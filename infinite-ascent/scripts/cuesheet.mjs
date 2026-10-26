import { writeFileSync, mkdirSync } from 'fs';
import { buildArchitecture } from '../src/architecture.js';
import { cueSheetMarkdown } from '../src/cues.js';
mkdirSync('docs', { recursive: true });
writeFileSync('docs/cue-sheet.md', cueSheetMarkdown(buildArchitecture(), 20.3) + '\n');
console.log('wrote docs/cue-sheet.md');
