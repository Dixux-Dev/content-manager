import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Test direct connection to DeepSeek using fetch
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Hello, can you respond with just "Connection test successful"?'
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      })
    })

    const responseText = await response.text()
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Direct DeepSeek test error:', error)
    return NextResponse.json({
      error: 'Direct test failed',
      message: error.message,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}