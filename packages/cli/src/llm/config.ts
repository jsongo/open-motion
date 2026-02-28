import type { ProviderName, ResolvedLLMConfig } from './types';
import { DEFAULT_MODELS } from './types';

// ---------------------------------------------------------------------------
// Environment variable helpers
// ---------------------------------------------------------------------------

function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

export interface CliConfigOverrides {
  apiKey?: string;
  baseURL?: string;
}

const OPENROUTER_DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Merge environment variables + CLI overrides into a single ResolvedLLMConfig.
 * Priority (high → low):
 *   CLI flags > ENV vars (.env file values are loaded as ENV vars by dotenv)
 */
export function resolveConfig(overrides: CliConfigOverrides = {}): ResolvedLLMConfig {
  const provider: ProviderName =
    (env('OPEN_MOTION_PROVIDER') as ProviderName | undefined) || 'openai';

  const model = env('OPEN_MOTION_MODEL') || DEFAULT_MODELS[provider];

  // 3. API key / base URL (provider-specific)
  let apiKey: string | undefined;
  let baseURL: string | undefined;

  switch (provider) {
    case 'openai':
      apiKey = overrides.apiKey || env('OPENAI_API_KEY');
      break;
    case 'openrouter':
      apiKey =
        overrides.apiKey ||
        env('OPENROUTER_API_KEY') ||
        // Back-compat: allow users to reuse the generic key env var.
        env('OPEN_MOTION_API_KEY');
      baseURL =
        overrides.baseURL ||
        env('OPENROUTER_BASE_URL') ||
        // Back-compat: allow using the generic base URL env var.
        env('OPEN_MOTION_BASE_URL') ||
        OPENROUTER_DEFAULT_BASE_URL;
      break;
    case 'anthropic':
      apiKey = overrides.apiKey || env('ANTHROPIC_API_KEY');
      break;
    case 'google':
      apiKey = overrides.apiKey || env('GOOGLE_API_KEY') || env('GEMINI_API_KEY');
      break;
    case 'ollama':
      baseURL =
        overrides.baseURL ||
        env('OPEN_MOTION_BASE_URL') ||
        'http://localhost:11434';
      break;
    case 'openai-compatible':
      apiKey = overrides.apiKey || env('OPEN_MOTION_API_KEY');
      baseURL = overrides.baseURL || env('OPEN_MOTION_BASE_URL');
      break;
  }

  return { provider, model, apiKey, baseURL };
}

/**
 * Validate config and throw a human-readable error if required fields are missing.
 */
export function validateConfig(cfg: ResolvedLLMConfig): void {
  if (cfg.provider === 'ollama') {
    // Ollama runs locally — no API key needed
    return;
  }
  if (cfg.provider === 'openai-compatible') {
    if (!cfg.baseURL) {
      throw new Error(
        'openai-compatible provider requires a base URL.\n' +
        'Set the OPEN_MOTION_BASE_URL environment variable, or pass --base-url.'
      );
    }
    return;
  }
  if (!cfg.apiKey) {
    const envVar: Record<ProviderName, string> = {
      openai: 'OPENAI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_API_KEY',
      ollama: '',
      'openai-compatible': 'OPEN_MOTION_API_KEY',
    };
    throw new Error(
      `No API key found for provider "${cfg.provider}".\n` +
      `Set the ${envVar[cfg.provider]} environment variable, or pass --api-key.\n` +
      `You can also add it to a .env file in your project directory.`
    );
  }
}
