import React, { useState } from 'react';
import { Laptop, X, Plus, Shield } from 'lucide-react';
import { api } from '../services/api';

interface NewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated: (newDeviceId: string) => void;
}

export const NewDeviceModal: React.FC<NewDeviceModalProps> = ({
  isOpen,
  onClose,
  onDeviceCreated
}) => {
  const [name, setName] = useState('');
  const [monitoredUser, setMonitoredUser] = useState('');
  const [ipAddress, setIpAddress] = useState('192.168.1.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !monitoredUser.trim()) {
      alert('Preencha o nome do computador e o login do filho.');
      return;
    }

    try {
      setLoading(true);
      const dev = await api.createDevice({
        name: name.trim().toUpperCase(),
        monitoredUser: monitoredUser.trim().toLowerCase(),
        ipAddress: ipAddress.trim()
      });
      onDeviceCreated(dev.id);
      onClose();
    } catch (err: any) {
      alert('Erro ao registar computador: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Laptop className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Adicionar Computador Windows</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Nome do Computador:</label>
            <input
              type="text"
              placeholder="ex: PC-QUARTO-MARIA ou PORTATIL-FILHO"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 uppercase font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Nome de Utilizador do Filho (Windows Login):</label>
            <input
              type="text"
              placeholder="ex: maria ou filho"
              value={monitoredUser}
              onChange={(e) => setMonitoredUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              O agente no Windows apenas aplicará bloqueios e limites quando este utilizador estiver com sessão aberta.
            </span>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">IP Local Previsto (Opcional):</label>
            <input
              type="text"
              placeholder="192.168.1.120"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'A Registar...' : 'Criar Perfil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
