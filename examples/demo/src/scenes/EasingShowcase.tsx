import React from 'react';
import { useCurrentFrame, interpolate, Easing } from '@open-motion/core';

export const EasingShowcase = () => {
  const frame = useCurrentFrame();

  const characters = [
    {
      name: 'Flash (Linear)',
      fn: Easing.linear,
      color: '#fbbf24',
      img: 'https://i.ibb.co/v4mS8mS/flash.png',
      desc: 'Slow and steady...'
    },
    {
      name: 'Nick (Ease)',
      fn: Easing.ease,
      color: '#f87171',
      img: 'https://i.ibb.co/mS8mS8m/nick.png',
      desc: 'Smooth operator'
    },
    {
      name: 'Judy (Ease-In)',
      fn: Easing.in,
      color: '#60a5fa',
      img: 'https://i.ibb.co/S8mS8mS/judy.png',
      desc: 'Burst of energy!'
    },
    {
      name: 'Bogo (Ease-Out)',
      fn: Easing.out,
      color: '#4b5563',
      img: 'https://i.ibb.co/8mS8mS8/bogo.png',
      desc: 'Heavy landing'
    },
    {
      name: 'Finnick (In-Out)',
      fn: Easing.inOut,
      color: '#10b981',
      img: 'https://i.ibb.co/S8mS8m8/finnick.png',
      desc: 'Dynamic rhythm'
    },
  ];

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#1a1a1a',
      padding: '40px',
      color: 'white',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ margin: 0, fontSize: 32, color: '#f59e0b' }}>Zootopia Easing Race</h2>
        <p style={{ color: '#94a3b8' }}>Visualizing animation curves through character movement</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {characters.map((char) => {
          const x = interpolate(frame % 120, [0, 80], [0, 850], {
            extrapolateRight: 'clamp',
            easing: char.fn
          });

          const opacity = interpolate(frame % 120, [100, 120], [1, 0], { extrapolateLeft: 'clamp' });

          return (
            <div key={char.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '950px', fontSize: 14 }}>
                <span style={{ fontWeight: 'bold', color: char.color }}>{char.name}</span>
                <span style={{ color: '#64748b', fontStyle: 'italic' }}>{char.desc}</span>
              </div>
              <div style={{
                width: '1000px',
                height: '60px',
                backgroundColor: '#262626',
                position: 'relative',
                borderRadius: '30px',
                border: `1px solid ${char.color}33`,
                overflow: 'hidden'
              }}>
                {/* Track finish line */}
                <div style={{ position: 'absolute', right: 100, top: 0, bottom: 0, width: 2, backgroundColor: '#ffffff11', borderLeft: '2px dashed #ffffff22' }} />

                {/* Character */}
                <div style={{
                  position: 'absolute',
                  left: x,
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity,
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: char.color,
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: `0 0 20px ${char.color}66`,
                    border: '2px solid white'
                  }}>
                    {/* Placeholder emojis as images might fail to load in this environment */}
                    {char.name.includes('Flash') ? '🦥' :
                     char.name.includes('Nick') ? '🦊' :
                     char.name.includes('Judy') ? '🐰' :
                     char.name.includes('Bogo') ? '🐃' : '👶'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', color: '#444', fontSize: 12 }}>
        <span>OPEN-MOTION ENGINE</span>
        <span>FRAME: {frame.toFixed(1)}</span>
      </div>
    </div>
  );
};