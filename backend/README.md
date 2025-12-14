# Backend MVP

Backend API construido con NestJS, TypeScript, Prisma y PostgreSQL para un sistema multi-tenant con autenticación JWT y RBAC.

## Stack Tecnológico

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Autorización**: RBAC (Role-Based Access Control)

## Estructura del Proyecto

```
src/
├── auth/              # Módulo de autenticación (JWT, Guards, Strategies)
├── users/             # Módulo de usuarios
├── tenants/           # Módulo de tenants (multi-tenancy)
├── health/            # Health check endpoint
├── prisma/            # Servicio y módulo de Prisma
├── config/            # Configuración y validación de variables de entorno
├── common/            # Utilidades comunes
│   ├── decorators/    # Decoradores personalizados
│   ├── filters/       # Exception filters
│   ├── guards/        # Guards de autorización
│   └── interceptors/  # Interceptors (logging)
└── main.ts            # Punto de entrada de la aplicación
```

## Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno:

Copiar el archivo `.env` y configurar las variables necesarias:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d
```

3. Generar el cliente de Prisma:

```bash
npm run prisma:generate
```

## Desarrollo

```bash
# Modo desarrollo (con watch)
npm run start:dev

# Modo producción
npm run start:prod

# Compilar
npm run build
```

## Scripts Disponibles

### Aplicación
- `npm run start` - Inicia la aplicación
- `npm run start:dev` - Inicia en modo desarrollo con watch
- `npm run start:debug` - Inicia en modo debug
- `npm run start:prod` - Inicia en modo producción
- `npm run build` - Compila el proyecto

### Base de Datos
- `npm run db:migrate` - Ejecuta migraciones pendientes (desarrollo)
- `npm run db:migrate:deploy` - Aplica migraciones (producción)
- `npm run db:reset` - Resetea la base de datos y ejecuta seed
- `npm run db:seed` - Ejecuta el seed script
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:studio` - Abre Prisma Studio

### Desarrollo
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Prettier

## Módulos Implementados

### Auth Module
- Login y registro de usuarios
- Autenticación JWT
- Guards para protección de rutas
- RBAC con roles (SUPER_ADMIN, ADMIN, USER)

### Users Module
- CRUD de usuarios
- Asociación con tenants
- Hash de contraseñas con bcrypt

### Tenants Module
- CRUD de tenants
- Soporte multi-tenant

## Documentación API (Swagger/OpenAPI)

La documentación interactiva de la API está disponible en:

```
http://localhost:3000/api
```

Incluye:
- Descripción completa de todos los endpoints
- Ejemplos de requests y responses
- Esquemas de validación
- Autenticación JWT integrada
- Pruebas interactivas desde el navegador

### Autenticación en Swagger

1. Inicia sesión usando el endpoint `/auth/login`
2. Copia el `access_token` de la respuesta
3. Haz clic en el botón "Authorize" en la parte superior de Swagger
4. Ingresa: `Bearer <tu-access-token>`
5. Ahora puedes probar los endpoints protegidos

## Endpoints Principales

### Health Check
- `GET /health` - Verificar estado de la aplicación y base de datos

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario

### Usuarios (Requiere autenticación JWT)
- `GET /users` - Listar usuarios
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear usuario
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario (soft delete)

### Tenants (Requiere autenticación JWT)
- `GET /tenants` - Listar tenants
- `GET /tenants/:id` - Obtener tenant por ID
- `POST /tenants` - Crear tenant
- `PATCH /tenants/:id` - Actualizar tenant
- `DELETE /tenants/:id` - Eliminar tenant (soft delete)

## Base de Datos

### Configuración Inicial

1. **Instalar PostgreSQL** (si no está instalado):

```bash
# macOS (con Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Docker (alternativa)
docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mydb -p 5432:5432 -d postgres:14
```

2. **Crear la base de datos**:

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE mydb;

# Salir
\q
```

3. **Configurar variables de entorno**:

Asegúrate de que tu archivo `.env` tenga la conexión correcta:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb?schema=public"
```

### Migraciones

El schema de Prisma está definido en `prisma/schema.prisma`. Las migraciones están en `prisma/migrations/`.

**Primera vez (setup inicial):**

```bash
# 1. Generar el cliente de Prisma
npm run prisma:generate

# 2. Ejecutar migraciones (crea las tablas)
npm run db:migrate

# 3. Ejecutar seed (crea datos de demo)
npm run db:seed
```

**Desarrollo (después de cambios en el schema):**

```bash
# Crear y aplicar nueva migración
npm run db:migrate
```

**Resetear base de datos (desarrollo):**

```bash
# ⚠️ Esto elimina todos los datos y vuelve a crear todo
npm run db:reset
```

### Seed (Datos de Demo)

El seed script crea datos de ejemplo para desarrollo local con soporte multi-tenant:

**Tenant A: "Demo Family Office"**
- Slug: `demo-family-office`

**Tenant B: "Demo Family Office B"**
- Slug: `demo-family-office-b`

**Usuarios creados:**

| Email | Rol | Tenant | Password |
|-------|-----|--------|----------|
| `superadmin@demo.com` | SUPER_ADMIN | A | `Demo123!` |
| `admin@demo.com` | ADMIN | A | `Demo123!` |
| `user@demo.com` | USER | A | `Demo123!` |
| `admin.b@demo.com` | ADMIN | B | `Demo123!` |

**Ejecutar seed:**

```bash
npm run db:seed
```

**Nota de seguridad:** Las contraseñas del seed son solo para desarrollo/demo. **NUNCA** uses estas contraseñas en producción.

### Prisma Studio

Para visualizar y editar datos directamente:

```bash
npm run prisma:studio
```

Esto abre una interfaz web en `http://localhost:5555`

## Validación

El proyecto utiliza `class-validator` y `class-transformer` para validación automática de DTOs. Todas las peticiones son validadas automáticamente mediante el `ValidationPipe` global.

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT tokens para autenticación
- Guards para protección de rutas
- RBAC implementado con decoradores y guards
- Validación automática de DTOs con class-validator

## Logging Estructurado

El sistema implementa logging estructurado con las siguientes características:

- **Request ID**: Cada request recibe un ID único (UUID) que se propaga en toda la aplicación
- **Información registrada**:
  - Método HTTP
  - Path de la request
  - Status code
  - Latency (tiempo de respuesta)
  - IP del cliente
  - Timestamp ISO 8601

Ejemplo de log:
```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "method": "GET",
  "path": "/users",
  "statusCode": 200,
  "latency": "45ms",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

El request ID puede ser enviado en el header `X-Request-ID` para tracking distribuido.

## Manejo de Errores

El sistema implementa un **Global Exception Filter** que proporciona respuestas de error consistentes:

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/users",
  "method": "POST",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "error": "Bad Request",
  "message": ["email must be an email", "password should not be empty"]
}
```

Todos los errores incluyen:
- Status code HTTP
- Timestamp
- Path y método de la request
- Request ID para tracking
- Mensajes de error descriptivos

## Health Check

El endpoint `/health` proporciona información sobre el estado de la aplicación:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "12345s",
  "database": {
    "status": "connected",
    "responseTime": "2ms"
  }
}
```

Retorna `503 Service Unavailable` si la base de datos no está disponible.

## Próximos Pasos

- [x] Implementar migraciones de Prisma
- [x] Implementar seed para desarrollo
- [ ] Agregar tests unitarios y e2e
- [ ] Implementar refresh tokens
- [ ] Agregar rate limiting
- [ ] Implementar métricas y monitoring

## Licencia

MIT
