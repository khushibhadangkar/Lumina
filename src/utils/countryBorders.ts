// Geographical Country Border Loops and Ray-Casting Utilities for Lumina
// Defines boundaries for major industrial nodes.

export interface CountryBoundary {
  id: string;
  name: string;
  center: { lat: number; lon: number };
  boundary: number[][]; // [lon, lat] points
}

export const COUNTRIES_BOUNDARIES: CountryBoundary[] = [
  {
    id: "TW",
    name: "Taiwan",
    center: { lat: 23.6, lon: 121.0 },
    boundary: [
      [120.0, 21.9],
      [120.8, 21.9],
      [121.9, 24.5],
      [122.0, 25.3],
      [121.0, 25.4],
      [120.0, 23.0],
      [120.0, 21.9]
    ]
  },
  {
    id: "CL",
    name: "Chile",
    center: { lat: -35.6, lon: -71.5 },
    boundary: [
      [-73.5, -54.0],
      [-68.5, -54.0],
      [-68.5, -40.0],
      [-70.0, -18.0],
      [-70.5, -18.0],
      [-74.5, -40.0],
      [-73.5, -54.0]
    ]
  },
  {
    id: "AU",
    name: "Australia",
    center: { lat: -25.2, lon: 133.7 },
    boundary: [
      [113.0, -26.0],
      [114.0, -35.0],
      [120.0, -35.0],
      [130.0, -32.0],
      [138.0, -35.0],
      [140.0, -38.0],
      [148.0, -38.0],
      [153.0, -28.0],
      [145.0, -15.0],
      [142.0, -10.0],
      [136.0, -12.0],
      [130.0, -12.0],
      [125.0, -15.0],
      [113.0, -26.0]
    ]
  },
  {
    id: "US",
    name: "United States",
    center: { lat: 37.0, lon: -95.7 },
    boundary: [
      [-124.5, 48.5],
      [-90.0, 48.5],
      [-80.0, 45.0],
      [-67.0, 45.0],
      [-80.0, 25.0],
      [-97.0, 26.0],
      [-117.0, 32.5],
      [-124.5, 40.0],
      [-124.5, 48.5]
    ]
  },
  {
    id: "CN",
    name: "China",
    center: { lat: 35.8, lon: 104.1 },
    boundary: [
      [74.0, 39.0],
      [90.0, 48.0],
      [120.0, 48.0],
      [125.0, 40.0],
      [121.5, 23.5], // kept clear of Taiwan coordinate loops
      [110.0, 20.0],
      [100.0, 21.5],
      [85.0, 28.0],
      [74.0, 39.0]
    ]
  },
  {
    id: "KR",
    name: "South Korea",
    center: { lat: 35.9, lon: 127.7 },
    boundary: [
      [126.3, 34.3],
      [129.4, 34.3],
      [129.4, 38.3],
      [126.3, 38.3],
      [126.3, 34.3]
    ]
  },
  {
    id: "BR",
    name: "Brazil",
    center: { lat: -14.2, lon: -51.9 },
    boundary: [
      [-73.0, -7.0],
      [-60.0, 5.0],
      [-44.0, -2.5],
      [-35.0, -6.0],
      [-35.0, -15.0],
      [-48.0, -28.0],
      [-53.0, -33.5],
      [-58.0, -30.0],
      [-58.0, -22.0],
      [-73.0, -7.0]
    ]
  },
  {
    id: "IN",
    name: "India",
    center: { lat: 20.5, lon: 78.9 },
    boundary: [
      [68.0, 23.0],
      [77.0, 31.0],
      [80.0, 35.0],
      [88.0, 27.0],
      [92.0, 27.0],
      [92.0, 22.0],
      [80.0, 10.0],
      [73.0, 10.0],
      [68.0, 23.0]
    ]
  },
  {
    id: "GB",
    name: "United Kingdom",
    center: { lat: 55.3, lon: -3.4 },
    boundary: [
      [-5.0, 50.0],
      [-8.0, 52.0],
      [-10.0, 55.0],
      [-5.0, 59.0],
      [0.0, 60.0],
      [2.0, 57.0],
      [2.0, 52.0],
      [-5.0, 50.0]
    ]
  },
  {
    id: "DE",
    name: "Germany",
    center: { lat: 51.1, lon: 10.4 },
    boundary: [
      [6.0, 50.0],
      [10.0, 55.0],
      [14.0, 54.0],
      [15.0, 51.0],
      [12.0, 47.5],
      [8.0, 47.5],
      [6.0, 50.0]
    ]
  }
];

/**
 * Standard 2D point-in-polygon raycasting algorithm.
 * Checks whether a lat/lon coordinate falls inside a boundary.
 */
export function checkPointInPolygon(lon: number, lat: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat))
        && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Iterates through active boundary profiles to determine if a clicked lat/lon falls inside any country.
 */
export function identifyCountryByCoordinates(lat: number, lon: number): CountryBoundary | null {
  for (const c of COUNTRIES_BOUNDARIES) {
    if (checkPointInPolygon(lon, lat, c.boundary)) {
      return c;
    }
  }
  return null;
}
