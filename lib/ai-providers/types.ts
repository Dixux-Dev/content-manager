// AI Provider Types and Interfaces

export type AIProvider = 'deepseek' | 'openai'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey: string
  baseURL?: string
  model: string
  timeout?: number
  maxRetries?: number
  temperature?: number
  maxTokens?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIGenerationRequest {
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  model?: string
}

export interface AIGenerationResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  provider: AIProvider
}

export interface AIProviderHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  error?: string
  provider: AIProvider
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryableErrors: string[]
}

export interface AIProviderInterface {
  readonly provider: AIProvider
  readonly config: AIProviderConfig
  
  // Core generation method
  generateCompletion(request: AIGenerationRequest): Promise<AIGenerationResponse>
  
  // Health check method
  checkHealth(): Promise<AIProviderHealthCheck>
  
  // Configuration validation
  validateConfig(): Promise<boolean>
  
  // Get provider-specific model list
  getAvailableModels(): string[]
}

export interface ContentGenerationParams {
  title: string
  type: 'SNIPPET' | 'PAGE'
  categories: string[]
  profile: {
    prompt: string
  }
  wordCount?: number
  extraInstructions?: string
}

// Provider-specific error types
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: AIProvider,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: AIProvider, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, 'RATE_LIMIT', true)
    this.retryAfter = retryAfter
  }
  
  retryAfter?: number
}

export class AuthenticationError extends AIProviderError {
  constructor(provider: AIProvider) {
    super(`Authentication failed for ${provider}`, provider, 'AUTH_ERROR', false)
  }
}

export class QuotaExceededError extends AIProviderError {
  constructor(provider: AIProvider) {
    super(`Quota exceeded for ${provider}`, provider, 'QUOTA_ERROR', false)
  }
}

export class ConnectionError extends AIProviderError {
  constructor(provider: AIProvider, originalError?: Error) {
    super(`Connection error for ${provider}: ${originalError?.message || 'Unknown error'}`, provider, 'CONNECTION_ERROR', true)
  }
}

export class TimeoutError extends AIProviderError {
  constructor(provider: AIProvider, timeout: number) {
    super(`Request timeout after ${timeout}ms for ${provider}`, provider, 'TIMEOUT_ERROR', true)
  }
}