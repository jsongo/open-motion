import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { generateText } from 'ai';
import chalk from 'chalk';
import * as diffLib from 'diff';
import { resolveConfig, validateConfig, type CliConfigOverrides } from '../llm/config';
import { createModel } from '../llm/factory';
import { EDIT_SYSTEM_PROMPT, buildEditPrompt, parseEditResponse } from '../prompts/edit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditOptions {
  message?: string;
  apiKey?: string;
  baseURL?: string;
  yes?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple inline spinner */
class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private idx = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private current = '';

  start(text: string): void {
    this.current = text;
    process.stdout.write('\n');
    this.timer = setInterval(() => {
      process.stdout.write(
        `\r${chalk.cyan(this.frames[this.idx % this.frames.length])} ${this.current}`
      );
      this.idx++;
    }, 80);
  }

  succeed(text: string): void {
    this.stop();
    process.stdout.write(`\r${chalk.green('✓')} ${text}\n`);
  }

  fail(text: string): void {
    this.stop();
    process.stdout.write(`\r${chalk.red('✗')} ${text}\n`);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Render a colored unified diff to the console.
 */
function printDiff(oldContent: string, newContent: string, filePath: string): void {
  const hunks = diffLib.createPatch(
    path.basename(filePath),
    oldContent,
    newContent,
    'before',
    'after'
  );

  if (oldContent === newContent) {
    console.log(chalk.yellow('\n  (no changes)'));
    return;
  }

  console.log('\n' + chalk.bold('--- Changes ---'));
  hunks.split('\n').forEach((line) => {
    if (line.startsWith('+++') || line.startsWith('---')) {
      console.log(chalk.bold(line));
    } else if (line.startsWith('+')) {
      console.log(chalk.green(line));
    } else if (line.startsWith('-')) {
      console.log(chalk.red(line));
    } else if (line.startsWith('@@')) {
      console.log(chalk.cyan(line));
    } else {
      console.log(chalk.dim(line));
    }
  });
  console.log(chalk.bold('----------------'));
}

/**
 * Prompt the user for a yes/no/retry answer via readline.
 */
async function askConfirm(
  rl: readline.Interface,
  question: string
): Promise<'yes' | 'no' | 'retry'> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      const a = answer.trim().toLowerCase();
      if (a === '' || a === 'y' || a === 'yes') {
        resolve('yes');
      } else if (a === 'r' || a === 'retry') {
        resolve('retry');
      } else {
        resolve('no');
      }
    });
  });
}

/**
 * Ask for a text input.
 */
async function askInput(
  rl: readline.Interface,
  prompt: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// LLM call
// ---------------------------------------------------------------------------

async function applyEdit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  fileContent: string,
  instruction: string
): Promise<string> {
  const { text } = await generateText({
    model,
    system: EDIT_SYSTEM_PROMPT,
    prompt: buildEditPrompt(fileContent, instruction),
    maxTokens: 8192,
  });
  return parseEditResponse(text);
}

// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

export async function runEdit(
  filePath: string,
  options: EditOptions
): Promise<void> {
  const absPath = path.resolve(process.cwd(), filePath);

  // Validate file exists
  if (!fs.existsSync(absPath)) {
    console.error(chalk.red(`File not found: ${absPath}`));
    process.exit(1);
  }
  if (!absPath.endsWith('.tsx') && !absPath.endsWith('.ts') && !absPath.endsWith('.jsx') && !absPath.endsWith('.js')) {
    console.error(chalk.red('Only .tsx / .ts / .jsx / .js files are supported.'));
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // Resolve LLM config
  // ------------------------------------------------------------------
  const configOverrides: CliConfigOverrides = {
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  };

  let resolvedCfg;
  try {
    resolvedCfg = resolveConfig(configOverrides);
    validateConfig(resolvedCfg);
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }

  let model;
  try {
    model = await createModel(resolvedCfg);
  } catch (err) {
    console.error(chalk.red(`Failed to initialize LLM provider: ${(err as Error).message}`));
    process.exit(1);
  }

  const relPath = path.relative(process.cwd(), absPath);
  const lineCount = fs.readFileSync(absPath, 'utf8').split('\n').length;

  console.log(chalk.bold('\nopen-motion edit'));
  console.log(chalk.dim(`File     : ${relPath} (${lineCount} lines)`));
  console.log(chalk.dim(`Provider : ${resolvedCfg.provider}  Model: ${resolvedCfg.model}`));
  console.log('');

  // ------------------------------------------------------------------
  // One-shot mode (--message / -m)
  // ------------------------------------------------------------------
  if (options.message) {
    await runOneShot(model, absPath, options.message, options.yes ?? false);
    return;
  }

  // ------------------------------------------------------------------
  // Interactive mode
  // ------------------------------------------------------------------
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  console.log(chalk.dim("Enter an instruction (type 'exit' to quit)\n"));

  // Keep previous instruction for retry
  let lastInstruction = '';
  let lastEditedContent: string | null = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const instruction = await askInput(rl, chalk.cyan('> '));

    if (instruction === '' && lastInstruction === '') {
      continue;
    }

    if (instruction.toLowerCase() === 'exit' || instruction.toLowerCase() === 'quit') {
      console.log(chalk.dim('Exited.'));
      rl.close();
      return;
    }

    const effectiveInstruction = instruction !== '' ? instruction : lastInstruction;
    if (!effectiveInstruction) {
      console.log(chalk.yellow('Please enter an instruction.'));
      continue;
    }

    lastInstruction = effectiveInstruction;

    // Read current file content (may have been updated in a previous iteration)
    const currentContent = fs.readFileSync(absPath, 'utf8');

    const spinner = new Spinner();
    spinner.start('Editing...');

    let edited: string;
    try {
      edited = await applyEdit(model, currentContent, effectiveInstruction);
    } catch (err) {
      spinner.fail('Edit failed');
      console.error(chalk.red((err as Error).message));
      continue;
    }

    spinner.succeed('Edit complete');
    lastEditedContent = edited;

    printDiff(currentContent, edited, absPath);

    if (currentContent === edited) {
      console.log(chalk.yellow('\nNo changes were made. Try a more specific instruction.\n'));
      continue;
    }

    const answer = await askConfirm(
      rl,
      chalk.bold('\nApply changes?') + chalk.dim(' (Y/n/retry) ')
    );

    if (answer === 'yes') {
      fs.writeFileSync(absPath, edited, 'utf8');
      console.log(chalk.green('\nSaved!\n'));
    } else if (answer === 'retry') {
      console.log(chalk.dim('\nRegenerating...\n'));
      const spinner2 = new Spinner();
      spinner2.start('Regenerating...');
      try {
        edited = await applyEdit(model, currentContent, effectiveInstruction);
        spinner2.succeed('Regeneration complete');
        lastEditedContent = edited;
        printDiff(currentContent, edited, absPath);

        const ans2 = await askConfirm(
          rl,
          chalk.bold('\nApply changes?') + chalk.dim(' (Y/n) ')
        );
        if (ans2 === 'yes') {
          fs.writeFileSync(absPath, edited, 'utf8');
          console.log(chalk.green('\nSaved!\n'));
        } else {
          console.log(chalk.dim('\nSkipped.\n'));
        }
      } catch (err) {
        spinner2.fail('Regeneration failed');
        console.error(chalk.red((err as Error).message));
      }
    } else {
      console.log(chalk.dim('\nSkipped.\n'));
    }
  }
}

// ---------------------------------------------------------------------------
// One-shot helper
// ---------------------------------------------------------------------------

async function runOneShot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  absPath: string,
  instruction: string,
  autoApply: boolean
): Promise<void> {
  const currentContent = fs.readFileSync(absPath, 'utf8');

  const spinner = new Spinner();
  spinner.start('Editing...');

  let edited: string;
  try {
    edited = await applyEdit(model, currentContent, instruction);
  } catch (err) {
    spinner.fail('Edit failed');
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }

  spinner.succeed('Edit complete');
  printDiff(currentContent, edited, absPath);

  if (currentContent === edited) {
    console.log(chalk.yellow('No changes were made.'));
    return;
  }

  if (autoApply) {
    fs.writeFileSync(absPath, edited, 'utf8');
    console.log(chalk.green('\nSaved!'));
    return;
  }

  // Ask for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const answer = await askConfirm(
    rl,
    chalk.bold('\nApply changes?') + chalk.dim(' (Y/n) ')
  );
  rl.close();

  if (answer === 'yes') {
    fs.writeFileSync(absPath, edited, 'utf8');
    console.log(chalk.green('\nSaved!'));
  } else {
    console.log(chalk.dim('\nCancelled.'));
  }
}
