import React from 'react';
import {
  Shield,
  Clock,
  LayoutGrid,
  Globe,
  Download,
  Server,
  History,
  Activity,
  Laptop,
  Plus
} from 'lucide-react';
import { TabType, DeviceInfo } from '../types';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  devices: DeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  onOpenNewDeviceModal: () => void;
  onOpenSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  devices,
  selectedDeviceId,
  onSelectDevice,
  onOpenNewDeviceModal,
  onOpenSimulator
}) => {
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  WinGuard
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Proxmox LXC
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Controlo Parental Windows 10/11</p>
            </div>
          </div>

          {/* Device Selector & Actions */}
          <div className="flex items-center space-x-3">
            {/* Device selector */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
              <Laptop className="w-4 h-4 text-slate-400 ml-2 mr-1.5" />
              <select
                value={selectedDeviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none pr-3 py-1 cursor-pointer"
              >
                {devices.map((dev) => (
                  <option key={dev.id} value={dev.id} className="bg-slate-900 text-slate-100">
                    {dev.name} ({dev.monitoredUser})
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenNewDeviceModal}
                title="Adicionar novo computador"
                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Status indicator */}
            {selectedDevice && (
              <div
                className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  selectedDevice.isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedDevice.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{selectedDevice.isOnline ? 'PC Ligado' : 'Offline (Regras Locais)'}</span>
              </div>
            )}

            {/* Test Simulator Button */}
            <button
              onClick={onOpenSimulator}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Simulador do Agente</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-1 border-t border-slate-800/80">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Painel Geral</span>
          </button>

          <button
            onClick={() => onTabChange('time_rules')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
              currentTab === 'time_rules'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Limites & Horários</span>
          </button>

          <button
            onClick={() => onTabChange('apps')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
              currentTab === 'apps'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Aplicações</span>
          </button>

          <button
            onClick={() => onTabChange('web_filter')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
              currentTab === 'web_filter'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Filtro Web (Hosts)</span>
          </button>

          <button
            onClick={() => onTabChange('agent_setup')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
              currentTab === 'agent_setup'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Instalar Agente Windows</span>
          </button>

          <button
            onClick={() => onTabChange('proxmox')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
              currentTab === 'proxmox'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Guia Proxmox LXC</span>
          </button>

          <button
            onClick={() => onTabChange('logs')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
              currentTab === 'logs'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Alertas</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
