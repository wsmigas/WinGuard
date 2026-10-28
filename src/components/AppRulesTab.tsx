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
  RefreshCw,
  Sparkles,
  Laptop,
  Check,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { DeviceInfo, DeviceRules, AppRule, InstalledApp } from '../types';
import { api } from '../services/api';

interface AppRulesTabProps {
  device: DeviceInfo;
  rules: DeviceRules;
  installedApps?: InstalledApp[];
  onRefresh: () => void;
}

export const AppRulesTab: React.FC<AppRulesTabProps> = ({
  device,
  rules,
  installedApps = [],
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'detected' | 'rules'>('detected');
  const [appRules, setAppRules] = useState<AppRule[]>(rules.appRules || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // New app form state
  const [newExe, setNewExe] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'games' | 'social' | 'browsers' | 'education' | 'other'>('games');
  const [newStatus, setNewStatus] = useState<'allowed' | 'limited' | 'blocked'>('limited');
  const [newLimit, setNewLimit] = useState(60);
  const [newStart, setNewStart] = useState('14:00');
  const [newEnd, setNewEnd] = useState('20:00');

  // Trigger remote app scan command on child's PC
  const handleScanApps = async () => {
    try {
      setScanning(true);
      await api.sendCommand(device.id, 'scan_apps');
      setScanMessage('Comando de leitura de aplicações enviado para o computador! A aguardar resposta do agente...');
      setTimeout(() => {
        onRefresh();
        setScanning(false);
      }, 3000);
      setTimeout(() => setScanMessage(null), 6000);
    } catch (err: any) {
      alert('Erro ao enviar pedido de pesquisa: ' + err.message);
      setScanning(false);
    }
  };

  // Add rule directly from a detected installed app
  const handleCreateRuleFromDetected = (app: InstalledApp, status: 'limited' | 'blocked' | 'allowed') => {
    const cleanExe = app.executableName.toLowerCase();
    const existingIdx = appRules.findIndex((r) => r.executableName.toLowerCase() === cleanExe);

    if (existingIdx >= 0) {
      // Update existing rule
      const updated = [...appRules];
      updated[existingIdx] = {
        ...updated[existingIdx],
        status,
        dailyLimitMinutes: status === 'limited' ? (updated[existingIdx].dailyLimitMinutes || 60) : 0
      };
      setAppRules(updated);
    } else {
      // Create new rule
      const newRule: AppRule = {
        id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        executableName: cleanExe,
        displayName: app.displayName || cleanExe,
        category: 'games',
        status,
        dailyLimitMinutes: status === 'limited' ? 60 : 0,
        allowedStartTime: '14:00',
        allowedEndTime: '20:00'
      };
      setAppRules([...appRules, newRule]);
    }
    setActiveSubTab('rules');
  };

  // Clean demo/example apps that were not detected on PC
  const handleRemoveUninstalledApps = () => {
    if (installedApps.length === 0) {
      if (!confirm('Ainda não foram detetadas aplicações pelo agente. Deseja mesmo limpar todas as regras de demonstração?')) {
        return;
      }
      setAppRules([]);
      return;
    }

    const detectedExes = new Set(installedApps.map((a) => a.executableName.toLowerCase()));
    const kept = appRules.filter((r) => detectedExes.has(r.executableName.toLowerCase()));
    setAppRules(kept);
    alert(`Regras limpas! Foram mantidas apenas as aplicações reais que foram detetadas no computador.`);
  };

  const handleAddManualRule = () => {
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

  // Filtered lists
  const filteredDetected = installedApps.filter((a) => {
    const q = searchQuery.toLowerCase();
    return a.displayName.toLowerCase().includes(q) || a.executableName.toLowerCase().includes(q);
  });

  const filteredRules = appRules.filter((r) => {
    const q = searchQuery.toLowerCase();
    return r.displayName.toLowerCase().includes(q) || r.executableName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <span>Controlo de Aplicações do Windows</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visualize as aplicações que estão realmente instaladas no computador{' '}
              <span className="font-semibold text-slate-200">{device.name}</span> e defina regras de tempo ou bloqueio.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleScanApps}
              disabled={scanning}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'A Pesquisar...' : 'Procurar Apps no PC Agora'}</span>
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

        {scanMessage && (
          <div className="mt-4 p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-xl flex items-center space-x-2 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{scanMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Regras atualizadas no servidor! O agente fechará automaticamente qualquer aplicação restrita no computador.
            </span>
          </div>
        )}
      </div>

      {/* Mode Tabs: Apps Detetadas Reais vs Regras Ativas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('detected')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'detected'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Aplicações Detetadas no Computador ({installedApps.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Regras & Limites Ativos ({appRules.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeSubTab === 'rules' && (
            <>
              <button
                onClick={handleRemoveUninstalledApps}
                title="Remove regras de demonstração de programas que não existem no computador"
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border border-slate-800 rounded-lg transition cursor-pointer"
              >
                Limpar Apps de Exemplo
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Executável</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou .exe..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* View 1: DETECTED INSTALLED APPS (Real Windows Applications) */}
      {activeSubTab === 'detected' && (
        <div className="space-y-4">
          {installedApps.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma aplicação detetada ainda neste computador</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                O agente WinGuard no Windows lê os programas instalados no Registo (<code className="text-indigo-300 font-mono">Uninstall</code>) e atalhos do Menu Iniciar. Assim que o agente arrancar ou o filho abrir programas, a lista aparecerá aqui automaticamente.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleScanApps}
                  disabled={scanning}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                  <span>Pedir Leitura ao Computador Agora</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  {filteredDetected.length} Programas e Jogos Encontrados no Windows
                </span>
                <span className="text-[11px] text-slate-500">
                  Clique em "Definir Limite" ou "Bloquear" para controlar
                </span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {filteredDetected.map((app) => {
                  const existingRule = appRules.find(
                    (r) => r.executableName.toLowerCase() === app.executableName.toLowerCase()
                  );

                  return (
                    <div
                      key={app.executableName}
                      className="p-4 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-indigo-400 font-mono">
                          {app.executableName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{app.displayName}</span>
                            {existingRule && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  existingRule.status === 'blocked'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : existingRule.status === 'limited'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {existingRule.status === 'blocked'
                                  ? 'Bloqueada'
                                  : existingRule.status === 'limited'
                                  ? `Limite: ${existingRule.dailyLimitMinutes}m`
                                  : 'Permitida'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5 text-[11px] font-mono text-slate-500">
                            <span>{app.executableName}</span>
                            {app.publisher && <span>&bull; {app.publisher}</span>}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {app.source === 'registry' ? 'Instalador Windows' : app.source === 'start_menu' ? 'Menu Iniciar' : 'Processo Ativo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleCreateRuleFromDetected(app, 'limited')}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Definir Limite</span>
                        </button>

                        <button
                          onClick={() => handleCreateRuleFromDetected(app, 'blocked')}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Bloquear</span>
                        </button>

                        <button
                          onClick={() => handleCreateRuleFromDetected(app, 'allowed')}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Livre</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: ACTIVE RULES LIST */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          {/* Add Manual App Rule Modal */}
          {isAdding && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl animate-in fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Adicionar Executável Manualmente</span>
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-xs text-slate-400 hover:text-white">
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Nome do Executável (.exe):</label>
                  <input
                    type="text"
                    placeholder="ex: fortnite.exe ou valorant.exe"
                    value={newExe}
                    onChange={(e) => setNewExe(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Nome da Aplicação:</label>
                  <input
                    type="text"
                    placeholder="ex: Fortnite"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="games">Jogos</option>
                    <option value="social">Redes Sociais & Chat</option>
                    <option value="browsers">Navegadores</option>
                    <option value="education">Educação</option>
                    <option value="other">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Estado:</label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="limited">Limitada (minutos máximos)</option>
                    <option value="blocked">Bloqueada Permanentemente</option>
                    <option value="allowed">Permitida (Sem limite)</option>
                  </select>
                </div>

                {newStatus === 'limited' && (
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Limite Diário (Minutos):</label>
                    <input
                      type="number"
                      min={5}
                      max={360}
                      step={15}
                      value={newLimit}
                      onChange={(e) => setNewLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleAddManualRule}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Adicionar à Lista
                </button>
              </div>
            </div>
          )}

          {/* Rules Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {filteredRules.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma regra ativa no momento. Vá ao separador "Aplicações Detetadas" para adicionar regras a partir dos programas reais instalados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Aplicação</th>
                      <th className="py-3 px-4">Executável</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Limite Diário</th>
                      <th className="py-3 px-4">Horário Permitido</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {rule.displayName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {rule.executableName}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};
