'use client';

import { useState } from 'react';
import { renderMarkdown } from '@/app/lib/markdown';

// Editor Markdown ligero (Sprint 3.3): un textarea con toggle de preview.
// Sin librerías de editor pesadas — el preview usa el renderer propio.
export function MarkdownEditor({
  name,
  defaultValue = '',
  rows = 8,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="flex gap-2 mb-2 text-sm">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-2 py-1 rounded ${!preview ? 'bg-primary-500' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-2 py-1 rounded ${preview ? 'bg-primary-500' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Preview
        </button>
      </div>
      {preview ? (
        <div
          className="prose-invert w-full min-h-[8rem] bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || '<p class="text-gray-500">Nada que previsualizar.</p>' }}
        />
      ) : (
        <textarea
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          placeholder="Escribe en Markdown… (# título, **negrita**, - listas)"
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      )}
      {/* El name viaja aunque estemos en preview, para que el form lo envíe. */}
      {preview && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
