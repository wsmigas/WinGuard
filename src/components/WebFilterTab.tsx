import React, { useState, useEffect } from 'react';
import {
  Globe,
  Shield,
  Plus,
  Trash2,
  Copy,
  Download,
  Save,
  CheckCircle2,
  Check,
  AlertCircle,
  FileCode,
  Flame,
  Radio
} from 'lucide-react';
import { DeviceInfo, DeviceRules } from '../types';
import { api } from '../services/api';

interface WebFilterTabProps {
  device: DeviceInfo;
  rules: DeviceRules;
  onRefresh: () => void;
}

export const WebFilterTab: React.FC<WebFilterTabProps> = ({ device, rules, onRefresh }) => {
  const [categories, setCategories] = useState(
    rules.blocklistCategories || {
      adult: true,
      social: false,
      gaming: false,
      gambling: true
    }
  );
  const [customDomains, setCustomDomains] = useState<string[]>(rules.blockedDomains || []);
  const [newDomain, setNewDomain] = useState('');
  const [hostsPreview, setHostsPreview] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch live hosts preview from server
  const loadHostsPreview = async () => {
    try {
      const res = await api.getHostsPreview(device.id);
      setHostsPreview(res.snippet);
      setTotalCount(res.count);
    } catch (err) {
      console.error('Failed to load hosts preview:', err);
    }
  };

  useEffect(() => {
    loadHostsPreview();
  }, [device.id, rules.version]);

  const handleToggleCategory = (key: keyof typeof categories) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddDomain = () => {
    let clean = newDomain.trim().toLowerCase();
    if (!clean) return;

    // Remove protocol and paths if pasted
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    if (!customDomains.includes(clean)) {
      setCustomDomains([...customDomains, clean]);
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (dom: string) => {
    setCustomDomains(customDomains.filter((d) => d !== dom));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateRules(device.id, {
        blocklistCategories: categories,
        blockedDomains: customDomains
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      onRefresh();
      loadHostsPreview();
    } catch (err: any) {
      alert('Erro ao guardar lista de bloqueio: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyHosts = () => {
    navigator.clipboard.writeText(hostsPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span>Bloqueio de Sites & Ficheiro Hosts do Windows</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Bloqueie websites diretamente no ficheiro{' '}
              <code className="text-indigo-300 font-mono bg-slate-950 px-1 py-0.5 rounded text-[11px]">
                C:\Windows\System32\drivers\etc\hosts
              </code>
              . Esta proteção é inviolável mesmo se o filho alterar o DNS no Windows ou no router.
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
            <span>{saving ? 'A Sincronizar...' : 'Gravar e Atualizar Hosts'}</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Configuração gravada no servidor! O agente Windows atualizará o ficheiro hosts e executará{' '}
              <code className="font-mono bg-emerald-950/80 px-1 py-0.5 rounded">ipconfig /flushdns</code> automaticamente no computador.
            </span>
          </div>
        )}
      </div>

      {/* Category Toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Categorias de Bloqueio Recomendadas</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Adult */}
          <div
            onClick={() => handleToggleCategory('adult')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              categories.adult
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">🔞 Adulto & Impróprio</span>
              <input
                type="checkbox"
                checked={categories.adult}
                onChange={() => {}}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Pornhub, Xvideos, Onlyfans, Omegle e sites para maiores.
            </p>
          </div>

          {/* Gambling */}
          <div
            onClick={() => handleToggleCategory('gambling')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              categories.gambling
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">🎰 Apostas & Jogos de Azar</span>
              <input
                type="checkbox"
                checked={categories.gambling}
                onChange={() => {}}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Betclic, Betano, Stake, Pokerstars, CSGO skins, cassinos online.
            </p>
          </div>

          {/* Social */}
          <div
            onClick={() => handleToggleCategory('social')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              categories.social
                ? 'bg-indigo-500/10 border-indigo-500/30'
                : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">📱 Redes Sociais</span>
              <input
                type="checkbox"
                checked={categories.social}
                onChange={() => {}}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              TikTok, Instagram, Twitter/X, Snapchat, Reddit, Twitch.
            </p>
          </div>

          {/* Gaming Sites */}
          <div
            onClick={() => handleToggleCategory('gaming')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              categories.gaming
                ? 'bg-purple-500/10 border-purple-500/30'
                : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300">🎮 Plataformas de Jogos</span>
              <input
                type="checkbox"
                checked={categories.gaming}
                onChange={() => {}}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Roblox.com, Steam Store, EpicGames, Minecraft, Battle.net.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Domains Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Domínios Personalizados a Bloquear</span>
        </h3>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Introduza um domínio (ex: tiktok.com, shein.com, youtube.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddDomain();
            }}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleAddDomain}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            Adicionar
          </button>
        </div>

        {customDomains.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum domínio personalizado adicionado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {customDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200 font-mono"
              >
                <span>{domain}</span>
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Generated Hosts File Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Conteúdo Gravado no Ficheiro Hosts do Windows
            </h3>
            <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
              {totalCount} Domínios Filtrados
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyHosts}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <a
              href={`/api/download/hosts-snippet/${device.id}`}
              download
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descarregar .txt</span>
            </a>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto leading-relaxed shadow-inner">
          <pre>{hostsPreview || '# A carregar lista de hosts gerada...'}</pre>
        </div>

        {/* Security explanation */}
        <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">
              Porque é que este bloqueio via Hosts é infalível contra mudança de DNS?
            </span>
            <p className="leading-relaxed">
              No sistema operativo Windows, o ficheiro hosts é processado a nível de kernel ANTES de qualquer pedido de rede ou consulta DNS externa. Mesmo que o filho altere os servidores DNS para 1.1.1.1 (Cloudflare) ou 8.8.8.8 (Google), utilize navegadores com DoH (DNS-over-HTTPS) ou tente usar navegadores portáteis, o Windows resolve o domínio de imediato para <code className="text-indigo-300 font-mono">127.0.0.1</code> e recusa a ligação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
