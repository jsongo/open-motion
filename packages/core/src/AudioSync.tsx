import React, { useRef, useEffect } from 'react';

export interface AudioOptions {
  startFrom?: number;
  startFrame?: number;
  volume?: number;
}

export interface AudioSyncManagerProps {
  frame: number;
  fps: number;
  isPlaying: boolean;
  durationInFrames: number;
}

interface AudioEntry {
  audio: HTMLAudioElement;
  loaded: boolean;
  pendingPlay: boolean;
}

export const AudioSyncManager: React.FC<AudioSyncManagerProps> = ({
  frame,
  fps,
  isPlaying,
}) => {
  const audioElementsRef = useRef<Map<string, AudioEntry>>(new Map());
  const lastSyncedFrameRef = useRef<number>(-1);

  // Register audio elements for newly discovered assets (runs each frame to pick up
  // assets added by Sequence-gated <Audio> components that appear mid-playback).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const assets: any[] = (window as any).__OPEN_MOTION_AUDIO_ASSETS__ || [];

    assets.forEach((asset: any) => {
      const id = `${asset.src}-${asset.startFrame || 0}-${asset.startFrom || 0}`;

      if (!audioElementsRef.current.has(id)) {
        const audio = new Audio();
        audio.src = asset.src;
        audio.volume = asset.volume ?? 1;
        audio.preload = 'auto';

        const entry: AudioEntry = { audio, loaded: false, pendingPlay: false };

        audio.addEventListener('canplaythrough', () => {
          entry.loaded = true;
        }, { once: true });

        audio.addEventListener('error', (e) => {
          console.error('[AudioSync] Audio error:', asset.src, e);
        });

        audio.load();
        audioElementsRef.current.set(id, entry);
      }
    });
  }, [frame]);

  // Synchronise audio playback position and play/pause state.
  useEffect(() => {
    if (lastSyncedFrameRef.current === frame) return;
    lastSyncedFrameRef.current = frame;

    const assets: any[] = (window as any).__OPEN_MOTION_AUDIO_ASSETS__ || [];

    audioElementsRef.current.forEach((entry, id) => {
      const { audio } = entry;

      const asset = assets.find((a: any) =>
        `${a.src}-${a.startFrame || 0}-${a.startFrom || 0}` === id
      );
      if (!asset) return;

      const startFrame: number = asset.startFrame || 0;
      const startFrom: number = asset.startFrom || 0;

      // Before the asset's start frame: keep silent and reset.
      if (frame < startFrame) {
        if (!audio.paused) audio.pause();
        entry.pendingPlay = false;
        audio.currentTime = 0;
        return;
      }

      const relativeFrame = frame - startFrame;
      const targetTime = relativeFrame / fps + startFrom;

      if (!isPlaying) {
        // Intentionally paused — seek to keep position in sync with scrubbing.
        if (!audio.paused) audio.pause();
        entry.pendingPlay = false;
        audio.currentTime = targetTime;
        return;
      }

      // isPlaying === true from here on.
      if (!audio.paused) {
        // Audio is already running — correct large drift only.
        const drift = Math.abs(audio.currentTime - targetTime);
        if (drift > 0.3) {
          audio.currentTime = targetTime;
        }
        return;
      }

      // Audio is paused but should be playing.
      if (!entry.loaded || entry.pendingPlay) {
        // Not ready yet, or play() already in-flight — do nothing.
        return;
      }

      // Set position once, then kick off play().
      audio.currentTime = targetTime;
      entry.pendingPlay = true;
      audio.play()
        .then(() => { entry.pendingPlay = false; })
        .catch((e) => {
          entry.pendingPlay = false;
          console.error('[AudioSync] Play failed:', e);
        });
    });
  }, [frame, fps, isPlaying]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      audioElementsRef.current.forEach(entry => {
        entry.audio.pause();
        entry.audio.src = '';
      });
      audioElementsRef.current.clear();
    };
  }, []);

  return null;
};
