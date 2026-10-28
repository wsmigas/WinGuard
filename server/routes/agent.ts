import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const agentRouter = Router();

// Register or re-pair an agent
agentRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { id, name, monitoredUser, osVersion, ipAddress, agentVersion } = req.body;
    if (!id || !monitoredUser) {
      return res.status(400).json({ error: 'Device id and monitoredUser are required' });
    }

    const device = db.upsertDevice({
      id,
      name: name || id,
      monitoredUser: monitoredUser.toLowerCase(),
      osVersion: osVersion || 'Windows 10/11',
      ipAddress: ipAddress || req.ip || '127.0.0.1',
      agentVersion: agentVersion || 'v1.4.2-lxc',
      isOnline: true,
      lastSeen: new Date().toISOString()
    });

    const rules = db.getRules(device.id);
    const hostsSnippet = db.generateHostsBlockSnippet(device.id);

    db.addEvent({
      deviceId: device.id,
      type: 'rule_updated',
      severity: 'info',
      message: `Agente registado com sucesso para o utilizador "${device.monitoredUser}" no computador ${device.name}.`,
      details: { osVersion, ipAddress }
    });

    res.json({
      success: true,
      deviceId: device.id,
      monitoredUser: device.monitoredUser,
      rules,
      hostsSnippet,
      rulesVersion: rules.version
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Periodic Heartbeat from Windows Agent (every 30s-60s)
agentRouter.post('/heartbeat', (req: Request, res: Response) => {
  try {
    const {
      deviceId,
      activeUser,
      foregroundApp,
      windowTitle,
      uptimeMinutes,
      activeMinutes,
      isLocked,
      lockReason,
      appliedRulesVersion
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const device = db.getDevice(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not registered' });
    }

    const prevUser = device.currentActiveUser;
    const cleanUser = (activeUser || '').toLowerCase();

    // Update live device state
    device.isOnline = true;
    device.lastSeen = new Date().toISOString();
    device.currentActiveUser = cleanUser;
    device.currentForegroundApp = foregroundApp || '';
    device.currentWindowTitle = windowTitle || '';
    if (typeof uptimeMinutes === 'number') device.todayUptimeMinutes = uptimeMinutes;
    if (typeof activeMinutes === 'number') device.todayActiveMinutes = activeMinutes;
    if (typeof isLocked === 'boolean') device.isLocked = isLocked;
    if (lockReason) device.lockReason = lockReason;
    if (typeof appliedRulesVersion === 'number') device.appliedRulesVersion = appliedRulesVersion;

    // Log if child logged in or logged out
    if (prevUser !== cleanUser && cleanUser) {
      const isMonitored = cleanUser === device.monitoredUser.toLowerCase();
      db.addEvent({
        deviceId: device.id,
        type: 'user_login',
        severity: isMonitored ? 'info' : 'warning',
        message: isMonitored
          ? `Sessão ativa detetada: Utilizador monitorizado "${cleanUser}" está a usar o computador.`
          : `Sessão não monitorizada: "${cleanUser}" (regras de controlo parental não aplicadas a contas de outros utilizadores/administradores).`,
        details: { user: cleanUser, isMonitored }
      });
    }

    // Pull any pending remote commands (e.g. lock now, bonus time)
    const pendingCommands = db.pullPendingCommands(deviceId);

    const rules = db.getRules(deviceId);
    const hasNewRules = (device.pendingRulesVersion || rules.version) > (device.appliedRulesVersion || 0);

    res.json({
      success: true,
      serverTime: new Date().toISOString(),
      hasNewRules,
      rulesVersion: rules.version,
      bonusMinutesToday: rules.bonusMinutesToday || 0,
      commands: pendingCommands
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync telemetry / app usage deltas from agent
agentRouter.post('/telemetry', (req: Request, res: Response) => {
  try {
    const { deviceId, appDeltas } = req.body;
    if (!deviceId || !Array.isArray(appDeltas)) {
      return res.status(400).json({ error: 'Invalid telemetry payload' });
    }

    db.recordAppUsageDelta(deviceId, appDeltas);

    res.json({ success: true, recordedCount: appDeltas.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full Rules & Config pull by the agent (when hasNewRules is true or at boot)
agentRouter.get('/config/:deviceId', (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = db.getDevice(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const rules = db.getRules(deviceId);
    const blockedDomains = db.getAllBlockedDomains(deviceId);
    const hostsSnippet = db.generateHostsBlockSnippet(deviceId);

    res.json({
      success: true,
      deviceId,
      monitoredUser: device.monitoredUser,
      rules,
      blockedDomains,
      hostsSnippet,
      rulesVersion: rules.version,
      updatedAt: rules.updatedAt
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Agent Acknowledges rules applied locally
agentRouter.post('/ack-rules', (req: Request, res: Response) => {
  try {
    const { deviceId, version } = req.body;
    const device = db.getDevice(deviceId);
    if (device && typeof version === 'number') {
      device.appliedRulesVersion = version;
      device.pendingRulesVersion = Math.max(device.pendingRulesVersion || 0, version);
      db.addEvent({
        deviceId,
        type: 'rule_updated',
        severity: 'info',
        message: `O computador confirmou a aplicação local da versão ${version} das regras (incluindo atualização do ficheiro hosts).`,
        details: { version }
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Agent logs an activity event (e.g. killed app, blocked website hit, quota exceeded)
agentRouter.post('/event', (req: Request, res: Response) => {
  try {
    const { deviceId, type, severity, message, details } = req.body;
    if (!deviceId || !message) {
      return res.status(400).json({ error: 'Missing deviceId or message' });
    }

    const evt = db.addEvent({
      deviceId,
      type: type || 'app_limit_reached',
      severity: severity || 'warning',
      message,
      details
    });

    res.json({ success: true, eventId: evt.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
