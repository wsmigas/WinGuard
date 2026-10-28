import React, { useState } from 'react';
import {
  History,
  AlertTriangle,
  ShieldAlert,
  Clock,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Filter
} from 'lucide-react';
import { ActivityEvent } from '../types';

interface ActivityLogsTabProps {
  events: ActivityEvent[];
  onRefresh: () => void;
}

export const ActivityLogsTab: React.FC<ActivityLogsTabProps> = ({ events, onRefresh }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    if (filterType === 'security') return e.type === 'blocked_site_attempt' || e.type === 'app_killed';
    if (filterType === 'time') return e.type === 'pc_locked' || e.type === 'app_limit_reached' || e.type === 'bonus_granted';
    if (filterType === 'session') return e.type === 'user_login';
    return true;
  });

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'blocked_site_attempt':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'app_killed':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'pc_locked':
        return <Clock className="w-4 h-4 text-purple-400" />;
      case 'user_login':
        return <UserCheck className="w-4 h-4 text-cyan-400" />;
      case 'bonus_granted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getSeverityBadge = (severity: ActivityEvent['severity']) => {
    switch (severity) {
      case 'alert':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'info':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-400" />
              <span>Histórico de Atividade e Alertas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Registo em tempo real das tentativas de navegação, aplicações fechadas, limites e logins registados pelo agente Windows.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 w-fit">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({events.length})
        </button>
        <button
          onClick={() => setFilterType('security')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'security' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tentativas de Sites & Bloqueios
        </button>
        <button
          onClick={() => setFilterType('time')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'time' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Limites de Tempo & Ecrã
        </button>
        <button
          onClick={() => setFilterType('session')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'session' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Logins e Utilizadores
        </button>
      </div>

      {/* Events List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            Nenhum evento registado para o filtro selecionado.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="p-4 hover:bg-slate-800/30 transition flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 shrink-0 mt-0.5">
                  {getEventIcon(evt.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">
                      {evt.message}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${getSeverityBadge(
                        evt.severity
                      )}`}
                    >
                      {evt.severity}
                    </span>
                  </div>

                  {evt.details && (
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      {Object.entries(evt.details).map(([k, v]) => (
                        <span key={k} className="mr-3 inline-block">
                          <span className="text-slate-500">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 mt-1">
                    {new Date(evt.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
