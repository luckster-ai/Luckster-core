// Generates the PWA / favicon icon set in public/icons/ from an App Icon
// master in docs/brand/app-icon/. No dependencies: PNG decode/encode via
// node:zlib, area-average downscaling.
//
//   cd frontend && node scripts/generate-app-icons.mjs [path/to/master.png]
//
// Replacing the icon = point MASTER_FILE (or the argument) at the new
// master, check FAVICON_CROP, and re-run this script. The manifest
// (public/manifest.webmanifest) and index.html only reference the output
// file names below, so they don't change.
//
// The master's style is detected automatically:
// - Bordered tile: a rounded tile with a thin gold border on a white canvas
//   (JOTI-App-Icon-Master.png). "any" icons keep the tile with transparent
//   corners; Apple Touch and maskable use the tile's inside on a solid
//   background, maskable shrunk until the lettering is in the safe zone.
// - Rounded shape: artwork filling a rounded shape with white corners, no
//   border (JOTI-App-Icon-v1.png). "any" icons are the shape with
//   transparent corners; Apple Touch and maskable are the artwork with the
//   corners filled in from its own edge, full size (the lettering is
//   assumed to be near the centre -- check the maskable preview).
// - Full-bleed: artwork to the edges. Every icon is the master itself.
// Platforms apply their own icon mask, so a drawn tile/shape on the Apple
// Touch or maskable icon would show as an icon inside an icon.

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// The current candidate (second version, not final).
const MASTER_FILE = 'JOTI-App-Icon-v1.png'
const masterPath = path.resolve(
  process.argv[2] ?? path.join(frontendDir, '../docs/brand/app-icon', MASTER_FILE)
)
const outDir = path.join(frontendDir, 'public/icons')

const ANY_SIZES = [192, 512]
const MASKABLE_SIZE = 512
const APPLE_TOUCH_SIZE = 180
const FAVICON_SIZES = [32, 48]

// Maskable: everything that matters must sit inside the centered circle
// of 40% radius (W3C safe zone); a little extra room on top of that. The
// shrunk artwork's edge fades into the background over MASKABLE_FEATHER
// (fraction of its size) so it doesn't read as a square inside the icon.
const MASKABLE_SAFE_RADIUS = 0.4 * 0.97
const MASKABLE_FEATHER = 0.14

// Favicon: the part of the master that still reads at 16-48px, in
// fractions of the master -- check it whenever the master changes.
// v1: the JOTI lettering on the centre sphere.
// (JOTI-App-Icon-Master.png: { cx: 0.5, cy: 0.428, size: 0.3 }, the
// flower's centre sphere and inner petals.)
const FAVICON_CROP = { cx: 0.5, cy: 0.5, size: 0.62 }
const FAVICON_CORNER = 0.22

// ---------------------------------------------------------------- PNG I/O

function readPng(file) {
  const buf = fs.readFileSync(file)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`)
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  const bitDepth = buf[24]
  const colorType = buf[25]
  const interlace = buf[28]
  if (bitDepth !== 8 || ![2, 6].includes(colorType) || interlace !== 0) {
    throw new Error('master must be an 8-bit, non-interlaced RGB or RGBA PNG')
  }
  const idat = []
  for (let o = 8; o < buf.length; ) {
    const len = buf.readUInt32BE(o)
    const type = buf.toString('latin1', o + 4, o + 8)
    if (type === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + len))
    o += 12 + len
    if (type === 'IEND') break
  }
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const bpp = colorType === 6 ? 4 : 3
  const stride = width * bpp
  const px = Buffer.alloc(height * stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x
      const a = x >= bpp ? px[i - bpp] : 0
      const b = y ? px[i - stride] : 0
      const c = x >= bpp && y ? px[i - stride - bpp] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) v += paeth(a, b, c)
      px[i] = v & 255
    }
  }
  // Normalize to float RGBA 0..1 (premultiplied later where needed).
  const img = { width, height, data: new Float32Array(width * height * 4) }
  for (let p = 0; p < width * height; p++) {
    img.data[p * 4] = px[p * bpp] / 255
    img.data[p * 4 + 1] = px[p * bpp + 1] / 255
    img.data[p * 4 + 2] = px[p * bpp + 2] / 255
    img.data[p * 4 + 3] = bpp === 4 ? px[p * bpp + 3] / 255 : 1
  }
  return img
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

// Opaque images are written as RGB, the rest as RGBA. Each row uses the
// PNG filter with the smallest absolute sum (the usual heuristic).
function writePng(file, img) {
  const opaque = img.data.every((v, i) => i % 4 !== 3 || v >= 0.999)
  const bpp = opaque ? 3 : 4
  const { width, height } = img
  const stride = width * bpp
  const px = Buffer.alloc(height * stride)
  for (let p = 0; p < width * height; p++) {
    for (let k = 0; k < bpp; k++) {
      px[p * bpp + k] = Math.round(Math.min(1, Math.max(0, img.data[p * 4 + k])) * 255)
    }
  }
  const raw = Buffer.alloc(height * (stride + 1))
  const candidate = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    let best = null
    let bestScore = Infinity
    for (let filter = 0; filter <= 4; filter++) {
      let score = 0
      for (let x = 0; x < stride; x++) {
        const i = y * stride + x
        const a = x >= bpp ? px[i - bpp] : 0
        const b = y ? px[i - stride] : 0
        const c = x >= bpp && y ? px[i - stride - bpp] : 0
        const pred = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter]
        const v = (px[i] - pred) & 255
        candidate[x] = v
        score += v < 128 ? v : 256 - v
      }
      if (score < bestScore) {
        bestScore = score
        best = Buffer.concat([Buffer.from([filter]), candidate])
      }
    }
    best.copy(raw, y * (stride + 1))
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = opaque ? 2 : 6
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0))
    ])
  )
}

// ----------------------------------------------------------- image helpers

function createImage(width, height, fill = [0, 0, 0, 0]) {
  const data = new Float32Array(width * height * 4)
  for (let p = 0; p < width * height; p++) data.set(fill, p * 4)
  return { width, height, data }
}

function pixel(img, x, y) {
  const i = (y * img.width + x) * 4
  return img.data.subarray(i, i + 4)
}

// Area-average resample of the source rectangle (sx, sy, sw, sh) into a
// w x h image, alpha-weighted so transparent edges don't darken.
function resample(src, sx, sy, sw, sh, w, h) {
  const out = createImage(w, h)
  const scaleX = sw / w
  const scaleY = sh / h
  for (let oy = 0; oy < h; oy++) {
    const y0 = sy + oy * scaleY
    const y1 = y0 + scaleY
    for (let ox = 0; ox < w; ox++) {
      const x0 = sx + ox * scaleX
      const x1 = x0 + scaleX
      let r = 0, g = 0, b = 0, a = 0, area = 0
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
        const wy = Math.min(y + 1, y1) - Math.max(y, y0)
        if (y < 0 || y >= src.height || wy <= 0) continue
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
          const wx = Math.min(x + 1, x1) - Math.max(x, x0)
          if (x < 0 || x >= src.width || wx <= 0) continue
          const weight = wx * wy
          const p = pixel(src, x, y)
          r += p[0] * p[3] * weight
          g += p[1] * p[3] * weight
          b += p[2] * p[3] * weight
          a += p[3] * weight
          area += weight
        }
      }
      const q = pixel(out, ox, oy)
      if (a > 0) {
        q[0] = r / a
        q[1] = g / a
        q[2] = b / a
      }
      q[3] = area > 0 ? a / area : 0
    }
  }
  return out
}

// Signed distance from (x, y) to a rounded rectangle (negative inside).
function roundedRectDistance(x, y, rect) {
  const cx = (rect.left + rect.right) / 2
  const cy = (rect.top + rect.bottom) / 2
  const hw = (rect.right - rect.left) / 2
  const hh = (rect.bottom - rect.top) / 2
  const qx = Math.abs(x - cx) - (hw - rect.radius)
  const qy = Math.abs(y - cy) - (hh - rect.radius)
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    rect.radius
  )
}

// Copy of img where everything outside the rounded rect becomes `fill`
// (an RGBA colour; alpha 0 for transparent), with a 1px anti-aliased edge.
function maskOutside(img, rect, fill) {
  const out = createImage(img.width, img.height)
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const inside = Math.min(1, Math.max(0, 0.5 - roundedRectDistance(x + 0.5, y + 0.5, rect)))
      const p = pixel(img, x, y)
      const q = pixel(out, x, y)
      const a = p[3] * inside + fill[3] * (1 - inside)
      for (let k = 0; k < 3; k++) {
        q[k] = a > 0 ? (p[k] * p[3] * inside + fill[k] * fill[3] * (1 - inside)) / a : 0
      }
      q[3] = a
    }
  }
  return out
}

function drawOnto(dst, src, x, y) {
  for (let sy = 0; sy < src.height; sy++) {
    for (let sx = 0; sx < src.width; sx++) {
      const dx = x + sx
      const dy = y + sy
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue
      const s = pixel(src, sx, sy)
      const d = pixel(dst, dx, dy)
      const a = s[3] + d[3] * (1 - s[3])
      for (let k = 0; k < 3; k++) {
        d[k] = a > 0 ? (s[k] * s[3] + d[k] * d[3] * (1 - s[3])) / a : 0
      }
      d[3] = a
    }
  }
}

// ------------------------------------------------------- tile detection

// The first version's tile border is a thin gold line on a near-white
// canvas with a soft glow; its strength varies along the edge. A border
// pixel is clearly more gold (red minus blue) than the pixel a few steps
// further out, which the slow glow gradient never is.
const gold = (p) => p[0] - p[2]
const isBorderStep = (p, outer) => gold(p) > 45 / 255 && gold(p) - gold(outer) > 40 / 255
const isNearWhite = (p) => p[0] > 0.95 && p[1] > 0.95 && p[2] > 0.95

function detectTile(img) {
  const { width: w, height: h } = img
  const corners = [pixel(img, 2, 2), pixel(img, w - 3, 2), pixel(img, 2, h - 3), pixel(img, w - 3, h - 3)]
  if (!corners.every(isNearWhite)) return null

  const limit = Math.round(Math.min(w, h) * 0.2)
  const scan = (from, step, at) => {
    for (let i = 6; i < limit; i++) {
      if (isBorderStep(at(from + i * step), at(from + (i - 6) * step))) return from + i * step
    }
    return null
  }
  // Several lines per side, median: artwork touching the border at one
  // point (e.g. a petal tip on the centre line) doesn't skew the edge.
  const lines = [0.3, 0.35, 0.4, 0.6, 0.65, 0.7]
  const median = (values) => {
    if (values.includes(null)) return null
    return values.sort((p, q) => p - q)[values.length >> 1]
  }
  const left = median(lines.map((t) => scan(0, 1, (x) => pixel(img, x, Math.round(h * t)))))
  const right = median(lines.map((t) => scan(w - 1, -1, (x) => pixel(img, x, Math.round(h * t)))))
  const top = median(lines.map((t) => scan(0, 1, (y) => pixel(img, Math.round(w * t), y))))
  const bottom = median(lines.map((t) => scan(h - 1, -1, (y) => pixel(img, Math.round(w * t), y))))
  if ([left, right, top, bottom].includes(null)) return null
  // A real border is a straight line: every sample line finds it at about
  // the same place, and the tile is square. Artwork edges (no border) aren't.
  const spread = (values) => Math.max(...values) - Math.min(...values)
  const sides = [
    lines.map((t) => scan(0, 1, (x) => pixel(img, x, Math.round(h * t)))),
    lines.map((t) => scan(w - 1, -1, (x) => pixel(img, x, Math.round(h * t)))),
    lines.map((t) => scan(0, 1, (y) => pixel(img, Math.round(w * t), y))),
    lines.map((t) => scan(h - 1, -1, (y) => pixel(img, Math.round(w * t), y)))
  ]
  if (sides.some((values) => values.includes(null) || spread(values) > 6)) return null
  if (Math.abs(right - left - (bottom - top)) > w * 0.02) return null

  // Corner radius from where the border crosses each corner's diagonal:
  // (edgeX + r - d)^2 + (edgeY + r - d)^2 = r^2 for the inset distance d.
  const radii = []
  const diag = (cx, cy, sx, sy, ex, ey) => {
    const lim = Math.round(Math.min(w, h) * 0.35)
    for (let d = 6; d < lim; d++) {
      if (isBorderStep(pixel(img, cx + sx * d, cy + sy * d), pixel(img, cx + sx * (d - 6), cy + sy * (d - 6)))) {
        const a = ex - d
        const b = ey - d
        const A = 1
        const B = 2 * (a + b)
        const C = a * a + b * b
        const disc = B * B - 4 * A * C
        if (disc >= 0) radii.push((-B + Math.sqrt(disc)) / (2 * A))
        return
      }
    }
  }
  diag(0, 0, 1, 1, left, top)
  diag(w - 1, 0, -1, 1, w - 1 - right, top)
  diag(0, h - 1, 1, -1, left, h - 1 - bottom)
  diag(w - 1, h - 1, -1, -1, w - 1 - right, h - 1 - bottom)
  if (!radii.length) return null
  const radius = radii.reduce((s, r) => s + r, 0) / radii.length

  return { left, top, right: right + 1, bottom: bottom + 1, radius }
}

// Rounded shape without a border: the white corners are the near-white
// pixels connected to the canvas corners. Returns the outside mask (1 =
// outside) and the inside's bounding box, or null if there is no outside.
function detectShape(img) {
  const { width: w, height: h } = img
  const outside = new Uint8Array(w * h)
  const white = (i) => {
    const p = img.data.subarray(i * 4, i * 4 + 3)
    return Math.min(p[0], p[1], p[2]) > 0.92 && p[0] - p[2] < 0.08
  }
  const stack = [0, w - 1, (h - 1) * w, h * w - 1].filter(white)
  for (const i of stack) outside[i] = 1
  while (stack.length) {
    const i = stack.pop()
    const x = i % w
    const y = (i - x) / w
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const j = ny * w + nx
      if (!outside[j] && white(j)) {
        outside[j] = 1
        stack.push(j)
      }
    }
  }
  const count = outside.reduce((sum, v) => sum + v, 0)
  if (count < w * h * 0.005) return null

  let left = w, top = h, right = 0, bottom = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (outside[y * w + x]) continue
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x + 1)
      bottom = Math.max(bottom, y + 1)
    }
  }
  return { outside, rect: { left, top, right, bottom } }
}

function forEachNeighbour(w, h, i, fn) {
  const x = i % w
  const y = (i - x) / w
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < w && ny < h) fn(ny * w + nx)
    }
  }
}

// Copy of img, fully opaque, with each outside pixel's colour averaged from
// its already-filled neighbours, ring by ring outward from the shape's edge.
function fillOutside(img, outside) {
  const { width: w, height: h } = img
  const out = { width: w, height: h, data: Float32Array.from(img.data) }
  const known = Uint8Array.from(outside, (v) => 1 - v)
  const queued = new Uint8Array(w * h)
  const enqueueAround = (list, target) => {
    for (const i of list) {
      forEachNeighbour(w, h, i, (j) => {
        if (!known[j] && !queued[j]) {
          queued[j] = 1
          target.push(j)
        }
      })
    }
  }
  let ring = []
  const inside = []
  for (let i = 0; i < w * h; i++) if (known[i]) inside.push(i)
  enqueueAround(inside, ring)
  while (ring.length) {
    for (const i of ring) {
      let r = 0, g = 0, b = 0, n = 0
      forEachNeighbour(w, h, i, (j) => {
        if (!known[j]) return
        r += out.data[j * 4]
        g += out.data[j * 4 + 1]
        b += out.data[j * 4 + 2]
        n++
      })
      out.data.set([r / n, g / n, b / n], i * 4)
    }
    for (const i of ring) known[i] = 1
    const next = []
    enqueueAround(ring, next)
    ring = next
  }
  for (let p = 0; p < w * h; p++) out.data[p * 4 + 3] = 1
  return out
}

// The filled image with the outside transparent again, the edge softened
// over about a pixel (3x3 average of the inside mask).
function cutOutside(filled, outside) {
  const { width: w, height: h } = filled
  const out = { width: w, height: h, data: Float32Array.from(filled.data) }
  for (let i = 0; i < w * h; i++) {
    let inside = 1 - outside[i]
    let n = 1
    forEachNeighbour(w, h, i, (j) => {
      inside += 1 - outside[j]
      n++
    })
    out.data[i * 4 + 3] = inside / n
  }
  return out
}

function inset(rect, by) {
  return {
    left: rect.left + by,
    top: rect.top + by,
    right: rect.right - by,
    bottom: rect.bottom - by,
    radius: Math.max(0, rect.radius - by)
  }
}

// Median colour of a thin band just inside the tile edge (middle half of
// each side): the background for full-bleed and maskable icons.
function edgeColour(img, rect) {
  const samples = []
  const w = rect.right - rect.left
  const h = rect.bottom - rect.top
  for (let t = 0.25; t <= 0.75; t += 0.01) {
    samples.push(pixel(img, Math.round(rect.left + w * t), Math.round(rect.top + 2)))
    samples.push(pixel(img, Math.round(rect.left + w * t), Math.round(rect.bottom - 3)))
    samples.push(pixel(img, Math.round(rect.left + 2), Math.round(rect.top + h * t)))
    samples.push(pixel(img, Math.round(rect.right - 3), Math.round(rect.top + h * t)))
  }
  const median = (k) => samples.map((p) => p[k]).sort((a, b) => a - b)[samples.length >> 1]
  return [median(0), median(1), median(2), 1]
}

// ------------------------------------------------------------------ main

const master = readPng(masterPath)
if (master.width !== master.height) throw new Error('master must be square')
const tile = detectTile(master)
fs.mkdirSync(outDir, { recursive: true })

let anyIcon // "any" purpose: the icon as drawn
let fullBleed // opaque, artwork to the edges (Apple Touch, maskable base)
let background
let shrinkMaskable = false // shrink the maskable artwork into the safe zone

const shape = tile ? null : detectShape(master)

if (tile) {
  shrinkMaskable = true
  // Cut just outside the gold border; corners become transparent.
  const outer = inset(tile, -0.5)
  anyIcon = cropTo(maskOutside(master, outer, [0, 0, 0, 0]), outer)
  // Inside the border, with the tile's own corners filled in.
  const inner = inset(tile, 14)
  background = edgeColour(master, inner)
  fullBleed = cropTo(maskOutside(master, inner, background), inner)
  console.log('Tile master detected:', {
    border: [tile.left, tile.top, tile.right, tile.bottom],
    radius: Math.round(tile.radius),
    background: background.slice(0, 3).map((v) => Math.round(v * 255))
  })
} else if (shape) {
  const filled = fillOutside(master, shape.outside)
  anyIcon = cropTo(cutOutside(filled, shape.outside), shape.rect)
  fullBleed = cropTo(filled, shape.rect)
  console.log('Rounded-shape master detected:', {
    shape: [shape.rect.left, shape.rect.top, shape.rect.right, shape.rect.bottom]
  })
} else {
  anyIcon = master
  fullBleed = master
  background = edgeColour(master, { left: 0, top: 0, right: master.width, bottom: master.height })
  console.log('Full-bleed master (no tile detected).')
}

// Square crop around the rect's centre (its larger side), kept inside the
// image so no empty border is added.
function cropTo(img, rect) {
  const size = Math.min(img.width, Math.ceil(Math.max(rect.right - rect.left, rect.bottom - rect.top)))
  const clamp = (v) => Math.min(Math.max(0, v), img.width - size)
  const x = clamp(Math.round((rect.left + rect.right - size) / 2))
  const y = clamp(Math.round((rect.top + rect.bottom - size) / 2))
  return resample(img, x, y, size, size, size, size)
}

function save(name, img) {
  writePng(path.join(outDir, name), img)
  console.log(`  public/icons/${name}  ${img.width}x${img.height}`)
}

for (const size of ANY_SIZES) {
  save(`icon-${size}.png`, resample(anyIcon, 0, 0, anyIcon.width, anyIcon.height, size, size))
}

save(
  `apple-touch-icon.png`,
  resample(fullBleed, 0, 0, fullBleed.width, fullBleed.height, APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE)
)

// Maskable. Bordered tile: shrink the artwork until its farthest
// non-background pixel is inside the safe circle, then centre it on the
// background colour. Otherwise the full-bleed artwork as is.
if (!shrinkMaskable) {
  save(
    'icon-maskable-512.png',
    resample(fullBleed, 0, 0, fullBleed.width, fullBleed.height, MASKABLE_SIZE, MASKABLE_SIZE)
  )
  console.log('    full size -- check the lettering stays inside the centre 80% circle')
} else {
  const n = fullBleed.width
  const c = n / 2
  let farthest = 0
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const p = pixel(fullBleed, x, y)
      const diff = Math.abs(p[0] - background[0]) + Math.abs(p[1] - background[1]) + Math.abs(p[2] - background[2])
      // Strong ink only (lettering, gold lines), not the soft glow.
      if (diff > 0.45) farthest = Math.max(farthest, Math.hypot(x + 0.5 - c, y + 0.5 - c))
    }
  }
  const scale = Math.min(1, (MASKABLE_SAFE_RADIUS * n) / farthest)
  const inner = Math.round(MASKABLE_SIZE * scale)
  const canvas = createImage(MASKABLE_SIZE, MASKABLE_SIZE, background)
  const art = resample(fullBleed, 0, 0, n, n, inner, inner)
  const feather = inner * MASKABLE_FEATHER
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const edge = Math.min(x + 0.5, y + 0.5, inner - x - 0.5, inner - y - 0.5)
      const t = Math.min(1, edge / feather)
      pixel(art, x, y)[3] *= t * t * (3 - 2 * t)
    }
  }
  drawOnto(canvas, art, Math.round((MASKABLE_SIZE - inner) / 2), Math.round((MASKABLE_SIZE - inner) / 2))
  save('icon-maskable-512.png', canvas)
  console.log(`    artwork scaled to ${Math.round(scale * 100)}% for the safe zone`)
}

// Favicon: FAVICON_CROP only, as a small rounded tile.
{
  const size = master.width * FAVICON_CROP.size
  const x = master.width * FAVICON_CROP.cx - size / 2
  const y = master.height * FAVICON_CROP.cy - size / 2
  for (const out of FAVICON_SIZES) {
    const crop = resample(master, x, y, size, size, out, out)
    const shape = { left: 0, top: 0, right: out, bottom: out, radius: out * FAVICON_CORNER }
    save(`favicon-${out}.png`, maskOutside(crop, shape, [0, 0, 0, 0]))
  }
}
