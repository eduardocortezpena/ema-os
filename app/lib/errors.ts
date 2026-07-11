export function toUserMessage(error: any, fallback: string): string {
  if (error?.code === 'P2025') {
    return 'No se encontró el registro (puede que ya se haya eliminado o modificado).';
  }
  if (error?.code === 'P2002') {
    return 'Ya existe un registro con ese valor.';
  }
  return fallback;
}
