import fs from 'fs';
import path from 'path';
import os from 'os';
import type { OpenMotionLLMConfig, ProviderName, ResolvedLLMConfig } from './types';
import { DEFAULT_MODELS } from './types';

const CONFIG_DIR = path.join(os.homedir(), '.open-motion');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

export function readConfigFile(): OpenMotionLLMConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw) as OpenMotionLLMConfig;
  } catch {
    return {};
  }
}

export function writeConfigFile(config: OpenMotionLLMConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/**
 * Set a nested key using dot notation.
 * e.g. setConfigKey('openai.apiKey', 'sk-...') sets config.openai.apiKey
 */
export function setConfigKey(key: string, value: string): void {
  const config = readConfigFile();
  const parts = key.split('.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = config;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined || typeof obj[parts[i]] !== 'object') {
      obj[parts[i]] = {};
    }
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  writeConfigFile(config);
}

/**
 * Get a nested key using dot notation.
 */
export function getConfigKey(key: string): string | undefined {
  const config = readConfigFile();
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = config;
  for (const part of parts) {
    if (obj === undefined || obj === null) return undefined;
    obj = obj[part];
  }
  return obj !== undefined && obj !== null ? String(obj) : undefined;
}

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
  provider?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

/**
 * Merge config file + environment variables + CLI overrides into a single
 * ResolvedLLMConfig. Priority (high → low):
 *   CLI flags > ENV vars > config file > built-in defaults
 */
export function resolveConfig(overrides: CliConfigOverrides = {}): ResolvedLLMConfig {
  const file = readConfigFile();

  // 1. Provider
  const provider: ProviderName =
    (overrides.provider as ProviderName | undefined) ||
    (env('OPEN_MOTION_PROVIDER') as ProviderName | undefined) ||
    file.provider ||
    'openai';

  // 2. Model — global override, then provider-specific, then default
  const modelFromEnv = env('OPEN_MOTION_MODEL');
  const modelFromFile =
    file.model || (file[provider] as { model?: string } | undefined)?.model;
  const model =
    overrides.model || modelFromEnv || modelFromFile || DEFAULT_MODELS[provider];

  // 3. API key / base URL (provider-specific)
  let apiKey: string | undefined;
  let baseURL: string | undefined;

  switch (provider) {
    case 'openai':
      apiKey =
        overrides.apiKey ||
        env('OPENAI_API_KEY') ||
        file.openai?.apiKey ||
        (file.openai as any)?.apikey;
      break;
    case 'anthropic':
      apiKey =
        overrides.apiKey ||
        env('ANTHROPIC_API_KEY') ||
        file.anthropic?.apiKey ||
        (file.anthropic as any)?.apikey;
      break;
    case 'google':
      apiKey =
        overrides.apiKey ||
        env('GOOGLE_API_KEY') ||
        env('GEMINI_API_KEY') ||
        file.google?.apiKey ||
        (file.google as any)?.apikey;
      break;
    case 'ollama':
      baseURL =
        overrides.baseURL ||
        env('OPEN_MOTION_BASE_URL') ||
        file.ollama?.baseURL ||
        (file.ollama as any)?.baseUrl ||
        'http://localhost:11434';
      break;
    case 'openai-compatible':
      apiKey =
        overrides.apiKey ||
        env('OPEN_MOTION_API_KEY') ||
        file['openai-compatible']?.apiKey ||
        (file['openai-compatible'] as any)?.apikey;
      baseURL =
        overrides.baseURL ||
        env('OPEN_MOTION_BASE_URL') ||
        file['openai-compatible']?.baseURL ||
        (file['openai-compatible'] as any)?.baseUrl;
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
        'Set it with: open-motion config set openai-compatible.baseURL <url>\n' +
        'or set the OPEN_MOTION_BASE_URL environment variable.'
      );
    }
    return;
  }
  if (!cfg.apiKey) {
    const envVar: Record<ProviderName, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_API_KEY',
      ollama: '',
      'openai-compatible': 'OPEN_MOTION_API_KEY',
    };
    const configKey: Record<ProviderName, string> = {
      openai: 'openai.apiKey',
      anthropic: 'anthropic.apiKey',
      google: 'google.apiKey',
      ollama: '',
      'openai-compatible': 'openai-compatible.apiKey',
    };
    throw new Error(
      `No API key found for provider "${cfg.provider}".\n` +
      `Set it with one of:\n` +
      `  open-motion config set ${configKey[cfg.provider]} <key>\n` +
      `  export ${envVar[cfg.provider]}=<key>`
    );
  }
}
