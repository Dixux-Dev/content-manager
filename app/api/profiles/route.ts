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