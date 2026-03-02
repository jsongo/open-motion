export type ProviderName =
  | 'openai'
  | 'openrouter'
  | 'anthropic'
  | 'google'
  | 'ollama'
  | 'openai-compatible';

export interface OpenAIConfig {
  apiKey?: string;
  model?: string;
}

export interface AnthropicConfig {
  apiKey?: string;
  model?: string;
}

export interface GoogleConfig {
  apiKey?: string;
  model?: string;
}

export interface OllamaConfig {
  baseURL?: string;
  model?: string;
}

export interface OpenAICompatibleConfig {
  baseURL?: string;
  apiKey?: string;
  model?: string;
}

/**
 * Shape stored in ~/.open-motion/config.json
 */
export interface OpenMotionLLMConfig {
  provider?: ProviderName;
  /** Global model override (takes priority over provider-specific model) */
  model?: string;
  openai?: OpenAIConfig;
  anthropic?: AnthropicConfig;
  google?: GoogleConfig;
  ollama?: OllamaConfig;
  'openai-compatible'?: OpenAICompatibleConfig;
}

/**
 * Fully resolved config after merging file + env vars + CLI flags
 */
export interface ResolvedLLMConfig {
  provider: ProviderName;
  model: string;
  apiKey?: string;
  baseURL?: string;
}

/** Default models for each provider */
export const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: 'gpt-4o',
  openrouter: 'openai/gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  google: 'gemini-1.5-pro',
  ollama: 'llama3',
  'openai-compatible': 'gpt-4o',
};
