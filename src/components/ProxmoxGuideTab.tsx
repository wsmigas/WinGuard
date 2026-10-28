import React, { useState } from 'react';
import { Server, Terminal, Copy, Check, Shield, Cpu, HardDrive, Network, CheckCircle2 } from 'lucide-react';

export const ProxmoxGuideTab: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const codeSnippets = [
    // Step 1: Create Container
    `# 1. Atualizar e instalar dependências no LXC (Debian 12 / Ubuntu 24.04)
apt update && apt upgrade -y
apt install -y curl git build-essential

# 2. Instalar Node.js LTS (v20 ou v22)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Confirmar versões instaladas
node -v
npm -v`,

    // Step 2: Clone or Place App
    `# Criar diretório da aplicação no Proxmox LXC
mkdir -p /opt/winguard
cd /opt/winguard

# Copiar os ficheiros do WinGuard ou clonar o repositório
# Instalar pacotes de produção
npm install --omit=dev

# Compilar o frontend estático para produção
npm run build`,

    // Step 3: Systemd Service
    `# Criar ficheiro de serviço systemd para auto-arranque com o Proxmox
cat << 'EOF' > /etc/systemd/system/winguard.service
[Unit]
Description=WinGuard Parental Control Server (Proxmox LXC)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/winguard
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Ativar e iniciar o serviço
systemctl daemon-reload
systemctl enable --now winguard

# Verificar estado
systemctl status winguard`,

    // Step 4: Test connectivity
    `# Testar que a porta 3000 está a escutar no container
ss -tuln | grep 3000

# O servidor estará disponível na sua rede local em:
# http://<IP_DO_LXC_PROXMOX>:3000`
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Server className="w-5 h-5 text-indigo-400" />
          <span>Guia de Instalação no Proxmox VE (Container LXC)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          O WinGuard foi concebido para correr 24/7 num container LXC leve em Proxmox, consumindo menos de 150MB de RAM e garantindo que o servidor doméstico está sempre disponível para receber dados e enviar regras.
        </p>
      </div>

      {/* Suggested Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">CPU</span>
            <p className="text-sm font-bold text-white">1 vCPU Cores</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <HardDrive className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Memória RAM</span>
            <p className="text-sm font-bold text-white">512 MB - 1 GB</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Disco LXC</span>
            <p className="text-sm font-bold text-white">4 GB - 8 GB</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <Network className="w-5 h-5 text-purple-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Rede</span>
            <p className="text-sm font-bold text-white">IP Estático Local</p>
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Criar o Container LXC e Instalar Node.js</span>
            </h3>
            <button
              onClick={() => copyCode(codeSnippets[0], 0)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copiedIndex === 0 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 0 ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            No Proxmox, crie um novo CT usando o template Debian 12 (bookworm) ou Ubuntu 24.04. Abra a consola do container e execute:
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[0]}</pre>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Instalar e Compilar o WinGuard</span>
            </h3>
            <button
              onClick={() => copyCode(codeSnippets[1], 1)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 1 ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[1]}</pre>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Configurar Serviço Systemd para Auto-Arranque</span>
            </h3>
            <button
              onClick={() => copyCode(codeSnippets[2], 2)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 2 ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Isto garante que se o nó Proxmox reiniciar ou houver falha de energia, o servidor do WinGuard volta a arrancar de forma totalmente autónoma.
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[2]}</pre>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Aceder ao Painel na Rede Doméstica</span>
            </h3>
            <button
              onClick={() => copyCode(codeSnippets[3], 3)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 3 ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[3]}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
