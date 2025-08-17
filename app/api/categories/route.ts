import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener categorías únicas del contenido existente
export async function GET() {
  try {
    // Obtener todas las categorías de la base de datos (ahora son JSON arrays)
    const content = await prisma.content.findMany({
      select: {
        categories: true
      }
    })

    // Extraer y aplanar todas las categorías desde los arrays JSON
    const allCategories = new Set<string>()
    content.forEach(item => {
      if (Array.isArray(item.categories)) {
        item.categories.forEach((category: any) => {
          if (category && typeof category === 'string' && category.trim() !== '') {
            allCategories.add(category.trim())
          }
        })
      }
    })

    // Convertir a array y ordenar
    const categoryNames = Array.from(allCategories).sort()

    return NextResponse.json(categoryNames)
  } catch (error) {
    console.error('Error obteniendo categorías:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Agregar nueva categoría (esto se hace implícitamente al crear contenido)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category } = body

    // Validación
    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'Categoría requerida' },
        { status: 400 }
      )
    }

    // Verificar si la categoría ya existe en algún array de categorías
    const content = await prisma.content.findMany({
      select: {
        categories: true
      }
    })
    
    const categoryExists = content.some(item => {
      if (Array.isArray(item.categories)) {
        return item.categories.some((cat: any) => 
          typeof cat === 'string' && cat.toLowerCase().trim() === category.toLowerCase().trim()
        )
      }
      return false
    })

    if (categoryExists) {
      return NextResponse.json(
        { error: 'La categoría ya existe' },
        { status: 400 }
      )
    }

    // No creamos contenido, solo validamos que es una categoría válida
    // La categoría se agregará cuando se cree contenido con ella
    return NextResponse.json({ 
      message: 'Categoría válida',
      category: category.trim()
    })

  } catch (error) {
    console.error('Error validando categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una categoría de todos los contenidos
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { category } = body

    // Validación
    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'Categoría requerida' },
        { status: 400 }
      )
    }

    // Obtener todos los contenidos que tienen esta categoría
    const contents = await prisma.content.findMany({
      select: {
        id: true,
        categories: true
      }
    })

    // Actualizar cada contenido para remover la categoría
    const updatePromises = contents.map(async (content) => {
      if (Array.isArray(content.categories)) {
        const updatedCategories = content.categories.filter((cat: any) => 
          !(typeof cat === 'string' && cat.toLowerCase().trim() === category.toLowerCase().trim())
        )
        
        // Solo actualizar si la categoría fue encontrada y removida
        if (updatedCategories.length !== content.categories.length) {
          return prisma.content.update({
            where: { id: content.id },
            data: { categories: updatedCategories }
          })
        }
      }
      return null
    })

    // Ejecutar todas las actualizaciones
    const results = await Promise.all(updatePromises)
    const updatedCount = results.filter(r => r !== null).length

    return NextResponse.json({ 
      message: `Categoría "${category}" eliminada de ${updatedCount} contenido(s)`,
      updatedCount
    })

  } catch (error) {
    console.error('Error eliminando categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}