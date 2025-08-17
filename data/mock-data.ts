export const mockContent = [
  {
    id: "1",
    title: "Guía de SEO 2024",
    type: "PAGE" as const,
    category: "Marketing Digital",
    content: "<h1>Guía Completa de SEO 2024</h1><p>Las mejores prácticas para optimizar tu sitio web...</p>",
    wordCount: 1250,
    profileId: "profile-1",
    profile: {
      id: "profile-1",
      name: "Blog SEO Optimizado",
      description: "Perfil para generar artículos de blog optimizados para SEO",
      prompt: "Eres un experto en redacción de blogs SEO...",
      tone: "Profesional pero accesible",
      style: "Informativo y persuasivo",
      format: "HTML con encabezados, párrafos y listas",
      creatorId: "user-1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    lastEditor: {
      id: "user-1",
      name: "Administrador",
      email: "admin@example.com",
      role: "ADMIN" as const,
    },
    lastEditorId: "user-1"
  },
  {
    id: "2",
    title: "Post Instagram - Lanzamiento",
    type: "SNIPPET" as const,
    category: "Social Media",
    content: "🚀 ¡GRAN LANZAMIENTO! 🚀\n\nPresentamos nuestro nuevo producto que revolucionará tu día a día ✨\n\n✅ Diseño innovador\n✅ Tecnología de punta\n✅ Precio especial de lanzamiento\n\n🎁 Los primeros 100 clientes reciben 20% OFF\n\nComenta \"QUIERO\" y te enviamos el link 👇\n\n#NuevoProducto #Innovación #Lanzamiento #OfertaEspecial",
    wordCount: 65,
    profileId: "profile-2",
    profile: {
      id: "profile-2",
      name: "Redes Sociales",
      description: "Perfil para crear contenido viral para redes sociales",
      prompt: "Eres un community manager experto...",
      tone: "Casual y divertido",
      style: "Directo y llamativo",
      format: "Texto corto con emojis y hashtags",
      creatorId: "user-1",
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    },
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
    lastEditor: {
      id: "user-1",
      name: "Administrador",
      email: "admin@example.com",
      role: "ADMIN" as const,
    },
    lastEditorId: "user-1"
  },
  {
    id: "3",
    title: "Documentación API REST",
    type: "PAGE" as const,
    category: "Desarrollo",
    content: "# API REST - Guía de Implementación\n\n## Introducción\nEsta guía proporciona instrucciones detalladas para implementar nuestra API REST.\n\n## Autenticación\nTodas las solicitudes requieren un token Bearer en el header:\n\n```javascript\nheaders: {\n  'Authorization': 'Bearer YOUR_API_TOKEN'\n}\n```\n\n## Endpoints principales\n\n### GET /api/users\nObtiene la lista de usuarios.\n\n### POST /api/users\nCrea un nuevo usuario.\n\n## Manejo de errores\nLa API retorna códigos de estado HTTP estándar...",
    wordCount: 180,
    profileId: "profile-3",
    profile: {
      id: "profile-3",
      name: "Documentación Técnica",
      description: "Perfil para generar documentación técnica clara y detallada",
      prompt: "Eres un redactor técnico experimentado...",
      tone: "Técnico y preciso",
      style: "Claro y metódico",
      format: "Markdown con ejemplos de código",
      creatorId: "user-1",
      createdAt: new Date("2024-01-17"),
      updatedAt: new Date("2024-01-17"),
    },
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-17"),
    lastEditor: null,
    lastEditorId: null
  }
]

export const mockProfiles = [
  {
    id: "profile-1",
    name: "Generador HTML Profesional",
    description: "Perfil especializado en generar contenido HTML estructurado y semántico",
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
    creatorId: "user-1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  }
]

export const categories = [
  "Marketing Digital"
]