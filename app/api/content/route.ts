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
      category, 
      content, 
      profileId, 
      wordCount,
      lastEditorId 
    } = body

    // Validación
    if (!title || !type || !category || !content || !profileId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const newContent = await prisma.content.create({
      data: {
        title,
        type,
        category,
        content,
        profileId,
        wordCount: wordCount ? parseInt(wordCount) : null,
        lastEditorId: lastEditorId || null
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
      category, 
      content, 
      profileId, 
      wordCount,
      lastEditorId 
    } = body

    // Validación
    if (!id || !title || !type || !category || !content || !profileId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const updatedContent = await prisma.content.update({
      where: { id },
      data: {
        title,
        type,
        category,
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