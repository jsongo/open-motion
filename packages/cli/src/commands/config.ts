import path from 'path';
import os from 'os';
import chalk from 'chalk';
import {
  readConfigFile,
  setConfigKey,
  getConfigKey,
} from '../llm/config';

const CONFIG_FILE = path.join(os.homedir(), '.open-motion', 'config.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_KEYS = [
  'provider',
  'model',
  'openai.apiKey',
  'openai.model',
  'anthropic.apiKey',
  'anthropic.model',
  'google.apiKey',
  'google.model',
  'ollama.baseURL',
  'ollama.model',
  'openai-compatible.baseURL',
  'openai-compatible.apiKey',
  'openai-compatible.model',
] as const;

function maskSecret(key: string, value: string): string {
  const lk = key.toLowerCase();
  if (lk.endsWith('apikey') || lk.endsWith('api_key')) {
    if (value.length <= 8) return '****';
    return value.slice(0, 6) + '...' + value.slice(-4);
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenConfig(obj: any, prefix = ''): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') {
      pairs.push(...flattenConfig(v, fullKey));
    } else {
      pairs.push([fullKey, String(v)]);
    }
  }
  return pairs;
}

// ---------------------------------------------------------------------------
// Sub-command handlers
// ---------------------------------------------------------------------------

export function runConfigSet(key: string, value: string): void {
  setConfigKey(key, value);
  const displayVal = maskSecret(key, value);
  console.log(chalk.green(`✓ ${key} = ${displayVal}`));
  console.log(chalk.dim(`  Saved to: ${CONFIG_FILE}`));
}

export function runConfigGet(key: string): void {
  const value = getConfigKey(key);
  if (value === undefined) {
    console.log(chalk.yellow(`  "${key}" is not set`));
  } else {
    console.log(`${key} = ${maskSecret(key, value)}`);
  }
}

export function runConfigList(): void {
  const config = readConfigFile();
  const pairs = flattenConfig(config);

  if (pairs.length === 0) {
    console.log(chalk.dim('No configuration found'));
    console.log(chalk.dim(`Config file: ${CONFIG_FILE}`));
    console.log('');
    console.log('Example:');
    console.log(chalk.cyan('  open-motion config set provider openai'));
    console.log(chalk.cyan('  open-motion config set openai.apiKey sk-...'));
    return;
  }

  console.log(chalk.bold(`Config file: ${CONFIG_FILE}`));
  console.log('');

  for (const [key, value] of pairs) {
    const displayVal = maskSecret(key, value);
    console.log(`  ${chalk.dim(key.padEnd(36))} ${displayVal}`);
  }
}

// ---------------------------------------------------------------------------
// Usage hint
// ---------------------------------------------------------------------------

export function printConfigHelp(): void {
  console.log(chalk.bold('open-motion config'));
  console.log('');
  console.log('Available commands:');
  console.log(
    `  ${chalk.cyan('open-motion config set <key> <value>')}  Save a configuration value`
  );
  console.log(
    `  ${chalk.cyan('open-motion config get <key>')}          Show a configuration value`
  );
  console.log(
    `  ${chalk.cyan('open-motion config list')}               List all configuration values`
  );
  console.log('');
  console.log('Configurable keys:');
  VALID_KEYS.forEach((k) => console.log(`  ${chalk.dim(k)}`));
  console.log('');
  console.log('Example:');
  console.log(chalk.cyan('  open-motion config set provider anthropic'));
  console.log(chalk.cyan('  open-motion config set anthropic.apiKey sk-ant-...'));
  console.log(chalk.cyan('  open-motion config set openai-compatible.baseURL https://api.example.com/v1'));
}
