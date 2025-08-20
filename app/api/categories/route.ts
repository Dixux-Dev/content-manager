import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get unique categories from existing content
export async function GET() {
  try {
    // Get all categories from database (now they are JSON arrays)
    const content = await prisma.content.findMany({
      select: {
        categories: true
      }
    })

    // Extract and flatten all categories from JSON arrays
    const allCategories = new Set<string>()
    content.forEach((item: { categories: any }) => {
      if (Array.isArray(item.categories)) {
        item.categories.forEach((category: string) => {
          if (category && typeof category === 'string' && category.trim() !== '') {
            allCategories.add(category.trim())
          }
        })
      }
    })

    // Convert to array and sort
    const categoryNames = Array.from(allCategories).sort()

    return NextResponse.json(categoryNames)
  } catch (error) {
    console.error('Error getting categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new category (this is done implicitly when creating content)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category } = body

    // Validation
    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category required' },
        { status: 400 }
      )
    }

    // Check if category already exists in any category array
    const content = await prisma.content.findMany({
      select: {
        categories: true
      }
    })
    
    const categoryExists = content.some((item: { categories: any }) => {
      if (Array.isArray(item.categories)) {
        return item.categories.some((cat: string) => 
          typeof cat === 'string' && cat.toLowerCase().trim() === category.toLowerCase().trim()
        )
      }
      return false
    })

    if (categoryExists) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      )
    }

    // We don't create content, just validate that it's a valid category
    // The category will be added when content is created with it
    return NextResponse.json({ 
      message: 'Valid category',
      category: category.trim()
    })

  } catch (error) {
    console.error('Error validating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a category from all content
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { category } = body

    // Validation
    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category required' },
        { status: 400 }
      )
    }

    // Get all content that has this category
    const contents = await prisma.content.findMany({
      select: {
        id: true,
        categories: true
      }
    })

    // Update each content to remove the category
    const updatePromises = contents.map(async (content: { id: string; categories: any }) => {
      if (Array.isArray(content.categories)) {
        const updatedCategories = content.categories.filter((cat: string) => 
          !(typeof cat === 'string' && cat.toLowerCase().trim() === category.toLowerCase().trim())
        )
        
        // Only update if category was found and removed
        if (updatedCategories.length !== content.categories.length) {
          return prisma.content.update({
            where: { id: content.id },
            data: { categories: updatedCategories }
          })
        }
      }
      return null
    })

    // Execute all updates
    const results = await Promise.all(updatePromises)
    const updatedCount = results.filter(r => r !== null).length

    return NextResponse.json({ 
      message: `Category "${category}" deleted from ${updatedCount} content(s)`,
      updatedCount
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}