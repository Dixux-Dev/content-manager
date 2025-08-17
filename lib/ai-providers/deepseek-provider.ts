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

export class DeepSeekProvider implements AIProviderInterface {
  readonly provider = 'deepseek' as const
  readonly config: AIProviderConfig
  private client: OpenAI
  private retryConfig: RetryConfig

  constructor(config: Partial<AIProviderConfig> = {}) {
    this.config = {
      provider: 'deepseek',
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY || '',
      baseURL: config.baseURL || 'https://api.deepseek.com/v1',
      model: config.model || 'deepseek-chat',
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
        'UND_ERR_SOCKET',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'terminated',
        'ECONNREFUSED',
        'ENOTFOUND'
      ]
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      maxRetries: 0 // We handle retries ourselves
    })
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('DeepSeek API key is required')
    }
    
    try {
      await this.checkHealth()
      return true
    } catch (error) {
      console.error('DeepSeek config validation failed:', error)
      return false
    }
  }

  getAvailableModels(): string[] {
    return [
      'deepseek-chat',
      'deepseek-coder'
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
          console.log(`Retrying ${context} (attempt ${attempt}/${this.retryConfig.maxRetries}) after ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        return await operation()
      } catch (error) {
        lastError = error
        
        console.error(`Error in ${context} (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}):`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          code: error?.code,
          cause: error?.cause,
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
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return new AuthenticationError('deepseek')
      }
      
      // Rate limiting errors
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        const retryAfter = this.extractRetryAfter(error.message)
        return new RateLimitError('deepseek', retryAfter)
      }
      
      // Quota errors
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        return new QuotaExceededError('deepseek')
      }
      
      // Timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        return new TimeoutError('deepseek', this.config.timeout!)
      }
      
      // Connection errors
      if (this.isRetryableError(error)) {
        return new ConnectionError('deepseek', error)
      }
    }
    
    return new AIProviderError(
      error instanceof Error ? error.message : String(error),
      'deepseek',
      'UNKNOWN_ERROR',
      false
    )
  }

  private extractRetryAfter(errorMessage: string): number | undefined {
    const retryMatch = errorMessage.match(/retry.*?(\d+)/i)
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
      'DeepSeek content generation'
    )

    let content = completion.choices[0]?.message?.content || ''
    
    // Clean content from markdown code blocks
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
      provider: 'deepseek'
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
        'DeepSeek health check'
      )
      
      const latency = Date.now() - startTime
      
      if (latency < 2000) {
        return { status: 'healthy', latency, provider: 'deepseek' }
      } else if (latency < 10000) {
        return { status: 'degraded', latency, provider: 'deepseek' }
      } else {
        return { status: 'unhealthy', latency, provider: 'deepseek' }
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        provider: 'deepseek'
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