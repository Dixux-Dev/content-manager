import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.content.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const viewerPassword = await bcrypt.hash('viewer123', 10)

  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  const viewerUser = await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: viewerPassword,
      role: 'VIEWER'
    }
  })

  // Create professional HTML profile
  const htmlProfile = await prisma.profile.create({
    data: {
      name: 'Professional HTML Generator',
      description: 'Profile specialized in generating structured and semantic HTML content',
      prompt: `You are a PROFESSIONAL CONTENT EDITOR specialized in creating high-quality digital content for web. Your function is to generate structured, semantic HTML content optimized for Lexical-based rich text editors.

IMPORTANT: You are a content generation system integrated into a professional CMS. Users will provide specific information through the generation form and your job is to create HTML content that works perfectly in our rich text editor.

FORM FIELDS YOU WILL RECEIVE:
1. TITLE: The main title of the content to generate
2. CONTENT TYPE: 
   - SNIPPET: Short and concise content (100-500 words)
   - PAGE: Extensive and complete content (500-2000 words)
3. CATEGORY: The thematic area (Marketing, Technology, Education, etc.)
4. WORD COUNT: Specific word target (mainly for snippets)
5. ADDITIONAL INSTRUCTIONS: Specific user requirements

YOUR MISSION AS EDITOR:
- Create original, valuable and well-structured content
- Adapt tone and style according to category and content type
- Optimize for readability and user engagement
- Ensure HTML structure compatible with rich text editors

CONTENT STRUCTURE BY TYPE:

For SNIPPET (short content):
- Direct introduction to the topic (1 paragraph)
- Concise development with 2-3 main points
- Use H2 for subtitles if necessary
- Lists when they add value
- Brief conclusion or call-to-action

For PAGE (extensive content):
- H1 with the main title
- Engaging introduction (2-3 paragraphs)
- Sections with H2 and subsections with H3
- Balanced paragraphs (3-5 sentences)
- Lists to improve readability
- Solid conclusion with added value

HTML FORMAT FOR RICH TEXT EDITOR (CRITICAL):
ONLY PURE HTML - No Markdown format allowed:
- DO NOT use ** for bold, use <strong> or <b>
- DO NOT use _ for italics, use <em> or <i>
- DO NOT use # for titles, use <h1>, <h2>, <h3>
- DO NOT use backticks for code, use <code> or <pre>
- DO NOT use > for quotes, use <blockquote>

IMPORTANT - NEVER WRAP THE HTML:
- DO NOT wrap content in \`\`\`html ... \`\`\`
- DO NOT use markdown code blocks
- DO NOT add prefixes like "html:" or similar
- RETURN ONLY the HTML directly

REQUIRED SEMANTIC HTML:
- Titles: <h1>, <h2>, <h3> (correct hierarchy)
- Paragraphs: <p> for all text
- Emphasis: <strong> for importance, <em> for emphasis
- Lists: <ul><li> for points, <ol><li> for sequences
- Quotes: <blockquote> to highlight information
- Code: <code> for inline, <pre><code> for blocks
- No style, class or id attributes
- No JavaScript or inline CSS
- Valid and well-structured HTML

QUALITY STANDARDS:
- 100% original and relevant content
- Current and accurate information
- Logical and coherent flow
- Natural SEO optimization
- Web accessibility (semantic structure)
- Optimized readability

OUTPUT INSTRUCTIONS:
Generate ONLY the requested HTML content. Do not include explanations, comments or additional text. The HTML must be clean, functional and ready to be loaded directly into the rich text editor.`,
      creatorId: adminUser.id
    }
  })

  // Create sample content
  await prisma.content.create({
    data: {
      title: '10 Best SEO Practices in 2024',
      type: 'PAGE',
      categories: ['Digital Marketing', 'SEO', 'Web'],
      content: `<h1>10 Best SEO Practices in 2024</h1>
<p>SEO continues evolving in 2024, and staying updated with best practices is crucial for online success.</p>
<h2>1. Core Web Vitals Optimization</h2>
<p>Google has emphasized the importance of user experience, especially in terms of loading speed, interactivity and visual stability.</p>
<h2>2. E-E-A-T Content</h2>
<p>Experience, Expertise, Authority and Trustworthiness are more important than ever.</p>
<h2>3. Voice Search and AI</h2>
<p>With the rise of virtual assistants, optimizing for conversational searches is essential.</p>`,
      wordCount: 850,
      profileId: htmlProfile.id,
      lastEditorId: adminUser.id
    }
  })

  await prisma.content.create({
    data: {
      title: 'Product Launch - Instagram Post',
      type: 'SNIPPET',
      categories: ['Social Media', 'Marketing', 'Instagram'],
      content: `🚀 BIG LAUNCH! 🚀

Introducing our new product that will revolutionize your daily life ✨

✅ Innovative design
✅ Cutting-edge technology
✅ Special launch price

🎁 First 100 customers get 20% OFF

Comment "WANT" and we'll send you the link 👇

#NewProduct #Innovation #Launch #SpecialOffer`,
      wordCount: 50,
      profileId: htmlProfile.id,
      lastEditorId: adminUser.id
    }
  })

  await prisma.content.create({
    data: {
      title: 'REST API - Implementation Guide',
      type: 'PAGE',
      categories: ['Development', 'API', 'Backend'],
      content: `# REST API - Implementation Guide

## Introduction
This guide provides detailed instructions for implementing our REST API.

## Authentication
All requests require a Bearer token in the header:

\`\`\`javascript
headers: {
  'Authorization': 'Bearer YOUR_API_TOKEN'
}
\`\`\`

## Main endpoints

### GET /api/users
Gets the list of users.

### POST /api/users
Creates a new user.

## Error handling
The API returns standard HTTP status codes...`,
      wordCount: 1200,
      profileId: htmlProfile.id,
      lastEditorId: null
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin User: admin@example.com / admin123`)
  console.log(`👤 Viewer User: viewer@example.com / viewer123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })