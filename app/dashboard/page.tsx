export default function Home() {
  return (
    <Layout>
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-950 text-gray-100">
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
            EMA OS Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800 p-4 rounded-lg rounded-t-none flex flex-col items-center">
              <div className="text-3xl font-bold text-primary-500">3</div>
              <p className="text-sm text-gray-400">Total Projects</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
              <div className="text-3xl font-bold text-success-500">2</div>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}