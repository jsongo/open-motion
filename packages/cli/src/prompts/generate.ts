// ---------------------------------------------------------------------------
// System prompt shared by all generation calls
// ---------------------------------------------------------------------------
export const GENERATE_SYSTEM_PROMPT = `You are an expert at creating React video animation components using the open-motion library.

## open-motion API Reference

All animation is driven entirely by the current frame number. NEVER use useState, useEffect,
setTimeout, setInterval, or any real-time mechanism for animation.

### Core hooks (import from '@open-motion/core')
- \`useCurrentFrame()\` — returns the current frame number (0-based integer)
- \`useVideoConfig()\` — returns \`{ width, height, fps, durationInFrames }\`

### Animation utilities (import from '@open-motion/core')
- \`interpolate(value, inputRange, outputRange, options?)\`
  - Maps a value from one range to another (like CSS linear-gradient or Framer motion)
  - options: \`{ extrapolateLeft?: 'clamp'|'extend', extrapolateRight?: 'clamp'|'extend' }\`
  - Example: \`interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })\`
- \`spring({ frame, fps, config?, from?, to? })\`
  - Returns a spring-animated value (0→1 by default)
  - config: \`{ stiffness?: number, damping?: number, mass?: number }\`
  - Example: \`spring({ frame, fps, config: { stiffness: 100, damping: 10 } })\`

### Layout component (import from '@open-motion/core')
- \`<Sequence from={n} durationInFrames={n}>\`
  - Children are only rendered during frames [from, from+durationInFrames)
  - Inside Sequence, \`useCurrentFrame()\` returns a frame relative to \`from\`

## Coding rules
1. Export the component as a **named export** (not default)
2. All styles must be **inline React styles** (no CSS files, no styled-components)
3. The root element MUST fill the full \`width\` and \`height\` from \`useVideoConfig()\`
4. Never import anything outside of \`react\` and \`@open-motion/core\`
5. Do NOT add \`<Composition>\` registration inside scene files — that belongs in main.tsx
6. The component must be **completely self-contained** with no props required
7. Use visually appealing designs: thoughtful colors, smooth animations, readable typography

## Naming rules (critical)
- Any exported component name MUST be a valid TypeScript/JavaScript identifier in PascalCase.
- The name MUST start with a letter A-Z (NEVER start with a digit or any non-ASCII character).
- Use ASCII letters and digits only for identifiers (A-Z, a-z, 0-9). Do NOT use Japanese text, Chinese text, spaces, hyphens, underscores at the start, emoji, or punctuation in identifiers.
- If the title is non-Latin (e.g. Japanese or Chinese), you MUST romanize/translate it for the identifier.
  - BAD:  "20秒でわかる三権分立" → identifier starts with digit AND contains Japanese → INVALID
  - GOOD: "20秒でわかる三権分立" → "SankenbunritsuIn20Seconds" (romanized + digit moved inside) → VALID
  - BAD:  "量子コンピュータ入門" → contains Japanese → INVALID
  - GOOD: "量子コンピュータ入門" → "IntroToQuantumComputers" → VALID
- This rule applies to EVERY identifier: componentName in scenes AND any name derived from videoTitle.

## Output completeness rules (CRITICAL)
- You MUST output the **entire file** from the first \`import\` to the final closing \`};\` — never truncate.
- Every opened bracket \`{\`, parenthesis \`(\`, and square bracket \`[\` MUST have a matching close.
- Every JSX tag that is opened MUST be closed (self-closing or with a closing tag).
- Every string literal started with \`"\`, \`'\`, or a template literal \`\`\` MUST be terminated on the same line or properly closed.
- The last line of the file MUST be \`};\` (the closing of the exported component arrow function) followed by a newline.
- If the component logic is becoming long, **simplify the design** — reduce the number of animated elements, use fewer style properties, or combine logic. Do NOT emit a partial file.
- Never rely on the reader to "complete" your output. The file must be runnable exactly as emitted.

## Minimal valid example
\`\`\`tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from '@open-motion/core';

export const ExampleScene = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { stiffness: 80, damping: 12 } });

  return (
    <div style={{
      width,
      height,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a1a2e',
    }}>
      <h1 style={{
        color: '#e0e0e0',
        fontSize: 72,
        fontFamily: 'sans-serif',
        opacity,
        transform: \`scale(\${scale})\`,
      }}>
        Hello open-motion
      </h1>
    </div>
  );
};
\`\`\`
`;

// ---------------------------------------------------------------------------
// Caption (SRT) generation
// ---------------------------------------------------------------------------

export const CAPTIONS_SYSTEM_PROMPT = `You generate subtitle captions for videos.

You must output VALID JSON only (no markdown, no extra keys).
The JSON must contain a single key: { "srt": "..." } where the value is a complete SRT file contents.

SRT rules:
- Use standard time format: HH:MM:SS,mmm --> HH:MM:SS,mmm
- Number captions starting from 1
- Separate each caption block with a blank line
- Do not include backticks in the SRT text
- Keep each caption to 1-2 lines
- Ensure times are strictly increasing and do not overlap
`;

export interface CaptionsContext {
  videoTitle: string;
  description: string;
  scenes: Array<{
    title: string;
    description: string;
    startInSeconds: number;
    endInSeconds: number;
  }>;
}

export function buildCaptionsPrompt(ctx: CaptionsContext): string {
  return `Create subtitles (SRT) for the following video.

Video title: ${ctx.videoTitle}
Video description: ${ctx.description}

Scene timeline (must keep captions within these bounds):
${ctx.scenes
  .map(
    (s, i) =>
      `${i + 1}. ${s.title} (${s.startInSeconds.toFixed(3)}s - ${s.endInSeconds.toFixed(3)}s): ${s.description}`
  )
  .join('\n')}

Guidelines:
- Write captions that match what the viewer sees on-screen in each scene (short, punchy)
- Prefer 1-3 caption blocks per scene
- Keep the total captions aligned to the total timeline (from 0s to ${ctx.scenes[ctx.scenes.length - 1].endInSeconds.toFixed(
    3
  )}s)

Respond with JSON only in this exact shape:
{ "srt": "<SRT content>" }`;
}

export function parseCaptionsResponse(text: string): { srt: string } {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  let out: { srt: string };
  try {
    out = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned invalid JSON for captions.\nRaw response:\n${text}`);
  }

  if (!out || typeof out.srt !== 'string' || out.srt.trim().length === 0) {
    throw new Error(`LLM captions response is missing required field "srt".\nParsed:\n${JSON.stringify(out, null, 2)}`);
  }

  return { srt: out.srt };
}

// ---------------------------------------------------------------------------
// Planning prompt: ask the LLM to break a description into scenes
// ---------------------------------------------------------------------------
export function buildPlanningPrompt(description: string): string {
  return `Analyze the following video description and break it into logical scenes.

Video description: "${description}"

Respond with a JSON object (and nothing else) in this exact shape:
{
  "videoTitle": "A concise title for the entire video (may contain any language/characters)",
  "scenes": [
    {
      "id": "kebab-case-unique-id",
      "componentName": "PascalCaseComponentName",
      "title": "Short scene title",
      "description": "What this scene shows and how it animates",
      "durationInSeconds": 5
    }
  ]
}

Guidelines:
- Total video duration should feel natural for the content (typically 20-90 seconds)
- Each scene should be self-contained and visually distinct
- \`videoTitle\` is a human-readable display title and may use any language or characters.
- \`componentName\` must be a valid PascalCase React component name AND a valid JS/TS identifier:
  - start with A-Z (NEVER start with a digit or non-ASCII character)
  - ASCII letters/digits only (no Japanese/Chinese/non-ASCII characters, no spaces, no hyphens)
  - If the scene title is Japanese/Chinese, romanize it: e.g. "三権分立とは" → "WhatIsSankenbunritsu"
  - examples: "IntroScene", "HowItWorksScene", "SankenbunritsuIn20SecondsScene"
- \`id\` must be unique kebab-case (e.g. "intro-scene", "data-flow-scene")
- Aim for 3-6 scenes unless the content clearly needs more or fewer
- Describe animations concretely (e.g. "text fades in from bottom, then a line draws across")

Return ONLY the JSON object. No markdown fences, no explanation.`;
}

// ---------------------------------------------------------------------------
// Code generation prompt: ask the LLM to write TSX for one scene
// ---------------------------------------------------------------------------
export interface SceneCodeContext {
  componentName: string;
  title: string;
  description: string;
  durationInSeconds: number;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  sceneIndex: number;
  totalScenes: number;
  /** Populated on retry attempts with a description of the previous failure. */
  retryContext?: string;
}

export function buildSceneCodePrompt(ctx: SceneCodeContext): string {
  const retrySection = ctx.retryContext
    ? `\n## Previous attempt failed — read carefully before writing\n${ctx.retryContext}\n`
    : '';

  return `${retrySection}Generate a complete TSX file for the following open-motion scene:

Component name : ${ctx.componentName}
Scene title    : ${ctx.title}
Scene index    : ${ctx.sceneIndex + 1} of ${ctx.totalScenes}
Duration       : ${ctx.durationInSeconds}s = ${ctx.durationInFrames} frames at ${ctx.fps}fps
Video size     : ${ctx.width}x${ctx.height}

Scene description:
${ctx.description}

Requirements:
- The component must be named exactly \`${ctx.componentName}\` and exported as a named export
- The component name must be a valid JS/TS identifier (ASCII PascalCase, must not start with a digit)
- Fill the full ${ctx.width}x${ctx.height} canvas
- Use smooth frame-based animations (interpolate / spring)
- Keep text readable and well-positioned
- Use colors and typography appropriate for the scene's content
- Do NOT include any Composition registration

Completeness rules (CRITICAL — violations cause build errors):
- Output the ENTIRE file: from the first \`import\` line to the final \`};\` closing line.
- Every \`{\` must have a matching \`}\`, every \`(\` a \`)\`, every \`[\` a \`]\`.
- Every JSX attribute string value started with \`"\` must be closed with \`"\` on the same line.
- Every JSX element opened must be closed (self-closing \`/>\` or with a \`</tag>\`).
- Every template literal \`\`\`\` must be terminated with a closing \`\`\`\`\`.
- The very last line must be \`};\` (end of the exported component), then a newline.
- If the design is growing too complex, simplify it — use fewer animated elements, fewer style properties. NEVER emit a partial or truncated file.

Return ONLY the raw TSX file content. No markdown code fences, no explanation.`;
}

// ---------------------------------------------------------------------------
// Response parser: extract JSON plan from LLM response
// ---------------------------------------------------------------------------
export interface ScenePlan {
  videoTitle: string;
  scenes: Array<{
    id: string;
    componentName: string;
    title: string;
    description: string;
    durationInSeconds: number;
  }>;
}

export function parsePlanResponse(text: string): ScenePlan {
  // Strip markdown code fences if the model included them anyway
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  let plan: ScenePlan;
  try {
    plan = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `LLM returned invalid JSON for scene plan.\nRaw response:\n${text}`
    );
  }

  if (!plan.videoTitle || !Array.isArray(plan.scenes) || plan.scenes.length === 0) {
    throw new Error(
      `LLM scene plan is missing required fields.\nParsed:\n${JSON.stringify(plan, null, 2)}`
    );
  }

  // Validate that every componentName is a legal JS/TS identifier.
  // This is a defence-in-depth check: the prompt already instructs the LLM,
  // but we must not trust LLM output blindly.
  const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  for (const scene of plan.scenes) {
    if (!scene.componentName || !validIdentifier.test(scene.componentName)) {
      throw new Error(
        `LLM returned an invalid componentName: "${scene.componentName}".\n` +
        `componentName must be a valid JS/TS identifier (ASCII PascalCase, must not start with a digit).\n` +
        `If the title is non-Latin (e.g. Japanese), the LLM must romanize it.\n` +
        `Please retry the generation.`
      );
    }
  }

  return plan;
}

/**
 * Strip markdown code fences from a raw TSX response, if present.
 */
export function parseCodeResponse(text: string): string {
  return text
    .replace(/^```(?:tsx?|jsx?|typescript|javascript)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

/**
 * Validate that generated scene code contains the expected named export.
 * Throws a descriptive error if the code is empty or the export is missing.
 *
 * Also runs a set of lightweight syntactic integrity checks that catch the
 * most common truncation / partial-output failures:
 *   1. Named export presence
 *   2. Bracket / parenthesis / square-bracket balance (outside string literals)
 *   3. JSX attribute string value closure on the same line
 *   4. File ends with a closing `}` or `};`
 */
export function validateSceneCode(code: string, componentName: string): void {
  if (!code || code.trim().length === 0) {
    throw new Error(
      `LLM returned empty code for component "${componentName}". The scene file would be blank.`
    );
  }

  // ── 1. Named export check ──────────────────────────────────────────────────
  // Accept: export const Foo, export function Foo, export class Foo
  const namedExportRe = new RegExp(
    `export\\s+(const|function|class)\\s+${componentName}\\b`
  );
  if (!namedExportRe.test(code)) {
    throw new Error(
      `Generated code for "${componentName}" is missing the required named export.\n` +
      `Expected: \`export const ${componentName} = ...\` (or export function/class).\n` +
      `The exported name in the file must exactly match "${componentName}".`
    );
  }

  // ── 2. Bracket balance check (skip contents of string/template literals) ───
  //
  // Strategy: walk character-by-character, tracking whether we are inside a
  // string literal ('…', "…") or template literal (`…`).  Inside a literal we
  // ignore brackets entirely.  This is not a full parser but catches the most
  // common truncation patterns (e.g. an object literal whose value was cut off).
  //
  // Template literal nesting is handled with a stack:
  //   - Entering `` ` `` pushes 'template' onto the context stack.
  //   - Inside a template, `${` begins an expression: we count the opening `{`
  //     in curly and push 'expr' so we know when the matching `}` exits back
  //     into the template (rather than decrementing curly a second time).
  //   - Inside 'expr' context, all normal bracket counting applies, and a
  //     nested `` ` `` pushes another 'template' level.
  {
    let inSingle = false;   // inside '…'
    let inDouble = false;   // inside "…"
    // Stack entries: 'template' | 'expr'
    // 'template' = we are inside `…` (template literal body)
    // 'expr'     = we are inside ${…} inside a template literal
    const templateStack: Array<'template' | 'expr'> = [];
    let curly = 0;
    let paren = 0;
    let square = 0;

    const inTemplateBody = () =>
      templateStack.length > 0 && templateStack[templateStack.length - 1] === 'template';
    const inString = () => inSingle || inDouble || inTemplateBody();

    for (let ci = 0; ci < code.length; ci++) {
      const ch = code[ci];

      // Handle escape sequences inside string/template literals
      if (inString() && ch === '\\') {
        ci++; // skip the escaped character
        continue;
      }

      if (!inString()) {
        if (ch === "'") { inSingle = true; }
        else if (ch === '"') { inDouble = true; }
        else if (ch === '`') { templateStack.push('template'); }
        else if (ch === '{') { curly++; }
        else if (ch === '}') {
          // If we are inside a template expression (${…}), this `}` closes
          // the expression and returns us to the template literal body.
          if (templateStack.length > 0 && templateStack[templateStack.length - 1] === 'expr') {
            templateStack.pop();
            curly--; // the matching `{` from `${` was already counted
          } else {
            curly--;
          }
        }
        else if (ch === '(') { paren++; }
        else if (ch === ')') { paren--; }
        else if (ch === '[') { square++; }
        else if (ch === ']') { square--; }
      } else {
        // Inside a string — check for closing delimiter
        if (inSingle && ch === "'") { inSingle = false; }
        else if (inDouble && ch === '"') { inDouble = false; }
        else if (inTemplateBody()) {
          if (ch === '`') {
            templateStack.pop(); // close this template literal level
          } else if (ch === '$' && code[ci + 1] === '{') {
            // Start of a template expression — count the `{` and enter expr context
            ci++; // skip the `{`
            curly++;
            templateStack.push('expr');
          }
        }
      }
    }

    const imbalanced: string[] = [];
    if (curly !== 0) imbalanced.push(`curly braces {} (net ${curly > 0 ? '+' : ''}${curly})`);
    if (paren !== 0) imbalanced.push(`parentheses () (net ${paren > 0 ? '+' : ''}${paren})`);
    if (square !== 0) imbalanced.push(`square brackets [] (net ${square > 0 ? '+' : ''}${square})`);
    if (inSingle) imbalanced.push(`unterminated single-quoted string`);
    if (inDouble) imbalanced.push(`unterminated double-quoted string`);
    if (templateStack.length > 0) imbalanced.push(`unterminated template literal`);

    if (imbalanced.length > 0) {
      throw new Error(
        `Generated code for "${componentName}" appears to be incomplete or truncated.\n` +
        `Syntax issues detected:\n` +
        imbalanced.map(s => `  • ${s}`).join('\n') + '\n' +
        `The file was likely cut off mid-way. The LLM should produce a shorter, simpler component.`
      );
    }
  }

  // ── 3. File-end check ─────────────────────────────────────────────────────
  // The last non-empty line should close the exported component: `}` or `};`
  {
    const lines = code.split('\n');
    const lastNonEmpty = [...lines].reverse().find(l => l.trim().length > 0) ?? '';
    const trimmed = lastNonEmpty.trim();
    if (trimmed !== '}' && trimmed !== '};') {
      throw new Error(
        `Generated code for "${componentName}" does not end with \`};\` or \`}\`.\n` +
        `Last non-empty line is: ${JSON.stringify(lastNonEmpty)}\n` +
        `The file was likely truncated before the component was fully closed.`
      );
    }
  }
}
