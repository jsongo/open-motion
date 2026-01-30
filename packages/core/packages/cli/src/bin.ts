#!/usr/bin/env node
import { Command } from 'commander';
import { runRender } from './index';

const program = new Command();
program.name('open-motion').version('0.1.0');
program
  .command('render')
  .requiredOption('-u, --url <url>', 'URL')
  .option('-w, --width <number>', 'Width', '1920')
  .option('-h, --height <number>', 'Height', '1080')
  .option('-f, --fps <number>', 'FPS', '30')
  .option('-d, --duration <number>', 'Duration', '90')
  .option('-o, --out <path>', 'Output', 'out.mp4')
  .action(async (o) => {
    await runRender({
      url: o.url,
      width: parseInt(o.width),
      height: parseInt(o.height),
      fps: parseInt(o.fps),
      duration: parseInt(o.duration),
      out: o.out
    });
  });
program.parse();
