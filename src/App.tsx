import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { TimeRulesTab } from './components/TimeRulesTab';
import { AppRulesTab } from './components/AppRulesTab';
import { WebFilterTab } from './components/WebFilterTab';
import { AgentSetupTab } from './components/AgentSetupTab';
import { ProxmoxGuideTab } from './components/ProxmoxGuideTab';
import { ActivityLogsTab } from './components/ActivityLogsTab';
import { SimulatorModal } from './components/SimulatorModal';
import { NewDeviceModal } from './components/NewDeviceModal';
import { TabType, DeviceInfo, DeviceRules, AppUsageRecord, ActivityEvent } from './types';
import { api } from './services/api';
import { Shield, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [rules, setRules] = useState<DeviceRules | null>(null);
  const [appUsage, setAppUsage] = useState<AppUsageRecord[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [newDeviceOpen, setNewDeviceOpen] = useState(false);

  // Load all devices
  const loadDevices = useCallback(async (preferredId?: string) => {
    try {
      const devList = await api.getDevices();
      setDevices(devList);
      if (devList.length > 0) {
        const idToSelect = preferredId || (devList.some((d) => d.id === selectedDeviceId) ? selectedDeviceId : devList[0].id);
        setSelectedDeviceId(idToSelect);
      }
    } catch (err: any) {
      console.error('Error loading devices:', err);
      setError(err.message);
    }
  }, [selectedDeviceId]);

  // Load detail for selected device
  const loadDeviceDetail = useCallback(async (id: string, isSilent = false) => {
    if (!id) return;
    try {
      if (!isSilent) setRefreshing(true);
      const detail = await api.getDeviceDetail(id);
      setDevice(detail.device);
      setRules(detail.rules);
      setAppUsage(detail.appUsage);
      setEvents(detail.events);
      setError(null);
    } catch (err: any) {
      console.error('Error loading device detail:', err);
      if (!isSilent) setError(err.message);
    } finally {
      if (!isSilent) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // On device select change
  useEffect(() => {
    if (selectedDeviceId) {
      loadDeviceDetail(selectedDeviceId);
    }
  }, [selectedDeviceId, loadDeviceDetail]);

  // Periodic background poll every 8 seconds for real-time agent updates
  useEffect(() => {
    if (!selectedDeviceId) return;
    const interval = setInterval(() => {
      loadDeviceDetail(selectedDeviceId, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, loadDeviceDetail]);

  const handleDeviceCreated = (newId: string) => {
    loadDevices(newId);
  };

  if (loading && devices.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div className="text-sm font-semibold tracking-wide text-white">WinGuard Parental Control</div>
        <p className="text-xs text-slate-500 mt-1">A iniciar painel do servidor Proxmox LXC...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
        onOpenNewDeviceModal={() => setNewDeviceOpen(true)}
        onOpenSimulator={() => setSimulatorOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>Aviso: {error}</span>
            <button
              onClick={() => {
                setError(null);
                loadDevices();
              }}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-500 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {device && rules ? (
          <>
            {currentTab === 'overview' && (
              <OverviewTab
                device={device}
                rules={rules}
                appUsage={appUsage}
                events={events}
                onRefresh={() => loadDeviceDetail(device.id)}
              />
            )}

            {currentTab === 'time_rules' && (
              <TimeRulesTab
                device={device}
                rules={rules}
                onRefresh={() => loadDeviceDetail(device.id)}
              />
            )}

            {currentTab === 'apps' && (
              <AppRulesTab
                device={device}
                rules={rules}
                onRefresh={() => loadDeviceDetail(device.id)}
              />
            )}

            {currentTab === 'web_filter' && (
              <WebFilterTab
                device={device}
                rules={rules}
                onRefresh={() => loadDeviceDetail(device.id)}
              />
            )}

            {currentTab === 'agent_setup' && <AgentSetupTab device={device} />}

            {currentTab === 'proxmox' && <ProxmoxGuideTab />}

            {currentTab === 'logs' && (
              <ActivityLogsTab events={events} onRefresh={() => loadDeviceDetail(device.id)} />
            )}
          </>
        ) : (
          <div className="text-center py-20 text-slate-400 text-xs">
            Nenhum computador selecionado ou registado. Adicione um novo computador no topo para começar.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WinGuard Parental Control &copy; {new Date().getFullYear()} &bull; Proxmox LXC Server Edition</span>
          <span className="text-slate-600">
            Regras offline gravadas no cliente &bull; Bloqueio nativo Windows via Hosts
          </span>
        </div>
      </footer>

      {/* Simulator Modal */}
      {device && (
        <SimulatorModal
          device={device}
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          onRefreshData={() => loadDeviceDetail(device.id)}
        />
      )}

      {/* New Device Modal */}
      <NewDeviceModal
        isOpen={newDeviceOpen}
        onClose={() => setNewDeviceOpen(false)}
        onDeviceCreated={handleDeviceCreated}
      />
    </div>
  );
}
