import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const dashboardRouter = Router();

// Get all devices
dashboardRouter.get('/devices', (_req: Request, res: Response) => {
  try {
    const devices = db.getDevices().map((dev) => {
      // Check if last seen is within 90 seconds
      const diffMs = Date.now() - new Date(dev.lastSeen).getTime();
      return {
        ...dev,
        isOnline: diffMs < 90000
      };
    });
    res.json({ devices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single device detail with rules, app usage, and events
dashboardRouter.get('/device/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const device = db.getDevice(id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const diffMs = Date.now() - new Date(device.lastSeen).getTime();
    const liveDevice = {
      ...device,
      isOnline: diffMs < 90000
    };

    const rules = db.getRules(id);
    const appUsage = db.getAppUsage(id);
    const blockedDomains = db.getAllBlockedDomains(id);
    const events = db.getEvents(id, 25);
    const hostsSnippet = db.generateHostsBlockSnippet(id);
    const installedApps = db.getInstalledApps(id);

    res.json({
      device: liveDevice,
      rules,
      appUsage: Object.values(appUsage),
      blockedDomains,
      hostsSnippet,
      events,
      installedApps
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Pair new device profile
dashboardRouter.post('/device', (req: Request, res: Response) => {
  try {
    const { name, monitoredUser, ipAddress } = req.body;
    if (!name || !monitoredUser) {
      return res.status(400).json({ error: 'Nome e utilizador do Windows são obrigatórios' });
    }

    const id = 'dev-' + Math.random().toString(36).substring(2, 9);
    const device = db.upsertDevice({
      id,
      name,
      monitoredUser: monitoredUser.toLowerCase().trim(),
      ipAddress: ipAddress || '192.168.1.X',
      osVersion: 'Windows 10/11',
      agentVersion: 'v1.4.2-lxc',
      isOnline: false,
      lastSeen: new Date().toISOString()
    });

    res.json({ success: true, device });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update device info
dashboardRouter.put('/device/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, monitoredUser } = req.body;
    const device = db.getDevice(id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (name) device.name = name;
    if (monitoredUser) device.monitoredUser = monitoredUser.toLowerCase().trim();

    db.upsertDevice(device);
    res.json({ success: true, device });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete device
dashboardRouter.delete('/device/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.deleteDevice(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update rules for device
dashboardRouter.put('/rules/:deviceId', (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const updated = db.updateRules(deviceId, req.body);
    res.json({ success: true, rules: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send remote action/command to child PC
dashboardRouter.post('/command/:deviceId', (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { command, payload } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const dev = db.getDevice(deviceId);
    if (!dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (command === 'bonus_time') {
      const minutes = Number(payload?.minutes || 30);
      const rules = db.getRules(deviceId);
      rules.bonusMinutesToday = (rules.bonusMinutesToday || 0) + minutes;
      db.updateRules(deviceId, { bonusMinutesToday: rules.bonusMinutesToday });

      db.addEvent({
        deviceId,
        type: 'bonus_granted',
        severity: 'info',
        message: `Bónus de tempo concedido: +${minutes} minutos adicionados para o utilizador "${dev.monitoredUser}".`,
        details: { minutes, totalBonus: rules.bonusMinutesToday }
      });
    } else if (command === 'lock_now') {
      dev.isLocked = true;
      dev.lockReason = payload?.reason || 'Bloqueio imediato acionado pelos pais.';
      db.addEvent({
        deviceId,
        type: 'pc_locked',
        severity: 'warning',
        message: `Comando de bloqueio imediato enviado para o computador ${dev.name}.`,
        details: payload
      });
    } else if (command === 'unlock_now') {
      dev.isLocked = false;
      dev.lockReason = undefined;
      db.addEvent({
        deviceId,
        type: 'remote_command',
        severity: 'info',
        message: `Computador ${dev.name} desbloqueado remotamente pelo administrador.`,
        details: payload
      });
    } else if (command === 'scan_apps') {
      db.addEvent({
        deviceId,
        type: 'remote_command',
        severity: 'info',
        message: `Solicitação de leitura e deteção de aplicações instaladas enviada para o computador ${dev.name}.`,
        details: payload
      });
    }

    const queued = db.queueCommand(deviceId, command, payload);
    res.json({ success: true, queued });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get system events
dashboardRouter.get('/events', (req: Request, res: Response) => {
  try {
    const deviceId = req.query.deviceId as string | undefined;
    const limit = Number(req.query.limit || 50);
    const events = db.getEvents(deviceId, limit);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hosts snippet preview
dashboardRouter.get('/hosts-preview/:deviceId', (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const snippet = db.generateHostsBlockSnippet(deviceId);
    const domains = db.getAllBlockedDomains(deviceId);
    res.json({ snippet, domains, count: domains.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
