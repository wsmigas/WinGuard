import fs from 'fs';
import path from 'path';
import { DatabaseSchema, DeviceInfo, DeviceRules, ActivityEvent, AppRule, AppUsageRecord } from './types.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'winguard-db.json');

export const PRESET_CATEGORY_DOMAINS: Record<string, string[]> = {
  adult: [
    'pornhub.com', 'www.pornhub.com',
    'xvideos.com', 'www.xvideos.com',
    'xnxx.com', 'www.xnxx.com',
    'redtube.com', 'www.redtube.com',
    'youporn.com', 'www.youporn.com',
    'onlyfans.com', 'www.onlyfans.com',
    'chaturbate.com', 'www.chaturbate.com',
    'omegle.com', 'www.omegle.com',
    'erome.com', 'www.erome.com',
    'beeg.com', 'www.beeg.com'
  ],
  social: [
    'tiktok.com', 'www.tiktok.com', 'v.tiktok.com',
    'instagram.com', 'www.instagram.com',
    'facebook.com', 'www.facebook.com',
    'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
    'snapchat.com', 'www.snapchat.com',
    'reddit.com', 'www.reddit.com',
    'threads.net', 'www.threads.net',
    'twitch.tv', 'www.twitch.tv'
  ],
  gaming: [
    'roblox.com', 'www.roblox.com',
    'steampowered.com', 'store.steampowered.com',
    'epicgames.com', 'www.epicgames.com',
    'riotgames.com', 'www.riotgames.com',
    'minecraft.net', 'www.minecraft.net',
    'battle.net', 'www.battle.net',
    'discord.com', 'www.discord.com'
  ],
  gambling: [
    'betclic.pt', 'www.betclic.pt',
    'betano.pt', 'www.betano.pt',
    'placard.pt', 'www.placard.pt',
    'bwin.pt', 'www.bwin.pt',
    'pokerstars.pt', 'www.pokerstars.pt',
    'stake.com', 'www.stake.com',
    'roobet.com', 'www.roobet.com',
    'csgoempire.com', 'www.csgoempire.com'
  ]
};

export const DEFAULT_APP_RULES: AppRule[] = [
  {
    id: 'app-roblox',
    executableName: 'robloxplayerbeta.exe',
    displayName: 'Roblox Player',
    category: 'games',
    status: 'limited',
    dailyLimitMinutes: 60,
    allowedStartTime: '14:00',
    allowedEndTime: '19:30'
  },
  {
    id: 'app-discord',
    executableName: 'discord.exe',
    displayName: 'Discord',
    category: 'social',
    status: 'limited',
    dailyLimitMinutes: 90,
    allowedStartTime: '10:00',
    allowedEndTime: '20:30'
  },
  {
    id: 'app-steam',
    executableName: 'steam.exe',
    displayName: 'Steam Client',
    category: 'games',
    status: 'limited',
    dailyLimitMinutes: 60,
    allowedStartTime: '16:00',
    allowedEndTime: '20:00'
  },
  {
    id: 'app-chrome',
    executableName: 'chrome.exe',
    displayName: 'Google Chrome',
    category: 'browsers',
    status: 'allowed',
    dailyLimitMinutes: 180
  },
  {
    id: 'app-minecraft',
    executableName: 'javaw.exe',
    displayName: 'Minecraft Java / Bedrock',
    category: 'games',
    status: 'limited',
    dailyLimitMinutes: 90,
    allowedStartTime: '15:00',
    allowedEndTime: '20:00'
  },
  {
    id: 'app-word',
    executableName: 'winword.exe',
    displayName: 'Microsoft Word (Escola)',
    category: 'education',
    status: 'allowed',
    dailyLimitMinutes: 0 // Unlimited
  }
];

export const INITIAL_DEVICE: DeviceInfo = {
  id: 'dev-win11-quarto',
  name: 'PC-QUARTO-FILHO',
  monitoredUser: 'pedro',
  osVersion: 'Windows 11 Pro 64-bit (Build 22631)',
  ipAddress: '192.168.1.115',
  agentVersion: 'v1.4.2-lxc',
  pairedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  lastSeen: new Date(Date.now() - 2 * 60000).toISOString(),
  isOnline: true,
  currentActiveUser: 'pedro',
  currentForegroundApp: 'robloxplayerbeta.exe',
  currentWindowTitle: 'Roblox - Blox Fruits',
  todayActiveMinutes: 75,
  todayUptimeMinutes: 140,
  isLocked: false,
  pendingRulesVersion: 3,
  appliedRulesVersion: 3
};

export const INITIAL_RULES: DeviceRules = {
  version: 3,
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
  globalDailyLimitMinutesWeekday: 120, // 2 horas em dias de escola
  globalDailyLimitMinutesWeekend: 240, // 4 horas no fim de semana
  bonusMinutesToday: 0,
  curfew: {
    enabled: true,
    weekdayStartTime: '21:30',
    weekdayEndTime: '07:30',
    weekendStartTime: '23:00',
    weekendEndTime: '08:30'
  },
  appRules: DEFAULT_APP_RULES,
  blockedDomains: [
    'tiktok.com',
    'www.tiktok.com',
    'omegle.com',
    'www.omegle.com',
    'csgoempire.com',
    'pornhub.com',
    'xvideos.com'
  ],
  blocklistCategories: {
    adult: true,
    social: false,
    gaming: false,
    gambling: true
  },
  customHostsHeader: '# WinGuard Parental Control - Proxmox LXC Managed'
};

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('Could not read existing database, initializing fresh one:', err);
    }

    const today = getTodayKey();
    const initialDb: DatabaseSchema = {
      devices: [INITIAL_DEVICE],
      rules: {
        'dev-win11-quarto': INITIAL_RULES
      },
      appUsage: {
        'dev-win11-quarto': {
          [today]: {
            'robloxplayerbeta.exe': {
              executableName: 'robloxplayerbeta.exe',
              displayName: 'Roblox Player',
              minutesUsedToday: 48,
              lastActive: new Date().toISOString()
            },
            'chrome.exe': {
              executableName: 'chrome.exe',
              displayName: 'Google Chrome',
              minutesUsedToday: 22,
              lastActive: new Date(Date.now() - 20 * 60000).toISOString()
            },
            'discord.exe': {
              executableName: 'discord.exe',
              displayName: 'Discord',
              minutesUsedToday: 15,
              lastActive: new Date(Date.now() - 50 * 60000).toISOString()
            }
          }
        }
      },
      events: [
        {
          id: 'evt-1',
          deviceId: 'dev-win11-quarto',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          type: 'blocked_site_attempt',
          severity: 'warning',
          message: 'Tentativa de acesso ao site bloqueado: tiktok.com (Redirecionado para 127.0.0.1 pelo ficheiro hosts)',
          details: { domain: 'tiktok.com', process: 'chrome.exe' }
        },
        {
          id: 'evt-2',
          deviceId: 'dev-win11-quarto',
          timestamp: new Date(Date.now() - 80 * 60000).toISOString(),
          type: 'rule_updated',
          severity: 'info',
          message: 'Novas regras horárias sincronizadas com o computador do filho.',
          details: { version: 3 }
        },
        {
          id: 'evt-3',
          deviceId: 'dev-win11-quarto',
          timestamp: new Date(Date.now() - 140 * 60000).toISOString(),
          type: 'user_login',
          severity: 'info',
          message: 'Sessão iniciada pelo utilizador monitorizado: "pedro" no PC-QUARTO-FILHO',
          details: { user: 'pedro' }
        }
      ],
      pendingCommands: {
        'dev-win11-quarto': []
      }
    };

    this.save(initialDb);
    return initialDb;
  }

  private save(data?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Devices
  getDevices(): DeviceInfo[] {
    return this.data.devices;
  }

  getDevice(id: string): DeviceInfo | undefined {
    return this.data.devices.find((d) => d.id === id);
  }

  upsertDevice(device: Partial<DeviceInfo> & { id: string }): DeviceInfo {
    const idx = this.data.devices.findIndex((d) => d.id === device.id);
    if (idx >= 0) {
      this.data.devices[idx] = { ...this.data.devices[idx], ...device };
    } else {
      const newDev: DeviceInfo = {
        name: 'WINDOWS-PC',
        monitoredUser: 'filho',
        osVersion: 'Windows 10/11',
        ipAddress: '127.0.0.1',
        agentVersion: 'v1.0.0',
        pairedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true,
        currentActiveUser: '',
        currentForegroundApp: '',
        todayActiveMinutes: 0,
        todayUptimeMinutes: 0,
        isLocked: false,
        pendingRulesVersion: 1,
        appliedRulesVersion: 1,
        ...device,
        id: device.id
      };
      this.data.devices.push(newDev);

      if (!this.data.rules[newDev.id]) {
        this.data.rules[newDev.id] = {
          ...INITIAL_RULES,
          version: 1,
          updatedAt: new Date().toISOString()
        };
      }
    }
    this.save();
    return this.getDevice(device.id)!;
  }

  deleteDevice(id: string) {
    this.data.devices = this.data.devices.filter((d) => d.id !== id);
    delete this.data.rules[id];
    delete this.data.appUsage[id];
    delete this.data.pendingCommands[id];
    this.save();
  }

  // Rules
  getRules(deviceId: string): DeviceRules {
    if (!this.data.rules[deviceId]) {
      this.data.rules[deviceId] = {
        ...INITIAL_RULES,
        version: 1,
        updatedAt: new Date().toISOString()
      };
      this.save();
    }
    return this.data.rules[deviceId];
  }

  updateRules(deviceId: string, partial: Partial<DeviceRules>): DeviceRules {
    const current = this.getRules(deviceId);
    const updatedVersion = (current.version || 1) + 1;
    const updated: DeviceRules = {
      ...current,
      ...partial,
      version: updatedVersion,
      updatedAt: new Date().toISOString()
    };
    this.data.rules[deviceId] = updated;

    // Mark pending version on device
    const dev = this.getDevice(deviceId);
    if (dev) {
      dev.pendingRulesVersion = updatedVersion;
    }

    this.addEvent({
      deviceId,
      type: 'rule_updated',
      severity: 'info',
      message: `Novas regras atualizadas pelo administrador (Versão ${updatedVersion}). Agente irá aplicar no próximo ciclo.`,
      details: { version: updatedVersion }
    });

    this.save();
    return updated;
  }

  // Effective Blocked Domains Calculation
  getAllBlockedDomains(deviceId: string): string[] {
    const rules = this.getRules(deviceId);
    const domainSet = new Set<string>();

    // Add custom domains
    for (const d of rules.blockedDomains || []) {
      const clean = d.trim().toLowerCase();
      if (clean) domainSet.add(clean);
    }

    // Add category domains
    for (const [cat, enabled] of Object.entries(rules.blocklistCategories || {})) {
      if (enabled && PRESET_CATEGORY_DOMAINS[cat]) {
        for (const dom of PRESET_CATEGORY_DOMAINS[cat]) {
          domainSet.add(dom.toLowerCase());
        }
      }
    }

    return Array.from(domainSet).sort();
  }

  // Generate exact Hosts file content snippet
  generateHostsBlockSnippet(deviceId: string): string {
    const domains = this.getAllBlockedDomains(deviceId);
    const lines = [
      '# =========================================================',
      '# WinGuard Parental Control - Managed Hosts Blocklist',
      `# Device: ${deviceId}`,
      `# Updated: ${new Date().toISOString()}`,
      `# Total Domains Blocked: ${domains.length}`,
      '# Do not edit manually - automatically overwritten by WinGuard Agent',
      '# ========================================================='
    ];

    for (const d of domains) {
      lines.push(`127.0.0.1 ${d}`);
      lines.push(`::1 ${d}`);
      if (!d.startsWith('www.')) {
        lines.push(`127.0.0.1 www.${d}`);
        lines.push(`::1 www.${d}`);
      }
    }

    lines.push('# ===== END OF WINGUARD MANAGED BLOCKLIST =====');
    return lines.join('\r\n');
  }

  // App Usage
  getAppUsage(deviceId: string, dateKey = getTodayKey()): Record<string, AppUsageRecord> {
    if (!this.data.appUsage[deviceId]) {
      this.data.appUsage[deviceId] = {};
    }
    if (!this.data.appUsage[deviceId][dateKey]) {
      this.data.appUsage[deviceId][dateKey] = {};
    }
    return this.data.appUsage[deviceId][dateKey];
  }

  recordAppUsageDelta(deviceId: string, deltaList: Array<{ executableName: string; displayName?: string; minutes: number }>) {
    const today = getTodayKey();
    const usage = this.getAppUsage(deviceId, today);

    let totalDelta = 0;
    for (const item of deltaList) {
      const key = item.executableName.toLowerCase();
      if (!usage[key]) {
        usage[key] = {
          executableName: item.executableName,
          displayName: item.displayName || item.executableName,
          minutesUsedToday: 0,
          lastActive: new Date().toISOString()
        };
      }
      usage[key].minutesUsedToday += item.minutes;
      usage[key].lastActive = new Date().toISOString();
      totalDelta += item.minutes;
    }

    const dev = this.getDevice(deviceId);
    if (dev) {
      dev.todayActiveMinutes += totalDelta;
    }

    this.save();
  }

  // Events
  getEvents(deviceId?: string, limit = 50): ActivityEvent[] {
    let evts = this.data.events;
    if (deviceId) {
      evts = evts.filter((e) => e.deviceId === deviceId);
    }
    return [...evts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  addEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'> & { timestamp?: string }): ActivityEvent {
    const full: ActivityEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      ...event
    };
    this.data.events.unshift(full);
    if (this.data.events.length > 500) {
      this.data.events = this.data.events.slice(0, 500);
    }
    this.save();
    return full;
  }

  // Pending Commands (e.g. instant lock, bonus time, popup message)
  queueCommand(deviceId: string, command: 'lock_now' | 'bonus_time' | 'message_child' | 'unlock_now', payload?: any) {
    if (!this.data.pendingCommands[deviceId]) {
      this.data.pendingCommands[deviceId] = [];
    }
    const cmd = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      command,
      payload,
      createdAt: new Date().toISOString()
    };
    this.data.pendingCommands[deviceId].push(cmd);
    this.save();
    return cmd;
  }

  pullPendingCommands(deviceId: string) {
    if (!this.data.pendingCommands[deviceId]) {
      return [];
    }
    const cmds = [...this.data.pendingCommands[deviceId]];
    this.data.pendingCommands[deviceId] = [];
    this.save();
    return cmds;
  }
}

export const db = new Database();
