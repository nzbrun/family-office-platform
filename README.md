# Portfolio Manager

Sistema de gestión de portfolios multi-tenant con backend NestJS y frontend Next.js.

## 🚀 Run Demo (One Command)

### Prerequisites

- **Docker Desktop** instalado y corriendo
- **Node.js** >= 18.x
- **npm** >= 9.x

### Quick Start

Ejecuta un solo comando para levantar todo el stack:

```bash
npm install
npm run demo:all
```

Este comando:
1. ✅ Levanta PostgreSQL en Docker
2. ✅ Espera a que la base de datos esté lista
3. ✅ Inicia el backend (puerto 3000)
4. ✅ Espera a que el backend esté saludable
5. ✅ Ejecuta el setup del demo (migraciones + seed + dataset)
6. ✅ Inicia el frontend (puerto 3001)

### URLs Resultantes

Una vez que todo esté corriendo:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

### Credenciales Demo

**Tenant A (Demo Family Office):**
- **Admin**: `admin@demo.com` / `Demo123!`
- **User**: `user@demo.com` / `Demo123!`
- **Super Admin**: `superadmin@demo.com` / `Demo123!`

**Tenant B (Demo Family Office B):**
- **Admin**: `admin.b@demo.com` / `Demo123!`

### Apagar el Demo

Para detener todos los servicios:

```bash
npm run demo:db:down
```

Esto detendrá el contenedor de PostgreSQL. Los servicios de backend y frontend se pueden detener con `Ctrl+C` en sus respectivas terminales.

### Scripts Disponibles

- `npm run demo:all` - Levanta todo el stack (DB + Backend + Setup + Frontend)
- `npm run demo:db:up` - Levanta solo PostgreSQL
- `npm run demo:db:down` - Detiene PostgreSQL
- `npm run demo:db:logs` - Muestra logs de PostgreSQL
- `npm run demo:backend` - Levanta solo el backend (usa `.env.demo`)
- `npm run demo:frontend` - Levanta solo el frontend
- `npm run demo:setup` - Ejecuta setup del demo (migraciones + seed + dataset)

### Troubleshooting

**Error: "Cannot connect to database"**
- Asegúrate de que Docker Desktop esté corriendo
- Verifica que el puerto 5432 no esté en uso: `docker compose ps`

**Error: "Port 3000 already in use"**
- Detén cualquier proceso usando el puerto 3000
- En Windows: `netstat -ano | findstr :3000` y luego `taskkill /PID <pid> /F`

**Error: "Port 3001 already in use"**
- Detén cualquier proceso usando el puerto 3001
- O cambia el puerto en `frontend/package.json` script `dev`

**La base de datos no se inicializa**
- Ejecuta `npm run demo:db:down` y luego `npm run demo:db:up`
- Verifica los logs: `npm run demo:db:logs`

## 📁 Estructura del Proyecto

```
.
├── backend/          # Backend NestJS + Prisma + PostgreSQL
├── frontend/         # Frontend Next.js + TypeScript + Tailwind
├── docs/             # Documentación
├── docker-compose.yml # Configuración Docker para PostgreSQL
└── package.json      # Scripts de orquestación del demo
```

## 🔧 Desarrollo

### Backend

Ver `backend/README.md` para instrucciones detalladas.

### Frontend

Ver `frontend/README.md` para instrucciones detalladas.

## 📚 Documentación

- **Arquitectura**: Ver `docs/architecture.md`
- **Backend API**: http://localhost:3000/api (Swagger)
- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`

## 🛠️ Tecnologías

### Backend
- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL 16
- JWT Authentication
- RBAC (Role-Based Access Control)

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

## 📝 Notas

- El demo usa un archivo `.env.demo` separado para no interferir con el desarrollo local
- Los datos de PostgreSQL se persisten en un volumen Docker
- El token JWT se almacena solo en memoria (no en localStorage)
- El setup del demo incluye un dataset completo de inversiones para ambos tenants
