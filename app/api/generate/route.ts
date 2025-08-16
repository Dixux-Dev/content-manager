import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, category, profileId, wordCount, extraInstructions } = body

    // Validación básica
    if (!title || !type || !category || !profileId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
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

    // Generar contenido usando OpenAI/DeepSeek
    const generatedContent = await generateContent({
      title,
      type,
      category,
      profile: {
        prompt: profile.prompt,
        tone: profile.tone,
        style: profile.style,
        format: profile.format
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
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}