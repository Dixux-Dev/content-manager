import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, categories, profileId, wordCount, extraInstructions } = body

    // Basic validation
    if (!title || !type || !categories || !Array.isArray(categories) || categories.length === 0 || !profileId) {
      return NextResponse.json(
        { error: 'Missing required fields or categories must be a non-empty array' },
        { status: 400 }
      )
    }

    // Get the profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Generate content using DeepSeek with profile prompt only
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
    console.error('Error generating content:', error)
    
    // Pass specific errors from generateContent function to client
    if (error instanceof Error) {
      // Determine appropriate status code based on error message
      let statusCode = 500
      
      if (error.message.includes('API key invalid') || error.message.includes('unauthorized')) {
        statusCode = 401
      } else if (error.message.includes('Rate limit') || error.message.includes('rate limit')) {
        statusCode = 429
      } else if (error.message.includes('API quota') || error.message.includes('billing')) {
        statusCode = 402 // Payment Required
      } else if (error.message.includes('Connection error') || error.message.includes('not available')) {
        statusCode = 503 // Service Unavailable
      } else if (error.message.includes('took too long') || error.message.includes('timeout')) {
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
    
    // Generic error
    return NextResponse.json(
      { 
        error: 'Internal server error',
        type: 'internal_error',
        retryable: false
      },
      { status: 500 }
    )
  }
}