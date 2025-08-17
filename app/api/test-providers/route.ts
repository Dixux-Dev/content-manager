import { NextRequest, NextResponse } from 'next/server'
import { 
  AIProviderFactory, 
  validateEnvironment,
  checkAllProvidersHealth,
  getCurrentProvider
} from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    // Validate environment configuration
    const validation = validateEnvironment()
    
    // Get current provider info  
    const currentProvider = await getCurrentProvider()
    
    // Check health of all providers
    const healthStatus = await checkAllProvidersHealth()
    
    // Get factory configuration
    const factory = AIProviderFactory.fromEnvironment()
    const config = factory.getConfiguration()
    const availableProviders = factory.getAvailableProviders()
    
    return NextResponse.json({
      success: true,
      environment: {
        validation,
        AI_PROVIDER: process.env.AI_PROVIDER || 'not-set',
        AI_ENABLE_FALLBACK: process.env.AI_ENABLE_FALLBACK || 'not-set',
        hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY
      },
      factory: {
        config,
        availableProviders
      },
      currentProvider,
      health: healthStatus,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Provider test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testContent = false } = body
    
    if (!testContent) {
      return NextResponse.json({
        success: true,
        message: 'Test endpoint is working. Set testContent: true to test content generation.'
      })
    }
    
    // Test content generation
    const factory = AIProviderFactory.fromEnvironment()
    
    const testParams = {
      title: 'Test Article',
      type: 'SNIPPET' as const,
      categories: ['test', 'ai'],
      profile: {
        prompt: 'You are a helpful assistant that creates concise, informative content.'
      },
      wordCount: 100,
      extraInstructions: 'Keep it simple and direct.'
    }
    
    const response = await factory.generateContent(testParams)
    
    return NextResponse.json({
      success: true,
      test: {
        provider: response.provider,
        content: response.content,
        usage: response.usage,
        model: response.model
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Content generation test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      type: error.constructor.name
    }, { status: 500 })
  }
}