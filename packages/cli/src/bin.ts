#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

const envIndex = process.argv.indexOf('--env');
if (envIndex !== -1 && process.argv[envIndex + 1]) {
  config({ path: resolve(process.cwd(), process.argv[envIndex + 1]) });
  process.argv.splice(envIndex, 2);
} else {
  config();
}

import { main } from './index';

main();
