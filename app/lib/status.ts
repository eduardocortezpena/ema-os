export const STATUS_CYCLE = ['TODO', 'IN_PROGRESS', 'WAITING', 'DONE'] as const;

export function nextStatus(current: string): (typeof STATUS_CYCLE)[number] {
  const idx = STATUS_CYCLE.indexOf(current as (typeof STATUS_CYCLE)[number]);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}
