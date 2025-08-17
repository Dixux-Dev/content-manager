import { DeepSeekProvider } from './deepseek-provider'
import { OpenAIProvider } from './openai-provider'
import {
  AIProvider,
  AIProviderInterface,
  AIProviderConfig,
  AIProviderError,
  ContentGenerationParams,
  AIGenerationResponse,
  AIProviderHealthCheck
} from './types'

export interface ProviderFactoryConfig {
  primary: AIProvider
  fallback?: AIProvider
  enableFallback?: boolean
  healthCheckInterval?: number
  configs?: {
    deepseek?: Partial<AIProviderConfig>
    openai?: Partial<AIProviderConfig>
  }
}

export class AIProviderFactory {
  private providers: Map<AIProvider, AIProviderInterface> = new Map()
  private config: ProviderFactoryConfig
  private healthCache: Map<AIProvider, { status: string; timestamp: number }> = new Map()
  private readonly HEALTH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(config?: Partial<ProviderFactoryConfig>) {
    this.config = {
      primary: (process.env.AI_PROVIDER as AIProvider) || 'deepseek',
      fallback: this.determineFallback((process.env.AI_PROVIDER as AIProvider) || 'deepseek'),
      enableFallback: process.env.AI_ENABLE_FALLBACK !== 'false',
      healthCheckInterval: 5 * 60 * 1000, // 5 minutes
      configs: {},
      ...config
    }

    this.initializeProviders()
  }

  private determineFallback(primary: AIProvider): AIProvider {
    return primary === 'deepseek' ? 'openai' : 'deepseek'
  }

  private initializeProviders(): void {
    // Initialize DeepSeek provider
    if (process.env.DEEPSEEK_API_KEY || this.config.configs?.deepseek?.apiKey) {
      const deepseekConfig = {
        ...this.config.configs?.deepseek,
        apiKey: process.env.DEEPSEEK_API_KEY || this.config.configs?.deepseek?.apiKey
      }
      this.providers.set('deepseek', new DeepSeekProvider(deepseekConfig))
    }

    // Initialize OpenAI provider
    if (process.env.OPENAI_API_KEY || this.config.configs?.openai?.apiKey) {
      const openaiConfig = {
        ...this.config.configs?.openai,
        apiKey: process.env.OPENAI_API_KEY || this.config.configs?.openai?.apiKey,
        model: process.env.OPENAI_MODEL || this.config.configs?.openai?.model || 'gpt-3.5-turbo'
      }
      this.providers.set('openai', new OpenAIProvider(openaiConfig))
    }

    // Check if fallback provider is available, if not disable fallback
    if (this.config.enableFallback && this.config.fallback && !this.providers.has(this.config.fallback)) {
      console.warn(`Fallback provider '${this.config.fallback}' not available (missing API key). Disabling fallback.`)
      this.config.enableFallback = false
      this.config.fallback = undefined
    }

  }

  async getPrimaryProvider(): Promise<AIProviderInterface> {
    const provider = this.providers.get(this.config.primary)
    if (!provider) {
      throw new Error(`Primary provider '${this.config.primary}' not available. Check your environment configuration.`)
    }

    // Check if primary provider is healthy
    if (await this.isProviderHealthy(this.config.primary)) {
      return provider
    }

    // If primary is not healthy and fallback is enabled, try fallback
    if (this.config.enableFallback && this.config.fallback) {
      console.warn(`Primary provider '${this.config.primary}' is unhealthy, attempting fallback to '${this.config.fallback}'`)
      return this.getFallbackProvider()
    }

    // Return primary provider anyway if no fallback
    console.warn(`Primary provider '${this.config.primary}' is unhealthy but no fallback available`)
    return provider
  }

  async getFallbackProvider(): Promise<AIProviderInterface> {
    if (!this.config.fallback) {
      throw new Error('No fallback provider configured')
    }

    const provider = this.providers.get(this.config.fallback)
    if (!provider) {
      throw new Error(`Fallback provider '${this.config.fallback}' not available. Add ${this.config.fallback.toUpperCase()}_API_KEY to your environment.`)
    }

    return provider
  }

  async getProvider(providerName?: AIProvider): Promise<AIProviderInterface> {
    if (providerName) {
      const provider = this.providers.get(providerName)
      if (!provider) {
        throw new Error(`Requested provider '${providerName}' not available`)
      }
      return provider
    }

    return this.getPrimaryProvider()
  }

  async checkHealth(providerName?: AIProvider): Promise<AIProviderHealthCheck> {
    const targetProvider = providerName || this.config.primary
    const provider = this.providers.get(targetProvider)
    
    if (!provider) {
      return {
        provider: targetProvider,
        status: 'unhealthy',
        latency: 0,
        error: `Provider '${targetProvider}' not available. Check your environment configuration.`
      }
    }

    try {
      return await provider.checkHealth()
    } catch (error) {
      return {
        provider: targetProvider,
        status: 'unhealthy',
        latency: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async isProviderHealthy(providerName: AIProvider): Promise<boolean> {
    const cached = this.healthCache.get(providerName)
    const now = Date.now()

    // Return cached result if still valid
    if (cached && (now - cached.timestamp) < this.HEALTH_CACHE_TTL) {
      return cached.status === 'healthy'
    }

    // Perform health check
    try {
      const provider = this.providers.get(providerName)
      if (!provider) return false

      const health = await provider.checkHealth()
      const isHealthy = health.status === 'healthy'

      // Cache result
      this.healthCache.set(providerName, {
        status: health.status,
        timestamp: now
      })

      return isHealthy
    } catch (error) {
      console.error(`Health check failed for ${providerName}:`, error)
      
      // Cache negative result
      this.healthCache.set(providerName, {
        status: 'unhealthy',
        timestamp: now
      })

      return false
    }
  }

  async generateContent(params: ContentGenerationParams): Promise<AIGenerationResponse> {
    const systemPrompt = params.profile.prompt

    const userPrompt = `Generate content with this data:

Title: ${params.title}
Type: ${params.type === 'SNIPPET' ? 'Short snippet' : 'Complete page'}
Categories: ${params.categories.join(', ')}
${params.wordCount ? `Approximate word count: ${params.wordCount}` : ''}
${params.extraInstructions ? `Additional instructions: ${params.extraInstructions}` : ''}`

    const maxTokens = params.type === 'SNIPPET' ? 500 : 2000

    const request = {
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens
    }

    let lastError: Error | null = null

    // Try primary provider
    try {
      const provider = await this.getPrimaryProvider()
      return await provider.generateCompletion(request)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Primary provider failed:`, lastError.message)

      // Try fallback if enabled and available
      if (this.config.enableFallback && this.config.fallback && this.providers.has(this.config.fallback)) {
        try {
          const fallbackProvider = await this.getFallbackProvider()
          return await fallbackProvider.generateCompletion(request)
        } catch (fallbackError) {
          console.error(`Fallback provider also failed:`, fallbackError)
          lastError = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
        }
      } else if (this.config.enableFallback) {
        console.warn(`Fallback is enabled but provider '${this.config.fallback}' is not available (missing API key)`)
      }
    }

    // Transform error for consistent handling
    if (lastError instanceof AIProviderError) {
      throw lastError
    }

    throw new AIProviderError(
      lastError?.message || 'Unknown error occurred during content generation',
      this.config.primary,
      'GENERATION_ERROR',
      false
    )
  }

  async checkAllProvidersHealth(): Promise<Record<string, any>> {
    const results: Record<string, any> = {}

    for (const [name, provider] of Array.from(this.providers.entries())) {
      try {
        const health = await provider.checkHealth()
        results[name] = {
          ...health,
          available: true,
          config: (provider as any).getConnectionStats?.() || {}
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          available: false,
          error: error instanceof Error ? error.message : String(error),
          provider: name
        }
      }
    }

    return {
      primary: this.config.primary,
      fallback: this.config.fallback,
      enableFallback: this.config.enableFallback,
      providers: results,
      timestamp: new Date().toISOString()
    }
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys())
  }

  getConfiguration(): ProviderFactoryConfig {
    return { ...this.config }
  }

  // Static method to create factory from environment
  static fromEnvironment(): AIProviderFactory {
    return new AIProviderFactory()
  }

  // Utility method to validate environment configuration
  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    const provider = process.env.AI_PROVIDER as AIProvider || 'deepseek'
    
    if (provider === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      errors.push('DEEPSEEK_API_KEY is required when using DeepSeek provider')
    }
    
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required when using OpenAI provider')
    }
    
    // Check if at least one provider is configured
    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      errors.push('At least one AI provider API key must be configured (DEEPSEEK_API_KEY or OPENAI_API_KEY)')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}