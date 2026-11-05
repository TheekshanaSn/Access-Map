export const environment = {
  production: true,
  apiBaseUrl: '/api',
  appName: 'AccessMap Sri Lanka',
  version: '1.0.0',
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
  // In production, fictional demo data is completely disabled. Only real user/verified places are shown.
  enableDevDemoData: false,
};
