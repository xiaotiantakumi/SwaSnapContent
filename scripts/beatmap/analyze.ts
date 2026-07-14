/**
 * 開発時ツール。実行には開発者マシンに ffmpeg が必要(本番/CI 不要)
 *
 * Usage: npx tsx scripts/beatmap/analyze.ts <input.mp3> <songId> <outputDir>
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const FRAME_SIZE = 1024;
const HOP = 512;
const TARGET_SAMPLE_RATE = 22050;
const MIN_NOTE_INTERVAL_MS = 300;
const ONSET_WINDOW = 6;
const ONSET_K = 1.4;
const ONSET_EPS = 0.02;
const LOCAL_PEAK_RADIUS = 3;
const LANES = 4;
// ゲーム側 noteTravelMs(1600)+hitWindowMs(260) 相当のリードイン。曲頭のノーツが落下途中から
// 出現して理不尽ミスにならないよう、これ未満のノーツは除外する。
const LEAD_IN_MS = 2000;

type BeatmapOutput = {
  songId: string;
  bpm: number;
  offsetMs: number;
  durationMs: number;
  notes: Array<{ timeMs: number; lane: number }>;
};

function resolveFfmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (fs.existsSync('/opt/homebrew/bin/ffmpeg')) return '/opt/homebrew/bin/ffmpeg';
  return 'ffmpeg';
}

function decodeToWav(inputPath: string): string {
  const tmpWav = path.join(
    os.tmpdir(),
    `beatmap-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`
  );
  const ffmpeg = resolveFfmpegPath();
  execFileSync(
    ffmpeg,
    ['-i', inputPath, '-ac', '1', '-ar', String(TARGET_SAMPLE_RATE), '-f', 'wav', '-acodec', 'pcm_s16le', '-y', tmpWav],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  return tmpWav;
}

function readWav(filePath: string): { samples: Float32Array; sampleRate: number; durationMs: number } {
  const buf = fs.readFileSync(filePath);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Invalid WAV file');
  }

  let offset = 12;
  let sampleRate = TARGET_SAMPLE_RATE;
  let bitsPerSample = 16;
  let numChannels = 1;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === 'fmt ') {
      const audioFormat = buf.readUInt16LE(chunkStart);
      numChannels = buf.readUInt16LE(chunkStart + 2);
      sampleRate = buf.readUInt32LE(chunkStart + 4);
      bitsPerSample = buf.readUInt16LE(chunkStart + 14);
      if (audioFormat !== 1) {
        throw new Error(`Unsupported WAV format: ${audioFormat}`);
      }
    } else if (chunkId === 'data') {
      dataOffset = chunkStart;
      dataSize = chunkSize;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (dataOffset < 0) throw new Error('WAV data chunk not found');
  if (bitsPerSample !== 16) throw new Error(`Expected 16-bit PCM, got ${bitsPerSample}`);

  const sampleCount = dataSize / (bitsPerSample / 8) / numChannels;
  const samples = new Float32Array(sampleCount);
  let readPos = dataOffset;
  for (let i = 0; i < sampleCount; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      sum += buf.readInt16LE(readPos);
      readPos += 2;
    }
    samples[i] = sum / numChannels / 32768;
  }

  const durationMs = Math.round((samples.length / sampleRate) * 1000);
  return { samples, sampleRate, durationMs };
}

function hannWindow(size: number): Float32Array {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return w;
}

function bitReverse(n: number, bits: number): number {
  let rev = 0;
  for (let i = 0; i < bits; i++) {
    rev = (rev << 1) | (n & 1);
    n >>= 1;
  }
  return rev;
}

/** Radix-2 Cooley-Tukey FFT (in-place) */
function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  const bits = Math.round(Math.log2(n));

  for (let i = 0; i < n; i++) {
    const j = bitReverse(i, bits);
    if (j > i) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
        const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe;
        im[i + j + len / 2] = uIm - vIm;
        const nextWRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextWRe;
      }
    }
  }
}

function computeStftMagnitudes(samples: Float32Array): Float32Array[] {
  const window = hannWindow(FRAME_SIZE);
  const frameCount = Math.max(0, Math.floor((samples.length - FRAME_SIZE) / HOP) + 1);
  const binCount = FRAME_SIZE / 2 + 1;
  const mags: Float32Array[] = [];

  const re = new Float32Array(FRAME_SIZE);
  const im = new Float32Array(FRAME_SIZE);

  for (let f = 0; f < frameCount; f++) {
    const start = f * HOP;
    for (let i = 0; i < FRAME_SIZE; i++) {
      re[i] = (samples[start + i] ?? 0) * window[i];
      im[i] = 0;
    }
    fft(re, im);

    const mag = new Float32Array(binCount);
    for (let b = 0; b < binCount; b++) {
      mag[b] = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
    }
    mags.push(mag);
  }

  return mags;
}

function spectralFlux(mags: Float32Array[]): Float32Array {
  const flux = new Float32Array(mags.length);
  for (let t = 1; t < mags.length; t++) {
    let sum = 0;
    for (let b = 0; b < mags[t].length; b++) {
      const diff = mags[t][b] - mags[t - 1][b];
      if (diff > 0) sum += diff;
    }
    flux[t] = sum;
  }
  return flux;
}

function normalizeFlux(flux: Float32Array): Float32Array {
  let max = 0;
  for (let i = 0; i < flux.length; i++) {
    if (flux[i] > max) max = flux[i];
  }
  const norm = new Float32Array(flux.length);
  if (max <= 0) return norm;
  for (let i = 0; i < flux.length; i++) {
    norm[i] = flux[i] / max;
  }
  return norm;
}

function meanStd(flux: Float32Array, center: number, radius: number): { mean: number; std: number } {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  const lo = Math.max(0, center - radius);
  const hi = Math.min(flux.length - 1, center + radius);
  for (let i = lo; i <= hi; i++) {
    sum += flux[i];
    sumSq += flux[i] * flux[i];
    count++;
  }
  const mean = count > 0 ? sum / count : 0;
  const variance = count > 0 ? Math.max(0, sumSq / count - mean * mean) : 0;
  return { mean, std: Math.sqrt(variance) };
}

function isLocalMax(flux: Float32Array, t: number, radius: number): boolean {
  const val = flux[t];
  const lo = Math.max(0, t - radius);
  const hi = Math.min(flux.length - 1, t + radius);
  for (let i = lo; i <= hi; i++) {
    if (flux[i] > val) return false;
  }
  return true;
}

function pickOnsets(normFlux: Float32Array, frameHopMs: number): Array<{ frame: number; strength: number }> {
  const minGapFrames = Math.round(MIN_NOTE_INTERVAL_MS / frameHopMs);
  const onsets: Array<{ frame: number; strength: number }> = [];
  let lastFrame = -minGapFrames;

  for (let t = 1; t < normFlux.length; t++) {
    if (!isLocalMax(normFlux, t, LOCAL_PEAK_RADIUS)) continue;

    const { mean, std } = meanStd(normFlux, t, ONSET_WINDOW);
    const threshold = mean + ONSET_K * std + ONSET_EPS;
    if (normFlux[t] < threshold) continue;

    if (t - lastFrame < minGapFrames) continue;

    onsets.push({ frame: t, strength: normFlux[t] });
    lastFrame = t;
  }

  return onsets;
}

function estimateBpm(normFlux: Float32Array, frameHopMs: number): { bpm: number; beatPeriodMs: number } {
  const minLag = Math.round(60000 / 200 / frameHopMs);
  const maxLag = Math.round(60000 / 60 / frameHopMs);

  let bestLag = minLag;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let n = 0; n + lag < normFlux.length; n++) {
      corr += normFlux[n] * normFlux[n + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  let bpm = 60000 / (bestLag * frameHopMs);

  while (bpm < 60) bpm *= 2;
  while (bpm > 200) bpm /= 2;
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;

  const beatPeriodMs = 60000 / bpm;
  return { bpm: Math.round(bpm), beatPeriodMs };
}

function estimateOffset(
  onsets: Array<{ frame: number; strength: number }>,
  frameHopMs: number,
  beatPeriodMs: number
): number {
  const subdiv = beatPeriodMs / 2;
  let bestOffset = 0;
  let bestScore = -Infinity;

  for (let offset = 0; offset < beatPeriodMs; offset += 10) {
    let score = 0;
    for (const o of onsets) {
      const onsetMs = o.frame * frameHopMs;
      score += o.strength * Math.cos((2 * Math.PI * (onsetMs - offset)) / subdiv);
    }
    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  return Math.round(bestOffset);
}

function snapToGrid(
  onsets: Array<{ frame: number; strength: number }>,
  frameHopMs: number,
  offsetMs: number,
  subdiv: number,
  durationMs: number
): Array<{ timeMs: number; strength: number }> {
  const gridMap = new Map<number, number>();

  for (const o of onsets) {
    const onsetMs = o.frame * frameHopMs;
    const grid =
      offsetMs + Math.round((onsetMs - offsetMs) / subdiv) * subdiv;
    const timeMs = Math.max(0, Math.min(durationMs - 1, Math.round(grid)));
    const prev = gridMap.get(timeMs);
    if (prev === undefined || o.strength > prev) {
      gridMap.set(timeMs, o.strength);
    }
  }

  return Array.from(gridMap.entries())
    .map(([timeMs, strength]) => ({ timeMs, strength }))
    .sort((a, b) => a.timeMs - b.timeMs);
}

function densityFilter(notes: Array<{ timeMs: number; strength: number }>): Array<{ timeMs: number; strength: number }> {
  const result: Array<{ timeMs: number; strength: number }> = [];

  for (const note of notes) {
    if (result.length === 0) {
      result.push(note);
      continue;
    }
    const last = result[result.length - 1];
    if (note.timeMs - last.timeMs < MIN_NOTE_INTERVAL_MS) {
      if (note.strength > last.strength) {
        result[result.length - 1] = note;
      }
    } else {
      result.push(note);
    }
  }

  return result;
}

function assignLanes(notes: Array<{ timeMs: number; strength: number }>): Array<{ timeMs: number; lane: number }> {
  return notes.map((note, index) => {
    const strengthBucket = Math.min(LANES - 1, Math.max(0, Math.floor(note.strength * LANES)));
    const lane = (index + strengthBucket) % LANES;
    return { timeMs: note.timeMs, lane };
  });
}

function analyze(inputPath: string, songId: string): BeatmapOutput {
  const tmpWav = decodeToWav(inputPath);
  try {
    const { samples, sampleRate, durationMs } = readWav(tmpWav);
    const frameHopMs = (HOP / sampleRate) * 1000;

    const mags = computeStftMagnitudes(samples);
    const flux = spectralFlux(mags);
    const normFlux = normalizeFlux(flux);
    const rawOnsets = pickOnsets(normFlux, frameHopMs);
    const { bpm, beatPeriodMs } = estimateBpm(normFlux, frameHopMs);
    const subdiv = beatPeriodMs / 2;
    const offsetMs = estimateOffset(rawOnsets, frameHopMs, beatPeriodMs);
    const snapped = snapToGrid(rawOnsets, frameHopMs, offsetMs, subdiv, durationMs);
    const filtered = densityFilter(snapped);
    // リードイン・フィルタ: 曲頭の落下途中出現による理不尽ミスを避けるため LEAD_IN_MS 未満を除外
    const leadInFiltered = filtered.filter((n) => n.timeMs >= LEAD_IN_MS);
    const notes = assignLanes(leadInFiltered);

    return {
      songId,
      bpm,
      offsetMs,
      durationMs,
      notes,
    };
  } finally {
    try {
      fs.unlinkSync(tmpWav);
    } catch {
      // ignore cleanup errors
    }
  }
}

function main(): void {
  const [, , inputPath, songId, outputDir] = process.argv;
  if (!inputPath || !songId || !outputDir) {
    console.error('Usage: npx tsx scripts/beatmap/analyze.ts <input.mp3> <songId> <outputDir>');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const result = analyze(inputPath, songId);

  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, `${songId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  const noteCount = result.notes.length;
  const firstTime = noteCount > 0 ? result.notes[0].timeMs : 0;
  const lastTime = noteCount > 0 ? result.notes[noteCount - 1].timeMs : 0;
  const avgInterval =
    noteCount > 1 ? Math.round((lastTime - firstTime) / (noteCount - 1)) : 0;

  console.log(`Wrote ${outPath}`);
  console.log(`Notes: ${noteCount}`);
  console.log(`BPM: ${result.bpm}`);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log(`First note: ${firstTime}ms`);
  console.log(`Last note: ${lastTime}ms`);
  console.log(`Avg interval: ${avgInterval}ms`);
}

main();
