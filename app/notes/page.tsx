'use client';

import { useState } from 'react';

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Primeras ideas',
      content: 'Diseño de interfaz',
      createdAt: '2026-07-08'
    }
  ]);

  const [form, setForm] = useState({
    title: '',
    content: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newNote: Note = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setNotes([newNote, ...notes]);
    setForm({ title: '', content: '' });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notas</h1>
          <button className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors">
            Nueva Nota
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{note.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{note.content.slice(0, 50)}...</p>
                      <p className="text-gray-500 text-xs mt-2">{note.createdAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-white">Editar</button>
                      <button className="text-danger-500 hover:text-white">Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg h-fit">
            <h2 className="text-lg font-semibold mb-4">Nueva Nota</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Contenido</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full h-40"
                />
              </div>
              <button type="submit" className="bg-primary-500 px-4 py-2 rounded hover:bg-primary-600 transition-colors w-full">
                Crear
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}