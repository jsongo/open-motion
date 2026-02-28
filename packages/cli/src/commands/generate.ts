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
  CAPTIONS_SYSTEM_PROMPT,
  buildPlanningPrompt,
  buildCaptionsPrompt,
  buildSceneCodePrompt,
  parsePlanResponse,
  parseCaptionsResponse,
  parseCodeResponse,
  validateSceneCode,
  type ScenePlan,
} from '../prompts/generate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateOptions {
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
 *
 * Rules enforced here (defense-in-depth, even if LLM follows the prompt):
 * - Only ASCII letters and digits are kept; all other characters (CJK, spaces,
 *   hyphens, emoji, …) are treated as word separators.
 * - Each word is capitalised so the result is PascalCase.
 * - If the result starts with a digit (e.g. "20秒…" → "20"), a "Video" prefix
 *   is prepended so the identifier is always valid.
 * - If nothing survives the filter, "VideoProject" is used as a fallback.
 */
function toPascalCase(str: string): string {
  // Replace any run of non-ASCII-alphanumeric characters with a single space,
  // then split, capitalise each word and join.
  const result = str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  if (!result) return 'VideoProject';

  // Ensure the identifier does not start with a digit.
  if (/^[0-9]/.test(result)) return 'Video' + result;

  return result;
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
function getOverwriteHints(cwd: string, outputDir: string): string[] {
  const hints: string[] = [];

  if (!fs.existsSync(cwd)) return hints;

  // If the output directory exists and has content, we may overwrite.
  if (fs.existsSync(outputDir)) {
    try {
      const entries = fs.readdirSync(outputDir);
      const meaningful = entries.filter((e) => e !== '.DS_Store');
      if (meaningful.length > 0) {
        hints.push(`Output directory is not empty: ${path.relative(cwd, outputDir)}`);
      }
    } catch {
      // Ignore read errors; still proceed.
    }
  }

  // We will attempt to append a Composition into src/main.tsx (if it exists).
  const srcDir = path.dirname(outputDir);
  const mainTsxPath = path.join(srcDir, 'main.tsx');
  if (fs.existsSync(mainTsxPath)) {
    hints.push(`src/main.tsx will be updated`);
  }

  return hints;
}

/**
 * Build the main composition TSX that assembles all scenes in a Sequence.
 */
function buildCompositionFile(
  videoTitle: string,
  plan: ScenePlan,
  fps: number,
  width: number,
  height: number,
  srtContent: string
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

  // Use JSON string escaping so we can embed arbitrary caption text safely.
  const srtLiteral = JSON.stringify(srtContent);

  return `import React, { useMemo } from 'react';
 import {
   Sequence,
   useCurrentFrame,
   useVideoConfig,
   interpolate,
   spring,
   parseSrt,
   type SubtitleItem,
 } from '@open-motion/core';
 ${imports}

 /** Auto-generated composition: ${videoTitle} */
 const SRT_CAPTIONS: string = ${srtLiteral};

  const CaptionOverlay: React.FC<{ subtitles: SubtitleItem[] }> = ({ subtitles }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTime = frame / fps;

    const active = subtitles.find(
      (s) => currentTime >= s.startInSeconds && currentTime < s.endInSeconds
    );
    if (!active) return null;

   const startFrame = Math.round(active.startInSeconds * fps);
   const relFrame = Math.max(0, frame - startFrame);

   const enter = spring({ frame: relFrame, fps, config: { stiffness: 120, damping: 14 } });
   const opacity = interpolate(enter, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
   const scale = interpolate(enter, [0, 1], [0.96, 1], { extrapolateRight: 'clamp' });

    // Simple TikTok-ish word highlight sweep.
    // Sweep exactly once across the whole subtitle block (no looping).
    const words = active.text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const displayedWords = words.length > 0 ? words : [active.text];
    const blockDurationInFrames = Math.max(
      1,
      Math.round((active.endInSeconds - active.startInSeconds) * fps)
    );
    const sweep = interpolate(
      relFrame,
      [0, blockDurationInFrames],
      [0, displayedWords.length],
      { extrapolateRight: 'clamp' }
    );
    const highlightIndex = Math.min(displayedWords.length - 1, Math.floor(sweep));

   return (
     <div
       style={{
         position: 'absolute',
         left: 0,
         right: 0,
         bottom: 72,
         display: 'flex',
         justifyContent: 'center',
          padding: '0 48px',
          pointerEvents: 'none',
          opacity,
          transform: \`scale(\${scale})\`,
        }}
      >
       <div
         style={{
           maxWidth: '92%',
           backgroundColor: 'rgba(0,0,0,0.6)',
           border: '2px solid rgba(255,255,255,0.14)',
           borderRadius: 18,
           padding: '14px 18px',
           color: '#fff',
           fontSize: 46,
           fontWeight: 900,
           lineHeight: 1.15,
           letterSpacing: '-0.02em',
           textAlign: 'center',
           textShadow: '4px 4px 0px rgba(0,0,0,0.85)',
           display: 'flex',
           flexWrap: 'wrap',
           justifyContent: 'center',
           gap: 12,
         }}
       >
          {displayedWords.map((w, i) => (
            <span
              key={i}
              style={{
                padding: '2px 10px',
                borderRadius: 10,
                backgroundColor: highlightIndex === i ? '#ff0050' : 'transparent',
                transform: highlightIndex === i ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 80ms linear',
              }}
            >
              {w}
            </span>
          ))}
       </div>
     </div>
   );
 };

 export const ${componentName} = () => {
   const { width, height } = useVideoConfig();
   const subtitles = useMemo(() => parseSrt(SRT_CAPTIONS), []);
   return (
     <div style={{ width, height, overflow: 'hidden', backgroundColor: '#000', position: 'relative' }}>
 ${sequences}
       <CaptionOverlay subtitles={subtitles} />
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

function formatSrtTimestamp(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const millis = Math.floor((clamped - Math.floor(clamped)) * 1000);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)},${pad3(millis)}`;
}

function buildFallbackSrt(plan: ScenePlan): string {
  let t = 0;
  let id = 1;
  const blocks: string[] = [];
  for (const s of plan.scenes) {
    const start = t;
    const end = t + Math.max(0.5, s.durationInSeconds);
    const text = (s.title || s.description || '...').toString().trim() || '...';
    const safeText = text.split(/\r?\n/).slice(0, 2).join('\n');
    blocks.push(
      `${id}\n${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}\n${safeText}`
    );
    id++;
    t = end;
  }
  return blocks.join('\n\n') + '\n';
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

function envInt(key: string): number | undefined {
  const v = process.env[key];
  if (v && v.trim() !== '') {
    const n = parseInt(v.trim(), 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

export async function runGenerate(
  description: string,
  options: GenerateOptions
): Promise<void> {
  const fps = options.fps ?? envInt('VIDEO_FPS') ?? 30;
  const width = options.width ?? envInt('VIDEO_WIDTH') ?? 1280;
  const height = options.height ?? envInt('VIDEO_HEIGHT') ?? 720;

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
  // 2. Environment / overwrite check (after config validation)
  // ------------------------------------------------------------------
  const initialized = isInitialized(process.cwd());
  const overwriteHints = getOverwriteHints(process.cwd(), outputDir);

  if (!initialized || overwriteHints.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warning: Existing files may be overwritten.'));
    if (!initialized) {
      console.log(
        chalk.yellow(
          'This directory does not appear to be an OpenMotion project (run "open-motion init" first).'
        )
      );
    }
    overwriteHints.forEach((h) => console.log(chalk.yellow(`- ${h}`)));
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

  // ------------------------------------------------------------------
  // 3. Plan scenes
  // ------------------------------------------------------------------
  const spinner = new Spinner();
  spinner.start('[1/4] Planning scene structure...');

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

  spinner.succeed(`[1/4] Scene structure: ${plan.scenes.length} scene(s)`);
  plan.scenes.forEach((s, i) => {
    console.log(
      chalk.dim(`       Scene ${i + 1}: ${s.title} (${s.durationInSeconds}s)`)
    );
  });
  console.log('');

  // ------------------------------------------------------------------
  // 3. Generate captions (SRT)
  // ------------------------------------------------------------------
  spinner.start('[2/4] Generating captions (SRT)...');

  // Build a deterministic scene timeline for caption planning.
  let cursor = 0;
  const timeline = plan.scenes.map((s) => {
    const startInSeconds = cursor;
    const endInSeconds = cursor + s.durationInSeconds;
    cursor = endInSeconds;
    return {
      title: s.title,
      description: s.description,
      startInSeconds,
      endInSeconds,
    };
  });

  let srtContent = '';
  try {
    const { text } = await generateText({
      model,
      system: CAPTIONS_SYSTEM_PROMPT,
      prompt: buildCaptionsPrompt({
        videoTitle: plan.videoTitle,
        description,
        scenes: timeline,
      }),
      maxTokens: 2048,
    });
    srtContent = parseCaptionsResponse(text).srt;
    spinner.succeed('[2/4] Captions generated');
  } catch (err) {
    srtContent = buildFallbackSrt(plan);
    spinner.succeed('[2/4] Captions generated (fallback)');
    console.log(
      chalk.yellow(
        `  Note: failed to generate captions via LLM; using a simple fallback. (${(err as Error).message})`
      )
    );
  }
  console.log('');

  // ------------------------------------------------------------------
  // 4. Generate TSX for each scene
  // ------------------------------------------------------------------
  spinner.start(`[3/4] Generating TSX... (0/${plan.scenes.length})`);

  const scenesDir = path.join(outputDir);
  fs.mkdirSync(scenesDir, { recursive: true });

  const generatedFiles: string[] = [];

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    spinner.update(`[3/4] Generating TSX... (${i + 1}/${plan.scenes.length}) — ${scene.title}`);

    const durationInFrames = Math.round(scene.durationInSeconds * fps);

    const scenePromptArgs = {
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
    };

    const MAX_ATTEMPTS = 3;
    let lastError: Error | null = null;
    let succeeded = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          spinner.update(
            `[3/4] Retrying TSX... (${i + 1}/${plan.scenes.length}) — ${scene.title} [attempt ${attempt}/${MAX_ATTEMPTS}]`
          );
        }

        const retryContext = attempt > 1 && lastError
          ? `IMPORTANT: The previous attempt failed with this error:\n${lastError.message}\n\nCommon causes:\n- The file was cut off mid-way (truncated output). Write simpler, shorter code to avoid this.\n- A bracket, parenthesis, or JSX tag was left unclosed.\n- A string or template literal was not terminated.\nFix these issues and output a COMPLETE, syntactically valid TSX file.`
          : undefined;

        const { text } = await generateText({
          model,
          system: GENERATE_SYSTEM_PROMPT,
          prompt: buildSceneCodePrompt({ ...scenePromptArgs, retryContext }),
          maxTokens: 32768,
        });

        const code = parseCodeResponse(text);
        validateSceneCode(code, scene.componentName);

        const filePath = path.join(scenesDir, `${scene.componentName}.tsx`);
        fs.writeFileSync(filePath, code + '\n', 'utf8');
        generatedFiles.push(filePath);
        succeeded = true;
        break;
      } catch (err) {
        lastError = err as Error;
        if (attempt < MAX_ATTEMPTS) {
          console.log(
            chalk.yellow(
              `\n  Warning (attempt ${attempt}/${MAX_ATTEMPTS}): ${lastError.message}\n  Retrying...`
            )
          );
        }
      }
    }

    if (!succeeded) {
      spinner.fail(`Failed to generate scene "${scene.title}" after ${MAX_ATTEMPTS} attempts`);
      console.error(chalk.red(lastError?.message ?? 'Unknown error'));
      process.exit(1);
    }
  }

  spinner.succeed(`[3/4] TSX generation complete (${plan.scenes.length} scene(s))`);
  console.log('');

  // ------------------------------------------------------------------
  // 5. Generate composition wrapper
  // ------------------------------------------------------------------
  spinner.start('[4/4] Generating composition file...');

  const compositionCode = buildCompositionFile(plan.videoTitle, plan, fps, width, height, srtContent);
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
  spinner.succeed('[4/4] Composition generation complete');
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
