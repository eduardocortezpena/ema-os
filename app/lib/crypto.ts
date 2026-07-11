import crypto from 'node:crypto';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    throw new Error('ENCRYPTION_KEY no está definida en .env');
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY debe ser 32 bytes en hexadecimal (64 caracteres)');
  }
  return key;
}

export function encrypt(plaintext: string): { cipher: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12);
  const cipherObj = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipherObj.update(plaintext, 'utf8'), cipherObj.final()]);
  return {
    cipher: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipherObj.getAuthTag().toString('base64'),
  };
}

export function decrypt(data: { cipher: string; iv: string; authTag: string }): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(data.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.cipher, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
