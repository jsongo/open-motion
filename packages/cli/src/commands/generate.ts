import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { generateText } from 'ai';
import chalk from 'chalk';
import { resolveConfig, validateConfig, type CliConfigOverrides } from '../llm/config';
import { createModel } from '../llm/factory';
import {
  GENERATE_SYSTEM_PROMPT,
  buildPlanningPrompt,
  buildSceneCodePrompt,
  parsePlanResponse,
  parseCodeResponse,
  type ScenePlan,
} from '../prompts/generate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  scenes?: number;
  fps?: number;
  width?: number;
  height?: number;
  output?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple spinner using stdout */
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

  update(text: string): void {
    this.current = text;
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

function getPackageManager(): 'pnpm' | 'npm' {
  try {
    execSync('pnpm -v', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    return 'npm';
  }
}

function formatRun(pm: 'pnpm' | 'npm', script: string): string {
  return pm === 'npm' ? `npm run ${script}` : `pnpm ${script}`;
}

/**
 * Convert a video title (or scene title) to a valid PascalCase component name.
 * E.g. "React Lifecycle" → "ReactLifecycle"
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\u3040-\u30FF\u4E00-\u9FFF]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) =>
      /^[a-zA-Z]/.test(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join('');
}

/**
 * Check if the directory is initialized with open-motion init.
 */
function isInitialized(cwd: string): boolean {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return !!(pkg.dependencies && pkg.dependencies['@open-motion/core']);
  } catch (e) {
    return false;
  }
}

/**
 * Check for files not created by "open-motion init".
 */
function getUnexpectedFiles(cwd: string): string[] {
  const initialFiles = new Set([
    '.npmrc',
    'package.json',
    'index.html',
    'vite.config.ts',
    'src/main.tsx',
    'src/App.tsx',
  ]);

  const allowedExtras = new Set([
    'node_modules',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    '.git',
    '.gitignore',
    'dist',
    '.open-motion-tmp',
    '.DS_Store',
  ]);

  const unexpected: string[] = [];
  if (!fs.existsSync(cwd)) return [];

  const files = fs.readdirSync(cwd);
  for (const f of files) {
    if (initialFiles.has(f) || allowedExtras.has(f)) continue;
    if (f === 'src') {
      if (fs.statSync(path.join(cwd, f)).isDirectory()) {
        const srcFiles = fs.readdirSync(path.join(cwd, 'src'));
        for (const sf of srcFiles) {
          const relSf = path.join('src', sf);
          if (!initialFiles.has(relSf)) {
            unexpected.push(relSf);
          }
        }
      } else {
        unexpected.push(f);
      }
      continue;
    }
    unexpected.push(f);
  }

  return unexpected;
}

/**
 * Build the main composition TSX that assembles all scenes in a Sequence.
 */
function buildCompositionFile(
  videoTitle: string,
  plan: ScenePlan,
  fps: number,
  width: number,
  height: number
): string {
  const imports = plan.scenes
    .map((s) => `import { ${s.componentName} } from './scenes/${s.componentName}';`)
    .join('\n');

  let offset = 0;
  const sequences = plan.scenes
    .map((s) => {
      const durationInFrames = Math.round(s.durationInSeconds * fps);
      const from = offset;
      offset += durationInFrames;
      return `  <Sequence from={${from}} durationInFrames={${durationInFrames}}>\n    <${s.componentName} />\n  </Sequence>`;
    })
    .join('\n');

  const totalFrames = offset;
  const componentName = toPascalCase(videoTitle) + 'Video';

  return `import React from 'react';
import { Sequence, useVideoConfig } from '@open-motion/core';
${imports}

/** Auto-generated composition: ${videoTitle} */
export const ${componentName} = () => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ width, height, overflow: 'hidden', backgroundColor: '#000' }}>
${sequences}
    </div>
  );
};

/** Total duration in frames: ${totalFrames} (${(totalFrames / fps).toFixed(1)}s at ${fps}fps) */
export const ${componentName}Config = {
  id: '${componentName.replace(/([A-Z])/g, (m, l, i) => (i === 0 ? l.toLowerCase() : '-' + l.toLowerCase()))}',
  component: ${componentName},
  width: ${width},
  height: ${height},
  fps: ${fps},
  durationInFrames: ${totalFrames},
} as const;
`;
}

/**
 * Inject a new Composition into src/main.tsx.
 * Finds the hidden-div block and appends the Composition before its closing tag.
 */
function updateMainTsx(
  mainTsxPath: string,
  compositionFile: string,
  componentName: string,
  config: { id: string; width: number; height: number; fps: number; durationInFrames: number }
): void {
  if (!fs.existsSync(mainTsxPath)) {
    return; // No main.tsx to update — skip silently
  }

  let content = fs.readFileSync(mainTsxPath, 'utf8');

  // Add import at the top (after the last existing import line)
  const importStatement = `import { ${componentName}, ${componentName}Config } from './${compositionFile}';`;
  if (content.includes(importStatement)) {
    return; // Already imported
  }

  // Insert import after the last import statement (supports multi-line imports)
  const importRe = /^import[\s\S]*?;\s*$/gm;
  const matches = Array.from(content.matchAll(importRe));
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    const insertAt = (last.index ?? 0) + last[0].length;
    content = content.slice(0, insertAt) + '\n' + importStatement + '\n' + content.slice(insertAt);
  } else {
    content = importStatement + '\n' + content;
  }

  // Insert Composition element before the closing </div> of the hidden block
  const compositionElement =
    `        <Composition\n` +
    `          id="${config.id}"\n` +
    `          component={${componentName}Config.component}\n` +
    `          width={${config.width}}\n` +
    `          height={${config.height}}\n` +
    `          fps={${config.fps}}\n` +
    `          durationInFrames={${config.durationInFrames}}\n` +
    `        />`;

  // Find the hidden div's closing </div>
  const hiddenDivPattern = /display:\s*['"]none['"]/;
  const match = hiddenDivPattern.exec(content);
  if (match) {
    // Find the closing </div> after this point
    const searchFrom = match.index;
    const closingTag = '</div>';
    const closingIdx = content.indexOf(closingTag, searchFrom);
    if (closingIdx !== -1) {
      content =
        content.slice(0, closingIdx) +
        compositionElement +
        '\n' +
        content.slice(closingIdx);
    }
  }

  fs.writeFileSync(mainTsxPath, content, 'utf8');
}

// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

export async function runGenerate(
  description: string,
  options: GenerateOptions
): Promise<void> {
  // ------------------------------------------------------------------
  // 0. Environment check
  // ------------------------------------------------------------------
  const initialized = isInitialized(process.cwd());
  const unexpectedFiles = getUnexpectedFiles(process.cwd());

  if (!initialized || unexpectedFiles.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warning: Existing files may be overwritten.'));
    if (!initialized) {
      console.log(
        chalk.yellow(
          'This directory does not appear to be an OpenMotion project (run "open-motion init" first).'
        )
      );
    } else {
      console.log(
        chalk.yellow('This directory contains files not created by "open-motion init".')
      );
    }
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        chalk.bold('Do you want to continue? ') + chalk.dim('(y/N) '),
        (a) => {
          resolve(a.trim().toLowerCase());
        }
      );
    });
    rl.close();

    if (answer !== 'y' && answer !== 'yes') {
      console.log(chalk.dim('\nAborted.'));
      return;
    }
  }

  const fps = options.fps ?? 30;
  const width = options.width ?? 1280;
  const height = options.height ?? 720;

  // Resolve output directory (default: src/scenes relative to cwd)
  const outputDir = options.output
    ? path.resolve(process.cwd(), options.output)
    : path.join(process.cwd(), 'src', 'scenes');

  console.log(chalk.bold('\nopen-motion generate'));
  console.log(chalk.dim(`Description : ${description}`));
  console.log(chalk.dim(`Output dir  : ${outputDir}`));
  console.log('');

  // ------------------------------------------------------------------
  // 1. Resolve & validate LLM config
  // ------------------------------------------------------------------
  const configOverrides: CliConfigOverrides = {
    provider: options.provider,
    model: options.model,
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

  console.log(
    chalk.dim(`Provider: ${resolvedCfg.provider}  Model: ${resolvedCfg.model}`)
  );

  let model;
  try {
    model = await createModel(resolvedCfg);
  } catch (err) {
    console.error(chalk.red(`Failed to initialize LLM provider: ${(err as Error).message}`));
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // 2. Plan scenes
  // ------------------------------------------------------------------
  const spinner = new Spinner();
  spinner.start('[1/3] Planning scene structure...');

  let plan: ScenePlan;
  try {
    const { text } = await generateText({
      model,
      system: GENERATE_SYSTEM_PROMPT,
      prompt: buildPlanningPrompt(description),
      maxTokens: 2048,
    });
    plan = parsePlanResponse(text);
  } catch (err) {
    spinner.fail('Failed to generate scene structure');
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }

  // Optionally override number of scenes
  if (options.scenes && options.scenes > 0 && options.scenes !== plan.scenes.length) {
    // Just warn — we respect what the LLM returned unless explicitly trimmed/expanded
    console.log(
      chalk.yellow(
        `\n  Note: LLM generated ${plan.scenes.length} scenes ` +
        `(you requested ${options.scenes}). Using LLM's plan.`
      )
    );
  }

  spinner.succeed(`[1/3] Scene structure: ${plan.scenes.length} scene(s)`);
  plan.scenes.forEach((s, i) => {
    console.log(
      chalk.dim(`       Scene ${i + 1}: ${s.title} (${s.durationInSeconds}s)`)
    );
  });
  console.log('');

  // ------------------------------------------------------------------
  // 3. Generate TSX for each scene
  // ------------------------------------------------------------------
  spinner.start(`[2/3] Generating TSX... (0/${plan.scenes.length})`);

  const scenesDir = path.join(outputDir);
  fs.mkdirSync(scenesDir, { recursive: true });

  const generatedFiles: string[] = [];

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    spinner.update(`[2/3] Generating TSX... (${i + 1}/${plan.scenes.length}) — ${scene.title}`);

    const durationInFrames = Math.round(scene.durationInSeconds * fps);

    try {
      const { text } = await generateText({
        model,
        system: GENERATE_SYSTEM_PROMPT,
        prompt: buildSceneCodePrompt({
          componentName: scene.componentName,
          title: scene.title,
          description: scene.description,
          durationInSeconds: scene.durationInSeconds,
          durationInFrames,
          fps,
          width,
          height,
          sceneIndex: i,
          totalScenes: plan.scenes.length,
        }),
        maxTokens: 4096,
      });

      const code = parseCodeResponse(text);
      const filePath = path.join(scenesDir, `${scene.componentName}.tsx`);
      fs.writeFileSync(filePath, code + '\n', 'utf8');
      generatedFiles.push(filePath);
    } catch (err) {
      spinner.fail(`Failed to generate scene "${scene.title}"`);
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  }

  spinner.succeed(`[2/3] TSX generation complete (${plan.scenes.length} scene(s))`);
  console.log('');

  // ------------------------------------------------------------------
  // 4. Generate composition wrapper
  // ------------------------------------------------------------------
  spinner.start('[3/3] Generating composition file...');

  const compositionCode = buildCompositionFile(plan.videoTitle, plan, fps, width, height);
  const compositionComponentName = toPascalCase(plan.videoTitle) + 'Video';

  // Total duration for the composition
  const totalFrames = plan.scenes.reduce(
    (acc, s) => acc + Math.round(s.durationInSeconds * fps),
    0
  );

  // Write composition to src/ (one level above scenes/)
  const srcDir = path.dirname(outputDir);
  const compositionFileName = `${compositionComponentName}`;
  const compositionFilePath = path.join(srcDir, `${compositionFileName}.tsx`);
  fs.writeFileSync(compositionFilePath, compositionCode + '\n', 'utf8');

  // Try to update main.tsx
  const mainTsxPath = path.join(srcDir, 'main.tsx');
  updateMainTsx(mainTsxPath, compositionFileName, compositionComponentName, {
    id: compositionComponentName
      .replace(/([A-Z])/g, (m, l, i) => (i === 0 ? l.toLowerCase() : '-' + l.toLowerCase())),
    width,
    height,
    fps,
    durationInFrames: totalFrames,
  });

  const updatedMainTsx = fs.existsSync(mainTsxPath);
  spinner.succeed('[3/3] Composition generation complete');
  console.log('');

  // ------------------------------------------------------------------
  // 5. Summary
  // ------------------------------------------------------------------
  console.log(chalk.bold.green('Done!'));
  console.log('');
  console.log(chalk.bold('Generated files:'));
  generatedFiles.forEach((f) => {
    const rel = path.relative(process.cwd(), f);
    console.log(chalk.green('  ✓') + '  ' + rel);
  });
  const relComp = path.relative(process.cwd(), compositionFilePath);
  console.log(chalk.green('  ✓') + '  ' + relComp + chalk.dim('  (composition)'));
  if (updatedMainTsx) {
    const relMain = path.relative(process.cwd(), mainTsxPath);
    console.log(chalk.green('  ✓') + '  ' + relMain + chalk.dim('  (Composition appended)'));
  }
  console.log('');
  console.log(
    chalk.dim(
      `Total: ${plan.scenes.length} scene(s), ${totalFrames} frame(s) ` +
      `(${(totalFrames / fps).toFixed(1)}s @ ${fps}fps)`
    )
  );
  console.log('');
  console.log('Next steps:');
  const pm = getPackageManager();
  console.log(chalk.cyan(`  ${formatRun(pm, 'dev')}`) + '  to preview');
  console.log(chalk.cyan(`  ${formatRun(pm, 'render')}`) + '  to render the video');
}
