export interface AppRule {
  id: string;
  executableName: string; // e.g. "robloxplayerbeta.exe", "chrome.exe", "discord.exe"
  displayName: string;
  category: 'games' | 'social' | 'browsers' | 'education' | 'other';
  status: 'allowed' | 'limited' | 'blocked';
  dailyLimitMinutes: number; // 0 if blocked, or allowed minutes
  allowedStartTime?: string; // e.g. "08:00"
  allowedEndTime?: string; // e.g. "20:00"
}

export interface CurfewRule {
  enabled: boolean;
  weekdayStartTime: string; // "21:30"
  weekdayEndTime: string;   // "07:30"
  weekendStartTime: string; // "23:00"
  weekendEndTime: string;   // "08:30"
}

export interface DeviceRules {
  version: number;
  updatedAt: string;
  globalDailyLimitMinutesWeekday: number; // e.g. 120 (2h)
  globalDailyLimitMinutesWeekend: number; // e.g. 240 (4h)
  bonusMinutesToday: number;
  curfew: CurfewRule;
  appRules: AppRule[];
  blockedDomains: string[];
  blocklistCategories: {
    adult: boolean;
    social: boolean;
    gaming: boolean;
    gambling: boolean;
  };
  customHostsHeader: string;
}

export interface DeviceInfo {
  id: string;
  name: string; // e.g. "PC-QUARTO-FILHO"
  monitoredUser: string; // e.g. "pedro" or "filho"
  osVersion: string; // "Windows 11 Pro 23H2"
  ipAddress: string;
  agentVersion: string;
  pairedAt: string;
  lastSeen: string;
  isOnline: boolean;
  currentActiveUser: string;
  currentForegroundApp: string;
  currentWindowTitle?: string;
  todayActiveMinutes: number;
  todayUptimeMinutes: number;
  isLocked: boolean;
  lockReason?: string;
  pendingRulesVersion: number;
  appliedRulesVersion: number;
}

export interface AppUsageRecord {
  executableName: string;
  displayName: string;
  minutesUsedToday: number;
  lastActive: string;
}

export interface InstalledApp {
  displayName: string;
  executableName: string;
  publisher?: string;
  installLocation?: string;
  detectedAt: string;
  source: 'registry' | 'process_tracker' | 'start_menu';
}

export interface ActivityEvent {
  id: string;
  deviceId: string;
  timestamp: string;
  type: 'blocked_site_attempt' | 'app_limit_reached' | 'app_killed' | 'pc_locked' | 'rule_updated' | 'user_login' | 'bonus_granted' | 'remote_command' | 'apps_scanned';
  severity: 'info' | 'warning' | 'alert';
  message: string;
  details?: Record<string, any>;
}

export interface DatabaseSchema {
  devices: DeviceInfo[];
  rules: Record<string, DeviceRules>; // deviceId -> DeviceRules
  appUsage: Record<string, Record<string, Record<string, AppUsageRecord>>>; // deviceId -> dateKey (YYYY-MM-DD) -> exe -> AppUsageRecord
  installedApps: Record<string, InstalledApp[]>; // deviceId -> InstalledApp[]
  events: ActivityEvent[];
  pendingCommands: Record<string, Array<{ id: string; command: 'lock_now' | 'bonus_time' | 'message_child' | 'unlock_now' | 'scan_apps'; payload?: any; createdAt: string }>>;
}
