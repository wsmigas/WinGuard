import React, { useState } from 'react';
import { Clock, Moon, Shield, Save, CheckCircle2, Info, Calendar } from 'lucide-react';
import { DeviceInfo, DeviceRules } from '../types';
import { api } from '../services/api';

interface TimeRulesTabProps {
  device: DeviceInfo;
  rules: DeviceRules;
  onRefresh: () => void;
}

export const TimeRulesTab: React.FC<TimeRulesTabProps> = ({ device, rules, onRefresh }) => {
  const [weekdayLimit, setWeekdayLimit] = useState(rules.globalDailyLimitMinutesWeekday || 120);
  const [weekendLimit, setWeekendLimit] = useState(rules.globalDailyLimitMinutesWeekend || 240);
  const [curfewEnabled, setCurfewEnabled] = useState(rules.curfew?.enabled ?? true);
  const [weekdayStart, setWeekdayStart] = useState(rules.curfew?.weekdayStartTime || '21:30');
  const [weekdayEnd, setWeekdayEnd] = useState(rules.curfew?.weekdayEndTime || '07:30');
  const [weekendStart, setWeekendStart] = useState(rules.curfew?.weekendStartTime || '23:00');
  const [weekendEnd, setWeekendEnd] = useState(rules.curfew?.weekendEndTime || '08:30');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateRules(device.id, {
        globalDailyLimitMinutesWeekday: Number(weekdayLimit),
        globalDailyLimitMinutesWeekend: Number(weekendLimit),
        curfew: {
          enabled: curfewEnabled,
          weekdayStartTime: weekdayStart,
          weekdayEndTime: weekdayEnd,
          weekendStartTime: weekendStart,
          weekendEndTime: weekendEnd
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      onRefresh();
    } catch (err: any) {
      alert('Erro ao guardar regras: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h 00m`;
    return `${h}h ${min}m`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Limites de Tempo e Toque de Recolher</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Defina os tempos máximos diários de utilização e horários de descanso para o utilizador{' '}
              <span className="font-mono text-indigo-300 font-semibold">{device.monitoredUser}</span> no computador{' '}
              <span className="font-semibold text-slate-200">{device.name}</span>.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            {saving ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'A Guardar...' : 'Guardar e Sincronizar Regras'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Regras atualizadas com sucesso no servidor! O computador cliente receberá e gravará estas novas regras no seu cache local.
            </span>
          </div>
        )}
      </div>

      {/* Daily Limits Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Tempo Máximo Diário de Computador</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekdays */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Dias de Semana (Segunda a Sexta)</span>
              <span className="text-base font-extrabold text-cyan-400 font-mono bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                {formatMinutes(weekdayLimit)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tempo recomendado para conciliar estudo com momentos de lazer.
            </p>
            <input
              type="range"
              min={30}
              max={480}
              step={15}
              value={weekdayLimit}
              onChange={(e) => setWeekdayLimit(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30m</span>
              <span>2h (120m)</span>
              <span>4h (240m)</span>
              <span>8h</span>
            </div>
          </div>

          {/* Weekends */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Fins de Semana (Sábado e Domingo)</span>
              <span className="text-base font-extrabold text-indigo-400 font-mono bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-800/50">
                {formatMinutes(weekendLimit)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Limite diário mais flexível para o fim de semana.
            </p>
            <input
              type="range"
              min={30}
              max={600}
              step={30}
              value={weekendLimit}
              onChange={(e) => setWeekendLimit(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30m</span>
              <span>3h</span>
              <span>5h</span>
              <span>10h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curfew / Bedtime Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Moon className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Toque de Recolher (Horário de Dormir / Noite)</h3>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={curfewEnabled}
              onChange={(e) => setCurfewEnabled(e.target.checked)}
              className="w-4 h-4 accent-purple-500 rounded"
            />
            <span className="text-xs font-semibold text-slate-300">Ativar Toque de Recolher</span>
          </label>
        </div>

        {curfewEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            {/* Weekdays Curfew */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-200">Dias de Escola (Segunda a Sexta)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bloquear a partir das:</label>
                  <input
                    type="time"
                    value={weekdayStart}
                    onChange={(e) => setWeekdayStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Permitir após as:</label>
                  <input
                    type="time"
                    value={weekdayEnd}
                    onChange={(e) => setWeekdayEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Durante este intervalo, a sessão do Windows do filho é bloqueada automaticamente.
              </p>
            </div>

            {/* Weekend Curfew */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-200">Fim de Semana (Sexta e Sábado à Noite)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bloquear a partir das:</label>
                  <input
                    type="time"
                    value={weekendStart}
                    onChange={(e) => setWeekendStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Permitir após as:</label>
                  <input
                    type="time"
                    value={weekendEnd}
                    onChange={(e) => setWeekendEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Permite um horário mais relaxado na véspera de folga.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Explanation of Offline Enforcement */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-white">Como é garantido o cumprimento mesmo offline?</h4>
          <p className="text-slate-400 leading-relaxed">
            Mesmo que o computador do filho não tenha acesso temporário ao servidor Proxmox ou à internet (por exemplo, se o cabo de rede for desligado), o agente residente no Windows mantém o relógio de contagem ativo em memória e grava o estado no disco local a cada 5 segundos. Assim que o tempo total atinge o limite configurado, o agente executa a chamada nativa do Windows{' '}
            <code className="text-indigo-300 font-mono bg-slate-950 px-1 py-0.5 rounded">LockWorkStation</code>{' '}
            e impede novas tentativas de login na conta do filho.
          </p>
        </div>
      </div>
    </div>
  );
};
