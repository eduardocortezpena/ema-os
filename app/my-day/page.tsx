import { redirect } from 'next/navigation';

// UX tareas v2: la vista "My Day" se eliminó — el Dashboard ya cumple ese
// rol ordenando las siguientes acciones por prioridad. Se conserva la ruta
// como redirect a / (que a su vez redirige a /dashboard) para no romper
// bookmarks/links antiguos. La lógica de rollover (planForToday,
// rolloverToTomorrow, unplanTask) se borró de task-actions.ts.
export default function MyDayPage() {
  redirect('/');
}
