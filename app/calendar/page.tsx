import { prisma } from '@/app/lib/db';

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Sesión con supervisión parcial, Parte 2a: calendario mensual simple,
// SOLO datos locales (Tarea.dueDate) -- nunca llama a la API de Google
// Calendar para renderizar (esa API ya se usa para sincronizar eventos,
// Sprint 4.2, pero es un concern distinto). Architect: CSS Grid puro +
// aritmética de fechas con Date nativo alcanza, mismo patrón que
// app/lib/date.ts -- no amerita traer una librería de calendario.
function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Offset lunes-primero: getDay() es 0=domingo..6=sábado: convertimos a
// 0=lunes..6=domingo para que el grid empiece en lunes (convención ES).
function mondayFirstOffset(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { year: yearParam, month: monthParam } = await searchParams;
  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1; // 1-12

  const monthStart = new Date(year, month - 1, 1);
  const nextMonthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonthDate = new Date(year, month - 2, 1);
  const nextMonthDate = new Date(year, month, 1);
  const prevHref = `/calendar?year=${prevMonthDate.getFullYear()}&month=${prevMonthDate.getMonth() + 1}`;
  const nextHref = `/calendar?year=${nextMonthDate.getFullYear()}&month=${nextMonthDate.getMonth() + 1}`;
  const todayHref = `/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;

  const tasks = await prisma.tarea.findMany({
    where: { dueDate: { gte: monthStart, lt: nextMonthStart } },
    include: { project: true },
    orderBy: { dueDate: 'asc' },
  });

  const tasksByDay = new Map<number, typeof tasks>();
  for (const task of tasks) {
    const day = task.dueDate!.getDate();
    const list = tasksByDay.get(day) ?? [];
    list.push(task);
    tasksByDay.set(day, list);
  }

  const leadingBlanks = mondayFirstOffset(monthStart);
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - leadingBlanks + 1;
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDate = now.getDate();

  // Link genérico al mes en Calendar (architect: el `id` de evento de la
  // API NO es el `eid` codificado que usa la URL web de calendar.google.com
  // -- prometer un deep-link exacto al evento sería una garantía falsa. La
  // única URL pública y estable es navegar al mes.
  const googleCalendarUrl = `https://calendar.google.com/calendar/r/month/${year}/${month}/1`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Calendario</h1>
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 transition-colors px-3 py-2 rounded text-sm"
          >
            Abrir en Google Calendar ↗
          </a>
        </div>

        <div className="flex items-center justify-between mb-4">
          <a href={prevHref} className="bg-gray-800 hover:bg-gray-700 transition-colors px-3 py-2 rounded text-sm">
            ← Anterior
          </a>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{monthLabel(year, month)}</h2>
            {!isCurrentMonth && (
              <a href={todayHref} className="text-primary-500 hover:underline text-sm">
                Hoy
              </a>
            )}
          </div>
          <a href={nextHref} className="bg-gray-800 hover:bg-gray-700 transition-colors px-3 py-2 rounded text-sm">
            Siguiente →
          </a>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const dayTasks = day ? tasksByDay.get(day) ?? [] : [];
            const isToday = isCurrentMonth && day === todayDate;
            return (
              <div
                key={i}
                className={`min-h-24 rounded-lg p-1.5 ${
                  day === null ? 'bg-transparent' : isToday ? 'bg-gray-800 ring-1 ring-primary-500' : 'bg-gray-800'
                }`}
              >
                {day !== null && (
                  <>
                    <div className={`text-xs mb-1 ${isToday ? 'text-primary-500 font-semibold' : 'text-gray-500'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.map((task) => (
                        <a
                          key={task.id}
                          href={task.projectId ? `/projects/${task.projectId}` : '/tasks'}
                          title={task.title}
                          className={`block text-xs px-1.5 py-0.5 rounded truncate badge-${task.priority.toLowerCase()} ${
                            task.status === 'DONE' ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          {task.title}
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <p className="text-gray-500 text-sm mt-4">Sin tareas con fecha límite este mes.</p>
        )}
      </div>
    </div>
  );
}
