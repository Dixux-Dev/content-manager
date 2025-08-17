import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, categories, profileId, wordCount, extraInstructions } = body

    // Validación básica
    if (!title || !type || !categories || !Array.isArray(categories) || categories.length === 0 || !profileId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos o las categorías deben ser un array no vacío' },
        { status: 400 }
      )
    }

    // Obtener el perfil
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Generar contenido usando DeepSeek con prompt del perfil únicamente
    const generatedContent = await generateContent({
      title,
      type,
      categories,
      profile: {
        prompt: profile.prompt
      },
      wordCount: wordCount ? parseInt(wordCount) : undefined,
      extraInstructions
    })

    return NextResponse.json({
      content: generatedContent,
      success: true
    })

  } catch (error) {
    console.error('Error generando contenido:', error)
    
    // Pasar errores específicos de la función generateContent al cliente
    if (error instanceof Error) {
      // Determinar el código de estado apropiado basado en el mensaje de error
      let statusCode = 500
      
      if (error.message.includes('API key inválida') || error.message.includes('unauthorized')) {
        statusCode = 401
      } else if (error.message.includes('Límite de velocidad') || error.message.includes('rate limit')) {
        statusCode = 429
      } else if (error.message.includes('Cuota de API') || error.message.includes('billing')) {
        statusCode = 402 // Payment Required
      } else if (error.message.includes('Error de conexión') || error.message.includes('no disponible')) {
        statusCode = 503 // Service Unavailable
      } else if (error.message.includes('tardó demasiado') || error.message.includes('timeout')) {
        statusCode = 408 // Request Timeout
      }
      
      return NextResponse.json(
        { 
          error: error.message,
          type: 'api_error',
          retryable: statusCode === 503 || statusCode === 408 || statusCode === 429
        },
        { status: statusCode }
      )
    }
    
    // Error genérico
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        type: 'internal_error',
        retryable: false
      },
      { status: 500 }
    )
  }
}