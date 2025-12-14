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
├── prisma/            # Servicio y módulo de Prisma
├── config/            # Configuración y validación de variables de entorno
├── common/            # Utilidades comunes (decorators, guards, etc.)
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

- `npm run start` - Inicia la aplicación
- `npm run start:dev` - Inicia en modo desarrollo con watch
- `npm run start:debug` - Inicia en modo debug
- `npm run start:prod` - Inicia en modo producción
- `npm run build` - Compila el proyecto
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:studio` - Abre Prisma Studio
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

## Endpoints Principales

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario

### Usuarios
- `GET /users` - Listar usuarios
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear usuario
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario (soft delete)

### Tenants
- `GET /tenants` - Listar tenants
- `GET /tenants/:id` - Obtener tenant por ID
- `POST /tenants` - Crear tenant
- `PATCH /tenants/:id` - Actualizar tenant
- `DELETE /tenants/:id` - Eliminar tenant (soft delete)

## Base de Datos

El schema de Prisma está definido en `prisma/schema.prisma`. 

**Nota**: Las migraciones no están implementadas aún en esta fase del MVP. El schema está listo para cuando se requiera ejecutar las migraciones.

## Validación

El proyecto utiliza `class-validator` y `class-transformer` para validación automática de DTOs. Todas las peticiones son validadas automáticamente mediante el `ValidationPipe` global.

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT tokens para autenticación
- Guards para protección de rutas
- RBAC implementado con decoradores y guards

## Próximos Pasos

- [ ] Implementar migraciones de Prisma
- [ ] Agregar tests unitarios y e2e
- [ ] Implementar refresh tokens
- [ ] Agregar rate limiting
- [ ] Implementar logging estructurado
- [ ] Documentación con Swagger/OpenAPI

## Licencia

MIT
