/**
 * Suite de integración del servidor MCP de EMA OS.
 *
 * Arranca el server contra una BD de prueba AISLADA (SQLite en tmp, nunca
 * emaos.db), invoca las 13 tools vía el cliente del SDK y valida respuestas.
 * Incluye casos borde (IDs inexistentes, estados inválidos, proyecto equivocado,
 * confirmación expirada/cancelada).
 *
 * Uso:  npm run test:mcp      (desde la raíz del repo)
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';
import PizZip from 'pizzip';

const REPO = process.cwd();
const PID = process.pid;
const TEST_DB = path.join(os.tmpdir(), `emaos-mcp-test-${PID}.db`);
const TEMPLATES_DIR = path.join(REPO, 'templates');
const FILES_DIR = path.join(REPO, 'files');
const TPL_DOCX = '__mcp_test_tpl.docx';
const TPL_MD = '__mcp_test_tpl.md';
const NOTE_FILE = path.join(TEMPLATES_DIR, '__mcp_test_note.md');

let passed = 0, failed = 0;
const failures = [];
function ok(name) { passed++; console.log(`  ✓ ${name}`); }
function bad(name, msg) { failed++; failures.push(`${name}: ${msg}`); console.log(`  ✗ ${name} — ${msg}`); }
function assert(name, cond, detail = '') { cond ? ok(name) : bad(name, detail); }

// --- PDF/DOCX template builders -------------------------------------------
function buildMinimalDocx() {
  const xml = '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hola {nombre}, fecha {fecha}</w:t></w:r></w:p></w:body></w:document>';
  const zip = new PizZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer' });
}

function setupDb() {
  // Schema en archivo aislado NUEVO (tmp). Sin --force-reset: crear schema en
  // un archivo vacío no destruye datos, así no se activa el guard anti-IA de
  // Prisma 7. --url override autoritativo: evita el DATABASE_URL de .env.
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  const url = 'file:' + TEST_DB.replace(/\\/g, '/');
  execSync(`npx prisma db push --url "${url}"`, {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: url },
  });
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  fs.writeFileSync(path.join(TEMPLATES_DIR, TPL_DOCX), buildMinimalDocx());
  fs.writeFileSync(path.join(TEMPLATES_DIR, TPL_MD), '# {{titulo}}\n\nHola {{nombre}}.\n');
  fs.writeFileSync(NOTE_FILE, '# Nota de contexto\n\nContenido de prueba.');

  const db = new Database(TEST_DB);
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO Proyecto (id,name,status,priority,progress,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`)
    .run('proj-test', 'Proyecto Prueba MCP', 'ACTIVE', 'HIGH', 0, now, now);
  db.prepare(`INSERT INTO Tarea (id,title,status,priority,reminderPreset,projectId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run('task-test', 'Tarea unica mcpflag', 'TODO', 'MEDIUM', 'DEFAULT', 'proj-test', now, now);
  db.prepare(`INSERT INTO DocumentTemplate (id,name,docType,path,variables,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`)
    .run('tpl-docx', 'Plantilla DOCX test', 'docx', TPL_DOCX, '{}', now, now);
  db.prepare(`INSERT INTO DocumentTemplate (id,name,docType,path,variables,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`)
    .run('tpl-md', 'Plantilla MD test', 'md', TPL_MD, '{}', now, now);
  db.prepare(`INSERT INTO Archivo (id,projectId,kind,title,path,mimeType,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run('arch-note', 'proj-test', 'NOTE', 'Nota test', NOTE_FILE, 'text/markdown', now, now);
  db.close();
}

function cleanup() {
  try {
    for (const f of [TPL_DOCX, TPL_MD, '__mcp_test_note.md']) {
      const p = path.join(TEMPLATES_DIR, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    const projDir = path.join(FILES_DIR, 'proj-test');
    if (fs.existsSync(projDir)) fs.rmSync(projDir, { recursive: true, force: true });
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  } catch { /* best-effort */ }
}

// --- MCP client ------------------------------------------------------------
async function startClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    // Paths relativos + cwd=REPO: el loader custom no soporta paths Windows
    // absolutos (protocol 'c:'). Es la misma invocación que `npm run mcp`.
    args: ['--experimental-strip-types', '--loader', './mcp-server/loader.mjs', 'mcp-server/index.ts'],
    env: { ...process.env, DATABASE_URL: 'file:' + TEST_DB.replace(/\\/g, '/') },
    cwd: REPO,
    stderr: 'inherit',
  });
  const client = new Client({ name: 'mcp-test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  return { client, transport };
}

async function call(client, name, args = {}) {
  const res = await client.callTool({ name, arguments: args });
  const txt = res.content?.[0]?.text;
  try { return JSON.parse(txt); } catch { return { _raw: txt }; }
}

// --- Suite -----------------------------------------------------------------
async function run() {
  setupDb();
  const { client, transport } = await startClient();
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

  console.log('\n[LECTURA]');
  let r = await call(client, 'listar_proyectos');
  assert('listar_proyectos', Array.isArray(r) && r.some((p) => p.id === 'proj-test'), JSON.stringify(r));

  r = await call(client, 'listar_tareas', { proyecto_nombre: 'Prueba MCP' });
  assert('listar_tareas (filtro proyecto)', Array.isArray(r) && r.some((t) => t.id === 'task-test'), JSON.stringify(r));

  r = await call(client, 'listar_tareas', { estado: 'DONE' });
  assert('listar_tareas (filtro estado, vacío)', Array.isArray(r) && !r.some((t) => t.id === 'task-test'), 'debería excluir la tarea TODO');

  r = await call(client, 'buscar_tareas_por_texto', { texto: 'mcpflag' });
  assert('buscar_tareas_por_texto', Array.isArray(r) && r.some((t) => t.id === 'task-test'), JSON.stringify(r));

  r = await call(client, 'leer_nota_contexto', { proyecto_nombre: 'Prueba MCP' });
  assert('leer_nota_contexto', Array.isArray(r) && r[0]?.titulo === 'Nota test', JSON.stringify(r));

  r = await call(client, 'leer_next_actions');
  assert('leer_next_actions', Array.isArray(r), JSON.stringify(r));

  r = await call(client, 'leer_my_day');
  assert('leer_my_day', r && Array.isArray(r.tareas) && r.tareas.some((t) => t.id === 'task-test'), JSON.stringify(r));

  r = await call(client, 'listar_plantillas');
  assert('listar_plantillas', Array.isArray(r) && r.some((t) => t.id === 'tpl-docx') && r.some((t) => t.id === 'tpl-md'), JSON.stringify(r));

  console.log('\n[ESCRITURA — happy path]');
  r = await call(client, 'crear_tarea', { titulo: 'Tarea creada por test', proyecto_nombre: 'Prueba MCP', prioridad: 'HIGH' });
  assert('crear_tarea → pending', r.status === 'pending_confirmation' && r.confirmationId, JSON.stringify(r));
  let r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: true });
  assert('crear_tarea → confirm', r2.ok === true && typeof r2.id === 'string', JSON.stringify(r2));
  const createdTaskId = r2.id;

  r = await call(client, 'actualizar_estado_tarea', { titulo: 'mcpflag', estado: 'IN_PROGRESS' });
  assert('actualizar_estado → pending', r.status === 'pending_confirmation', JSON.stringify(r));
  r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: true });
  assert('actualizar_estado → confirm', r2.ok === true, JSON.stringify(r2));

  r = await call(client, 'crear_nota', { proyecto_nombre: 'Prueba MCP', titulo: 'Nota nueva test', contenido: 'cuerpo de la nota' });
  r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: true });
  assert('crear_nota → confirm', r2.ok === true, JSON.stringify(r2));

  r = await call(client, 'mover_archivo_a_proyecto', { archivo_titulo: 'Nota test', proyecto_destino: 'Prueba MCP' });
  r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: true });
  assert('mover_archivo → confirm', r2.ok === true, JSON.stringify(r2));

  console.log('\n[generar_documento — DOCX y PDF reales en disco]');
  r = await call(client, 'generar_documento', { tarea_id: 'task-test', plantilla_id: 'tpl-docx', data: { nombre: 'Mundo', fecha: '2026-07-19' } });
  assert('generar_documento DOCX → pending', r.status === 'pending_confirmation', JSON.stringify(r));
  r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: true });
  assert('generar_documento DOCX → archivo en disco', r2.ok === true && r2.filePath && fs.existsSync(r2.filePath), JSON.stringify(r2));

  r = await call(client, 'generar_documento', { tarea_id: 'task-test', plantilla_id: 'tpl-md', data: { titulo: 'Reporte', nombre: 'EMA' } });
  assert('generar_documento PDF → pending (md permitido)', r.status === 'pending_confirmation', JSON.stringify(r));
  r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: true });
  const pdfOk = r2.ok === true && r2.filePath && fs.existsSync(r2.filePath);
  const pdfHeader = pdfOk ? fs.readFileSync(r2.filePath, { encoding: null }).subarray(0, 5).toString() : '';
  assert('generar_documento PDF → PDF válido en disco', pdfOk && pdfHeader === '%PDF-', `header="${pdfHeader}" ${JSON.stringify(r2)}`);

  console.log('\n[CASOS BORDE — errores claros, nunca crash]');
  r = await call(client, 'confirmar_accion', { confirmationId: 'id-que-no-existe', confirm: true });
  assert('confirmar_accion id inválido → error', r.error && !r.ok, JSON.stringify(r));

  r = await call(client, 'crear_tarea', { titulo: 'X', proyecto_nombre: 'Proyecto Inexistente XYZ' });
  r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: true });
  assert('crear_tarea proyecto inexistente → error', r2.error && !r2.ok, JSON.stringify(r2));

  r = await call(client, 'actualizar_estado_tarea', { titulo: 'tarea-que-no-existe-xyz', estado: 'DONE' });
  assert('actualizar_estado tarea inexistente → error', r.error && !r.ok, JSON.stringify(r));

  r = await call(client, 'generar_documento', { tarea_id: 'task-test', plantilla_id: 'plantilla-inexistente' });
  assert('generar_documento plantilla inexistente → error', r.error && !r.ok, JSON.stringify(r));

  r = await call(client, 'crear_tarea', { titulo: 'Cancelar esto' });
  r2 = await call(client, 'confirmar_accion', { confirmationId: r.confirmationId, confirm: false });
  assert('confirmar_accion cancelar → ok', r2.ok === true && /cancel/i.test(r2.mensaje || ''), JSON.stringify(r2));

  // doble confirmación del mismo id → debe fallar (ya usada)
  r = await call(client, 'crear_tarea', { titulo: 'Doble confirm' });
  const cid = r.confirmationId;
  await call(client, 'confirmar_accion', { confirmationId: cid, confirm: true });
  r2 = await call(client, 'confirmar_accion', { confirmationId: cid, confirm: true });
  assert('confirmar_accion reuso → error', r2.error && !r2.ok, JSON.stringify(r2));

  await client.close();
  await waitFor(200);
  cleanup();

  console.log(`\n=== ${passed} pasaron, ${failed} fallaron ===`);
  if (failed) { console.log('FALLAS:\n - ' + failures.join('\n - ')); process.exit(1); }
}

run().catch((e) => { console.error('FATAL:', e); cleanup(); process.exit(1); });
