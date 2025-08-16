# Content Manager

Dashboard web para generar, gestionar y buscar contenido usando IA (DeepSeek) con Next.js, TypeScript y Prisma.

## Características

- 🤖 **Generación de IA**: Integración con DeepSeek para generar contenido personalizado
- 👥 **Sistema de Roles**: Admin y Viewer con permisos diferenciados
- 📝 **Editor Rico**: Interface de edición con vista previa
- 🏷️ **Categorización**: Organización por categorías y tipos de contenido
- 🔍 **Búsqueda Avanzada**: Filtros por categoría, tipo y fecha
- 📊 **Perfiles Personalizables**: Plantillas de IA configurables

## Stack Tecnológico

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **UI**: Radix UI + shadcn/ui components
- **Backend**: Next.js API Routes
- **Base de Datos**: SQLite + Prisma ORM
- **IA**: DeepSeek API via OpenAI SDK
- **Autenticación**: NextAuth.js (preparado)

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── generate/      # Generación de contenido
│   │   ├── content/       # CRUD de contenido
│   │   └── profiles/      # CRUD de perfiles
│   ├── generator/         # Página generador
│   ├── profiles/          # Página perfiles
│   └── page.tsx          # Dashboard principal
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   ├── sidebar.tsx       # Navegación lateral
│   ├── content-table.tsx # Tabla de contenido
│   ├── content-form.tsx  # Formulario generador
│   └── profile-form.tsx  # Gestión de perfiles
├── lib/                  # Librerías y utilidades
│   ├── prisma.ts        # Cliente Prisma
│   ├── openai.ts        # Cliente DeepSeek/OpenAI
│   └── utils.ts         # Utilidades generales
├── types/               # Tipos TypeScript
├── data/                # Datos mock para desarrollo
└── styles/              # Estilos globales
```

## Instalación y Configuración

### 1. Clonar y instalar dependencias

```bash
git clone <repository-url>
cd content-manager
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env.local`:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# OpenAI (DeepSeek)
OPENAI_API_KEY="your-deepseek-api-key-here"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"
```

### 3. Configurar base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Crear base de datos
npm run db:push

# Poblar con datos de ejemplo
npm run db:seed
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Usuarios de Prueba

Después de ejecutar el seed:

- **Admin**: `admin@example.com` / `admin123`
- **Viewer**: `viewer@example.com` / `viewer123`

## Funcionalidades por Rol

### Administrador
- ✅ Ver todo el contenido
- ✅ Crear nuevo contenido
- ✅ Editar contenido existente
- ✅ Eliminar contenido
- ✅ Gestionar perfiles de IA
- ✅ Crear/editar/eliminar perfiles

### Viewer
- ✅ Ver contenido existente
- ✅ Usar generador de contenido
- ❌ Editar/eliminar contenido
- ❌ Gestionar perfiles

## Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor desarrollo

# Producción
npm run build           # Construir aplicación
npm run start           # Iniciar servidor producción

# Base de datos
npm run db:generate     # Generar cliente Prisma
npm run db:push         # Sincronizar esquema
npm run db:migrate      # Crear migración
npm run db:reset        # Resetear base de datos
npm run db:seed         # Poblar con datos ejemplo

# Calidad
npm run lint            # Linter ESLint
```

## Próximos Pasos

### Funcionalidades Pendientes
1. **Autenticación**: Implementar NextAuth completamente
2. **Editor Rico**: Integrar shadcn-editor para edición avanzada
3. **Paginación**: Implementar paginación en tablas
4. **Búsqueda**: Mejorar sistema de filtros
5. **Versionado**: Sistema de versiones de contenido
6. **Estadísticas**: Dashboard de métricas y analytics
7. **Export**: Exportar contenido en diferentes formatos
8. **Social Login**: Google/GitHub authentication

### Configuración de Producción
1. **Base de Datos**: Migrar de SQLite a PostgreSQL
2. **Deploy**: Configurar en Vercel/Railway
3. **Variables**: Configurar variables de producción
4. **Dominio**: Configurar dominio personalizado
5. **SSL**: Certificados SSL/TLS
6. **Monitoring**: Logging y monitoreo

## Contribución

1. Fork del proyecto
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push al branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

MIT License