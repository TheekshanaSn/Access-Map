export interface DatabaseHealth {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  host: string | null;
  databaseName: string | null;
  lastError: string | null;
}

export interface SystemMemory {
  rss: number;
  heapUsed: number;
}

export interface BackendHealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: DatabaseHealth;
  system: {
    platform: string;
    nodeVersion: string;
    memoryUsageMb: SystemMemory;
  };
}

export interface ConnectionState {
  status: 'idle' | 'checking' | 'connected' | 'error';
  data: BackendHealthResponse | null;
  errorMessage: string | null;
  latencyMs: number | null;
  lastChecked: Date | null;
}

