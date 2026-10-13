import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fail = (message) => { console.error(`错误：${message}`); process.exit(1); };

function parseArgs(argv) {
  const args = { copyVideo: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--copy-video') args.copyVideo = true;
    else if (['--manifest', '--out', '--ffmpeg', '--ffprobe'].includes(a)) args[a.slice(2)] = argv[++i];
    else fail(`未知参数 ${a}`);
  }
  if (!args.manifest || !args.out) fail('必须提供 --manifest 和 --out');
  return args;
}

function commandPath(name, override) {
  if (override) return override;
  const probe = spawnSync(name, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (probe.status !== 0) fail(`找不到 ${name}，请安装并加入 PATH，或使用 --${name} 指定路径`);
  return name;
}

function videoInfo(ffprobe, path) {
  const r = spawnSync(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,avg_frame_rate:format=duration', '-of', 'json', path], { encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) fail(`无法读取视频 ${path}\n${r.stderr}`);
  const data = JSON.parse(r.stdout);
  const stream = data.streams?.[0];
  const duration = Number(data.format?.duration);
  if (!stream || !Number.isFinite(duration) || duration <= 0) fail(`视频缺少有效画面或时长：${path}`);
  return { width: stream.width, height: stream.height, duration, fps: stream.avg_frame_rate };
}

function ensureEmptyOrNew(path) {
  if (!existsSync(path)) return;
  if (!statSync(path).isDirectory()) fail(`输出路径不是目录：${path}`);
  if (readdirSync(path).length) fail(`输出目录不是空目录：${path}`);
}

const shapeNames = new Set(['rectangle', 'trapezoid-left', 'trapezoid-right', 'slant-left', 'slant-right', 'hexagon', 'irregular']);
function seededRandom(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
function hash(text) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
const randomShapes = ['trapezoid-left', 'trapezoid-right', 'slant-left', 'slant-right', 'hexagon', 'irregular'];
const captionPositions = [{ x: .27, y: .1 }, { x: .5, y: .1 }, { x: .73, y: .1 }, { x: .27, y: .9 }, { x: .5, y: .9 }, { x: .73, y: .9 }];
function validPolygon(points) {
  if (!Array.isArray(points) || points.length < 3 || points.length > 8) return false;
  if (!points.every((point) => Array.isArray(point) && point.length === 2 && point.every((v) => Number.isFinite(v) && v >= 0 && v <= 1))) return false;
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length], c = points[(i + 2) % points.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) < 1e-5) continue;
    if (sign && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return Boolean(sign);
}

const args = parseArgs(process.argv);
const manifestPath = resolve(args.manifest);
const out = resolve(args.out);
if (!existsSync(manifestPath)) fail(`清单不存在：${manifestPath}`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!manifest.title?.trim() || !manifest.theme?.trim()) fail('清单缺少 title 或 theme');
if (!Array.isArray(manifest.panels) || manifest.panels.length < 1 || manifest.panels.length > 9) fail('panels 数量必须为 1–9');
ensureEmptyOrNew(out);
mkdirSync(join(out, 'media'), { recursive: true });

const ffprobe = commandPath('ffprobe', args.ffprobe);
const ffmpeg = args.copyVideo ? null : commandPath('ffmpeg', args.ffmpeg);
const usedNames = new Set();
const random = seededRandom(Number.isInteger(manifest.seed) ? manifest.seed : hash(`${manifest.title}|${manifest.theme}|${manifest.panels.length}`));
const layoutShape = manifest.style?.frameShape || 'random';
if (layoutShape !== 'random' && !shapeNames.has(layoutShape)) fail(`未知默认框形：${layoutShape}`);
const panels = manifest.panels.map((panel, index) => {
  if (!panel.video || !panel.caption?.trim()) fail(`第 ${index + 1} 格缺少 video 或 caption`);
  const src = isAbsolute(panel.video) ? panel.video : resolve(dirname(manifestPath), panel.video);
  if (!existsSync(src)) fail(`视频不存在：${src}`);
  videoInfo(ffprobe, src);
  let name = `${String(index + 1).padStart(2, '0')}-${basename(src).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  if (extname(name).toLowerCase() !== '.mp4') name = name.replace(/\.[^.]+$/, '') + '.mp4';
  while (usedNames.has(name)) name = `${index + 1}-${name}`;
  usedNames.add(name);
  const dest = join(out, 'media', name);
  if (args.copyVideo) copyFileSync(src, dest);
  else {
    const r = spawnSync(ffmpeg, ['-y', '-i', src, '-map', '0:v:0', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-g', '1', '-keyint_min', '1', '-sc_threshold', '0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dest], { stdio: 'inherit', windowsHide: true });
    if (r.status !== 0) fail(`FFmpeg 转码失败：${src}`);
  }
  const outputInfo = videoInfo(ffprobe, dest);
  const shape = panel.shape ?? (layoutShape === 'random' ? randomShapes[Math.floor(random() * randomShapes.length)] : layoutShape);
  if (typeof shape === 'string' ? !shapeNames.has(shape) : !validPolygon(shape)) fail(`第 ${index + 1} 格的 shape 无效；自定义多边形必须是凸多边形`);
  const captionPosition = panel.captionPosition ?? captionPositions[Math.floor(random() * captionPositions.length)];
  if (!captionPosition || !Number.isFinite(captionPosition.x) || !Number.isFinite(captionPosition.y) || captionPosition.x < 0 || captionPosition.x > 1 || captionPosition.y < 0 || captionPosition.y > 1) fail(`第 ${index + 1} 格的 captionPosition 必须在 0–1 范围内`);
  return {
    id: `p${index + 1}`, no: index + 1, src: `media/${name}`,
    caption: panel.caption.trim(), reverse: Boolean(panel.reverse),
    shape, captionPosition,
    startAngle: Number(panel.startAngle || 0), width: outputInfo.width,
    height: outputInfo.height, duration: outputInfo.duration
  };
});

const data = {
  title: manifest.title.trim(), theme: manifest.theme.trim(), language: manifest.language || 'zh-CN',
  style: { accent: manifest.style?.accent || '#e4472e', background: manifest.style?.background || '#171513', halftone: manifest.style?.halftone !== false },
  panels
};
const templatePath = resolve(here, '..', 'assets', 'site', 'index.html');
const template = readFileSync(templatePath, 'utf8');
const html = template.replace('__COMIC_DATA__', JSON.stringify(data).replace(/</g, '\\u003c'));
writeFileSync(join(out, 'index.html'), html, 'utf8');
const resolvedManifest = { ...manifest, panels: manifest.panels.map((panel, i) => ({ ...panel, shape: panels[i].shape, captionPosition: panels[i].captionPosition })) };
writeFileSync(join(out, 'manifest.json'), JSON.stringify(resolvedManifest, null, 2), 'utf8');
writeFileSync(join(out, 'comic.json'), JSON.stringify(data, null, 2), 'utf8');
console.log(`完成：${join(out, 'index.html')}`);
console.log(`漫画格：${panels.length}；视频已${args.copyVideo ? '复制' : '转为全关键帧 MP4'}`);
