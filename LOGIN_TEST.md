# 🔐 Pruebas de Login - Content Manager

## Estructura Actualizada
Todos los archivos se han movido de `src/` a la raíz para seguir la estructura estándar de Next.js:

```
/
├── app/                    # Páginas y API routes
│   ├── api/auth/          # NextAuth endpoints
│   ├── dashboard/         # Dashboard protegido
│   ├── login/            # Página de login
│   └── ...
├── components/            # Componentes React
├── lib/                  # Utilidades y configuración
├── hooks/                # Custom hooks
├── types/                # Definiciones TypeScript
└── middleware.ts         # Middleware de autenticación
```

## 🚀 Configuración Rápida

1. **Ejecutar script de setup:**
```bash
./setup.sh
```

2. **O manualmente:**
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## 📝 Credenciales de Prueba

- **Admin**: `admin@example.com` / `admin123`
- **Viewer**: `viewer@example.com` / `viewer123`

## 🔄 Flujo de Prueba

### 1. Página Pública (`/`)
- ✅ Accesible sin autenticación
- 📊 Muestra estado de sesión actual
- 🔗 Botón "Iniciar Sesión" si no está autenticado
- 🏠 Botón "Dashboard" si está autenticado

### 2. Login (`/login`)
- 📝 Formulario de email/contraseña
- 🔄 Redirección automática a `/dashboard` después del login
- 🔄 Redirección automática a `/dashboard` si ya está autenticado
- ⬅️ Botón para volver al inicio

### 3. Dashboard (`/dashboard`)
- 🔒 Requiere autenticación
- 🔄 Redirige a `/login` si no está autenticado
- 👤 Muestra información del usuario logueado
- 📊 Tabla de contenido con datos

### 4. Rutas Protegidas
- `/dashboard/*` - Dashboard principal
- `/generator/*` - Generador de contenido
- `/profiles/*` - Gestión de perfiles (solo admin)

## 🧪 Tests de Funcionalidad

### Test 1: Usuario No Autenticado
1. Ir a `http://localhost:3000`
2. ✅ Ver página pública con botón "Iniciar Sesión"
3. Ir a `/dashboard`
4. ✅ Ser redirigido a `/login`

### Test 2: Login Exitoso
1. Ir a `/login`
2. Usar credenciales: `admin@example.com` / `admin123`
3. ✅ Ser redirigido a `/dashboard`
4. ✅ Ver información del usuario en sidebar

### Test 3: Usuario Autenticado
1. Después del login, ir a `/`
2. ✅ Ver botón "Dashboard" en lugar de "Iniciar Sesión"
3. ✅ Acceder a rutas protegidas sin redirección

### Test 4: Logout
1. En el dashboard, hacer click en "Cerrar Sesión" en el sidebar
2. ✅ Ser redirigido a `/login`
3. ✅ No poder acceder a rutas protegidas

## 🐛 Troubleshooting

### Error de Imports
Si ves errores de imports, asegúrate de que:
- `tsconfig.json` tenga `"@/*": ["./*"]`
- No haya carpeta `src/` restante

### Error de Base de Datos
```bash
npm run db:reset
npm run db:seed
```

### Error de NextAuth
Verifica que `.env` tenga:
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-change-in-production"
```

## ✅ Funcionalidades Implementadas

- ✅ NextAuth con JWT
- ✅ Middleware de protección de rutas
- ✅ Páginas de login responsive
- ✅ Gestión de sesiones
- ✅ Roles de usuario (ADMIN/VIEWER)
- ✅ UI adaptativa según estado de autenticación
- ✅ Redirecciones automáticas
- ✅ Logout funcional
- ✅ Validación de formularios
- ✅ Manejo de errores