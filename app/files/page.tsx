export default async function FilesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Archivos</h1>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-300 mb-2">
            El directorio de archivos se está rediseñando.
          </p>
          <p className="text-gray-500 text-sm">
            Esta sección será el índice de toda la documentación (local + Google
            Drive), organizado en un plan conjunto con el dueño. Por ahora no hay
            nada que ver aquí — vuelve más adelante.
          </p>
        </div>
      </div>
    </div>
  );
}
