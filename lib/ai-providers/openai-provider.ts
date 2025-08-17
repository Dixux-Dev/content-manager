import OpenAI from 'openai'
import {
  AIProviderInterface,
  AIProviderConfig,
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderHealthCheck,
  RetryConfig,
  AIProviderError,
  RateLimitError,
  AuthenticationError,
  QuotaExceededError,
  ConnectionError,
  TimeoutError
} from './types'

export class OpenAIProvider implements AIProviderInterface {
  readonly provider = 'openai' as const
  readonly config: AIProviderConfig
  private client: OpenAI
  private retryConfig: RetryConfig

  constructor(config: Partial<AIProviderConfig> = {}) {
    this.config = {
      provider: 'openai',
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      model: config.model || 'gpt-3.5-turbo',
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000
    }

    this.retryConfig = {
      maxRetries: this.config.maxRetries || 3,
      baseDelay: 1000,
      maxDelay: 10000,
      retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNREFUSED',
        'network',
        'socket',
        'timeout'
      ]
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      maxRetries: 0, // We handle retries ourselves
      defaultHeaders: {
        'User-Agent': 'content-manager/1.0'
      }
    })
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }
    
    try {
      await this.checkHealth()
      return true
    } catch (error) {
      console.error('OpenAI config validation failed:', error)
      return false
    }
  }

  getAvailableModels(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4o',
      'gpt-4o-mini'
    ]
  }

  private exponentialBackoff(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    )
    // Add random jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1)
    return Math.max(0, delay + jitter)
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      const errorString = error.toString().toLowerCase()
      
      return this.retryConfig.retryableErrors.some(retryableError => 
        errorMessage.includes(retryableError.toLowerCase()) ||
        errorString.includes(retryableError.toLowerCase())
      )
    }
    return false
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.exponentialBackoff(attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        return await operation()
      } catch (error) {
        lastError = error
        
        console.error(`Error in ${context} (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}):`, {
          error: error instanceof Error ? error.message : String(error),
          retryable: this.isRetryableError(error)
        })

        // Check if we should retry
        if (attempt < this.retryConfig.maxRetries && this.isRetryableError(error)) {
          continue
        }

        // Transform and throw appropriate error
        throw this.transformError(error)
      }
    }

    throw this.transformError(lastError)
  }

  private transformError(error: unknown): AIProviderError {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      // Authentication errors
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid api key')) {
        return new AuthenticationError('openai')
      }
      
      // Rate limiting errors
      if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        const retryAfter = this.extractRetryAfter(error.message)
        return new RateLimitError('openai', retryAfter)
      }
      
      // Quota errors
      if (errorMessage.includes('quota') || errorMessage.includes('billing') || errorMessage.includes('insufficient funds')) {
        return new QuotaExceededError('openai')
      }
      
      // Timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        return new TimeoutError('openai', this.config.timeout!)
      }
      
      // Connection errors
      if (this.isRetryableError(error)) {
        return new ConnectionError('openai', error)
      }
      
      // Model errors
      if (errorMessage.includes('model') || errorMessage.includes('invalid request')) {
        return new AIProviderError(
          `Invalid model or request format for OpenAI: ${error.message}`,
          'openai',
          'INVALID_REQUEST',
          false
        )
      }
    }
    
    return new AIProviderError(
      error instanceof Error ? error.message : String(error),
      'openai',
      'UNKNOWN_ERROR',
      false
    )
  }

  private extractRetryAfter(errorMessage: string): number | undefined {
    // OpenAI returns retry-after in various formats
    const retryMatch = errorMessage.match(/retry.*?(\d+)/i) || errorMessage.match(/(\d+)\s*seconds?/i)
    return retryMatch ? parseInt(retryMatch[1]) * 1000 : undefined
  }

  async generateCompletion(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const model = request.model || this.config.model
    const temperature = request.temperature ?? this.config.temperature
    const maxTokens = request.maxTokens || this.config.maxTokens

    const completion = await this.withRetry(
      async () => {
        return await this.client.chat.completions.create({
          model,
          messages: request.messages,
          temperature,
          max_tokens: maxTokens,
        })
      },
      'OpenAI content generation'
    )

    let content = completion.choices[0]?.message?.content || ''
    
    // Clean content from markdown code blocks (same as DeepSeek for consistency)
    content = content.replace(/^```html\s*\n?/i, '')
    content = content.replace(/\n?```\s*$/i, '')
    content = content.replace(/^```\w*\s*\n?/i, '')
    content = content.replace(/\n?```\s*$/i, '')
    content = content.trim()

    return {
      content,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      } : undefined,
      model: completion.model,
      provider: 'openai'
    }
  }

  async checkHealth(): Promise<AIProviderHealthCheck> {
    const startTime = Date.now()
    
    try {
      await this.withRetry(
        async () => {
          return await this.client.chat.completions.create({
            model: this.config.model,
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 1,
            temperature: 0
          })
        },
        'OpenAI health check'
      )
      
      const latency = Date.now() - startTime
      
      if (latency < 2000) {
        return { status: 'healthy', latency, provider: 'openai' }
      } else if (latency < 10000) {
        return { status: 'degraded', latency, provider: 'openai' }
      } else {
        return { status: 'unhealthy', latency, provider: 'openai' }
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        provider: 'openai'
      }
    }
  }

  // Utility method to get connection stats
  getConnectionStats() {
    return {
      provider: this.provider,
      config: {
        baseURL: this.config.baseURL,
        model: this.config.model,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries
      },
      retryConfig: this.retryConfig
    }
  }
}