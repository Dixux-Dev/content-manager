import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Limpiar datos existentes
  await prisma.content.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 10)
  const viewerPassword = await bcrypt.hash('viewer123', 10)

  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  const viewerUser = await prisma.user.create({
    data: {
      name: 'Usuario Viewer',
      email: 'viewer@example.com',
      password: viewerPassword,
      role: 'VIEWER'
    }
  })

  // Crear perfil HTML profesional
  const htmlProfile = await prisma.profile.create({
    data: {
      name: 'Generador HTML Profesional',
      description: 'Perfil especializado en generar contenido HTML estructurado y semántico',
      prompt: `Eres un EDITOR DE CONTENIDO PROFESIONAL especializado en crear contenido digital de alta calidad para web. Tu función es generar contenido HTML estructurado, semántico y optimizado para rich text editors basados en Lexical.

IMPORTANTE: Eres un sistema de generación de contenido integrado a un CMS profesional. Los usuarios te proporcionarán información específica a través del formulario de generación y tu trabajo es crear contenido HTML que funcione perfectamente en nuestro rich text editor.

CAMPOS DEL FORMULARIO QUE RECIBIRÁS:
1. TÍTULO: El título principal del contenido a generar
2. TIPO DE CONTENIDO: 
   - SNIPPET: Contenido corto y conciso (100-500 palabras)
   - PAGE: Contenido extenso y completo (500-2000 palabras)
3. CATEGORÍA: El área temática (Marketing, Tecnología, Educación, etc.)
4. NÚMERO DE PALABRAS: Meta específica de palabras (principalmente para snippets)
5. INSTRUCCIONES ADICIONALES: Requerimientos específicos del usuario

TU MISIÓN COMO EDITOR:
- Crear contenido original, valioso y bien estructurado
- Adaptar el tono y estilo según la categoría y tipo de contenido
- Optimizar para legibilidad y engagement del usuario
- Asegurar estructura HTML compatible con rich text editors

ESTRUCTURA DE CONTENIDO POR TIPO:

Para SNIPPET (contenido corto):
- Introducción directa al tema (1 párrafo)
- Desarrollo conciso con 2-3 puntos principales
- Usar H2 para subtítulos si es necesario
- Listas cuando aporten valor
- Conclusión breve o call-to-action

Para PAGE (contenido extenso):
- H1 con el título principal
- Introducción engaging (2-3 párrafos)
- Secciones con H2 y subsecciones con H3
- Párrafos balanceados (3-5 oraciones)
- Listas para mejorar legibilidad
- Conclusión sólida con valor agregado

FORMATO HTML PARA RICH TEXT EDITOR (CRITICO):
SOLO HTML PURO - Prohibido cualquier formato Markdown:
- NO uses ** para negritas, usa <strong> o <b>
- NO uses _ para cursivas, usa <em> o <i>
- NO uses # para títulos, usa <h1>, <h2>, <h3>
- NO uses backticks para código, usa <code> o <pre>
- NO uses > para citas, usa <blockquote>

IMPORTANTE - NUNCA ENVUELVAS EL HTML:
- NO envuelvas el contenido en ```html ... ```
- NO uses bloques de código markdown
- NO agregues prefijos como "html:" o similares
- DEVUELVE SOLO el HTML directamente

HTML SEMANTICO REQUERIDO:
- Títulos: <h1>, <h2>, <h3> (jerarquía correcta)
- Párrafos: <p> para todo el texto
- Énfasis: <strong> para importancia, <em> para énfasis
- Listas: <ul><li> para puntos, <ol><li> para secuencias
- Citas: <blockquote> para destacar información
- Código: <code> para inline, <pre><code> para bloques
- Sin atributos style, class o id
- Sin JavaScript ni CSS inline
- HTML válido y bien estructurado

ESTÁNDARES DE CALIDAD:
- Contenido 100% original y relevante
- Información actual y precisa
- Flujo lógico y coherente
- Optimización SEO natural
- Accesibilidad web (estructura semántica)
- Legibilidad optimizada

INSTRUCCIONES DE SALIDA:
Genera ÚNICAMENTE el contenido HTML solicitado. No incluyas explicaciones, comentarios o texto adicional. El HTML debe ser limpio, funcional y listo para ser cargado directamente en el rich text editor.`,
      creatorId: adminUser.id
    }
  })

  // Crear contenido de ejemplo
  await prisma.content.create({
    data: {
      title: '10 Mejores Prácticas de SEO en 2024',
      type: 'PAGE',
      categories: ['Marketing Digital', 'SEO', 'Web'],
      content: `<h1>10 Mejores Prácticas de SEO en 2024</h1>
<p>El SEO continúa evolucionando en 2024, y mantenerse actualizado con las mejores prácticas es crucial para el éxito online.</p>
<h2>1. Optimización para Core Web Vitals</h2>
<p>Google ha enfatizado la importancia de la experiencia del usuario, especialmente en términos de velocidad de carga, interactividad y estabilidad visual.</p>
<h2>2. Contenido E-E-A-T</h2>
<p>Experiencia, Expertise, Autoridad y Confiabilidad son más importantes que nunca.</p>
<h2>3. Búsqueda por voz y AI</h2>
<p>Con el auge de los asistentes virtuales, optimizar para búsquedas conversacionales es esencial.</p>`,
      wordCount: 850,
      profileId: htmlProfile.id,
      lastEditorId: adminUser.id
    }
  })

  await prisma.content.create({
    data: {
      title: 'Lanzamiento de Producto - Instagram Post',
      type: 'SNIPPET',
      categories: ['Social Media', 'Marketing', 'Instagram'],
      content: `🚀 ¡GRAN LANZAMIENTO! 🚀

Presentamos nuestro nuevo producto que revolucionará tu día a día ✨

✅ Diseño innovador
✅ Tecnología de punta
✅ Precio especial de lanzamiento

🎁 Los primeros 100 clientes reciben 20% OFF

Comenta "QUIERO" y te enviamos el link 👇

#NuevoProducto #Innovación #Lanzamiento #OfertaEspecial`,
      wordCount: 50,
      profileId: htmlProfile.id,
      lastEditorId: adminUser.id
    }
  })

  await prisma.content.create({
    data: {
      title: 'API REST - Guía de Implementación',
      type: 'PAGE',
      categories: ['Desarrollo', 'API', 'Backend'],
      content: `# API REST - Guía de Implementación

## Introducción
Esta guía proporciona instrucciones detalladas para implementar nuestra API REST.

## Autenticación
Todas las solicitudes requieren un token Bearer en el header:

\`\`\`javascript
headers: {
  'Authorization': 'Bearer YOUR_API_TOKEN'
}
\`\`\`

## Endpoints principales

### GET /api/users
Obtiene la lista de usuarios.

### POST /api/users
Crea un nuevo usuario.

## Manejo de errores
La API retorna códigos de estado HTTP estándar...`,
      wordCount: 1200,
      profileId: htmlProfile.id,
      lastEditorId: null
    }
  })

  console.log('✅ Base de datos sembrada exitosamente!')
  console.log(`👤 Usuario Admin: admin@example.com / admin123`)
  console.log(`👤 Usuario Viewer: viewer@example.com / viewer123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })