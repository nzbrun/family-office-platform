# Backend MVP

Backend API construido con NestJS, TypeScript, Prisma y PostgreSQL para un sistema multi-tenant con autenticación JWT y RBAC.

## 🚀 Demo en 5 minutos

### Setup Rápido

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar base de datos:**
```bash
# Asegúrate de tener PostgreSQL corriendo
# Configura DATABASE_URL en .env
```

3. **Ejecutar setup del demo:**
```bash
npm run demo:setup
```

Este comando:
- Resetea la base de datos
- Crea usuarios de demo (del seed)
- Crea dataset completo de inversiones para ambos tenants

4. **Iniciar la aplicación:**
```bash
npm run start:dev
```

### Credenciales Demo

**Tenant A (Demo Family Office):**
- Admin: `admin@demo.com` / `Demo123!`
- User: `user@demo.com` / `Demo123!`
- Super Admin: `superadmin@demo.com` / `Demo123!`

**Tenant B (Demo Family Office B):**
- Admin: `admin.b@demo.com` / `Demo123!`

### URLs Importantes

- **API Documentation (Swagger):** http://localhost:3000/api
- **Health Check:** http://localhost:3000/health
- **Reporting Summary:** http://localhost:3000/reporting/summary (requiere auth)
- **Assistant Query:** http://localhost:3000/assistant/query (requiere auth + OPENAI_API_KEY)

### Probar el Demo

1. **Login como admin:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "Demo123!"}'
```

2. **Ver resumen del portfolio:**
```bash
curl -X GET http://localhost:3000/reporting/summary \
  -H "Authorization: Bearer <token-del-paso-1>"
```

3. **Consultar al asistente** (requiere OPENAI_API_KEY):
```bash
curl -X POST http://localhost:3000/assistant/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cuánto vale el portfolio?"}'
```

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

## Multi-Tenancy

El sistema implementa **aislamiento real multi-tenant** con las siguientes características:

### Aislamiento por Rol

**SUPER_ADMIN:**
- Puede acceder a todos los tenants
- Puede usar header `X-Tenant-Id` para scoping de queries
- Puede filtrar usuarios por `tenantId` (query param o header)
- CRUD completo de tenants

**ADMIN:**
- Solo puede acceder a recursos de su propio tenant
- CRUD de usuarios solo en su tenant
- Solo puede ver su propio tenant (GET /tenants/:id)
- No puede listar todos los tenants

**USER:**
- Solo puede acceder a su propio perfil (GET /users/me)
- No puede listar usuarios
- Solo puede ver su propio tenant (GET /tenants/:id)

### Header X-Tenant-Id

El header `X-Tenant-Id` permite a SUPER_ADMIN especificar el tenant para scoping de queries:

```bash
curl -H "Authorization: Bearer <superadmin-token>" \
     -H "X-Tenant-Id: <tenant-id>" \
     http://localhost:3000/users
```

## Endpoints Principales

### Health Check
- `GET /health` - Verificar estado de la aplicación y base de datos

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario

### Usuarios (Requiere autenticación JWT)
- `GET /users` - Listar usuarios (ADMIN/SUPER_ADMIN)
- `GET /users/me` - Obtener perfil del usuario actual (todos los roles)
- `GET /users/:id` - Obtener usuario por ID (con aislamiento tenant)
- `POST /users` - Crear usuario (ADMIN/SUPER_ADMIN, solo en su tenant)
- `PATCH /users/:id` - Actualizar usuario (ADMIN/SUPER_ADMIN)
- `DELETE /users/:id` - Eliminar usuario (soft delete, ADMIN/SUPER_ADMIN)

### Tenants (Requiere autenticación JWT)
- `GET /tenants` - Listar tenants (SUPER_ADMIN only)
- `GET /tenants/:id` - Obtener tenant por ID (con aislamiento)
- `POST /tenants` - Crear tenant (SUPER_ADMIN only)
- `PATCH /tenants/:id` - Actualizar tenant (SUPER_ADMIN only)
- `DELETE /tenants/:id` - Eliminar tenant (soft delete, SUPER_ADMIN only)

### Audit Logs (Requiere autenticación JWT)
- `GET /audit-logs` - Listar logs de auditoría con paginación y filtros (SUPER_ADMIN/ADMIN)
  - Filtros: `tenantId`, `actorUserId`, `action`, `entity`, `startDate`, `endDate`
  - Paginación: `page`, `limit` (max 100)
  - SUPER_ADMIN puede ver todos los logs o filtrar por tenant
  - ADMIN solo ve logs de su tenant

### Legal Entities (Requiere autenticación JWT)
- `GET /legal-entities` - Listar entidades legales (SUPER_ADMIN/ADMIN)
- `GET /legal-entities/:id` - Obtener entidad legal por ID
- `POST /legal-entities` - Crear entidad legal
- `PATCH /legal-entities/:id` - Actualizar entidad legal
- `DELETE /legal-entities/:id` - Eliminar entidad legal

### Assets (Requiere autenticación JWT)
- `GET /assets` - Listar activos (SUPER_ADMIN/ADMIN)
  - Filtro opcional: `legalEntityId`
- `GET /assets/:id` - Obtener activo por ID (incluye últimas 10 valuaciones)
- `POST /assets` - Crear activo
- `PATCH /assets/:id` - Actualizar activo
- `DELETE /assets/:id` - Eliminar activo

### Valuations (Requiere autenticación JWT)
- `GET /valuations` - Listar valuaciones (SUPER_ADMIN/ADMIN)
  - Filtro opcional: `assetId`
- `GET /valuations/:id` - Obtener valuación por ID
- `POST /valuations` - Crear valuación
- `PATCH /valuations/:id` - Actualizar valuación
- `DELETE /valuations/:id` - Eliminar valuación

### Reporting (Requiere autenticación JWT)
- `GET /reporting/assets` - Listar assets con latestValuation para reporting (todos los roles)
  - Filtros: `type`, `currency`, `legalEntityId`, `hasValuation` (true/false)
  - Paginación: `page`, `limit` (max 100)
  - SUPER_ADMIN puede filtrar por `tenantId` (query param o X-Tenant-Id header)
- `GET /reporting/summary` - Resumen agregado con totals por currency, type y legal entity (todos los roles)
  - SUPER_ADMIN puede filtrar por `tenantId` (query param o X-Tenant-Id header)

### Assistant (Requiere autenticación JWT)
- `POST /assistant/query` - Consultar al asistente AI sobre datos del portfolio (todos los roles)
  - Body: `{ message: string }`
  - Response: `{ answer: string, actionsTaken: string[], citations: string[] }`
  - El asistente puede usar tools internas (read-only):
    - `reporting_summary`: Resumen del portfolio
    - `reporting_assets`: Assets con filtros
    - `asset_get`: Detalles de un asset
    - `valuations_list`: Valuaciones de un asset
    - `audit_logs`: Logs de auditoría (solo SUPER_ADMIN/ADMIN)
  - Respeta RBAC y aislamiento multi-tenant
  - Requiere `OPENAI_API_KEY` configurado (retorna 501 si no está)

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

## Ejemplos de Uso (cURL)

### 1. Login como Admin del Tenant A

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo123!"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@demo.com",
    "role": "ADMIN",
    "tenantId": "..."
  }
}
```

### 2. Listar usuarios (solo del tenant del admin)

```bash
TOKEN="<token-del-paso-1>"

curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Intentar acceder a usuario de otro tenant (403)

```bash
# Obtener ID de usuario del tenant B (desde seed o DB)
USER_B_ID="<id-del-usuario-tenant-b>"

curl -X GET http://localhost:3000/users/$USER_B_ID \
  -H "Authorization: Bearer $TOKEN"
# Retorna 403 Forbidden
```

### 4. SUPER_ADMIN con X-Tenant-Id header

```bash
# Login como superadmin
SUPER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@demo.com", "password": "Demo123!"}' \
  | jq -r '.access_token')

# Listar usuarios del tenant A
TENANT_A_ID="<tenant-a-id>"
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "X-Tenant-Id: $TENANT_A_ID"

# Listar usuarios del tenant B
TENANT_B_ID="<tenant-b-id>"
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "X-Tenant-Id: $TENANT_B_ID"
```

### 5. USER accediendo a su perfil

```bash
# Login como user
USER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@demo.com", "password": "Demo123!"}' \
  | jq -r '.access_token')

# Acceder a /users/me
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $USER_TOKEN"

# Intentar listar usuarios (403)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $USER_TOKEN"
# Retorna 403 Forbidden
```

## Tests E2E

El proyecto incluye tests end-to-end para validar el aislamiento multi-tenant.

### Ejecutar Tests E2E

```bash
# Asegúrate de tener la base de datos corriendo y el seed ejecutado
npm run db:seed

# Ejecutar todos los tests e2e
npm run test:e2e

# Ejecutar solo tests de multi-tenancy
npm run test:e2e -- multi-tenant
```

### Tests Incluidos

Los tests e2e validan:

1. **Autenticación:**
   - Login de admin tenant A
   - Login de admin tenant B
   - Login de superadmin

2. **Aislamiento de Usuarios:**
   - Admin A solo ve usuarios de tenant A
   - Admin A NO puede acceder a usuarios de tenant B (403)
   - Admin B solo ve usuarios de tenant B
   - Admin A NO puede crear usuarios en tenant B (403)

3. **Aislamiento de Tenants:**
   - Admin A puede acceder a su tenant
   - Admin A NO puede acceder a tenant B (403)
   - Admin A NO puede listar tenants (403)

4. **SUPER_ADMIN Cross-Tenant:**
   - SUPER_ADMIN puede listar todos los tenants
   - SUPER_ADMIN puede acceder a cualquier tenant
   - SUPER_ADMIN puede filtrar usuarios por X-Tenant-Id header
   - SUPER_ADMIN puede filtrar usuarios por query param tenantId
   - SUPER_ADMIN puede acceder a usuarios de cualquier tenant

5. **Restricciones de USER:**
   - USER puede acceder a /users/me
   - USER NO puede listar usuarios (403)

## Auditoría

El sistema implementa un **sistema de auditoría mínima** que registra todas las acciones importantes:

### Eventos Auditados

- **LOGIN**: Intentos de login (exitosos y fallidos)
- **CREATE**: Creación de usuarios y tenants
- **UPDATE**: Actualización de usuarios y tenants
- **DELETE**: Eliminación (soft delete) de usuarios y tenants

### Información Registrada

Cada log de auditoría incluye:
- `tenantId`: ID del tenant (nullable para SUPER_ADMIN)
- `actorUserId`: ID del usuario que realizó la acción
- `actorRole`: Rol del usuario (SUPER_ADMIN, ADMIN, USER)
- `action`: Tipo de acción (LOGIN, CREATE, UPDATE, DELETE)
- `entity`: Tipo de entidad (User, Tenant)
- `entityId`: ID de la entidad afectada
- `metadata`: Información adicional (JSON)
- `requestId`: ID de la request para correlación con logs
- `createdAt`: Timestamp del evento

### Acceso a Audit Logs

- **SUPER_ADMIN**: Puede ver todos los logs o filtrar por tenant
- **ADMIN**: Solo puede ver logs de su tenant
- **USER**: Sin acceso a audit logs

### Ejemplo de Uso

```bash
# Listar todos los logs (SUPER_ADMIN)
curl -X GET "http://localhost:3000/audit-logs?page=1&limit=20" \
  -H "Authorization: Bearer $SUPER_TOKEN"

# Filtrar por tenant
curl -X GET "http://localhost:3000/audit-logs?tenantId=$TENANT_ID&action=CREATE" \
  -H "Authorization: Bearer $SUPER_TOKEN"

# Filtrar por rango de fechas
curl -X GET "http://localhost:3000/audit-logs?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Dominio de Inversiones

El sistema incluye un dominio de inversiones v1 para gestión de activos manuales:

### Modelos

**LegalEntity (Entidades Legales):**
- Representa entidades legales (LLC, Corporation, etc.)
- Campos: `name`, `type`, `country`
- Relación con Tenant (multi-tenant)

**Asset (Activos):**
- Representa activos de inversión
- Campos: `name`, `type`, `currency`, `legalEntityId` (opcional), `metadata` (JSON)
- Relación con LegalEntity (opcional)
- Relación con Tenant (multi-tenant)

**Valuation (Valuaciones):**
- Representa valuaciones de activos en el tiempo
- Campos: `date`, `value`, `currency`, `source`, `notes` (opcional)
- Relación con Asset
- Relación con Tenant (multi-tenant)

### Ejemplo de Flujo

```bash
# 1. Crear entidad legal
LEGAL_ENTITY=$(curl -s -X POST http://localhost:3000/legal-entities \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Holdings LLC",
    "type": "LLC",
    "country": "US"
  }' | jq -r '.id')

# 2. Crear activo
ASSET=$(curl -s -X POST http://localhost:3000/assets \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Apple Inc. Stock\",
    \"type\": \"EQUITY\",
    \"currency\": \"USD\",
    \"legalEntityId\": \"$LEGAL_ENTITY\",
    \"metadata\": {\"ticker\": \"AAPL\", \"exchange\": \"NASDAQ\"}
  }" | jq -r '.id')

# 3. Crear valuación
curl -X POST http://localhost:3000/valuations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"assetId\": \"$ASSET\",
    \"date\": \"2024-01-01T00:00:00.000Z\",
    \"value\": 150000.50,
    \"currency\": \"USD\",
    \"source\": \"MANUAL\",
    \"notes\": \"Based on market price\"
  }"
```

### Aislamiento Multi-Tenant

- Todos los recursos (LegalEntity, Asset, Valuation) están aislados por tenant
- ADMIN solo puede acceder a recursos de su tenant
- SUPER_ADMIN puede acceder a todos los recursos
- Todas las operaciones CRUD registran auditoría

## Reporting

El sistema incluye un módulo de **reporting v1 (solo lectura)** basado en la última valuación por asset.

### Endpoints de Reporting

**GET /reporting/assets:**
- Retorna assets del tenant con `latestValuation` y `legalEntity` (si existe)
- Filtros disponibles:
  - `type`: Filtrar por tipo de asset
  - `currency`: Filtrar por moneda
  - `legalEntityId`: Filtrar por entidad legal
  - `hasValuation`: Filtrar por si tiene valuación (true/false)
  - `tenantId`: Filtrar por tenant (SUPER_ADMIN only)
- Paginación: `page` (default 1), `limit` (default 20, max 100)

**GET /reporting/summary:**
- Calcula agregados basados en la última valuación por asset:
  - `totalsByCurrency`: Totales agrupados por moneda
  - `totalsByAssetType`: Totales agrupados por tipo de asset
  - `totalsByLegalEntity`: Totales agrupados por entidad legal (solo assets con legalEntityId)
  - `assetsWithoutValuationCount`: Cantidad de assets sin valuación
  - `assetsCount`: Total de assets
- SUPER_ADMIN puede filtrar por `tenantId` (query param o X-Tenant-Id header)

### Ejemplo de Uso

```bash
# Obtener assets con valuaciones
curl -X GET "http://localhost:3000/reporting/assets?hasValuation=true&type=EQUITY" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Obtener resumen
curl -X GET "http://localhost:3000/reporting/summary" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# SUPER_ADMIN filtrando por tenant
curl -X GET "http://localhost:3000/reporting/summary?tenantId=$TENANT_ID" \
  -H "Authorization: Bearer $SUPER_TOKEN"
```

### Auditoría

Todas las llamadas a reporting se registran en AuditLog con:
- `action`: READ
- `entity`: Reporting
- `metadata`: Endpoint y filtros aplicados

## Assistant AI

El sistema incluye un **asistente AI** que permite consultar datos del portfolio usando lenguaje natural.

### Configuración

Requiere configurar la variable de entorno `OPENAI_API_KEY`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Opcional, default: gpt-4o-mini
```

Si la API key no está configurada, el endpoint retorna `501 Not Implemented`.

### Funcionalidades

El asistente puede:
- Responder preguntas sobre el portfolio
- Acceder a reporting, assets, valuations y audit logs (según rol)
- Respetar RBAC y aislamiento multi-tenant
- Usar herramientas internas (tools) para obtener datos

### Tools Disponibles

**Para todos los roles:**
- `reporting_summary`: Obtener resumen del portfolio
- `reporting_assets`: Listar assets con filtros
- `asset_get`: Obtener detalles de un asset
- `valuations_list`: Listar valuaciones de un asset

**Solo SUPER_ADMIN y ADMIN:**
- `audit_logs`: Consultar logs de auditoría

### Ejemplo de Uso

```bash
# Consultar valor del portfolio
curl -X POST http://localhost:3000/assistant/query \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuánto vale el portfolio?"
  }'
```

Respuesta:
```json
{
  "answer": "El portfolio tiene un valor total de $500,000 USD...",
  "actionsTaken": ["reporting_summary"],
  "citations": ["Used 1 tool(s): reporting_summary"]
}
```

### Seguridad y Hardening

**Rate Limiting:**
- Límite por usuario: configurable con `ASSISTANT_RATE_LIMIT_USER` (default: 10 req/min)
- Límite por tenant: configurable con `ASSISTANT_RATE_LIMIT_TENANT` (default: 20 req/min)
- Retorna `429 Too Many Requests` con `retryAfter` en segundos

**Timeouts:**
- Timeout configurable con `ASSISTANT_TIMEOUT_MS` (default: 10s)
- Retorna `504 Gateway Timeout` con `requestId` si excede el timeout

**Control de Tokens/Costo:**
- `max_output_tokens` configurable con `ASSISTANT_MAX_OUTPUT_TOKENS` (default: 500)
- Truncamiento automático de resultados de tools si exceden límites
- Límite de longitud del mensaje de entrada: `ASSISTANT_MAX_INPUT_CHARS` (default: 2000 chars)

**Prompt Injection Defenses:**
- Rechaza pedidos de secretos, env vars, instrucciones para saltar RBAC/tenant
- Si el usuario pide acciones de escritura, responde "read-only" explícito
- Validación de patrones de inyección

**Validación de Tool Params:**
- Validación fuerte con schemas Zod
- Tool name allow-list; bloquea cualquier otro
- Validación de tipos y formatos (UUIDs, fechas, etc.)

**Observabilidad:**
- Logs estructurados con: model, latency, toolCallsCount, estimatedTokens, status
- Request ID para correlación
- Auditoría completa en AuditLog

**Otras medidas:**
- Todas las queries se registran en AuditLog
- Respeta RBAC: USER no puede usar `audit_logs`
- Respeta multi-tenancy: solo accede a datos del tenant del usuario
- Límite de 3 tool calls por query
- Límite de 50 items en respuestas

## Preguntas Recomendadas al Asistente

El asistente puede responder preguntas sobre el portfolio usando lenguaje natural. Aquí hay 10 ejemplos:

1. **"¿Cuánto vale el portfolio?"**
   - El asistente usará `reporting_summary` para calcular el total

2. **"¿Cuántos assets tengo sin valuación?"**
   - Consultará `reporting_assets` con filtro `hasValuation=false`

3. **"Muéstrame todos los assets de tipo EQUITY"**
   - Filtrará assets por tipo usando `reporting_assets`

4. **"¿Cuál es la valuación más reciente del asset [ID]?"**
   - Usará `asset_get` para obtener el asset con `latestValuation`

5. **"Muéstrame el historial de valuaciones del asset [ID] desde enero 2024"**
   - Usará `valuations_list` con filtros de fecha

6. **"¿Cuánto vale el portfolio en USD?"**
   - Consultará `reporting_summary` y filtrará por currency

7. **"¿Qué assets están asociados a la entidad legal [ID]?"**
   - Usará `reporting_assets` con filtro `legalEntityId`

8. **"Muéstrame los últimos 5 eventos de auditoría"**
   - Solo para SUPER_ADMIN/ADMIN, usará `audit_logs`

9. **"¿Cuál es el asset más valioso?"**
   - Consultará `reporting_assets` y analizará `latestValuation`

10. **"Resume el portfolio por tipo de asset"**
    - Usará `reporting_summary` para obtener `totalsByAssetType`

**Nota:** El asistente respeta RBAC y multi-tenancy. Cada usuario solo puede acceder a datos de su tenant.

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
- `npm run demo:setup` - Setup completo del demo (reset + dataset)

### Desarrollo
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Prettier

## Próximos Pasos

- [x] Implementar migraciones de Prisma
- [x] Implementar seed para desarrollo
- [x] Implementar multi-tenancy con aislamiento real
- [x] Agregar tests e2e para multi-tenancy
- [x] Implementar sistema de auditoría
- [x] Implementar dominio de inversiones v1
- [x] Implementar reporting v1
- [x] Implementar assistant AI con OpenAI
- [x] Preparar demo reproducible
- [ ] Agregar tests unitarios
- [ ] Implementar refresh tokens
- [ ] Agregar rate limiting global
- [ ] Implementar métricas y monitoring

## Licencia

MIT
