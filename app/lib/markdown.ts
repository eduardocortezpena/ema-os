// Renderer Markdown mínimo, sin dependencias (Sprint 3.3). Cubre el subconjunto
// común: encabezados, negrita, cursiva, código inline y en bloque, enlaces y
// listas. Escapa el HTML de entrada ANTES de aplicar transformaciones, así el
// contenido de la nota nunca inyecta HTML (defensa contra XSS en el preview).

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Escapar comillas también: si no, una URL con `"` en [txt](url) rompe el
    // atributo href e inyecta un handler (XSS almacenado). Ver reviewer H1.
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" class="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

export function renderMarkdown(src: string): string {
  const escaped = escapeHtml(src);
  const lines = escaped.split('\n');
  const html: string[] = [];
  let inCode = false;
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        closeList();
        html.push('<pre class="bg-gray-900 p-2 rounded overflow-x-auto text-sm"><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm'];
      html.push(`<h${level} class="${sizes[level - 1]} font-bold mt-3 mb-1">${inline(heading[2])}</h${level}>`);
      continue;
    }

    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) {
        html.push('<ul class="list-disc pl-5 space-y-1">');
        inList = true;
      }
      html.push(`<li>${inline(li[1])}</li>`);
      continue;
    }

    closeList();
    if (line.trim() === '') {
      html.push('<br/>');
    } else {
      html.push(`<p>${inline(line)}</p>`);
    }
  }

  closeList();
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}
