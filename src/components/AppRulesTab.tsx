import React, { useState } from 'react';
import {
  Gamepad2,
  Plus,
  Trash2,
  Clock,
  Ban,
  CheckCircle,
  Save,
  CheckCircle2,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { DeviceInfo, DeviceRules, AppRule } from '../types';
import { api } from '../services/api';

interface AppRulesTabProps {
  device: DeviceInfo;
  rules: DeviceRules;
  onRefresh: () => void;
}

export const AppRulesTab: React.FC<AppRulesTabProps> = ({ device, rules, onRefresh }) => {
  const [appRules, setAppRules] = useState<AppRule[]>(rules.appRules || []);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New app form state
  const [newExe, setNewExe] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'games' | 'social' | 'browsers' | 'education' | 'other'>('games');
  const [newStatus, setNewStatus] = useState<'allowed' | 'limited' | 'blocked'>('limited');
  const [newLimit, setNewLimit] = useState(60);
  const [newStart, setNewStart] = useState('14:00');
  const [newEnd, setNewEnd] = useState('20:00');

  const handleAddRule = () => {
    if (!newExe.trim()) {
      alert('Por favor introduza o nome do executável (ex: robloxplayerbeta.exe)');
      return;
    }

    const cleanExe = newExe.trim().toLowerCase().endsWith('.exe')
      ? newExe.trim().toLowerCase()
      : `${newExe.trim().toLowerCase()}.exe`;

    const newRule: AppRule = {
      id: `app-${Date.now()}`,
      executableName: cleanExe,
      displayName: newName.trim() || cleanExe,
      category: newCategory,
      status: newStatus,
      dailyLimitMinutes: newStatus === 'limited' ? Number(newLimit) : 0,
      allowedStartTime: newStatus === 'limited' ? newStart : undefined,
      allowedEndTime: newStatus === 'limited' ? newEnd : undefined
    };

    setAppRules([...appRules, newRule]);
    setIsAdding(false);
    setNewExe('');
    setNewName('');
  };

  const handleRemoveRule = (id: string) => {
    setAppRules(appRules.filter((r) => r.id !== id));
  };

  const handleUpdateStatus = (id: string, status: 'allowed' | 'limited' | 'blocked') => {
    setAppRules(
      appRules.map((r) => (r.id === id ? { ...r, status, dailyLimitMinutes: status === 'limited' ? 60 : 0 } : r))
    );
  };

  const handleUpdateLimit = (id: string, dailyLimitMinutes: number) => {
    setAppRules(appRules.map((r) => (r.id === id ? { ...r, dailyLimitMinutes } : r)));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await api.updateRules(device.id, { appRules });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      onRefresh();
    } catch (err: any) {
      alert('Erro ao guardar regras de aplicações: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = appRules.filter((r) => {
    const matchCat = filterCategory === 'all' || r.category === filterCategory;
    const matchSearch =
      r.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.executableName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <span>Controlo e Limites por Aplicação</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Defina tempos máximos diários ou horários de jogo específicos para cada programa instalado no Windows 10/11.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Adicionar Aplicação</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              {saving ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'A Guardar...' : 'Guardar Regras'}</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Regras de aplicações gravadas no servidor! O agente Windows forçará o fecho automático de qualquer app bloqueada ou que exceda o limite.
            </span>
          </div>
        )}
      </div>

      {/* Add App Modal/Card */}
      {isAdding && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl animate-in fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Nova Regra de Aplicação</span>
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Nome do Executável (.exe):</label>
              <input
                type="text"
                placeholder="ex: robloxplayerbeta.exe ou fortnite.exe"
                value={newExe}
                onChange={(e) => setNewExe(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Nome Amigável / Descrição:</label>
              <input
                type="text"
                placeholder="ex: Roblox Player"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Categoria:</label>
              <select
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="games">Jogos (Gaming)</option>
                <option value="social">Redes Sociais & Chat</option>
                <option value="browsers">Navegadores de Internet</option>
                <option value="education">Educação / Escola</option>
                <option value="other">Outros</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Estado da Regra:</label>
              <select
                value={newStatus}
                onChange={(e: any) => setNewStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="limited">Limitada (com tempo diário máximo)</option>
                <option value="blocked">Totalmente Bloqueada (Fechar Imediatamente)</option>
                <option value="allowed">Permitida (Sem limite específico)</option>
              </select>
            </div>

            {newStatus === 'limited' && (
              <>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Limite Diário (Minutos):</label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    step={15}
                    value={newLimit}
                    onChange={(e) => setNewLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Hora Início:</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Hora Fim:</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleAddRule}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
            >
              Adicionar à Lista
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por app ou executável..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {['all', 'games', 'social', 'browsers', 'education'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all'
                ? 'Todas'
                : cat === 'games'
                ? 'Jogos'
                : cat === 'social'
                ? 'Social'
                : cat === 'browsers'
                ? 'Browsers'
                : 'Educação'}
            </button>
          ))}
        </div>
      </div>

      {/* App Rules List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Aplicação</th>
                <th className="py-3 px-4">Executável</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Limite Diário</th>
                <th className="py-3 px-4">Horário Permitido</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {rule.displayName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {rule.executableName}
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-300">
                    {rule.category}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={rule.status}
                      onChange={(e: any) => handleUpdateStatus(rule.id, e.target.value)}
                      className={`font-semibold rounded-lg px-2 py-1 border text-xs cursor-pointer ${
                        rule.status === 'blocked'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : rule.status === 'limited'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <option value="limited" className="bg-slate-900 text-slate-100">Limitada</option>
                      <option value="blocked" className="bg-slate-900 text-slate-100">Bloqueada</option>
                      <option value="allowed" className="bg-slate-900 text-slate-100">Permitida</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    {rule.status === 'limited' ? (
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min={5}
                          max={360}
                          step={15}
                          value={rule.dailyLimitMinutes}
                          onChange={(e) => handleUpdateLimit(rule.id, Number(e.target.value))}
                          className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none"
                        />
                        <span className="text-slate-400">min</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">
                        {rule.status === 'blocked' ? '0 min (Bloqueada)' : 'Sem limite'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    {rule.status === 'limited' && rule.allowedStartTime && rule.allowedEndTime
                      ? `${rule.allowedStartTime} - ${rule.allowedEndTime}`
                      : 'Qualquer hora'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Eliminar regra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
