import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export interface AudioAsset {
  src: string;
  startFrame: number;
  startFrom?: number;
  volume?: number;
}

export interface EncodeOptions {
  framesDir: string;
  fps: number;
  outputFile: string;
  audioAssets?: AudioAsset[];
  onProgress?: (percent: number) => void;
}

export const encodeVideo = ({ framesDir, fps, outputFile, audioAssets = [], onProgress }: EncodeOptions) => {
  // Verify frames exist
  const files = fs.readdirSync(framesDir).filter(f => f.startsWith('frame-') && f.endsWith('.png'));
  if (files.length === 0) {
    throw new Error(`No frames found in ${framesDir}`);
  }
  // console.log(`Found ${files.length} frames for encoding.`);

  return new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(path.join(framesDir, 'frame-%05d.png'))
      .inputFPS(fps);

    // Add audio inputs
    audioAssets.forEach(asset => {
      command.input(asset.src);
    });

    const videoOptions = [
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-crf 18'
    ];

    if (audioAssets.length > 0) {
      const filters = audioAssets.map((asset, i) => {
        const delayMs = Math.round((asset.startFrame / fps) * 1000);
        const startFromSec = (asset.startFrom || 0) / fps;
        const volume = asset.volume ?? 1;

        // Use a more robust filter chain for each audio input
        return `[${i + 1}:a]atrim=start=${startFromSec},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[a${i}]`;
      });

      const mixInput = audioAssets.map((_, i) => `[a${i}]`).join('');
      // Use dropout_transition=1000 to ensure audio doesn't cut off abruptly
      filters.push(`${mixInput}amix=inputs=${audioAssets.length}:duration=longest:dropout_transition=1000[a]`);

      command.complexFilter(filters);
      command.outputOptions([
        ...videoOptions,
        '-map 0:v',
        '-map [a]',
        '-c:a aac',
        '-b:a 192k',
        '-ac 2',
        '-shortest'
      ]);
    } else {
      command.outputOptions(videoOptions);
    }

    command
      .on('start', (cmd) => {
        // console.log('FFmpeg started with command:', cmd)
      })
      .on('progress', (progress) => {
        if (progress.percent && onProgress) {
          onProgress(progress.percent);
        }
      })
      .on('end', () => {
        // console.log('Encoding finished.');
        resolve(outputFile);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .save(outputFile);
  });
};
