# ARCHITECTURE.md
EMA OS follows a modern web application architecture with the following layers:

## Backend Layer
- **Prisma** as ORM for database abstraction
- **SQLite** as local development database
- **Server Actions** in Next.js for form handling
- **TypeScript** for type safety throughout

## Frontend Layer
- **Next.js App Router** for file-based routing
- **React** with Client Components where needed
- **Tailwind CSS** for styling
- **Custom components** for reusable UI elements

## Data Flow
1. UI components interact via Client Components
2. Form submissions handled by Server Actions
3. Data persisted through Prisma Client
4. Real-time updates would use Next.js caching or polling

## Technology Stack
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS v4
- **ORM**: Prisma 7.8 (SQLite)
- **State Management**: React hooks (useState, useEffect)
- **Build Tool**: Next.js Turbopack
- **Version Control**: Git

## Project Structure
```
.app/
├── layout.tsx        # Global layout with sidebar
├── page.tsx          # Home page (redirect to dashboard)
├── dashboard/         # Dashboard module
├── projects/          # Projects management
├── tasks/             # Tasks management
├── notes/             # Notes management
├── settings/          # Configuration
├── src/              # Shared types and utilities
├── prisma/           # Database schema
├── app/generated/prisma/  # Generated Prisma Client
```