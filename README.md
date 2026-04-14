# React + Vite + TypeScript Project

## Optimizaciones Aplicadas

### 1. Configuración de Entorno
- Variables de entorno para URLs de API (`.env`)
- Soporte para múltiples entornos (`.env.example`)

### 2. Autenticación Centralizada
- `AuthContext` con tipado TypeScript
- Hook personalizado `useAuth`
- Gestión unificada de tokens y usuarios

### 3. Servicios API Estandarizados
- Instancia de Axios configurada con interceptores
- Servicio API genérico con métodos CRUD
- Manejo automático de errores 401
- Tipado de respuestas

### 4. Optimización de Vite
- Code splitting por vendor chunks
- Path aliases (`@/` para `src/`)
- Configuración TypeScript optimizada

### 5. Calidad de Código
- ESLint configurado con reglas TypeScript
- Prettier para formateo consistente
- Git ignore actualizado

### 6. Dependencias Limpias
- Eliminadas dependencias innecesarias (Next.js)
- Solo dependencias requeridas para Vite

## Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linting
npm run format   # Formateo
```

## Estructura del Proyecto

```
src/
├── components/    # Componentes reutilizables
├── hooks/         # Custom hooks
├── pages/         # Páginas de la aplicación
├── services/      # Servicios API
├── AuthContext.tsx # Contexto de autenticación
└── main.tsx       # Entry point
```

## Uso de la API

```typescript
import { apiService } from '@/services';

// GET request
const data = await apiService.get<UserData>('/user/profile');

// POST request
const result = await apiService.post('/auth/login', { email, password });
```

## Uso de Autenticación

```typescript
import { useAuth } from '@/hooks';

function MyComponent() {
  const { token, user, login, logout, isAuthenticated } = useAuth();
  
  // ...
}
```
