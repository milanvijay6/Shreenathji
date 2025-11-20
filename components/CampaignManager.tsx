
import React, { useState } from 'react';
import { Campaign, CampaignStep, Channel, Importer } from '../types';
import { Plus, Play, Pause, Trash2, Edit2, MessageSquare, Clock, CheckCircle } from 'lucide-react';

interface CampaignManagerProps {
  campaigns: Campaign[];
  onChange: (campaigns: Campaign[]) => void;
  importers: Importer[];
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ campaigns, onChange, importers }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<Partial<CampaignStep>>({ dayOffset: 1, channel: Channel.EMAIL, template: '' });

  const handleCreate = () => {
    const newCampaign: Campaign = {
      id: `cmp-${Date.now()}`,
      name: 'New Nurture Campaign',
      steps: [],
      status: 'draft',
      createdAt: Date.now()
    };
    onChange([...campaigns, newCampaign]);
    setEditingId(newCampaign.id);
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    onChange(campaigns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCampaign = (id: string) => {
    if (confirm('Are you sure?')) {
      onChange(campaigns.filter(c => c.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const addStep = (campaignId: string) => {
    if (!newStep.template) return;
    
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const step: CampaignStep = {
      id: `step-${Date.now()}`,
      dayOffset: newStep.dayOffset || 1,
      channel: newStep.channel || Channel.EMAIL,
      template: newStep.template || ''
    };

    updateCampaign(campaignId, { steps: [...campaign.steps, step].sort((a, b) => a.dayOffset - b.dayOffset) });
    setNewStep({ dayOffset: step.dayOffset + 2, channel: Channel.EMAIL, template: '' });
  };

  const activeCampaign = campaigns.find(c => c.id === editingId);

  return (
    <div className="flex h-full bg-slate-100">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-slate-200 bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Campaigns</h2>
          <button onClick={handleCreate} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1">
          {campaigns.map(c => (
            <div 
              key={c.id} 
              onClick={() => setEditingId(c.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${editingId === c.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.steps.length} Steps • {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <div className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeCampaign ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <input 
                type="text" 
                value={activeCampaign.name}
                onChange={(e) => updateCampaign(activeCampaign.id, { name: e.target.value })}
                className="text-2xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => deleteCampaign(activeCampaign.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => updateCampaign(activeCampaign.id, { status: activeCampaign.status === 'active' ? 'paused' : 'active' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white ${activeCampaign.status === 'active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {activeCampaign.status === 'active' ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Activate</>}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
               <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold">Enrolled</p>
                  <p className="text-2xl font-bold text-slate-800">0</p>
               </div>
               <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold">Active</p>
                  <p className="text-2xl font-bold text-indigo-600">0</p>
               </div>
               <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold">Completed</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
               </div>
            </div>

            <div className="space-y-6">
              {activeCampaign.steps.map((step, idx) => (
                <div key={step.id} className="relative pl-8 border-l-2 border-slate-200 pb-6 last:pb-0 last:border-l-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                          <Clock className="w-3 h-3" /> Day {step.dayOffset}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium bg-blue-50 px-2 py-1 rounded text-blue-600">
                          <MessageSquare className="w-3 h-3" /> {step.channel}
                        </div>
                      </div>
                      <button 
                        onClick={() => updateCampaign(activeCampaign.id, { steps: activeCampaign.steps.filter(s => s.id !== step.id) })}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 font-mono bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">
                      {step.template}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add Step Form */}
              <div className="relative pl-8 border-l-2 border-slate-200">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                 </div>
                 <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Add Campaign Step</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Send After (Days)</label>
                         <input 
                           type="number" 
                           min="1"
                           value={newStep.dayOffset}
                           onChange={(e) => setNewStep({ ...newStep, dayOffset: parseInt(e.target.value) })}
                           className="w-full p-2 text-sm border border-slate-300 rounded"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Channel</label>
                         <select 
                            value={newStep.channel}
                            onChange={(e) => setNewStep({ ...newStep, channel: e.target.value as Channel })}
                            className="w-full p-2 text-sm border border-slate-300 rounded"
                         >
                            {Object.values(Channel).map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                       </div>
                    </div>
                    <div className="mb-3">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Message Template (Supports {'{{name}}'}, etc)</label>
                        <textarea 
                            value={newStep.template}
                            onChange={(e) => setNewStep({ ...newStep, template: e.target.value })}
                            className="w-full p-2 text-sm border border-slate-300 rounded h-20 font-mono"
                            placeholder="Hi {{name}}, checking in..."
                        />
                    </div>
                    <button 
                      onClick={() => addStep(activeCampaign.id)}
                      disabled={!newStep.template}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Add Step
                    </button>
                 </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Edit2 className="w-12 h-12 mb-3 opacity-20" />
            <p>Select or create a campaign to edit</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignManager;
