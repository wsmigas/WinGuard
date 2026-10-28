export interface AppRule {
  id: string;
  executableName: string;
  displayName: string;
  category: 'games' | 'social' | 'browsers' | 'education' | 'other';
  status: 'allowed' | 'limited' | 'blocked';
  dailyLimitMinutes: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
}

export interface CurfewRule {
  enabled: boolean;
  weekdayStartTime: string;
  weekdayEndTime: string;
  weekendStartTime: string;
  weekendEndTime: string;
}

export interface DeviceRules {
  version: number;
  updatedAt: string;
  globalDailyLimitMinutesWeekday: number;
  globalDailyLimitMinutesWeekend: number;
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
  name: string;
  monitoredUser: string;
  osVersion: string;
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

export interface ActivityEvent {
  id: string;
  deviceId: string;
  timestamp: string;
  type: 'blocked_site_attempt' | 'app_limit_reached' | 'app_killed' | 'pc_locked' | 'rule_updated' | 'user_login' | 'bonus_granted' | 'remote_command';
  severity: 'info' | 'warning' | 'alert';
  message: string;
  details?: Record<string, any>;
}

export type TabType = 'overview' | 'time_rules' | 'apps' | 'web_filter' | 'agent_setup' | 'proxmox' | 'logs';
