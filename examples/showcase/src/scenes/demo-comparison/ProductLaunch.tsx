import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
} from '@open-motion/core';

const AbsoluteFill: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', ...style }}>
    {children}
  </div>
);

// Scene 1: Opening - Particle explosion + logo reveal (0-120 frames, 4s)
const ParticleOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const particles = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * Math.PI * 2;
    const speed = 3 + (i % 5) * 1.5;
    const delay = (i % 8) * 2;
    const progress = Math.max(0, (frame - delay) / 40);
    const distance = progress * speed * 80;
    const x = width / 2 + Math.cos(angle) * distance;
    const y = height / 2 + Math.sin(angle) * distance;
    const opacity = interpolate(frame, [delay, delay + 20, 80, 120], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const size = 4 + (i % 3) * 3;
    const hue = (i * 6 + frame * 2) % 360;
    return { x, y, opacity, size, hue };
  });

  const logoScale = spring({ frame: Math.max(0, frame - 30), fps, config: { stiffness: 80, damping: 12 } });
  const logoOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glowPulse = Math.sin(frame / 10) * 0.3 + 0.7;

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a15 100%)', overflow: 'hidden' }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          backgroundColor: `hsla(${p.hue}, 80%, 60%, ${p.opacity})`,
          boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 80%, 60%, ${p.opacity * 0.5})`,
        }} />
      ))}
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 72,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-2px',
            textShadow: `0 0 ${30 * glowPulse}px rgba(99, 102, 241, 0.8), 0 0 60px rgba(99, 102, 241, 0.4)`,
          }}>
            NeuralFlow AI
          </div>
          <div style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 16,
            opacity: subtitleOpacity,
            fontWeight: 300,
            letterSpacing: '4px',
          }}>
            THE FUTURE OF INTELLIGENCE
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 2: Feature cards with stagger animation (120-300 frames, 6s)
const FeatureShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: '🧠', title: 'Neural Engine', desc: '10x faster inference with custom silicon', color: '#6366f1' },
    { icon: '⚡', title: 'Real-time Processing', desc: 'Sub-millisecond latency at scale', color: '#f59e0b' },
    { icon: '🔒', title: 'Privacy First', desc: 'On-device processing, zero data leaks', color: '#10b981' },
    { icon: '🌐', title: 'Global Scale', desc: '200+ edge nodes worldwide', color: '#ec4899' },
  ];

  const titleProgress = spring({ frame, fps, config: { stiffness: 80, damping: 14 } });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{
        fontSize: 48,
        fontWeight: 800,
        color: 'white',
        marginBottom: 50,
        opacity: titleProgress,
        transform: `translateY(${(1 - titleProgress) * 30}px)`,
      }}>
        Breakthrough Features
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {features.map((feat, i) => {
          const delay = 15 + i * 12;
          const cardSpring = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness: 100, damping: 13 } });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardTranslate = interpolate(cardSpring, [0, 1], [60, 0]);

          return (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              padding: 28,
              border: `1px solid ${feat.color}33`,
              opacity: cardOpacity,
              transform: `translateY(${cardTranslate}px)`,
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{feat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8 }}>{feat.title}</div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{feat.desc}</div>
              <div style={{
                marginTop: 16,
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${feat.color}, transparent)`,
                width: `${interpolate(Math.max(0, frame - delay - 20), [0, 40], [0, 100], { extrapolateRight: 'clamp' })}%`,
              }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Animated stats/metrics counter (300-450 frames, 5s)
const MetricsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = [
    { value: 99.97, suffix: '%', label: 'Uptime SLA', prefix: '' },
    { value: 2.4, suffix: 'M', label: 'API Calls/sec', prefix: '' },
    { value: 150, suffix: 'ms', label: 'Avg Latency', prefix: '<' },
    { value: 10, suffix: 'x', label: 'Cost Reduction', prefix: '' },
  ];

  const bgRotation = frame * 0.5;

  return (
    <AbsoluteFill style={{ background: '#0a0a15', overflow: 'hidden' }}>
      {/* Animated gradient orbs */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
        top: -100,
        right: -100,
        transform: `rotate(${bgRotation}deg)`,
      }} />
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
        bottom: -50,
        left: -50,
        transform: `rotate(${-bgRotation}deg)`,
      }} />

      <AbsoluteFill style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: 'white', marginBottom: 50, textAlign: 'center' }}>
          Performance at Scale
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20 }}>
          {metrics.map((m, i) => {
            const delay = i * 15;
            const countProgress = interpolate(Math.max(0, frame - delay), [0, 60], [0, 1], {
              extrapolateRight: 'clamp',
              easing: Easing.outCubic,
            });
            const displayValue = (m.value * countProgress).toFixed(m.value % 1 === 0 ? 0 : 2);
            const cardScale = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness: 120, damping: 14 } });

            return (
              <div key={i} style={{
                textAlign: 'center',
                transform: `scale(${cardScale})`,
                padding: 20,
              }}>
                <div style={{
                  fontSize: 52,
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {m.prefix}{displayValue}{m.suffix}
                </div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Animated chart */}
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, height: 100 }}>
          {Array.from({ length: 30 }, (_, i) => {
            const barDelay = 30 + i * 2;
            const barHeight = interpolate(Math.max(0, frame - barDelay), [0, 30], [0, 30 + Math.sin(i * 0.5) * 40 + 40], {
              extrapolateRight: 'clamp',
              easing: Easing.outCubic,
            });
            const hue = 240 + i * 4;
            return (
              <div key={i} style={{
                width: 12,
                height: barHeight,
                borderRadius: 4,
                background: `hsl(${hue}, 70%, 60%)`,
              }} />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 4: Code/Terminal demo (450-600 frames, 5s)
const CodeDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeLines = [
    { text: 'import { NeuralFlow } from "@neuralflow/sdk";', delay: 10 },
    { text: '', delay: 20 },
    { text: 'const ai = new NeuralFlow({', delay: 25 },
    { text: '  model: "nf-ultra-v3",', delay: 35 },
    { text: '  region: "auto",', delay: 42 },
    { text: '  privacy: "on-device"', delay: 49 },
    { text: '});', delay: 56 },
    { text: '', delay: 60 },
    { text: 'const result = await ai.process({', delay: 65 },
    { text: '  input: videoStream,', delay: 75 },
    { text: '  pipeline: ["detect", "track", "classify"],', delay: 82 },
    { text: '  realtime: true', delay: 90 },
    { text: '});', delay: 97 },
    { text: '', delay: 100 },
    { text: '// Response: 0.8ms latency ✓', delay: 110 },
  ];

  const panelSpring = spring({ frame, fps, config: { stiffness: 100, damping: 15 } });

  return (
    <AbsoluteFill style={{ background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: '90%',
        background: '#161b22',
        borderRadius: 16,
        border: '1px solid #30363d',
        overflow: 'hidden',
        transform: `scale(${panelSpring})`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Terminal header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: '#21262d', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f85149' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#d29922' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3fb950' }} />
          <div style={{ marginLeft: 12, color: '#8b949e', fontSize: 13 }}>neuralflow-demo.ts</div>
        </div>
        {/* Code content */}
        <div style={{ padding: '20px 24px', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: 16, lineHeight: 1.7 }}>
          {codeLines.map((line, i) => {
            const charCount = Math.max(0, Math.floor((frame - line.delay) * 1.5));
            const visible = frame >= line.delay;
            const displayText = line.text.slice(0, charCount);
            const showCursor = visible && charCount < line.text.length && frame % 16 < 8;

            let colored = displayText;
            const colorMap: Record<string, string> = {
              'import': '#ff7b72',
              'from': '#ff7b72',
              'const': '#ff7b72',
              'await': '#ff7b72',
              'new': '#ff7b72',
              'true': '#79c0ff',
            };

            return (
              <div key={i} style={{ minHeight: 24, color: line.text.startsWith('//') ? '#3fb950' : '#c9d1d9', opacity: visible ? 1 : 0 }}>
                <span style={{ color: '#6e7681', marginRight: 16, userSelect: 'none' }}>{String(i + 1).padStart(2, ' ')}</span>
                {line.text.startsWith('//') ? (
                  <span style={{ color: '#3fb950' }}>{displayText}</span>
                ) : (
                  <span>{displayText.split(/(\s+)/).map((word, wi) => (
                    <span key={wi} style={{ color: colorMap[word] || (word.startsWith('"') || word.startsWith("'") ? '#a5d6ff' : '#c9d1d9') }}>
                      {word}
                    </span>
                  ))}</span>
                )}
                {showCursor && <span style={{ borderRight: '2px solid #58a6ff' }}>&nbsp;</span>}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Testimonials (600-720 frames, 4s)
const Testimonials: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quotes = [
    { text: '"NeuralFlow reduced our inference costs by 90% while improving accuracy."', author: 'Sarah Chen', role: 'CTO, TechVault', avatar: '👩‍💻' },
    { text: '"The on-device processing changed everything for our privacy-first approach."', author: 'Marcus Johnson', role: 'VP Engineering, DataShield', avatar: '👨‍💼' },
  ];

  const activeQuote = frame < 60 ? 0 : 1;
  const quoteFrame = activeQuote === 0 ? frame : frame - 60;

  const q = quotes[activeQuote];
  const fadeIn = interpolate(quoteFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(quoteFrame, [0, 20], [30, 0], { extrapolateRight: 'clamp', easing: Easing.outCubic });

  const starProgress = interpolate(quoteFrame, [10, 40], [0, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        maxWidth: 800,
        textAlign: 'center',
        opacity: fadeIn,
        transform: `translateY(${slideUp}px)`,
      }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>{q.avatar}</div>
        <div style={{ fontSize: 28, color: 'white', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 300, marginBottom: 30 }}>
          {q.text}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <span key={i} style={{ fontSize: 24, opacity: starProgress > i ? 1 : 0.2, filter: starProgress > i ? 'none' : 'grayscale(1)' }}>⭐</span>
          ))}
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{q.author}</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{q.role}</div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: CTA / Outro (720-840 frames, 4s)
const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainSpring = spring({ frame, fps, config: { stiffness: 80, damping: 12 } });
  const buttonSpring = spring({ frame: Math.max(0, frame - 30), fps, config: { stiffness: 100, damping: 10 } });
  const pulseScale = 1 + Math.sin(frame / 8) * 0.02;

  const ringRotation = frame * 2;

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0a0a15 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Rotating rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 500 + i * 100,
          height: 500 + i * 100,
          borderRadius: '50%',
          border: `1px solid rgba(99, 102, 241, ${0.15 - i * 0.04})`,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${ringRotation * (i % 2 === 0 ? 1 : -1)}deg)`,
        }} />
      ))}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, opacity: mainSpring, transform: `scale(${mainSpring})` }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: 'white', marginBottom: 20 }}>
          Ready to Build?
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', marginBottom: 40, maxWidth: 500 }}>
          Join 10,000+ developers shipping AI-powered products with NeuralFlow
        </div>
        <div style={{
          display: 'inline-block',
          padding: '18px 48px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: 50,
          fontSize: 20,
          fontWeight: 700,
          color: 'white',
          transform: `scale(${buttonSpring * pulseScale})`,
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
        }}>
          Get Started Free →
        </div>
        <div style={{
          marginTop: 30,
          fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          neuralflow.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition: 840 frames at 30fps = 28 seconds
export const ProductLaunch: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Scene 1: Particle Opening (0-120, 4s) */}
      <Sequence from={0} durationInFrames={120}>
        <ParticleOpening />
      </Sequence>
      {/* Scene 2: Features (120-300, 6s) */}
      <Sequence from={120} durationInFrames={180}>
        <FeatureShowcase />
      </Sequence>
      {/* Scene 3: Metrics (300-450, 5s) */}
      <Sequence from={300} durationInFrames={150}>
        <MetricsScene />
      </Sequence>
      {/* Scene 4: Code Demo (450-600, 5s) */}
      <Sequence from={450} durationInFrames={150}>
        <CodeDemo />
      </Sequence>
      {/* Scene 5: Testimonials (600-720, 4s) */}
      <Sequence from={600} durationInFrames={120}>
        <Testimonials />
      </Sequence>
      {/* Scene 6: CTA (720-840, 4s) */}
      <Sequence from={720} durationInFrames={120}>
        <CallToAction />
      </Sequence>
    </AbsoluteFill>
  );
};
