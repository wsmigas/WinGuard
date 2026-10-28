import React, { useState } from 'react';
import {
  Download,
  Terminal,
  ShieldCheck,
  Check,
  Copy,
  Server,
  Laptop,
  UserCheck,
  AlertTriangle,
  FolderLock
} from 'lucide-react';
import { DeviceInfo } from '../types';

interface AgentSetupTabProps {
  device: DeviceInfo;
}

export const AgentSetupTab: React.FC<AgentSetupTabProps> = ({ device }) => {
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://192.168.1.150:3000';
  const [serverUrl, setServerUrl] = useState(currentHost);
  const [targetUser, setTargetUser] = useState(device.monitoredUser || 'pedro');
  const [deviceId, setDeviceId] = useState(device.id);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const downloadBatUrl = `/api/download/install.bat?serverUrl=${encodeURIComponent(
    serverUrl
  )}&deviceId=${encodeURIComponent(deviceId)}&monitoredUser=${encodeURIComponent(targetUser)}`;

  const downloadPs1Url = `/api/download/agent.ps1?serverUrl=${encodeURIComponent(
    serverUrl
  )}&deviceId=${encodeURIComponent(deviceId)}&monitoredUser=${encodeURIComponent(targetUser)}`;

  const quickPowerShellCommand = `powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${serverUrl}${downloadBatUrl}' -OutFile 'install.bat'; Start-Process 'install.bat' -Verb RunAs"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(quickPowerShellCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Download className="w-5 h-5 text-indigo-400" />
          <span>Instalação do Agente no Windows 10/11</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Gere e descarregue o agente pré-configurado para instalar no computador do filho. O agente necessita de acesso de administrador para gerir o ficheiro hosts, mas monitoriza estritamente apenas a conta do filho indicada.
        </p>
      </div>

      {/* Generator Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Configuração do Instalador do Cliente</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Endereço IP / URL do Servidor Proxmox:</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="ex: http://192.168.1.150:3000"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              IP local do container LXC acessível pelo Windows.
            </span>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Login do Windows a Monitorizar (Filho):</label>
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="ex: pedro ou filho"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Apenas este utilizador terá limites e bloqueios.
            </span>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Identificador do Computador (ID):</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="dev-win11-quarto"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Identificador único para guardar as regras.
            </span>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-slate-800">
          <a
            href={downloadBatUrl}
            download="install-winguard.bat"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descarregar Instalador (install-winguard.bat)</span>
          </a>

          <a
            href={downloadPs1Url}
            download="WinGuard-Agent.ps1"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Descarregar Script PowerShell (WinGuard-Agent.ps1)</span>
          </a>
        </div>
      </div>

      {/* One-Liner PowerShell Command */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Instalação Rápida via PowerShell (No Computador Windows)</span>
          </h3>
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd ? 'Copiado!' : 'Copiar Comando'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Abra o PowerShell como <strong>Administrador</strong> no Windows 10/11 e cole o comando abaixo:
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-emerald-400 break-all select-all shadow-inner">
          {quickPowerShellCommand}
        </div>
      </div>

      {/* Step by Step Guide with Screenshots/Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="text-sm font-bold text-white">Identificar o Login do Filho</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            No computador do filho, abra a linha de comandos ou veja em Definições &gt; Contas. Pode executar{' '}
            <code className="text-indigo-300 font-mono bg-slate-950 px-1 py-0.5 rounded text-[11px]">whoami</code>{' '}
            para confirmar o nome exato da conta.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h4 className="text-sm font-bold text-white">Executar como Administrador</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Execute o instalador <code className="text-cyan-300 font-mono text-[11px]">install-winguard.bat</code> como Administrador. O instalador cria a pasta{' '}
            <code className="text-slate-300 font-mono text-[11px]">C:\ProgramData\WinGuard</code> e agenda a tarefa com privilégios SYSTEM no arranque.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h4 className="text-sm font-bold text-white">Monitorização Exclusiva</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            O agente roda em segundo plano. Quando o filho fizer login, o tempo é contabilizado, o hosts é aplicado e as regras são respeitadas. Se o pai fizer login como Administrador, o WinGuard não impõe limites.
          </p>
        </div>
      </div>

      {/* Security Architecture Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-start space-x-4">
        <FolderLock className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
        <div className="space-y-2 text-xs">
          <h4 className="text-sm font-bold text-white">
            Como é protegida a integridade do agente no Windows?
          </h4>
          <p className="text-slate-400 leading-relaxed">
            Ao correr como serviço/tarefa agendada com privilégios <strong>SYSTEM / HIGHEST</strong>, um utilizador normal (a conta do filho sem privilégios de administrador no Windows) não consegue fechar o processo do WinGuard através do Gestor de Tarefas, nem tem permissão de escrita para alterar ou limpar o ficheiro <code className="text-indigo-300 font-mono">hosts</code>. Mesmo que reinicie o PC ou tente entrar em Modo de Segurança com rede, a tarefa inicia automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};
