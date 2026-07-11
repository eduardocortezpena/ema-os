export const PRIORITY_CYCLE = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function nextPriority(current: string): (typeof PRIORITY_CYCLE)[number] {
  const idx = PRIORITY_CYCLE.indexOf(current as (typeof PRIORITY_CYCLE)[number]);
  return PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
}
