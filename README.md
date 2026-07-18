# EMA OS

Organizador personal de proyectos de un solo usuario. Next.js 16 + Prisma + SQLite local.

## Stack

- **Next.js** 16.2.10 (Turbopack, App Router)
- **React** 19.2.4
- **Prisma** 7.8.0
- **SQLite** (better-sqlite3)
- **Tailwind CSS** 4

## Requisitos

- Node.js 18+
- npm o pnpm

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura de carpetas

```
ema-os/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   │   ├── task-actions.ts
│   │   ├── note-actions.ts
│   │   └── project-actions.ts
│   ├── api/               # API routes
│   ├── calendar/          # Vista de calendario
│   ├── components/        # Componentes UI
│   ├── dashboard/         # Dashboard principal
│   ├── files/             # Gestión de archivos
│   ├── inbox/             # Vista de inbox
│   ├── lib/               # Utilidades y configuración
│   ├── my-day/            # Vista "Mi día"
│   ├── projects/          # Vista de proyectos
│   ├── settings/          # Configuración
│   └── tasks/             # Vista de tareas
├── prisma/                # Schema y migraciones
│   ├── schema.prisma
│   └── migrations/
├── public/                # Assets estáticos
└── files/                 # Almacenamiento de archivos
```

## Scripts

- `npm run dev` — Servidor de desarrollo
- `npm run build` — Build de producción
- `npm run start` — Servidor de producción
- `npm run lint` — Linting con ESLint