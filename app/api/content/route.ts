import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todo el contenido
export async function GET() {
  try {
    const content = await prisma.content.findMany({
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        lastEditor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error obteniendo contenido:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo contenido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      type, 
      categories, 
      content, 
      profileId, 
      wordCount,
      lastEditorId 
    } = body

    // Validación
    if (!title || !type || !categories || !Array.isArray(categories) || categories.length === 0 || !content || !profileId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos o las categorías deben ser un array no vacío' },
        { status: 400 }
      )
    }

    // Verificar que el perfil existe
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: `El perfil con ID ${profileId} no existe` },
        { status: 400 }
      )
    }

    // Verificar que el usuario editor existe (si se proporciona)
    let validEditor = null
    if (lastEditorId) {
      validEditor = await prisma.user.findUnique({
        where: { id: lastEditorId }
      })

      if (!validEditor) {
        console.warn(`Usuario con ID ${lastEditorId} no existe, se guardará sin editor`)
      }
    }

    const newContent = await prisma.content.create({
      data: {
        title,
        type,
        categories,
        content,
        profileId,
        wordCount: wordCount ? parseInt(wordCount) : null,
        lastEditorId: validEditor ? lastEditorId : null
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        lastEditor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(newContent, { status: 201 })
  } catch (error) {
    console.error('Error creando contenido:', error)
    
    // Manejo específico de errores de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Error de relación: Verifique que el perfil y usuario existan' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar contenido existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      title, 
      type, 
      categories, 
      content, 
      profileId, 
      wordCount,
      lastEditorId 
    } = body

    // Validación
    if (!id || !title || !type || !categories || !Array.isArray(categories) || categories.length === 0 || !content || !profileId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos o las categorías deben ser un array no vacío' },
        { status: 400 }
      )
    }

    const updatedContent = await prisma.content.update({
      where: { id },
      data: {
        title,
        type,
        categories,
        content,
        profileId,
        wordCount: wordCount ? parseInt(wordCount) : null,
        lastEditorId: lastEditorId || null,
        updatedAt: new Date()
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        lastEditor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedContent)
  } catch (error) {
    console.error('Error actualizando contenido:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar contenido
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de contenido requerido' },
        { status: 400 }
      )
    }

    await prisma.content.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Contenido eliminado exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error eliminando contenido:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}