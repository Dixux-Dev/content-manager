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

  // Crear perfiles
  const blogProfile = await prisma.profile.create({
    data: {
      name: 'Blog SEO Optimizado',
      description: 'Perfil para generar artículos de blog optimizados para SEO',
      prompt: 'Eres un experto en redacción de blogs SEO. Crea contenido optimizado para motores de búsqueda, con estructura clara, palabras clave relevantes y valor para el lector.',
      tone: 'Profesional pero accesible',
      style: 'Informativo y persuasivo',
      format: 'HTML con encabezados, párrafos y listas',
      creatorId: adminUser.id
    }
  })

  const socialProfile = await prisma.profile.create({
    data: {
      name: 'Redes Sociales',
      description: 'Perfil para crear contenido viral para redes sociales',
      prompt: 'Eres un community manager experto. Crea contenido atractivo, conciso y compartible para redes sociales.',
      tone: 'Casual y divertido',
      style: 'Directo y llamativo',
      format: 'Texto corto con emojis y hashtags',
      creatorId: adminUser.id
    }
  })

  const techProfile = await prisma.profile.create({
    data: {
      name: 'Documentación Técnica',
      description: 'Perfil para generar documentación técnica clara y detallada',
      prompt: 'Eres un redactor técnico experimentado. Crea documentación clara, precisa y bien estructurada.',
      tone: 'Técnico y preciso',
      style: 'Claro y metódico',
      format: 'Markdown con ejemplos de código',
      creatorId: adminUser.id
    }
  })

  // Crear contenido de ejemplo
  await prisma.content.create({
    data: {
      title: '10 Mejores Prácticas de SEO en 2024',
      type: 'PAGE',
      category: 'Marketing Digital',
      content: `<h1>10 Mejores Prácticas de SEO en 2024</h1>
<p>El SEO continúa evolucionando en 2024, y mantenerse actualizado con las mejores prácticas es crucial para el éxito online.</p>
<h2>1. Optimización para Core Web Vitals</h2>
<p>Google ha enfatizado la importancia de la experiencia del usuario, especialmente en términos de velocidad de carga, interactividad y estabilidad visual.</p>
<h2>2. Contenido E-E-A-T</h2>
<p>Experiencia, Expertise, Autoridad y Confiabilidad son más importantes que nunca.</p>
<h2>3. Búsqueda por voz y AI</h2>
<p>Con el auge de los asistentes virtuales, optimizar para búsquedas conversacionales es esencial.</p>`,
      wordCount: 850,
      profileId: blogProfile.id,
      lastEditorId: adminUser.id
    }
  })

  await prisma.content.create({
    data: {
      title: 'Lanzamiento de Producto - Instagram Post',
      type: 'SNIPPET',
      category: 'Social Media',
      content: `🚀 ¡GRAN LANZAMIENTO! 🚀

Presentamos nuestro nuevo producto que revolucionará tu día a día ✨

✅ Diseño innovador
✅ Tecnología de punta
✅ Precio especial de lanzamiento

🎁 Los primeros 100 clientes reciben 20% OFF

Comenta "QUIERO" y te enviamos el link 👇

#NuevoProducto #Innovación #Lanzamiento #OfertaEspecial`,
      wordCount: 50,
      profileId: socialProfile.id,
      lastEditorId: adminUser.id
    }
  })

  await prisma.content.create({
    data: {
      title: 'API REST - Guía de Implementación',
      type: 'PAGE',
      category: 'Desarrollo',
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
      profileId: techProfile.id,
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