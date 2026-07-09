export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">EMA OS</h1>
        <p className="text-gray-400">Organizador personal de proyectos</p>
        <div className="mt-8 space-x-4">
          <a
            href="/dashboard"
            className="inline-block bg-blue-500 px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}