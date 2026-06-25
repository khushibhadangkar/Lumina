// Procedural Texture Generator for Lumina Globe (PBR & Photorealistic)
// Generates Satellite Color Map, City Lights, fBm Clouds, PBR Roughness, and Grayscale Bump maps.

interface Coordinate {
  lat: number;
  lon: number;
  name?: string;
  intensity?: number;
}

export const GLOBAL_CITIES: Coordinate[] = [
  { name: "New York", lat: 40.7128, lon: -74.0060, intensity: 1.0 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437, intensity: 0.9 },
  { name: "London", lat: 51.5074, lon: -0.1278, intensity: 1.0 },
  { name: "Paris", lat: 48.8566, lon: 2.3522, intensity: 0.95 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, intensity: 1.0 },
  { name: "Shanghai", lat: 31.2304, lon: 121.4737, intensity: 1.0 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, intensity: 0.8 },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, intensity: 0.95 },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, intensity: 0.9 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, intensity: 0.95 },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333, intensity: 0.85 },
  { name: "Cairo", lat: 30.0444, lon: 31.2357, intensity: 0.8 },
  { name: "Moscow", lat: 55.7558, lon: 37.6173, intensity: 0.85 },
  { name: "Johannesburg", lat: -26.2041, lon: 28.0473, intensity: 0.75 },
  { name: "Rio de Janeiro", lat: -22.9068, lon: -43.1729, intensity: 0.8 },
  { name: "Chicago", lat: 41.8781, lon: -87.6298, intensity: 0.85 },
  { name: "Seattle", lat: 47.6062, lon: -122.3321, intensity: 0.8 },
  { name: "Beijing", lat: 39.9042, lon: 116.4074, intensity: 0.95 },
  { name: "Hong Kong", lat: 22.3193, lon: 114.1694, intensity: 0.95 },
  { name: "Seoul", lat: 37.5665, lon: 126.9780, intensity: 0.95 },
  { name: "Berlin", lat: 52.5200, lon: 13.4050, intensity: 0.8 },
  { name: "Cape Town", lat: -33.9249, lon: 18.4241, intensity: 0.75 },
  { name: "Buenos Aires", lat: -34.6037, lon: -58.3816, intensity: 0.8 },
  { name: "Lagos", lat: 6.5244, lon: 3.3792, intensity: 0.75 },
  { name: "Nairobi", lat: -1.2921, lon: 36.8219, intensity: 0.7 },
  { name: "Riyadh", lat: 24.7136, lon: 46.6753, intensity: 0.8 },
  { name: "Istanbul", lat: 41.0082, lon: 28.9784, intensity: 0.85 },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194, intensity: 0.9 },
  { name: "Toronto", lat: 43.6532, lon: -79.3832, intensity: 0.85 },
  { name: "Mexico City", lat: 19.4326, lon: -99.1332, intensity: 0.85 }
];

const CONTINENT_POLYGONS: number[][][] = [
  // North America
  [
    [-168, 65], [-160, 70], [-120, 75], [-90, 70], [-80, 82], [-60, 83], [-55, 75], 
    [-60, 60], [-50, 48], [-60, 46], [-65, 45], [-70, 42], [-75, 35], [-81, 25], 
    [-81, 20], [-87, 15], [-80, 9], [-83, 8], [-90, 14], [-98, 16], [-105, 20], 
    [-110, 23], [-107, 27], [-115, 30], [-125, 40], [-125, 48], [-135, 55], [-145, 60], 
    [-160, 58], [-168, 65]
  ],
  // South America
  [
    [-77, 8], [-72, 11], [-60, 10], [-50, 0], [-35, -5], [-39, -15], [-45, -23], 
    [-50, -35], [-63, -50], [-67, -54], [-73, -54], [-73, -45], [-75, -40], [-72, -30], 
    [-71, -20], [-79, -10], [-81, -5], [-81, 0], [-77, 8]
  ],
  // Eurasia & Africa
  [
    [-17, 15], [-10, 20], [0, 30], [5, 36], [10, 37], [20, 32], [30, 31], [32, 30],
    [35, 30], [40, 25], [43, 27], [50, 25], [60, 25], [62, 20], [55, 15], [45, 12], 
    [43, 12], [38, 15], [33, 28], [33, 25], [38, 20], [42, 15], [51, 11], [48, 5], 
    [40, -5], [38, -15], [35, -25], [28, -34], [18, -34], [12, -20], [10, -10], 
    [5, -5], [5, 5], [0, 6], [-10, 5], [-15, 10], [-17, 15]
  ],
  // Eurasia
  [
    [35, 30], [26, 40], [15, 40], [9, 37], [-5, 36], [-9, 39], [-9, 43], [-1, 44], 
    [5, 50], [10, 55], [10, 60], [20, 65], [25, 71], [40, 68], [60, 70], [80, 75], 
    [100, 77], [120, 74], [140, 72], [160, 70], [170, 67], [180, 65], [170, 60], 
    [160, 50], [150, 45], [140, 40], [130, 35], [121, 31], [115, 20], [108, 15], 
    [105, 10], [100, 5], [104, 1], [98, 5], [96, 15], [88, 22], [80, 15], [78, 8], 
    [73, 10], [70, 20], [68, 25], [60, 25]
  ],
  // United Kingdom
  [
    [-5, 50], [-8, 52], [-10, 55], [-5, 59], [0, 60], [2, 57], [2, 52], [-5, 50]
  ],
  // Scandinavia
  [
    [5, 58], [5, 62], [10, 65], [15, 68], [25, 71], [30, 68], [25, 60], [20, 55], [10, 58], [5, 58]
  ],
  // Japan
  [
    [130, 32], [136, 35], [140, 38], [142, 43], [145, 45], [140, 40], [135, 35], [130, 32]
  ],
  // Australia
  [
    [113, -26], [114, -35], [120, -35], [130, -32], [138, -35], [140, -38], [148, -38], 
    [153, -28], [145, -15], [142, -10], [136, -12], [130, -12], [125, -15], [113, -26]
  ],
  // Greenland
  [
    [-60, 60], [-55, 70], [-60, 76], [-60, 82], [-40, 83], [-20, 80], [-20, 70], 
    [-30, 65], [-43, 60], [-60, 60]
  ],
  // Madagascar
  [
    [49, -12], [51, -16], [47, -25], [44, -25], [46, -16], [49, -12]
  ],
  // Antarctica
  [
    [-180, -75], [-120, -73], [-60, -70], [0, -68], [60, -72], [120, -74], [180, -75],
    [180, -90], [-180, -90], [-180, -75]
  ]
];

function mapCoords(lon: number, lat: number, width: number, height: number) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

function hash(p: number): number {
  const s = Math.sin(p) * 43758.5453123;
  return s - Math.floor(s);
}

function noise2D(x: number, y: number): number {
  const X = Math.floor(x);
  const Y = Math.floor(y);
  const fx = x - X;
  const fy = y - Y;

  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const a = hash(X + Y * 57);
  const b = hash(X + 1 + Y * 57);
  const c = hash(X + (Y + 1) * 57);
  const d = hash(X + 1 + (Y + 1) * 57);

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - v) * v + d * u * v;
}

function fbm(x: number, y: number, octaves = 4): number {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

export function createBaseEarthTexture(): HTMLCanvasElement {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#0c152b";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(10, 100, 180, 0.4)";
  ctx.lineWidth = 14;
  CONTINENT_POLYGONS.forEach(poly => {
    ctx.beginPath();
    poly.forEach((pt, idx) => {
      const { x, y } = mapCoords(pt[0], pt[1], width, height);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(0, 170, 220, 0.2)";
  ctx.lineWidth = 6;
  CONTINENT_POLYGONS.forEach(poly => {
    ctx.beginPath();
    poly.forEach((pt, idx) => {
      const { x, y } = mapCoords(pt[0], pt[1], width, height);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });

  const landGrad = ctx.createLinearGradient(0, 0, 0, height);
  landGrad.addColorStop(0.0, "#f0f2f5");
  landGrad.addColorStop(0.12, "#ffffff");
  landGrad.addColorStop(0.22, "#3e523f");
  landGrad.addColorStop(0.35, "#566846");
  landGrad.addColorStop(0.46, "#8c8261");
  landGrad.addColorStop(0.54, "#7e7855");
  landGrad.addColorStop(0.68, "#42573d");
  landGrad.addColorStop(0.80, "#2c402d");
  landGrad.addColorStop(0.92, "#f8f9fa");
  landGrad.addColorStop(1.0, "#ffffff");

  const landCanvas = document.createElement("canvas");
  landCanvas.width = width;
  landCanvas.height = height;
  const lctx = landCanvas.getContext("2d");
  if (!lctx) return canvas;

  lctx.fillStyle = landGrad;
  CONTINENT_POLYGONS.forEach(poly => {
    lctx.beginPath();
    poly.forEach((pt, idx) => {
      const { x, y } = mapCoords(pt[0], pt[1], width, height);
      if (idx === 0) lctx.moveTo(x, y);
      else lctx.lineTo(x, y);
    });
    lctx.closePath();
    lctx.fill();
  });

  const terrainCanvas = document.createElement("canvas");
  terrainCanvas.width = width;
  terrainCanvas.height = height;
  const tctx = terrainCanvas.getContext("2d");
  if (tctx) {
    const imgData = tctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      const ny = (y / height) * Math.PI;
      const sinNy = Math.sin(ny);
      for (let x = 0; x < width; x++) {
        const nx = (x / width) * Math.PI * 2;
        const val = fbm(Math.cos(nx) * sinNy * 16.0, Math.sin(nx) * sinNy * 16.0 + Math.cos(ny) * 16.0, 3);
        const intensity = Math.floor(val * 90 - 45);

        const pixelIdx = (y * width + x) * 4;
        data[pixelIdx] = 128 + intensity;
        data[pixelIdx + 1] = 128 + intensity;
        data[pixelIdx + 2] = 128 + intensity;
        data[pixelIdx + 3] = 255;
      }
    }
    tctx.putImageData(imgData, 0, 0);
    lctx.globalCompositeOperation = "soft-light";
    lctx.drawImage(terrainCanvas, 0, 0);
  }

  ctx.drawImage(landCanvas, 0, 0);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  for (let x = width / 6; x < width; x += width / 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  return canvas;
}

export function createCityLightsTexture(): HTMLCanvasElement {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  GLOBAL_CITIES.forEach(city => {
    const { x, y } = mapCoords(city.lon, city.lat, width, height);
    const scale = city.intensity || 1.0;

    const grad = ctx.createRadialGradient(x, y, 1, x, y, 14 * scale);
    grad.addColorStop(0, "rgba(225, 175, 80, 0.85)");
    grad.addColorStop(0.2, "rgba(215, 150, 60, 0.3)");
    grad.addColorStop(0.5, "rgba(200, 120, 40, 0.08)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 14 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 0.8 * scale, 0, Math.PI * 2);
    ctx.fill();

    const subLights = Math.floor(10 * scale);
    ctx.fillStyle = "rgba(225, 160, 60, 0.65)";
    for (let i = 0; i < subLights; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 8 * scale + 1.5;
      const sx = x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.3 + Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  return canvas;
}

export function createCloudsTexture(): HTMLCanvasElement {
  const width = 256;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const ny = (y / height) * Math.PI;
    const sinNy = Math.sin(ny);
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * Math.PI * 2;
      const val = fbm(Math.cos(nx) * sinNy * 5.0, Math.sin(nx) * sinNy * 5.0 + Math.cos(ny) * 5.0, 5);
      const pixelIdx = (y * width + x) * 4;
      const cloudDensity = Math.max(0, (val - 0.42) * 1.5);
      const white = Math.floor(255 * Math.min(1.0, cloudDensity + 0.3));
      const alpha = Math.floor(210 * cloudDensity);

      data[pixelIdx] = white;
      data[pixelIdx + 1] = white;
      data[pixelIdx + 2] = white;
      data[pixelIdx + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function createEarthRoughnessTexture(): HTMLCanvasElement {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Oceans are shiny black (roughness ~0.05)
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, width, height);

  // Lands are matte light grey (roughness ~0.85)
  ctx.fillStyle = "#dcdcdc";
  CONTINENT_POLYGONS.forEach(poly => {
    ctx.beginPath();
    poly.forEach((pt, idx) => {
      const { x, y } = mapCoords(pt[0], pt[1], width, height);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  });

  return canvas;
}

export function createEarthBumpTexture(): HTMLCanvasElement {
  const width = 512;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Oceans are completely flat mid-grey
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, width, height);

  // Lands mask
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mctx = maskCanvas.getContext("2d");
  if (!mctx) return canvas;

  mctx.fillStyle = "#000000";
  mctx.fillRect(0, 0, width, height);
  mctx.fillStyle = "#ffffff";
  CONTINENT_POLYGONS.forEach(poly => {
    mctx.beginPath();
    poly.forEach((pt, idx) => {
      const { x, y } = mapCoords(pt[0], pt[1], width, height);
      if (idx === 0) mctx.moveTo(x, y);
      else mctx.lineTo(x, y);
    });
    mctx.closePath();
    mctx.fill();
  });

  const maskData = mctx.getImageData(0, 0, width, height).data;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const ny = (y / height) * Math.PI;
    const sinNy = Math.sin(ny);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isLand = maskData[idx] > 128;

      if (isLand) {
        const nx = (x / width) * Math.PI * 2;
        // High frequency fBm noise representing mountains
        const val = fbm(Math.cos(nx) * sinNy * 32.0, Math.sin(nx) * sinNy * 32.0 + Math.cos(ny) * 32.0, 4);
        const bump = Math.floor(128 + val * 100);
        data[idx] = bump;
        data[idx + 1] = bump;
        data[idx + 2] = bump;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
