import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeAndSave } from '@/app/lib/google-drive-auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const errorParam = request.nextUrl.searchParams.get('error');
  const redirectUri = `${request.nextUrl.origin}/settings/drive/callback`;

  if (errorParam) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings?error=${encodeURIComponent('Autorización de Google cancelada o rechazada')}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings?error=${encodeURIComponent('Google no envió un código de autorización')}`
    );
  }

  try {
    await exchangeCodeAndSave(code, redirectUri);
    return NextResponse.redirect(`${request.nextUrl.origin}/settings?drive=connected`);
  } catch (error: any) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings?error=${encodeURIComponent(error.message)}`
    );
  }
}
