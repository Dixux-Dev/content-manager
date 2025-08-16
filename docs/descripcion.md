# Content Manager - Descripción del Proyecto

## Resumen
Content Manager es un dashboard web construido con **Next.js** que permite generar, gestionar y buscar contenido de forma sencilla.  
El contenido se crea utilizando la API de DeepSeek a través de la librería oficial **OpenAI Node.js** y se guarda en una base de datos **SQLite** gestionada con **Prisma ORM**.  
El sistema cuenta con un login con **NextAuth** (email/password) y soporte para dos roles: **admin** y **viewer**.

## Páginas principales
### `/` - Lista de Contenido
- Muestra todo el contenido generado.
- Buscador y filtros por **categoría**, **tipo** (snippet/page), **perfil** y **fecha**.
- Tabla o lista con paginación (opcional en MVP).
- Los usuarios **viewer** pueden ver el contenido, los **admin** pueden editar o borrar.

### `/generator` - Generador de Contenido
Formulario con los siguientes campos:
1. **Título** (string)
2. **Tipo de contenido** (enum: snippet o page)
3. **Categoría** (string o selección predefinida)
4. **Perfil** (selector de perfil maestro con instrucciones, tono, estilo, formato de retorno)
5. **Número de palabras** (integer, solo necesario si tipo = snippet)
6. **Instrucciones extra** (textarea para ajustes adicionales)

Flujo:
- El usuario completa el formulario y presiona **Generar**.
- Se envía una solicitud a la API interna que usa **OpenAI** para conectarse a DeepSeek.
- El contenido generado aparece a la derecha en un **Rich Text Editor** (basado en [shadcn-editor](https://shadcn-editor.vercel.app/)).
- El usuario puede realizar ajustes manuales.
- Al presionar **Guardar**, el contenido se almacena en la base de datos junto con:
  - Fecha de creación
  - Última edición
  - Usuario que editó por última vez
  - Perfil utilizado
  - Categoría

### `/profiles` - Perfiles de Generación
- CRUD para perfiles de generación.
- Cada perfil tiene:
  - Nombre
  - Descripción
  - Texto de configuración (prompt maestro)
- El editor de texto será el mismo **Rich Text Editor** del generador.
- Solo los **admin** pueden crear, editar o eliminar perfiles.

## Roles de Usuario
- **Admin**: acceso total (crear/editar/eliminar contenido y perfiles).
- **Viewer**: solo puede ver el contenido, sin modificarlo.

## Autenticación
- **NextAuth** con email/password para MVP.
- Preparado para agregar social login en el futuro.

## Tecnologías
- **Next.js** (App Router)
- **TypeScript**
- **Prisma ORM** + **SQLite**
- **NextAuth**
- **shadcn/ui** + **shadcn-editor**
- **OpenAI Node.js SDK** (para DeepSeek)
- **Tailwind CSS**

## Flujo de generación de contenido
1. Usuario llena formulario en `/generator`.
2. Se envía la información (título, tipo, categoría, perfil, instrucciones extra) a la API interna.
3. La API llama a DeepSeek mediante el SDK oficial de OpenAI.
4. DeepSeek devuelve el contenido según el perfil y los parámetros enviados.
5. El contenido se muestra en el editor para revisión y edición final.
6. Al guardar, se almacena en SQLite vía Prisma.

## Futuras mejoras
- Social login (Google/GitHub).
- Paginación y ordenamiento avanzado.
- Versionado de contenido.
- Estadísticas de uso.
