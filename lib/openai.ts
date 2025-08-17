import OpenAI from 'openai'
import { AIProviderFactory, ContentGenerationParams, AIProviderError } from './ai-providers'

// Initialize the AI provider factory
const providerFactory = AIProviderFactory.fromEnvironment()

// Legacy OpenAI client for backward compatibility (now uses dynamic provider)
let legacyClient: OpenAI | null = null

// Get the appropriate OpenAI client based on current provider
function getLegacyClient(): OpenAI {
  if (!legacyClient) {
    // This is for legacy compatibility - create client based on current primary provider
    const provider = process.env.AI_PROVIDER || 'deepseek'
    
    if (provider === 'deepseek') {
      legacyClient = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseURL: 'https://api.deepseek.com',
        timeout: 60000,
        maxRetries: 3,
        defaultHeaders: {
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=30, max=100'
        }
      })
    } else {
      legacyClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: 'https://api.openai.com/v1',
        timeout: 60000,
        maxRetries: 3
      })
    }
  }
  return legacyClient
}

// Export legacy client for backward compatibility
export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    return getLegacyClient()[prop as keyof OpenAI]
  }
})

// Legacy configuration for backward compatibility
const API_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 60000,
  retryableErrors: [
    'UND_ERR_SOCKET',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'terminated'
  ]
}

// Dynamic model selection based on provider
export const DEEPSEEK_MODEL = 'deepseek-chat'
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'

// Legacy utility functions for backward compatibility
function exponentialBackoff(attempt: number): number {
  const delay = Math.min(
    API_CONFIG.baseDelay * Math.pow(2, attempt),
    API_CONFIG.maxDelay
  )
  const jitter = delay * 0.25 * (Math.random() * 2 - 1)
  return Math.max(0, delay + jitter)
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()
    const errorString = error.toString().toLowerCase()
    
    return API_CONFIG.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorString.includes(retryableError.toLowerCase())
    )
  }
  return false
}

async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= API_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = exponentialBackoff(attempt - 1)
        console.log(`Reintentando ${context} (intento ${attempt}/${API_CONFIG.maxRetries}) después de ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      return await operation()
    } catch (error) {
      lastError = error
      
      console.error(`Error en ${context} (intento ${attempt + 1}/${API_CONFIG.maxRetries + 1}):`, {
        error: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error && 'cause' in error ? error.cause : undefined,
        retryable: isRetryableError(error)
      })

      if (attempt < API_CONFIG.maxRetries && isRetryableError(error)) {
        continue
      }

      break
    }
  }

  throw lastError
}

// Updated health check using provider factory
export async function checkAPIHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  error?: string
  provider?: string
}> {
  try {
    const provider = await providerFactory.getPrimaryProvider()
    const health = await provider.checkHealth()
    
    return {
      status: health.status,
      latency: health.latency,
      error: health.error,
      provider: health.provider
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// New comprehensive health check for all providers
export async function checkAllProvidersHealth() {
  return await providerFactory.checkAllProvidersHealth()
}

// Updated connection stats using provider factory
export function getConnectionStats() {
  return {
    factory: providerFactory.getConfiguration(),
    availableProviders: providerFactory.getAvailableProviders(),
    legacy: {
      config: {
        timeout: API_CONFIG.timeout,
        maxRetries: API_CONFIG.maxRetries,
        baseDelay: API_CONFIG.baseDelay,
        maxDelay: API_CONFIG.maxDelay
      },
      retryableErrors: API_CONFIG.retryableErrors
    }
  }
}

// Get current provider info
export async function getCurrentProvider() {
  try {
    const provider = await providerFactory.getPrimaryProvider()
    return {
      name: provider.provider,
      config: provider.config,
      stats: provider.getConnectionStats?.() || null
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Updated generateContent function using provider factory
export async function generateContent(params: ContentGenerationParams) {
  try {
    const response = await providerFactory.generateContent(params)
    return response.content
  } catch (error) {
    console.error('Error generating content:', error)
    
    // Handle provider-specific errors
    if (error instanceof AIProviderError) {
      // Transform provider errors to user-friendly messages
      switch (error.code) {
        case 'AUTH_ERROR':
          throw new Error(`API key inválida para ${error.provider}. Verifica tu configuración.`)
        case 'RATE_LIMIT':
          throw new Error(`Límite de velocidad excedido para ${error.provider}. Intenta nuevamente en unos minutos.`)
        case 'QUOTA_ERROR':
          throw new Error(`Cuota de API agotada para ${error.provider}. Verifica tu saldo.`)
        case 'CONNECTION_ERROR':
          throw new Error(`Error de conexión con ${error.provider}. El servidor puede estar temporalmente no disponible.`)
        case 'TIMEOUT_ERROR':
          throw new Error(`La solicitud tardó demasiado en responder con ${error.provider}. Intenta nuevamente.`)
        default:
          if (error.message.includes('not available') || error.message.includes('missing API key')) {
            throw new Error(`Configuración de IA incompleta. Verifica las variables de entorno (DEEPSEEK_API_KEY u OPENAI_API_KEY).`)
          }
          throw new Error(`Error en ${error.provider}: ${error.message}`)
      }
    }
    
    // Generic error fallback
    throw new Error('Error al generar contenido con IA. Intenta nuevamente o contacta al soporte si el problema persiste.')
  }
}

// Legacy wrapper for backward compatibility
export async function generateContentLegacy({
  title,
  type,
  categories,
  profile,
  wordCount,
  extraInstructions,
}: {
  title: string
  type: 'SNIPPET' | 'PAGE'
  categories: string[]
  profile: { prompt: string }
  wordCount?: number
  extraInstructions?: string
}) {
  return generateContent({
    title,
    type,
    categories,
    profile,
    wordCount,
    extraInstructions
  })
}

// Export provider factory for advanced usage
export { providerFactory }

// Validate environment configuration
export function validateEnvironment() {
  return AIProviderFactory.validateEnvironment()
}