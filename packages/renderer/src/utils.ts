import fs from 'fs';
import path from 'path';

/**
 * Extract a single frame from a video at a specific time
 * @param videoPath Path to the video file
 * @param time Time in seconds where to extract the frame
 * @param outputPath Output path for the extracted frame
 * @returns boolean indicating success
 */
export const extractFrame = (videoPath: string, time: number, outputPath: string): boolean => {
  try {
    const ffmpeg = require('fluent-ffmpeg');
    return new Promise((resolve) => {
      ffmpeg(videoPath)
        .seekInput(time)
        .frames(1)
        .outputOptions('-q:v', '2')
        .output(outputPath)
        .on('end', () => resolve(true))
        .on('error', () => resolve(false))
        .run();
    });
  } catch (error) {
    console.warn('Fluent-ffmpeg not available, using fallback');
    try {
      const { execSync } = require('child_process');
      execSync(`ffmpeg -y -ss ${time} -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}"`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Get video decoding info and metadata
 * @param videoPath Path to the video file
 * @returns Decoding information including codec, duration, fps, etc.
 */
export const getVideoInfo = async (videoPath: string): Promise<{
  format: string;
  duration: number;
  size: number;
  videoCodec: string;
  audioCodec?: string;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
} | null> => {
  try {
    const { execSync } = require('child_process');
    const output = execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`, {
      encoding: 'utf-8'
    });

    const data = JSON.parse(output);
    const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
    const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

    if (!videoStream) return null;

    return {
      format: data.format.format_name,
      duration: parseFloat(data.format.duration),
      size: parseInt(data.format.size),
      videoCodec: videoStream.codec_name,
      audioCodec: audioStream?.codec_name,
      width: videoStream.width,
      height: videoStream.height,
      fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
      bitrate: parseInt(videoStream.bit_rate)
    };
  } catch (error) {
    console.error('Failed to get video info:', error);
    return null;
  }
};

/**
 * Check if a video file can be decoded properly
 * @param videoPath Path to the video file
 * @returns boolean indicating if video is decodable
 */
export const checkDecoding = async (videoPath: string): Promise<boolean> => {
  try {
    const { execSync } = require('child_process');
    execSync(`ffmpeg -i "${videoPath}" -f null -`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Measure rendering performance for a composition
 * @param renderFn Function that performs the rendering
 * @returns Performance metrics
 */
export const measurePerformance = async (
  renderFn: () => Promise<void>
): Promise<{
  duration: number;
  fps: number;
  frameTime: number;
}> => {
  const start = performance.now();
  await renderFn();
  const end = performance.now();

  const duration = end - start;
  return {
    duration,
    fps: 1000 / (duration / 60), // Assuming 60 frames
    frameTime: duration / 60
  };
};

/**
 * Create a thumbnail by extracting a frame from the middle of the video
 * @param videoPath Path to the video file
 * @param outputPath Output path for the thumbnail
 * @returns boolean indicating success
 */
export const createThumbnail = (videoPath: string, outputPath: string): boolean => {
  try {
    const { execSync } = require('child_process');

    // Get video duration first
    const durationOutput = execSync(`ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, {
      encoding: 'utf-8'
    });
    const duration = parseFloat(durationOutput.trim());
    const thumbnailTime = duration / 2; // Middle of the video

    return extractFrame(videoPath, thumbnailTime, outputPath);
  } catch (error) {
    console.error('Failed to create thumbnail:', error);
    return false;
  }
};

/**
 * Extract multiple frames at regular intervals
 * @param videoPath Path to the video file
 * @param interval Interval in seconds between frames
 * @param outputDir Directory to save extracted frames
 * @returns Array of extracted frame paths
 */
export const extractFramesAtInterval = async (
  videoPath: string,
  interval: number,
  outputDir: string
): Promise<string[]> => {
  try {
    const { execSync } = require('child_process');

    // Get video duration
    const durationOutput = execSync(`ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, {
      encoding: 'utf-8'
    });
    const duration = parseFloat(durationOutput.trim());

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const frames: string[] = [];
    for (let time = 0; time < duration; time += interval) {
      const outputPath = path.join(outputDir, `frame-${time.toFixed(2)}.png`);
      if (extractFrame(videoPath, time, outputPath)) {
        frames.push(outputPath);
      }
    }

    return frames;
  } catch (error) {
    console.error('Failed to extract frames:', error);
    return [];
  }
};
