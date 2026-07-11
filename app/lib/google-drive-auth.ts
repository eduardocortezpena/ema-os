import { prisma } from '@/app/lib/db';
import { encrypt, decrypt } from '@/app/lib/crypto';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_ROW_ID = 'default';

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET no están definidas en .env');
  }
  return { clientId, clientSecret };
}

export function buildAuthUrl(redirectUri: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeAndSave(code: string, redirectUri: string): Promise<void> {
  const { clientId, clientSecret } = getClientCredentials();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[google-drive-auth] Error intercambiando código (${res.status}):`, body);
    throw new Error('Error autorizando con Google. Revisa los logs del servidor.');
  }

  const data = await res.json();
  if (!data.refresh_token) {
    throw new Error(
      'Google no devolvió un refresh_token. Probablemente ya autorizaste esta app antes; revoca el acceso en https://myaccount.google.com/permissions y vuelve a intentar.'
    );
  }

  const { cipher, iv, authTag } = encrypt(data.refresh_token);
  const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.googleDriveToken.upsert({
    where: { id: TOKEN_ROW_ID },
    create: {
      id: TOKEN_ROW_ID,
      refreshTokenCipher: cipher,
      refreshTokenIv: iv,
      refreshTokenAuthTag: authTag,
      accessToken: data.access_token,
      accessTokenExpiresAt,
    },
    update: {
      refreshTokenCipher: cipher,
      refreshTokenIv: iv,
      refreshTokenAuthTag: authTag,
      accessToken: data.access_token,
      accessTokenExpiresAt,
    },
  });
}

export async function isDriveConnected(): Promise<boolean> {
  const row = await prisma.googleDriveToken.findUnique({ where: { id: TOKEN_ROW_ID } });
  return row !== null;
}

export async function getValidAccessToken(): Promise<string> {
  const row = await prisma.googleDriveToken.findUnique({ where: { id: TOKEN_ROW_ID } });
  if (!row) {
    throw new Error('Google Drive no está conectado todavía. Ve a Settings para conectarlo.');
  }

  const stillValid =
    row.accessToken && row.accessTokenExpiresAt && row.accessTokenExpiresAt.getTime() - Date.now() > 60_000;
  if (stillValid) {
    return row.accessToken!;
  }

  const { clientId, clientSecret } = getClientCredentials();
  const refreshToken = decrypt({
    cipher: row.refreshTokenCipher,
    iv: row.refreshTokenIv,
    authTag: row.refreshTokenAuthTag,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[google-drive-auth] Error refrescando access token (${res.status}):`, body);
    if (body.includes('invalid_grant')) {
      // El refresh token fue revocado (ej. el usuario quitó el acceso en
      // myaccount.google.com/permissions) — limpiar para que isDriveConnected()
      // refleje el estado real en vez de quedar "Conectado" con un token muerto.
      await prisma.googleDriveToken.delete({ where: { id: TOKEN_ROW_ID } });
      throw new Error('El acceso a Google Drive fue revocado. Vuelve a conectarlo en Settings.');
    }
    throw new Error('Error refrescando el acceso a Drive. Revisa los logs del servidor.');
  }

  const data = await res.json();
  const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.googleDriveToken.update({
    where: { id: TOKEN_ROW_ID },
    data: { accessToken: data.access_token, accessTokenExpiresAt },
  });

  return data.access_token;
}
