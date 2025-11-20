
import React, { useState } from 'react';
import { CheckCircle, Key, Link as LinkIcon, Globe, Shield, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { PlatformService } from '../services/platformService';
import { PlatformConnection, Channel, PlatformStatus } from '../types';
import PlatformConnectModal from './PlatformConnectModal';

interface SetupWizardProps {
  onComplete: () => void;
}

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Shield },
  { id: 'api', title: 'AI API Keys', icon: Key },
  { id: 'accounts', title: 'Connect Accounts', icon: LinkIcon },
  { id: 'webhooks', title: 'Network Config', icon: Globe },
];

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form State
  const [apiKey, setApiKey] = useState('');
  const [webhookToken, setWebhookToken] = useState('globalreach_secret_token');
  const [tunnelUrl, setTunnelUrl] = useState('');
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  
  // UI State
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(Channel.WHATSAPP);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateStep = (): boolean => {
      setError(null);
      
      if (currentStep === 1) { // AI Config
          if (!apiKey || apiKey.trim().length < 10) {
              setError("Please enter a valid Google GenAI API Key.");
              return false;
          }
      }
      
      if (currentStep === 2) { // Accounts
          if (connections.length === 0) {
              setError("We recommend connecting at least one platform (Email, WhatsApp, or WeChat) to get started.");
              // Warning only? Or block? Let's block for better setup experience in a wizard context.
              // Or allow skip with a strict warning.
              // For now, let's allow but show the error as a dismissible warning if needed, but here we return false to enforce.
              // Actually, strictly enforcing might be annoying if they just want to test. Let's allow but maybe alert.
              // Let's just clear error and return true, but rely on UI cues.
              // Re-decision: Let's require at least one to ensure the app is useful.
              return false; 
          }
      }

      if (currentStep === 3) { // Webhooks
          if (!webhookToken || webhookToken.length < 5) {
              setError("A secure Verification Token is required.");
              return false;
          }
          // Tunnel URL optional, but if provided check format
          if (tunnelUrl && !tunnelUrl.startsWith('http')) {
              setError("Tunnel URL must start with http:// or https://");
              return false;
          }
      }

      return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep === steps.length - 1) {
      setIsSaving(true);
      try {
          // Secure Save
          await PlatformService.secureSave('user_provided_api_key', apiKey);
          await PlatformService.setAppConfig('webhookToken', webhookToken);
          await PlatformService.setAppConfig('tunnelUrl', tunnelUrl);
          await PlatformService.secureSave('globalreach_platforms', JSON.stringify(connections));
          
          // Mark complete
          await PlatformService.setAppConfig('setupComplete', true);
          
          setTimeout(() => {
            setIsSaving(false);
            onComplete();
          }, 1000);
      } catch (e) {
          console.error("Setup save failed", e);
          setError("Failed to save configuration. Please try again.");
          setIsSaving(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const openConnectModal = (channel: Channel) => {
    setSelectedChannel(channel);
    setConnectModalOpen(true);
  };

  const handleLink = (conn: PlatformConnection) => {
    setConnections(prev => [...prev.filter(c => c.channel !== conn.channel), conn]);
    setError(null); // Clear "no accounts" error if resolved
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-4 py-8 animate-in slide-in-from-right duration-500">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome to GlobalReach</h2>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              Your AI-powered export CRM is almost ready. This wizard will guide you through configuring your API keys, connecting messaging platforms, and securing your local environment.
            </p>
          </div>
        );
      case 1: // API
        return (
          <div className="space-y-6 py-4 animate-in slide-in-from-right duration-300">
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
              <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Gemini AI Key
              </h3>
              <p className="text-xs text-blue-700 mb-4 leading-relaxed">
                This application uses Google's Gemini AI for automated messaging and lead scoring. 
                Your API Key will be encrypted securely on this device.
              </p>
              <div className="relative">
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(null); }}
                  placeholder="Enter your AIzaSy... key"
                  className={`w-full pl-4 pr-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${error ? 'border-red-300 ring-1 ring-red-200' : 'border-blue-200'}`}
                />
              </div>
              <p className="text-[10px] text-blue-500 mt-3 flex justify-between">
                <span>Required for AI features.</span>
                <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-blue-800">Get API Key &rarr;</a>
              </p>
            </div>
          </div>
        );
      case 2: // Accounts
        return (
          <div className="space-y-6 py-4 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                Link your messaging accounts. You can add more later in Settings.
                </p>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">
                    {connections.length} Linked
                </span>
            </div>
            
            <div className="space-y-3">
              {[Channel.WHATSAPP, Channel.WECHAT, Channel.EMAIL].map(channel => {
                const isConnected = connections.some(c => c.channel === channel && c.status === PlatformStatus.CONNECTED);
                return (
                  <div key={channel} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${isConnected ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${channel === Channel.WHATSAPP ? 'bg-[#25D366]' : channel === Channel.WECHAT ? 'bg-[#07C160]' : 'bg-blue-600'}`}>
                         <span className="font-bold text-lg">{channel[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{channel}</h4>
                        <p className="text-xs text-slate-500">{isConnected ? 'Connected Securely' : 'Not configured'}</p>
                      </div>
                    </div>
                    {isConnected ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium text-sm bg-white px-3 py-1 rounded-full border border-green-100">
                          <CheckCircle className="w-4 h-4" /> Linked
                      </div>
                    ) : (
                      <button 
                        onClick={() => openConnectModal(channel)}
                        className="px-4 py-2 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 3: // Webhooks
        return (
          <div className="space-y-6 py-4 animate-in slide-in-from-right duration-300">
             <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Webhook Configuration
                </h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  To receive real-time messages from WhatsApp/WeChat servers, configure your local tunnel settings. 
                  This protects your endpoint from unauthorized access.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Verification Token</label>
                    <input 
                      type="text" 
                      value={webhookToken}
                      onChange={(e) => { setWebhookToken(e.target.value); setError(null); }}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Use this token in your Meta/WeChat developer portal.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Tunnel URL (Optional)</label>
                    <input 
                      type="text" 
                      value={tunnelUrl}
                      onChange={(e) => setTunnelUrl(e.target.value)}
                      placeholder="https://your-tunnel.ngrok.io"
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">If using ngrok/localtunnel, paste the public URL here.</p>
                  </div>
                </div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-4 font-sans">
      <PlatformConnectModal 
        isOpen={connectModalOpen} 
        onClose={() => setConnectModalOpen(false)}
        channel={selectedChannel}
        onLink={handleLink}
      />

      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-8">
             <div>
                 <h1 className="text-xl font-bold text-slate-800">Setup Wizard</h1>
                 <p className="text-xs text-slate-500 mt-1">Step {currentStep + 1} of {steps.length}: <span className="font-bold text-indigo-600">{steps[currentStep].title}</span></p>
             </div>
             <div className="flex items-center gap-1 text-slate-400">
                 <Shield className="w-5 h-5" />
                 <span className="text-xs font-bold">SECURE SETUP</span>
             </div>
          </div>
          
          {/* Stepper */}
          <div className="relative mx-4">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />
            <div className="flex justify-between w-full">
                {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;

                return (
                    <div key={step.id} className="flex flex-col items-center bg-slate-50 px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${isActive ? 'border-indigo-600 bg-indigo-600 text-white scale-110 shadow-md' : 
                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 bg-white text-slate-300'}`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    </div>
                );
                })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto relative">
          {error && (
              <div className="absolute top-2 left-8 right-8 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4" /> {error}
              </div>
          )}
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
           <button 
             onClick={() => { setCurrentStep(Math.max(0, currentStep - 1)); setError(null); }}
             disabled={currentStep === 0}
             className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
             Back
           </button>
           <button 
             onClick={handleNext}
             disabled={isSaving}
             className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-80"
           >
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
             {currentStep === steps.length - 1 ? 'Finish Setup' : 'Next Step'}
             {!isSaving && currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
