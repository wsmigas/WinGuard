import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  PlusCircle,
  Clock,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Globe,
  Radio,
  Gamepad2,
  Send,
  Sparkles
} from 'lucide-react';
import { DeviceInfo, DeviceRules, AppUsageRecord, ActivityEvent } from '../types';
import { api } from '../services/api';

interface OverviewTabProps {
  device: DeviceInfo;
  rules: DeviceRules;
  appUsage: AppUsageRecord[];
  events: ActivityEvent[];
  onRefresh: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  device,
  rules,
  appUsage,
  events,
  onRefresh
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [messagePrompt, setMessagePrompt] = useState(false);
  const [customMessage, setCustomMessage] = useState('O jantar está quase pronto, guarda o jogo!');
  const [feedback, setFeedback] = useState<string | null>(null);

  const isWeekend = [0, 6].includes(new Date().getDay());
  const dailyLimit = isWeekend
    ? rules.globalDailyLimitMinutesWeekend
    : rules.globalDailyLimitMinutesWeekday;
  const bonus = rules.bonusMinutesToday || 0;
  const totalAllowed = dailyLimit + bonus;

  const usedMinutes = device.todayActiveMinutes || 0;
  const remainingMinutes = Math.max(0, totalAllowed - usedMinutes);
  const percentage = Math.min(100, Math.round((usedMinutes / totalAllowed) * 100));

  const handleAction = async (command: 'lock_now' | 'bonus_time' | 'message_child' | 'unlock_now', payload?: any) => {
    try {
      setActionLoading(true);
      await api.sendCommand(device.id, command, payload);
      setFeedback('Comando enviado com sucesso!');
      setTimeout(() => setFeedback(null), 3500);
      onRefresh();
    } catch (err: any) {
      alert('Erro ao enviar comando: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const sortedApps = [...appUsage].sort((a, b) => b.minutesUsedToday - a.minutesUsedToday);

  // Helper format minutes to "1h 30m"
  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Lock Status Alert if locked */}
      {device.isLocked && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">Computador Bloqueado</h3>
              <p className="text-xs text-rose-200/80">
                {device.lockReason || 'Bloqueado por limite diário ou toque de recolher.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleAction('unlock_now')}
            disabled={actionLoading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer flex items-center space-x-1.5"
          >
            <Unlock className="w-4 h-4" />
            <span>Desbloquear Agora</span>
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Controlo Imediato do Computador ({device.name})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Utilizador Windows Alvo: <span className="font-mono text-indigo-300 font-semibold">{device.monitoredUser}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!device.isLocked ? (
              <button
                onClick={() => handleAction('lock_now')}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear PC Já</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction('unlock_now')}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Desbloquear PC</span>
              </button>
            )}

            <button
              onClick={() => handleAction('bonus_time', { minutes: 30 })}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>+30 min Bónus</span>
            </button>

            <button
              onClick={() => handleAction('bonus_time', { minutes: 60 })}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>+1 Hora Bónus</span>
            </button>

            <button
              onClick={() => setMessagePrompt(!messagePrompt)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Mensagem</span>
            </button>
          </div>
        </div>

        {/* Message prompt popup */}
        {messagePrompt && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Escreva uma mensagem para aparecer no ecrã do filho..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => {
                handleAction('message_child', { text: customMessage });
                setMessagePrompt(false);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Enviar ao Ecrã
            </button>
          </div>
        )}
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Screen Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tempo Ativo Hoje</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">{formatTime(usedMinutes)}</span>
            <span className="text-xs text-slate-400 font-medium">de {formatTime(totalAllowed)}</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentage >= 90
                    ? 'bg-rose-500'
                    : percentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-400 font-medium">
              <span>{percentage}% utilizado</span>
              <span className={remainingMinutes === 0 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                {remainingMinutes > 0 ? `${formatTime(remainingMinutes)} restantes` : 'Limite Atingido!'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: PC Uptime vs Active Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tempo Ligado (Uptime)</span>
            <Laptop className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {formatTime(device.todayUptimeMinutes || 0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">desde boot</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 line-clamp-2">
            O agente WinGuard diferencia o tempo que o PC está ligado do tempo de utilização real (ignora ecrã bloqueado e inatividade).
          </p>
        </div>

        {/* Card 3: Current Active Application */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Aplicação Atual</span>
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-base font-bold text-white truncate" title={device.currentForegroundApp || 'Nenhuma'}>
              {device.currentForegroundApp || 'Área de Trabalho'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate" title={device.currentWindowTitle || 'Nenhuma janela ativa'}>
            {device.currentWindowTitle || 'Sem janela focada'}
          </p>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Sessão: {device.currentActiveUser || 'Nenhum'}
          </div>
        </div>

        {/* Card 4: Web Filter Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Filtro Web (Hosts)</span>
            <Globe className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {rules.blockedDomains?.length || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">domínios bloqueados</span>
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Gravado no hosts do Windows</span>
          </div>
        </div>
      </div>

      {/* Main Grid: App Breakdown & Rules Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Top Apps Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Utilização por Aplicação Hoje</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registo exato contabilizado pelo agente Windows
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
              {sortedApps.length} aplicações registadas
            </span>
          </div>

          {sortedApps.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Ainda não foram registadas aplicações hoje. O agente irá sincronizar assim que o utilizador monitorizado abrir programas.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedApps.map((app) => {
                const appPercentage = Math.min(100, Math.round((app.minutesUsedToday / (totalAllowed || 1)) * 100));
                const rule = rules.appRules?.find(
                  (r) => r.executableName.toLowerCase() === app.executableName.toLowerCase()
                );

                return (
                  <div
                    key={app.executableName}
                    className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs text-slate-300 font-bold">
                          {app.executableName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {app.displayName || app.executableName}
                            </span>
                            {rule && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  rule.status === 'blocked'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : rule.status === 'limited'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {rule.status === 'blocked'
                                  ? 'Bloqueada'
                                  : rule.status === 'limited'
                                  ? `Limite: ${rule.dailyLimitMinutes}m`
                                  : 'Permitida'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {app.executableName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-white font-mono">
                          {formatTime(app.minutesUsedToday)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {appPercentage}% do tempo total
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${appPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Rules & Architecture info (1 col) */}
        <div className="space-y-6">
          {/* Rules Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Regras Ativas Hoje</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Limite Diário de Ecrã:</span>
                <span className="font-semibold text-white font-mono">
                  {formatTime(dailyLimit)} {bonus > 0 ? `(+${bonus}m bónus)` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Toque de Recolher (Curfew):</span>
                <span className="font-semibold text-white font-mono">
                  {rules.curfew?.enabled
                    ? `${rules.curfew.weekdayStartTime} às ${rules.curfew.weekdayEndTime}`
                    : 'Desativado'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Versão das Regras:</span>
                <span className="font-semibold text-slate-300">
                  v{rules.version} (Aplicada no PC: v{device.appliedRulesVersion || rules.version})
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Utilizador Monitorizado:</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {device.monitoredUser}
                </span>
              </div>
            </div>
          </div>

          {/* Offline Resilience Architecture Card */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Controlo Offline Garantido</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O agente Windows guarda todas as regras e o estado diário localmente em{' '}
              <code className="text-indigo-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">
                C:\ProgramData\WinGuard\local-config.json
              </code>
              . Se o computador for desligado da rede ou da internet, o limite de ecrã e o bloqueio de sites continuam a ser cumpridos rigorosamente.
            </p>
          </div>

          {/* Quick Recent Events list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Últimos Alertas</span>
            </h4>

            {events.slice(0, 3).map((evt) => (
              <div key={evt.id} className="py-2 border-b border-slate-800 last:border-0 text-xs">
                <div className="text-slate-300 font-medium">{evt.message}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
