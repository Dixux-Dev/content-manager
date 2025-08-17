import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic environment configuration
    const hasDeepSeekKey = !!process.env.DEEPSEEK_API_KEY
    const deepSeekKey = process.env.DEEPSEEK_API_KEY ? 
      `${process.env.DEEPSEEK_API_KEY.substring(0, 10)}...` : 'Not set'
    
    const config = {
      hasDeepSeekKey,
      deepSeekKey,
      AI_PROVIDER: process.env.AI_PROVIDER || 'Not set',
      AI_ENABLE_FALLBACK: process.env.AI_ENABLE_FALLBACK || 'Not set',
    }

    // Test DeepSeek connection
    let connectionTest = 'Not tested'
    let healthCheck = 'Not tested'
    
    try {
      // Import the provider factory
      const { AIProviderFactory } = await import('@/lib/ai-providers')
      const factory = AIProviderFactory.fromEnvironment()
      
      // Try to get logs from initialization
      connectionTest = 'Factory created'
      
      // Test health check
      const health = await factory.checkHealth('deepseek')
      healthCheck = health.status
      
    } catch (error) {
      connectionTest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return NextResponse.json({
      status: 'DeepSeek Diagnostic',
      config,
      connectionTest,
      healthCheck,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('DeepSeek test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('Testing DeepSeek content generation...')
    
    // Import the provider factory
    const { AIProviderFactory } = await import('@/lib/ai-providers')
    const factory = AIProviderFactory.fromEnvironment()
    
    // Test a simple content generation
    const testParams = {
      title: "Test Content",
      type: "SNIPPET" as const,
      categories: ["test"],
      profile: {
        name: "Test Profile",
        prompt: "You are a helpful AI assistant. Generate a simple test response."
      }
    }
    
    const result = await factory.generateContent(testParams)
    
    return NextResponse.json({
      status: 'Success',
      provider: result.provider,
      contentLength: result.content.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('DeepSeek generation test error:', error)
    return NextResponse.json({
      error: 'Generation test failed',
      message: error.message,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}