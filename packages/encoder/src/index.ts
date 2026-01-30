import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export interface EncodeOptions {
  framesDir: string;
  fps: number;
  outputFile: string;
  audioFile?: string;
}

export const encodeVideo = ({ framesDir, fps, outputFile, audioFile }: EncodeOptions) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(path.join(framesDir, 'frame-%05d.png'))
      .inputFPS(fps)
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-crf 18'
      ]);

    if (audioFile) {
      command.input(audioFile);
    }

    command
      .on('start', (cmd) => console.log('FFmpeg started with command:', cmd))
      .on('progress', (progress) => console.log('Encoding progress:', progress.percent, '%'))
      .on('end', () => {
        console.log('Encoding finished.');
        resolve(outputFile);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .save(outputFile);
  });
};
