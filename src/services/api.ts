import { DeviceInfo, DeviceRules, AppUsageRecord, ActivityEvent, InstalledApp } from '../types';

const API_BASE = '/api';

export const api = {
  async getDevices(): Promise<DeviceInfo[]> {
    const res = await fetch(`${API_BASE}/dashboard/devices`);
    if (!res.ok) throw new Error('Falha ao obter lista de computadores');
    const data = await res.json();
    return data.devices;
  },

  async getDeviceDetail(id: string): Promise<{
    device: DeviceInfo;
    rules: DeviceRules;
    appUsage: AppUsageRecord[];
    blockedDomains: string[];
    hostsSnippet: string;
    events: ActivityEvent[];
    installedApps: InstalledApp[];
  }> {
    const res = await fetch(`${API_BASE}/dashboard/device/${id}`);
    if (!res.ok) throw new Error('Falha ao obter dados do computador');
    return await res.json();
  },

  async createDevice(payload: { name: string; monitoredUser: string; ipAddress?: string }): Promise<DeviceInfo> {
    const res = await fetch(`${API_BASE}/dashboard/device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Falha ao criar computador');
    const data = await res.json();
    return data.device;
  },

  async updateDevice(id: string, payload: { name?: string; monitoredUser?: string }): Promise<DeviceInfo> {
    const res = await fetch(`${API_BASE}/dashboard/device/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Falha ao atualizar computador');
    const data = await res.json();
    return data.device;
  },

  async deleteDevice(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/dashboard/device/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao eliminar computador');
  },

  async updateRules(deviceId: string, rules: Partial<DeviceRules>): Promise<DeviceRules> {
    const res = await fetch(`${API_BASE}/dashboard/rules/${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });
    if (!res.ok) throw new Error('Falha ao guardar regras');
    const data = await res.json();
    return data.rules;
  },

  async sendCommand(deviceId: string, command: 'lock_now' | 'bonus_time' | 'message_child' | 'unlock_now' | 'scan_apps', payload?: any): Promise<void> {
    const res = await fetch(`${API_BASE}/dashboard/command/${deviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, payload })
    });
    if (!res.ok) throw new Error('Falha ao enviar comando remoto');
  },

  async getEvents(deviceId?: string, limit = 50): Promise<ActivityEvent[]> {
    const query = new URLSearchParams();
    if (deviceId) query.set('deviceId', deviceId);
    query.set('limit', limit.toString());
    const res = await fetch(`${API_BASE}/dashboard/events?${query.toString()}`);
    if (!res.ok) throw new Error('Falha ao obter histórico');
    const data = await res.json();
    return data.events;
  },

  async getHostsPreview(deviceId: string): Promise<{ snippet: string; domains: string[]; count: number }> {
    const res = await fetch(`${API_BASE}/dashboard/hosts-preview/${deviceId}`);
    if (!res.ok) throw new Error('Falha ao obter pré-visualização do hosts');
    return await res.json();
  },

  // Client Agent Simulation endpoints (allows testing the real agent flow from the browser)
  async simulateHeartbeat(payload: {
    deviceId: string;
    activeUser: string;
    foregroundApp: string;
    windowTitle?: string;
    uptimeMinutes: number;
    activeMinutes: number;
    isLocked?: boolean;
    appliedRulesVersion?: number;
  }) {
    const res = await fetch(`${API_BASE}/agent/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async simulateTelemetry(deviceId: string, appDeltas: Array<{ executableName: string; displayName?: string; minutes: number }>) {
    const res = await fetch(`${API_BASE}/agent/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, appDeltas })
    });
    return await res.json();
  },

  async simulateEvent(deviceId: string, type: string, severity: string, message: string, details?: any) {
    const res = await fetch(`${API_BASE}/agent/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, type, severity, message, details })
    });
    return await res.json();
  }
};
