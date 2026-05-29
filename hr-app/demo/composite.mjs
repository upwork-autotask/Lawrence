import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(__dirname, 'audio');
const visDir = path.join(__dirname, 'visuals');
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

// Map scene id → ordered list of still images.
// Multi-still scenes simulate motion via hard cuts spread evenly across the narration.
const scenes = [
  { id: '01-title',       stills: ['scene-01-title.png'] },
  { id: '02-login',       stills: ['scene-02a-login-empty.png', 'scene-02b-login-username.png', 'scene-02c-login-typed.png', 'scene-02d-after-login.png'] },
  { id: '03-employees',   stills: ['scene-03a-employees-list.png', 'scene-03b-employee-detail.png'] },
  { id: '04-leave',       stills: ['scene-04a-leave-list.png', 'scene-04b-leave-detail.png'] },
  { id: '05-disciplinary',stills: ['scene-05a-disciplinary-list.png', 'scene-05b-disciplinary-detail.png'] },
  { id: '06-jobdesc',     stills: ['scene-06a-jd-list.png', 'scene-06b-jd-detail.png'] },
  { id: '07-training',    stills: ['scene-07a-training-catalogue.png'] },
  { id: '08-performance', stills: ['scene-08a-performance-list.png', 'scene-08b-performance-detail.png'] },
  { id: '09-development', stills: ['scene-09a-development-list.png', 'scene-09b-development-detail.png'] },
  { id: '10-settings',    stills: ['scene-10a-settings.png'] },
  { id: '11-roadmap',     stills: ['scene-11-roadmap.png'] },
  { id: '12-close',       stills: ['scene-12-close.png'] },
];

const W = 1920, H = 1080, FPS = 30;

function getDuration(file) {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`,
  ).toString().trim();
  return parseFloat(out);
}

function composeScene(scene) {
  const audio = path.join(audioDir, `${scene.id}.mp3`);
  const dur = getDuration(audio);
  const N = scene.stills.length;
  const perStill = dur / N;
  const outFile = path.join(outDir, `scene-${scene.id}.mp4`);

  // Build inputs: N looped images of perStill duration + 1 audio
  const inputArgs = scene.stills.flatMap((s) => [
    '-loop', '1',
    '-t', perStill.toFixed(3),
    '-i', path.join(visDir, s),
  ]);

  // Filter complex: scale each still to 1920x1080 then concat them
  const scaleFilters = scene.stills.map(
    (_, i) => `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS}[v${i}]`,
  ).join(';');
  const concatInputs = scene.stills.map((_, i) => `[v${i}]`).join('');
  const concatFilter = `${concatInputs}concat=n=${N}:v=1:a=0[v]`;
  const filterComplex = `${scaleFilters};${concatFilter}`;

  const args = [
    '-y',
    ...inputArgs,
    '-i', audio,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-map', `${N}:a`,
    '-t', dur.toFixed(3),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outFile,
  ];

  console.log(`composing ${scene.id}  ${N} still(s)  ${dur.toFixed(1)}s`);
  // Use spawn-style argv to avoid quoting hell on Windows
  const cmd = 'ffmpeg ' + args.map((a) => /[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a).join(' ');
  execSync(cmd, { stdio: ['ignore', 'ignore', 'pipe'] });
  return { dur, outFile };
}

let total = 0;
const segments = [];
for (const scene of scenes) {
  const { dur, outFile } = composeScene(scene);
  total += dur;
  segments.push(outFile);
}

console.log('');
console.log(`total runtime ${total.toFixed(1)}s — concatenating…`);

const concatList = path.join(outDir, 'concat.txt');
fs.writeFileSync(concatList, segments.map((s) => `file '${s.replace(/\\/g, '/')}'`).join('\n'));

const finalMp4 = path.join(__dirname, 'HR-Desktop-Demo.mp4');
execSync(
  `ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${finalMp4}"`,
  { stdio: ['ignore', 'ignore', 'pipe'] },
);

const finalSize = (fs.statSync(finalMp4).size / 1024 / 1024).toFixed(1);
console.log(`\nDONE  ${finalMp4}  ${finalSize} MB  ${total.toFixed(1)}s`);
