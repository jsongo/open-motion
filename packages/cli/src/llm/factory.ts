import type { LanguageModelV1 } from 'ai';
import type { ResolvedLLMConfig } from './types';

/**
 * Create a LanguageModelV1 instance from the resolved config.
 * Each provider SDK is imported lazily so the CLI doesn't fail if a provider's
 * package is somehow missing (peer-dep install issues, etc.).
 */
export async function createModel(cfg: ResolvedLLMConfig): Promise<LanguageModelV1> {
  switch (cfg.provider) {
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const client = createOpenAI({ apiKey: cfg.apiKey });
      return client(cfg.model) as LanguageModelV1;
    }

    case 'openrouter': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const client = createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });
      return client(cfg.model) as LanguageModelV1;
    }

    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const client = createAnthropic({ apiKey: cfg.apiKey });
      return client(cfg.model) as LanguageModelV1;
    }

    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const client = createGoogleGenerativeAI({ apiKey: cfg.apiKey });
      return client(cfg.model) as LanguageModelV1;
    }

    case 'ollama': {
      const { ollama: createOllama } = await import('ollama-ai-provider');
      // ollama-ai-provider exports a pre-configured instance; to set a custom
      // base URL we create a new one via createOllama (same module, named export).
      if (cfg.baseURL && cfg.baseURL !== 'http://localhost:11434') {
        const { createOllama: factory } = await import('ollama-ai-provider');
        const client = factory({ baseURL: `${cfg.baseURL}/api` });
        return client(cfg.model) as LanguageModelV1;
      }
      return createOllama(cfg.model) as LanguageModelV1;
    }

    case 'openai-compatible': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const client = createOpenAI({
        baseURL: cfg.baseURL,
        apiKey: cfg.apiKey || 'placeholder',
      });
      return client(cfg.model) as LanguageModelV1;
    }

    default: {
      throw new Error(`Unknown provider: ${(cfg as ResolvedLLMConfig).provider}`);
    }
  }
}
