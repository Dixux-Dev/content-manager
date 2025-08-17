import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all content
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
    console.error('Error getting content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new content
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

    // Validation
    if (!title || !type || !categories || !Array.isArray(categories) || categories.length === 0 || !content || !profileId) {
      return NextResponse.json(
        { error: 'Missing required fields or categories must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify that profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: `Profile with ID ${profileId} does not exist` },
        { status: 400 }
      )
    }

    // Verify that editor user exists (if provided)
    let validEditor = null
    if (lastEditorId) {
      validEditor = await prisma.user.findUnique({
        where: { id: lastEditorId }
      })

      if (!validEditor) {
        console.warn(`User with ID ${lastEditorId} does not exist, will save without editor`)
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
    console.error('Error creating content:', error)
    
    // Specific Prisma error handling
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Relationship error: Verify that profile and user exist' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing content
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

    // Validation
    if (!id || !title || !type || !categories || !Array.isArray(categories) || categories.length === 0 || !content || !profileId) {
      return NextResponse.json(
        { error: 'Missing required fields or categories must be a non-empty array' },
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
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID required' },
        { status: 400 }
      )
    }

    await prisma.content.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Content deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}