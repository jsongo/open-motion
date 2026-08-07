import chalk from 'chalk';
import { resolveConfig } from '../llm/config';

// ---------------------------------------------------------------------------
// Environment variables recognised by open-motion
// ---------------------------------------------------------------------------

const ENV_VARS: Array<{ key: string; description: string }> = [
  { key: 'OPEN_MOTION_PROVIDER',  description: 'LLM provider (openai | openrouter | anthropic | google | ollama | openai-compatible)' },
  { key: 'OPEN_MOTION_MODEL',     description: 'Model name override' },
  { key: 'OPENAI_API_KEY',        description: 'API key for OpenAI' },
  { key: 'OPENROUTER_API_KEY',    description: 'API key for OpenRouter' },
  { key: 'OPENROUTER_BASE_URL',   description: 'Optional base URL for OpenRouter (default: https://openrouter.ai/api/v1)' },
  { key: 'ANTHROPIC_API_KEY',     description: 'API key for Anthropic' },
  { key: 'GOOGLE_API_KEY',        description: 'API key for Google / Gemini' },
  { key: 'GEMINI_API_KEY',        description: 'Alias for GOOGLE_API_KEY' },
  { key: 'OPEN_MOTION_API_KEY',   description: 'API key for openai-compatible providers' },
  { key: 'OPEN_MOTION_BASE_URL',  description: 'Base URL for ollama / openai-compatible providers' },
];

function maskSecret(key: string, value: string): string {
  const lk = key.toLowerCase();
  if (lk.endsWith('api_key') || lk.endsWith('apikey')) {
    if (value.length <= 8) return '****';
    return value.slice(0, 6) + '...' + value.slice(-4);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Sub-command handlers
// ---------------------------------------------------------------------------

export function runConfigSet(_key: string, _value: string): void {
  console.log(chalk.yellow('The config set command is no longer supported.'));
  console.log('API keys and settings are read from environment variables only.');
  console.log('');
  console.log('Add your values to a ' + chalk.cyan('.env') + ' file in your project directory:');
  console.log('');
  console.log(chalk.dim('  # .env'));
  console.log(chalk.dim('  OPENAI_API_KEY=sk-...'));
  console.log('');
  console.log('Run ' + chalk.cyan('open-motion config list') + ' to see all recognised variables.');
}

export function runConfigGet(key: string): void {
  const value = process.env[key.toUpperCase()];
  if (!value || value.trim() === '') {
    console.log(chalk.yellow(`  "${key}" is not set`));
  } else {
    console.log(`${key} = ${maskSecret(key, value.trim())}`);
  }
}

export function runConfigList(): void {
  const cfg = resolveConfig();

  console.log(chalk.bold('Active configuration'));
  console.log(chalk.dim('  (resolved from environment variables and .env file)'));
  console.log('');
  console.log(`  ${'provider'.padEnd(20)} ${cfg.provider}`);
  console.log(`  ${'model'.padEnd(20)} ${cfg.model}`);
  if (cfg.apiKey)  console.log(`  ${'apiKey'.padEnd(20)} ${maskSecret('apiKey', cfg.apiKey)}`);
  if (cfg.baseURL) console.log(`  ${'baseURL'.padEnd(20)} ${cfg.baseURL}`);

  console.log('');
  console.log(chalk.bold('Recognised environment variables'));
  console.log('');
  for (const { key, description } of ENV_VARS) {
    const val = process.env[key];
    const status = val && val.trim() !== ''
      ? chalk.green(maskSecret(key, val.trim()))
      : chalk.dim('(not set)');
    console.log(`  ${key.padEnd(28)} ${status}`);
    console.log(`  ${' '.repeat(28)} ${chalk.dim(description)}`);
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// Usage hint
// ---------------------------------------------------------------------------

export function printConfigHelp(): void {
  console.log(chalk.bold('open-motion config'));
  console.log('');
  console.log('Commands:');
  console.log(
    `  ${chalk.cyan('open-motion config list')}               Show active config and all recognised env vars`
  );
  console.log(
    `  ${chalk.cyan('open-motion config get <VAR>')}          Show the value of a single env var`
  );
  console.log('');
  console.log('API keys and settings are configured via environment variables.');
  console.log('You can place them in a ' + chalk.cyan('.env') + ' file in your project directory.');
  console.log('');
  console.log('Example .env:');
  console.log(chalk.dim('  OPEN_MOTION_PROVIDER=openrouter'));
  console.log(chalk.dim('  OPENROUTER_API_KEY=sk-or-...'));
  console.log('');
  console.log('See ' + chalk.cyan('.env.example') + ' for all available variables.');
}
