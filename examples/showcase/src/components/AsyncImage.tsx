import React, { useEffect, useState } from 'react';
import { delayRender, continueRender } from '@open-motion/core';

export const AsyncImage: React.FC<{ src: string }> = ({ src }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handle = delayRender(`Loading image: ${src}`);
    console.debug(`[OpenMotion] Starting load for image: ${src}`);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      console.debug(`[OpenMotion] Successfully loaded image: ${src}`);
      setLoaded(true);
      continueRender(handle);
    };
    img.onerror = () => {
      console.error(`[OpenMotion] Failed to load image: ${src}`);
      setError(true);
      continueRender(handle);
    };
  }, [src]);

  if (error) {
    return (
      <div style={{
        width: '400px',
        height: '225px',
        backgroundColor: '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '20px',
        color: '#666'
      }}>
        Failed to load image
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{
        width: '400px',
        height: '225px',
        backgroundColor: '#f5f5f5',
        borderRadius: '20px'
      }} />
    );
  }

  return (
    <img
      src={src}
      style={{
        width: '400px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}
    />
  );
};