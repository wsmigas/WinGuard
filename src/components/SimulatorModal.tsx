import React, { useState } from 'react';
import {
  Activity,
  X,
  Play,
  Clock,
  ShieldAlert,
  User,
  Gamepad2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { DeviceInfo } from '../types';
import { api } from '../services/api';

interface SimulatorModalProps {
  device: DeviceInfo;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  device,
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [activeUser, setActiveUser] = useState(device.monitoredUser || 'pedro');
  const [app, setApp] = useState('robloxplayerbeta.exe');
  const [windowTitle, setWindowTitle] = useState('Roblox - Blox Fruits');
  const [simActiveMin, setSimActiveMin] = useState(device.todayActiveMinutes || 75);
  const [simUptimeMin, setSimUptimeMin] = useState(device.todayUptimeMinutes || 140);
  const [logs, setLogs] = useState<string[]>([
    `[Simulator] Agente iniciado para computador "${device.name}"`,
    `[Simulator] Conectado à API do WinGuard LXC Server`,
    `[Simulator] Ficheiro hosts sincronizado localmente`
  ]);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const appendLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 30)]);
  };

  const handleSendHeartbeat = async (overrideMinutes?: number, overrideApp?: string) => {
    try {
      setBusy(true);
      const minutesToUse = overrideMinutes ?? simActiveMin;
      const appToUse = overrideApp ?? app;

      appendLog(`A enviar Heartbeat... Utilizador: ${activeUser} | App: ${appToUse}`);
      const res = await api.simulateHeartbeat({
        deviceId: device.id,
        activeUser,
        foregroundApp: appToUse,
        windowTitle,
        uptimeMinutes: simUptimeMin,
        activeMinutes: minutesToUse,
        isLocked: false
      });

      if (res.hasNewRules) {
        appendLog(`Novas regras detetadas no servidor (v${res.rulesVersion})! Agente atualizou local-config.json e ficheiro hosts.`);
      }

      if (res.commands && res.commands.length > 0) {
        for (const cmd of res.commands) {
          appendLog(`Comando remoto recebido do pai: ${cmd.command}`);
        }
      }

      // Also send delta if child
      if (activeUser.toLowerCase() === device.monitoredUser.toLowerCase()) {
        await api.simulateTelemetry(device.id, [
          {
            executableName: appToUse,
            displayName: appToUse.replace('.exe', ''),
            minutes: 5
          }
        ]);
      }

      onRefreshData();
    } catch (err: any) {
      appendLog(`Erro no heartbeat: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleAddMinutes = async (mins: number) => {
    const nextVal = simActiveMin + mins;
    setSimActiveMin(nextVal);
    setSimUptimeMin(simUptimeMin + mins);
    appendLog(`Tempo avançado em +${mins} minutos (Total hoje: ${nextVal}m)`);
    await handleSendHeartbeat(nextVal);
  };

  const handleSimulateBlockedSite = async (domain: string) => {
    try {
      setBusy(true);
      appendLog(`Tentativa de acesso ao site bloqueado: ${domain}`);
      appendLog(`[Hosts File] ${domain} resolvido para 127.0.0.1. Ligação recusada com sucesso!`);
      await api.simulateEvent(
        device.id,
        'blocked_site_attempt',
        'warning',
        `Tentativa de acesso ao site bloqueado: ${domain} (Redirecionado para 127.0.0.1 pelo ficheiro hosts)`,
        { domain, browser: 'chrome.exe', user: activeUser }
      );
      onRefreshData();
    } catch (err: any) {
      appendLog(`Erro ao registar evento: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSimulateKillApp = async (appName: string) => {
    try {
      setBusy(true);
      appendLog(`[Process Watcher] A terminar processo proibido: ${appName} (Stop-Process -Force)`);
      await api.simulateEvent(
        device.id,
        'app_killed',
        'warning',
        `Aplicação fechada automaticamente pelo WinGuard: ${appName} (Limite diário ou horário excedido)`,
        { app: appName, user: activeUser }
      );
      onRefreshData();
    } catch (err: any) {
      appendLog(`Erro ao matar app: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulador do Agente Windows</h3>
              <p className="text-xs text-slate-400">
                Teste e valide o envio de dados do computador cliente {device.name} para o servidor LXC.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Session & App Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* User Switcher */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Utilizador Ativo na Sessão do Windows</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveUser(device.monitoredUser)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    activeUser.toLowerCase() === device.monitoredUser.toLowerCase()
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {device.monitoredUser} (Filho - Monitorizado)
                </button>
                <button
                  onClick={() => setActiveUser('Administrador')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    activeUser.toLowerCase() !== device.monitoredUser.toLowerCase()
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Administrador (Pai - Livre)
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeUser.toLowerCase() === device.monitoredUser.toLowerCase()
                  ? 'O agente contabiliza o tempo e aplica limites estritos.'
                  : 'Sessão administrativa detetada: o agente não bloqueia nem restringe.'}
              </p>
            </div>

            {/* App Picker */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                <Gamepad2 className="w-4 h-4 text-indigo-400" />
                <span>Aplicação Ativa em Primeiro Plano</span>
              </div>
              <select
                value={app}
                onChange={(e) => {
                  setApp(e.target.value);
                  if (e.target.value.includes('roblox')) setWindowTitle('Roblox - Blox Fruits');
                  else if (e.target.value.includes('discord')) setWindowTitle('Discord - Amigos');
                  else if (e.target.value.includes('chrome')) setWindowTitle('Google Chrome - YouTube');
                  else setWindowTitle('Microsoft Word - Trabalho de História');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="robloxplayerbeta.exe">Roblox (robloxplayerbeta.exe)</option>
                <option value="discord.exe">Discord (discord.exe)</option>
                <option value="chrome.exe">Google Chrome (chrome.exe)</option>
                <option value="javaw.exe">Minecraft Java (javaw.exe)</option>
                <option value="winword.exe">Microsoft Word - Estudo (winword.exe)</option>
              </select>
              <input
                type="text"
                value={windowTitle}
                onChange={(e) => setWindowTitle(e.target.value)}
                placeholder="Título da janela..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Quick Simulation Action Triggers */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-slate-200 block">Ações de Teste Rápido:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendHeartbeat()}
                disabled={busy}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                <span>Enviar Heartbeat Agora</span>
              </button>

              <button
                onClick={() => handleAddMinutes(15)}
                disabled={busy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                +15 Minutos de Uso
              </button>

              <button
                onClick={() => handleAddMinutes(45)}
                disabled={busy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                +45 Minutos de Uso
              </button>

              <button
                onClick={() => handleSimulateBlockedSite('tiktok.com')}
                disabled={busy}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simular Acesso a tiktok.com</span>
              </button>

              <button
                onClick={() => handleSimulateKillApp(app)}
                disabled={busy}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simular Fecho Forçado de App</span>
              </button>
            </div>
          </div>

          {/* Real-time Simulator Terminal Logs */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Terminal do Agente Windows (Simulado):</span>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 h-40 overflow-y-auto space-y-1 shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-400 leading-snug">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Fechar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
