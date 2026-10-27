import { timeLabelStep, valueAxis } from './chart-scale.js';

/** Space around the plot for the axis labels, in CSS pixels. */
const PADDING = Object.freeze({ left: 38, right: 12, top: 12, bottom: 26 });
const LABEL_FONT = '12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const CROSS_RADIUS = 4;

/**
 * @typedef {object} ChartColors
 * @property {string} line - net WPM line
 * @property {string} fill - area under the net WPM line, at the top
 * @property {string} fillEnd - area under the net WPM line, at the bottom
 * @property {string} raw - raw WPM line
 * @property {string} grid - grid lines
 * @property {string} label - axis labels
 * @property {string} error - error crosses
 */

/**
 * Draws net and raw WPM for every second of a test, with a cross on the raw
 * line for each second that had errors. The canvas backing store follows the
 * element's CSS size times devicePixelRatio, so the chart stays sharp.
 * @param {HTMLCanvasElement} canvas
 * @param {readonly {second: number, wpm: number, raw: number, errors: number}[]} history
 * @param {ChartColors} colors
 */
export function drawChart(canvas, history, colors) {
  const surface = prepareCanvas(canvas);
  if (surface === null || history.length === 0) return;
  const { ctx } = surface;
  const frame = createFrame(surface, history);
  drawGrid(ctx, frame, colors);
  const net = history.map((sample) => [frame.x(sample.second), frame.y(sample.wpm)]);
  const raw = history.map((sample) => [frame.x(sample.second), frame.y(sample.raw)]);
  strokeLine(ctx, raw, colors.raw, 1.5);
  fillArea(ctx, net, frame, colors);
  strokeLine(ctx, net, colors.line, 2.5);
  drawErrors(ctx, frame, history, colors.error);
}

function prepareCanvas(canvas) {
  const { width, height } = canvas.getBoundingClientRect();
  if (width === 0 || height === 0) return null;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

/** Maps seconds and WPM to canvas coordinates. */
function createFrame({ width, height }, history) {
  const axis = valueAxis(Math.max(...history.flatMap((sample) => [sample.wpm, sample.raw])));
  const first = history.length > 1 ? history[0].second : 0;
  const last = history[history.length - 1].second;
  const left = PADDING.left;
  const right = width - PADDING.right;
  const top = PADDING.top;
  const bottom = height - PADDING.bottom;
  return {
    axis, first, last, left, right, top, bottom,
    x: (second) => left + ((second - first) / (last - first)) * (right - left),
    y: (value) => bottom - (value / axis.max) * (bottom - top),
  };
}

function drawGrid(ctx, frame, colors) {
  ctx.font = LABEL_FONT;
  ctx.fillStyle = colors.label;
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let value = 0; value <= frame.axis.max; value += frame.axis.step) {
    const y = Math.round(frame.y(value)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(frame.left, y);
    ctx.lineTo(frame.right, y);
    ctx.stroke();
    ctx.fillText(String(value), frame.left - 8, y);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const step = timeLabelStep(frame.last - frame.first, frame.right - frame.left);
  for (let second = step; second <= frame.last + 1e-9; second += step) {
    if (second >= frame.first) ctx.fillText(String(second), frame.x(second), frame.bottom + 8);
  }
}

function strokeLine(ctx, points, color, width) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function fillArea(ctx, points, frame, colors) {
  const gradient = ctx.createLinearGradient(0, frame.top, 0, frame.bottom);
  gradient.addColorStop(0, colors.fill);
  gradient.addColorStop(1, colors.fillEnd);
  ctx.beginPath();
  ctx.moveTo(points[0][0], frame.bottom);
  points.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(points[points.length - 1][0], frame.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawErrors(ctx, frame, history, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const sample of history) {
    if (sample.errors === 0) continue;
    const x = frame.x(sample.second);
    const y = frame.y(sample.raw);
    ctx.beginPath();
    ctx.moveTo(x - CROSS_RADIUS, y - CROSS_RADIUS);
    ctx.lineTo(x + CROSS_RADIUS, y + CROSS_RADIUS);
    ctx.moveTo(x + CROSS_RADIUS, y - CROSS_RADIUS);
    ctx.lineTo(x - CROSS_RADIUS, y + CROSS_RADIUS);
    ctx.stroke();
  }
}
