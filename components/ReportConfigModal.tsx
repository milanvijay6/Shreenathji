
import React, { useState } from 'react';
import { X, FileBarChart, Calendar, Mail, Clock } from 'lucide-react';
import { ReportConfig } from '../types';

interface ReportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReportConfig;
  onSave: (config: ReportConfig) => void;
}

const ReportConfigModal: React.FC<ReportConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ReportConfig>(config);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-indigo-600" />
            Report Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Time Frame */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-slate-400" /> Default Time Frame
            </label>
            <div className="grid grid-cols-4 gap-2">
                {['7d', '30d', '90d', 'all'].map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setLocalConfig({ ...localConfig, timeFrame: tf as any })}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all
                            ${localConfig.timeFrame === tf 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {tf === 'all' ? 'All Time' : `Last ${tf}`}
                    </button>
                ))}
            </div>
          </div>

          {/* KPIs */}
          <div>
             <label className="text-sm font-semibold text-slate-700 mb-3 block">Visible KPIs</label>
             <div className="space-y-2">
                 {[
                     { key: 'revenue', label: 'Projected Revenue' },
                     { key: 'conversion', label: 'Conversion Rate' },
                     { key: 'leads', label: 'Total Active Leads' }
                 ].map((kpi) => (
                     <label key={kpi.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                         <span className="text-sm text-slate-700">{kpi.label}</span>
                         <input 
                            type="checkbox" 
                            checked={localConfig.kpis[kpi.key as keyof typeof localConfig.kpis]} 
                            onChange={(e) => setLocalConfig({
                                ...localConfig,
                                kpis: { ...localConfig.kpis, [kpi.key]: e.target.checked }
                            })}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                         />
                     </label>
                 ))}
             </div>
          </div>

          {/* Scheduled Exports */}
          <div>
             <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Mail className="w-4 h-4 text-slate-400" /> Email Reports
            </label>
             <div className="space-y-3">
                 <div className="relative">
                    <input 
                        type="email" 
                        value={localConfig.emailRecipients}
                        onChange={(e) => setLocalConfig({ ...localConfig, emailRecipients: e.target.value })}
                        placeholder="manager@company.com"
                        className="w-full pl-3 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                 </div>
                 <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4 text-slate-400" />
                     <select 
                        value={localConfig.exportSchedule}
                        onChange={(e) => setLocalConfig({ ...localConfig, exportSchedule: e.target.value as any })}
                        className="text-sm border border-slate-300 rounded-lg p-2 flex-1 outline-none"
                     >
                         <option value="never">No automated emails</option>
                         <option value="daily">Daily Summary</option>
                         <option value="weekly">Weekly Report</option>
                         <option value="monthly">Monthly Report</option>
                     </select>
                 </div>
             </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => { onSave(localConfig); onClose(); }}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-600/20"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportConfigModal;
