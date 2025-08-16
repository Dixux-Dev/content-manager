import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los perfiles
export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      include: {
        creator: {
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

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Error obteniendo perfiles:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo perfil
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      prompt, 
      tone, 
      style, 
      format, 
      creatorId 
    } = body

    // Validación
    if (!name || !prompt || !creatorId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const newProfile = await prisma.profile.create({
      data: {
        name,
        description: description || null,
        prompt,
        tone: tone || null,
        style: style || null,
        format: format || null,
        creatorId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(newProfile, { status: 201 })
  } catch (error) {
    console.error('Error creando perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar perfil existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      name, 
      description, 
      prompt, 
      tone, 
      style, 
      format
    } = body

    // Validación
    if (!id || !name || !prompt) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const updatedProfile = await prisma.profile.update({
      where: { id },
      data: {
        name,
        description: description || null,
        prompt,
        tone: tone || null,
        style: style || null,
        format: format || null,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar perfil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de perfil requerido' },
        { status: 400 }
      )
    }

    // Verificar si el perfil tiene contenido asociado
    const contentCount = await prisma.content.count({
      where: { profileId: id }
    })

    if (contentCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un perfil que tiene contenido asociado' },
        { status: 400 }
      )
    }

    await prisma.profile.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Perfil eliminado exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error eliminando perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}