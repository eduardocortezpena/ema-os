// Compartido por los atajos globales (Sprint 7.2): true si el evento debería
// ignorarse porque el usuario está escribiendo en un campo, para no
// interceptar teclas normales de escritura.
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}
