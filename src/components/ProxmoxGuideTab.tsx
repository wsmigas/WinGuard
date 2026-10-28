import React, { useState } from 'react';
import {
  Server,
  Terminal,
  Copy,
  Check,
  Shield,
  Cpu,
  HardDrive,
  Network,
  CheckCircle2,
  GitBranch,
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const ProxmoxGuideTab: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const repoUrl = 'https://github.com/wsmigas/WinGuard.git';

  const codeSnippets = [
    // Step 1: Create Container & Pre-requisites
    `# 1. Atualizar o sistema no LXC (Debian 12 / Ubuntu 24.04)
apt update && apt upgrade -y

# 2. Instalar Git, Curl e ferramentas de compilação
apt install -y git curl build-essential

# 3. Instalar Node.js LTS (v20 ou v22)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Confirmar as versões instaladas
node -v
npm -v
git --version`,

    // Step 2: Clone GitHub Repository & Build
    `# 1. Navegar para a pasta de aplicações do sistema
cd /opt

# 2. Clonar o repositório oficial do WinGuard a partir do GitHub
git clone https://github.com/wsmigas/WinGuard.git winguard

# 3. Entrar na pasta do projeto
cd /opt/winguard

# 4. Remover lockfile antigo se existir (previne conflitos de dependências)
rm -f package-lock.json

# 5. Instalar as dependências do projeto com suporte a dependências legadas
npm install --legacy-peer-deps

# 6. Compilar o frontend estático para produção
npm run build`,

    // Step 3: Systemd Service for 24/7 Autostart
    `# Criar o ficheiro de serviço systemd para auto-arranque no Proxmox
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

# Recarregar o daemon do systemd e ativar o arranque automático
systemctl daemon-reload
systemctl enable --now winguard

# Verificar o estado do serviço (deve indicar 'active (running)')
systemctl status winguard`,

    // Step 4: Verification & Access
    `# Verificar se o servidor está a escutar na porta 3000
ss -tuln | grep 3000

# O servidor estará acessível na sua rede local doméstica em:
# http://<IP_DO_LXC_PROXMOX>:3000`,

    // Step 5: Easy Update Command
    `# Como atualizar o WinGuard no futuro com novas versões do GitHub:
cd /opt/winguard
git pull origin main
npm install --legacy-peer-deps
npm run build
systemctl restart winguard`
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Guia de Instalação no Proxmox VE (Container LXC)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Instale o servidor WinGuard no seu container LXC clonando diretamente do repositório oficial no GitHub. Consome menos de 150MB de RAM e corre de forma contínua 24/7.
            </p>
          </div>

          {/* GitHub Repo Badge */}
          <a
            href="https://github.com/wsmigas/WinGuard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition self-start sm:self-auto shrink-0 group"
          >
            <GitBranch className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>GitHub: wsmigas/WinGuard</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Suggested Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">CPU</span>
            <p className="text-sm font-bold text-white">1 vCPU Core</p>
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
              <span>Preparar o Container LXC (Debian 12 / Ubuntu 24.04)</span>
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
            No Proxmox VE, crie um container CT usando o template Debian 12 ou Ubuntu. Abra a consola (Console) do container e execute:
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[0]}</pre>
          </div>
        </div>

        {/* Step 2 - CLONE GITHUB REPOSITORY */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-bold text-white">Clonar o Repositório GitHub e Compilar</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                wsmigas/WinGuard.git
              </span>
            </div>
            <button
              onClick={() => copyCode(codeSnippets[1], 1)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 1 ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Clona o código-fonte diretamente do GitHub para <code className="text-indigo-300 font-mono">/opt/winguard</code>, instala os pacotes necessários e compila os ficheiros de produção:
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[1]}</pre>
          </div>

          {/* Troubleshooting Callout for edgesOut */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300">
                Apareceu o erro "Cannot read properties of null (reading 'edgesOut')"?
              </span>
              <p className="text-amber-200/80 leading-relaxed text-[11px]">
                Isto é um bug comum do motor de dependências do npm quando encontra lockfiles pré-existentes ou divergentes entre ambientes. Basta apagar o ficheiro <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">package-lock.json</code> e reinstalar:
              </p>
              <div className="font-mono bg-slate-950 px-2 py-1 rounded text-cyan-300 text-[11px] select-all w-fit mt-1">
                rm -f package-lock.json && npm install --legacy-peer-deps
              </div>
            </div>
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
            Cria o serviço de arranque contínuo. Se o Proxmox reiniciar ou houver quebra de energia, o WinGuard reinicia sozinho sem necessitar de intervenção manual:
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
          <p className="text-xs text-slate-400">
            Abra qualquer navegador no telemóvel, tablet ou computador da mesma rede local:
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[3]}</pre>
          </div>
        </div>

        {/* Step 5 - Future Updates */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Como Atualizar o WinGuard no Futuro</span>
            </h3>
            <button
              onClick={() => copyCode(codeSnippets[4], 4)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 4 ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Sempre que fizer alterações ou novas melhorias no GitHub, basta executar estes comandos no LXC para atualizar em segundos sem perder os dados de configuração:
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner">
            <pre>{codeSnippets[4]}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
