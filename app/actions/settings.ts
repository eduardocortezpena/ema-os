'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/db';
import { buildAuthUrl } from '@/app/lib/google-drive-auth';
import { toUserMessage } from '@/app/lib/errors';

const TOKEN_ROW_ID = 'default';

/**
 * Revoca la sesión de Drive actual (borra el refresh token cifrado de la DB)
 * y redirige de inmediato a la pantalla de consentimiento de Google — en un
 * solo clic, sin paso intermedio. Necesario cuando cambia el conjunto de
 * scopes solicitados (ej. Fase 4: se añadió Calendar) porque un token ya
 * emitido con un scope menor no lo gana solo por cambiar el código; Google
 * exige un nuevo consentimiento explícito del usuario.
 *
 * `deleteMany` en vez de `delete` porque no debe fallar si ya no había
 * token (ej. el usuario ya lo había revocado desde su cuenta de Google).
 */
export async function disconnectAndReconnectDrive() {
  try {
    // Construir la URL ANTES de borrar el token: si buildAuthUrl lanza (ej.
    // faltan credenciales en .env), el token sigue intacto en vez de quedar
    // borrado sin poder completar el reconsentimiento. Ver reviewer.
    const headersList = await headers();
    const host = headersList.get('host') ?? 'localhost:3000';
    const redirectUri = `http://${host}/settings/drive/callback`;
    const authUrl = buildAuthUrl(redirectUri);

    await prisma.googleDriveToken.deleteMany({ where: { id: TOKEN_ROW_ID } });

    redirect(authUrl);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/settings?error=${encodeURIComponent(toUserMessage(error, 'Error desconectando Drive. Intenta de nuevo.'))}`);
  }
}
