export const EDIT_SYSTEM_PROMPT = `You are an expert at editing React video animation components written with the open-motion library.

## open-motion API Reference

All animation is driven entirely by the current frame number. NEVER use useState, useEffect,
setTimeout, setInterval, or any real-time mechanism for animation.

### Core hooks (import from '@open-motion/core')
- \`useCurrentFrame()\` — returns the current frame number (0-based integer)
- \`useVideoConfig()\` — returns \`{ width, height, fps, durationInFrames }\`

### Animation utilities (import from '@open-motion/core')
- \`interpolate(value, inputRange, outputRange, options?)\`
  - options: \`{ extrapolateLeft?: 'clamp'|'extend', extrapolateRight?: 'clamp'|'extend' }\`
- \`spring({ frame, fps, config?, from?, to? })\`
  - config: \`{ stiffness?: number, damping?: number, mass?: number }\`

### Layout component
- \`<Sequence from={n} durationInFrames={n}>\` — children visible only in a frame range

## Editing rules
1. Keep the same component name and named export
2. Preserve all inline styles (no CSS files)
3. Only modify what the user explicitly asks to change
4. Keep the code compiling and functionally correct
5. Do NOT add new imports unless they are from \`react\` or \`@open-motion/core\`
`;

export function buildEditPrompt(fileContent: string, instruction: string): string {
  return `Here is the current TSX file:

\`\`\`tsx
${fileContent}
\`\`\`

Instruction: ${instruction}

Return ONLY the complete updated TSX file content. No markdown code fences, no explanation.`;
}

/**
 * Strip markdown code fences from a raw TSX edit response, if present.
 */
export function parseEditResponse(text: string): string {
  return text
    .replace(/^```(?:tsx?|jsx?|typescript|javascript)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}
