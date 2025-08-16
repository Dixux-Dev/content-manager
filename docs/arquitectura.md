# Arquitectura - Content Manager

## Diagrama de flujo de datos
Usuario → Next.js (App Router) → API interna (`/api/generate`) → SDK OpenAI → DeepSeek → Respuesta a Next.js → Render en Rich Text Editor → Guardado en SQLite vía Prisma.

## Stack Tecnológico
- **Frontend**: Next.js + TypeScript + Tailwind CSS + shadcn/ui + shadcn-editor
- **Backend/API**: Next.js API Routes
- **Autenticación**: NextAuth (email/password, roles)
- **Base de datos**: SQLite + Prisma ORM
- **Generación IA**: OpenAI Node.js SDK (DeepSeek endpoint)
- **Hosting**: Vercel (MVP)

## Estructura de carpetas

src/
├─ app/
│ ├─ page.tsx # Página principal (/)
│ ├─ generator/page.tsx # Generador (/generator)
│ ├─ profiles/page.tsx # Perfiles (/profiles)
│ ├─ api/
│ │ ├─ generate/route.ts # API para generar contenido
│ │ ├─ content/ # CRUD de contenido
│ │ └─ profiles/ # CRUD de perfiles
│ └─ auth/ # NextAuth config
├─ components/
│ ├─ ContentTable.tsx
│ ├─ ContentForm.tsx
│ ├─ ProfileForm.tsx
│ ├─ Editor.tsx
│ └─ Sidebar.tsx
├─ lib/
│ ├─ auth.ts # Configuración de NextAuth
│ ├─ prisma.ts # Cliente de Prisma
│ └─ openai.ts # Cliente SDK OpenAI
├─ prisma/
│ └─ schema.prisma # Modelos de la BD
└─ styles/
└─ globals.css


## Modelo de base de datos (Prisma)
```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  password  String
  role      Role     @default(VIEWER)
  content   Content[]
  profiles  Profile[] @relation("ProfileCreator")
}

model Content {
  id          String   @id @default(cuid())
  title       String
  type        ContentType
  category    String
  content     String   // HTML o JSON del editor
  profileId   String
  profile     Profile  @relation(fields: [profileId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastEditor  User?    @relation(fields: [lastEditorId], references: [id])
  lastEditorId String?
}

model Profile {
  id          String   @id @default(cuid())
  name        String
  description String?
  prompt      String   // Texto maestro
  creatorId   String
  creator     User     @relation("ProfileCreator", fields: [creatorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  content     Content[]
}

enum Role {
  ADMIN
  VIEWER
}

enum ContentType {
  SNIPPET
  PAGE
}

Flujo de autenticación

Usuario ingresa email y contraseña en login.

NextAuth valida credenciales contra SQLite (hash con bcrypt).

Se establece sesión y se guarda en cookies.

Middleware verifica rol antes de acceder a páginas restringidas.

Flujo de generación de contenido

Usuario llena el formulario en /generator.

Se envía POST /api/generate con datos.

Backend construye prompt a partir del perfil + datos.

Llama al SDK OpenAI con modelo DeepSeek.

Recibe respuesta, renderiza en el editor.

Usuario edita y guarda (POST /api/content).

Prisma guarda en SQLite.

Seguridad

Rutas protegidas por middleware según rol.

Validación de entrada en APIs.

Sanitización del contenido HTML antes de guardar.
