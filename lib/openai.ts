import OpenAI from 'openai'

// Configuración para DeepSeek usando el SDK de OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
})

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

// Función helper para generar contenido
export async function generateContent({
  title,
  type,
  category,
  profile,
  wordCount,
  extraInstructions,
}: {
  title: string
  type: 'SNIPPET' | 'PAGE'
  category: string
  profile: {
    prompt: string
    tone?: string | null
    style?: string | null
    format?: string | null
  }
  wordCount?: number
  extraInstructions?: string
}) {
  const systemPrompt = `${profile.prompt}
${profile.tone ? `\nTono: ${profile.tone}` : ''}
${profile.style ? `\nEstilo: ${profile.style}` : ''}
${profile.format ? `\nFormato: ${profile.format}` : ''}`

  const userPrompt = `Genera contenido para:
Título: ${title}
Tipo: ${type === 'SNIPPET' ? 'Snippet corto' : 'Página completa'}
Categoría: ${category}
${wordCount ? `Número de palabras aproximado: ${wordCount}` : ''}
${extraInstructions ? `\nInstrucciones adicionales: ${extraInstructions}` : ''}`

  try {
    const completion = await openai.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: type === 'SNIPPET' ? 500 : 2000,
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Error generating content:', error)
    throw new Error('Failed to generate content')
  }
}