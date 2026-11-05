export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api',
  appName: 'AccessMap Sri Lanka',
  version: '1.0.0',
  // Sri Lanka Geographic Map Configuration
  mapCenter: [7.8731, 80.7718] as [number, number],
  mapZoom: 7,
  mapMinZoom: 6,
  mapMaxZoom: 19,
  mapBounds: [
    [5.0, 78.5],
    [10.5, 83.0],
  ] as [[number, number], [number, number]],
  mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  mapAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  // Keep clearly labeled demo data only in development / testing
  enableDevDemoData: true,
};
