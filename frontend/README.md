# Frontend MVP

Frontend construido con Next.js 16 (App Router), TypeScript, Tailwind CSS y shadcn/ui.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Autenticación**: Client-side JWT (en memoria)

## Estructura del Proyecto

```
app/
├── layout.tsx          # Root layout con AuthProvider
├── page.tsx            # Dashboard (protegido)
├── login/
│   └── page.tsx        # Página de login
components/
├── ui/                 # Componentes de shadcn/ui
└── navbar.tsx          # Barra de navegación
contexts/
└── auth-context.tsx    # Contexto de autenticación
lib/
├── api.ts              # Cliente API con JWT
└── auth.ts             # Tipos de autenticación
```

## Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x
- Backend corriendo en http://localhost:3000

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno:

Copiar `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Desarrollo

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000 (o el puerto que Next.js asigne).

## Build

Compilar para producción:

```bash
npm run build
```

Iniciar en modo producción:

```bash
npm start
```

## Autenticación

### Login

1. Navegar a `/login`
2. Ingresar credenciales:
   - **Admin**: `admin@demo.com` / `Demo123!`
   - **User**: `user@demo.com` / `Demo123!`
   - **Super Admin**: `superadmin@demo.com` / `Demo123!`

### Flujo de Autenticación

- El token JWT se almacena **solo en memoria** (no en localStorage)
- Al recargar la página, el usuario debe volver a iniciar sesión
- El token se incluye automáticamente en todas las peticiones API
- Si el backend responde 401, se redirige automáticamente a `/login`

### Rutas Protegidas

- `/` (Dashboard) - Requiere autenticación
- `/login` - Redirige a `/` si ya está autenticado

## API Client

El cliente API (`lib/api.ts`) maneja:

- Inclusión automática del token JWT en headers
- Manejo centralizado de errores 401
- Redirección automática a login en caso de no autorizado

Ejemplo de uso:

```typescript
import { apiClient } from '@/lib/api';

// GET request
const data = await apiClient.get('/users/me');

// POST request
const result = await apiClient.post('/assets', {
  name: 'Apple Inc.',
  type: 'EQUITY',
  currency: 'USD',
});
```

## Componentes UI

El proyecto usa [shadcn/ui](https://ui.shadcn.com/) para componentes:

- `Button` - Botones
- `Input` - Campos de entrada
- `Card` - Tarjetas
- `Label` - Etiquetas

Para agregar más componentes:

```bash
npx shadcn@latest add [component-name]
```

## Próximos Pasos

- [ ] Agregar más páginas (Assets, Reporting, etc.)
- [ ] Implementar persistencia de token (opcional)
- [ ] Agregar manejo de errores más robusto
- [ ] Implementar refresh tokens
- [ ] Agregar tests
