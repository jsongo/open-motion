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
- The name MUST start with a letter A-Z (do not start with a digit).
- Use ASCII letters and digits only for identifiers (A-Z, a-z, 0-9). Do NOT use Japanese text, spaces, hyphens, emoji, or punctuation in identifiers.
- If the title is non-Latin (e.g. Japanese), romanize/translate it for the identifier (e.g. "30秒でわかるRemotion" -> "RemotionIn30Seconds").

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
// Planning prompt: ask the LLM to break a description into scenes
// ---------------------------------------------------------------------------
export function buildPlanningPrompt(description: string): string {
  return `Analyze the following video description and break it into logical scenes.

Video description: "${description}"

Respond with a JSON object (and nothing else) in this exact shape:
{
  "videoTitle": "A concise title for the entire video",
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
- \`componentName\` must be a valid PascalCase React component name AND a valid JS/TS identifier:
  - start with A-Z (never start with a number)
  - ASCII letters/digits only (no Japanese/non-ASCII characters, no spaces, no hyphens)
  - examples: "IntroScene", "HowItWorksScene", "RemotionIn30SecondsScene"
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
}

export function buildSceneCodePrompt(ctx: SceneCodeContext): string {
  return `Generate a complete TSX file for the following open-motion scene:

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
