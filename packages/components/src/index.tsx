import React from 'react';
/**
 * Series Component: automatically calculates 'from' for its children
 * based on their duration.
 */
export const Series: React.FC<{
  children: React.ReactElement<{ durationInFrames: number }>[];
}> = ({ children }) => {
  let currentFrom = 0;

  return (
    <>
      {React.Children.map(children, (child) => {
        const from = currentFrom;
        currentFrom += child.props.durationInFrames || 0;
        return (
          <Sequence from={from} durationInFrames={child.props.durationInFrames}>
            {child}
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * A button that pulsates slowly to attract attention.
 */
export const BreathingButton: React.FC<{
  text: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  speed?: number;
  scaleRange?: [number, number];
}> = ({ text, style, speed = 15, scaleRange = [0.98, 1.05] }) => {
  const frame = useCurrentFrame();

  const scale = interpolate(
    Math.sin(frame / speed),
    [-1, 1],
    scaleRange
  );

  return (
    <div style={{
      padding: '16px 40px',
      backgroundColor: '#2d3748',
      color: 'white',
      borderRadius: '40px',
      fontSize: '24px',
      fontWeight: 600,
      boxShadow: '0 10px 25px rgba(45, 55, 72, 0.3)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transform: `scale(${scale})`,
      ...style
    }}>
      {text}
    </div>
  );
};

/**
 * An item that slides in and fades in.
 */
export const SlideInItem: React.FC<{
  children: React.ReactNode;
  index: number;
  delay?: number;
  stagger?: number;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ children, index, delay = 0, stagger = 5, distance = 50, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame: frame - delay - index * stagger,
    fps,
    config: { stiffness: 100, damping: 12 }
  });

  const opacity = interpolate(spr, [0, 1], [0, 1]);
  const translateX = interpolate(spr, [0, 1], [distance, 0]);

  return (
    <div style={{
      opacity,
      transform: `translateX(${translateX}px)`,
      ...style
    }}>
      {children}
    </div>
  );
};

/**
 * A typewriter effect for text.
 */
export const Typewriter: React.FC<{
  text: string;
  speed?: number; // frames per character
  delay?: number;
  style?: React.CSSProperties;
}> = ({ text, speed = 2, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const charsShown = Math.max(0, Math.floor((frame - delay) / speed));
  const visibleText = text.slice(0, charsShown);

  return <span style={style}>{visibleText}</span>;
};

/**
 * A progress bar that can be used for dashboards or status indicators.
 */
export const ProgressBar: React.FC<{
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  backgroundColor?: string;
  style?: React.CSSProperties;
}> = ({ progress, color = '#3b82f6', height = 10, backgroundColor = '#e2e8f0', style }) => {
  return (
    <div style={{
      width: '100%',
      height,
      backgroundColor,
      borderRadius: height / 2,
      overflow: 'hidden',
      ...style
    }}>
      <div style={{
        width: `${progress * 100}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: height / 2,
        transition: 'width 0.1s ease-out'
      }} />
    </div>
  );
};

/**
 * A simple wave visualizer that mimics audio frequencies.
 */
export const WaveVisualizer: React.FC<{
  bars?: number;
  color?: string;
  height?: number;
  style?: React.CSSProperties;
}> = ({ bars = 20, color = '#3b82f6', height = 100, style }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height, ...style }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = interpolate(
          Math.sin((frame / 5) + i * 0.5),
          [-1, 1],
          [10, height]
        );
        return (
          <div key={i} style={{
            width: '8px',
            height: h,
            backgroundColor: color,
            borderRadius: '4px'
          }} />
        );
      })}
    </div>
  );
};
