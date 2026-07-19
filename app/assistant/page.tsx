import { AssistantChat } from '@/app/components/AssistantChat';

// Sprint 6.5 (Señor Dev): la ruta se conserva para no romper enlaces
// existentes, pero el asistente ahora vive principalmente en el panel
// flotante global (AssistantWidget en app/layout.tsx). Misma lógica.
export default function AssistantPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Asistente</h1>
      <AssistantChat />
    </div>
  );
}
