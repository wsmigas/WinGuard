import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Laptop } from 'lucide-react';
import { DeviceInfo } from '../types';
import { api } from '../services/api';

interface DeleteDeviceModalProps {
  device: DeviceInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onDeviceDeleted: () => void;
}

export const DeleteDeviceModal: React.FC<DeleteDeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onDeviceDeleted
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !device) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.deleteDevice(device.id);
      onDeviceDeleted();
      onClose();
    } catch (err: any) {
      alert('Erro ao eliminar computador: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Eliminar Computador</h3>
              <p className="text-xs text-rose-300/80">Ação irreversível no servidor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Tem a certeza de que deseja apagar o computador{' '}
            <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">
              {device.name}
            </strong>{' '}
            (utilizador monitorizado:{' '}
            <strong className="text-indigo-300 font-mono">{device.monitoredUser}</strong>)?
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-slate-400">
            <div className="flex items-center space-x-2 text-slate-300 font-medium">
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>Dados que serão eliminados do servidor Proxmox:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1">
              <li>Todas as regras de limites de ecrã e horários configuradas</li>
              <li>Regras específicas de aplicações (jogos, bloqueios)</li>
              <li>Histórico de atividade, alertas e tempos registados</li>
            </ul>
          </div>

          <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <strong>Nota:</strong> Se o agente Windows ainda estiver instalado no computador físico, ele deixará de conseguir sincronizar com este servidor até ser desinstalado ou registado novamente.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'A Eliminar...' : 'Sim, Eliminar Cliente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
