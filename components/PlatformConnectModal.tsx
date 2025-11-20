
import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle, Loader2, RefreshCw, Mail, Globe, Server, MessageCircle } from 'lucide-react';
import { Channel, PlatformStatus, PlatformConnection } from '../types';

interface PlatformConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
  onLink: (connection: PlatformConnection) => void;
}

const PlatformConnectModal: React.FC<PlatformConnectModalProps> = ({ isOpen, onClose, channel, onLink }) => {
  const [step, setStep] = useState<'provider-select' | 'generating' | 'scan' | 'verifying' | 'success'>('generating');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [emailProvider, setEmailProvider] = useState<'google' | 'microsoft' | 'custom' | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      if (channel === Channel.EMAIL) {
          setStep('provider-select');
      } else {
          setStep('generating');
          setTimeout(() => {
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GlobalReachAuth-${channel}-${Date.now()}`);
            setStep('scan');
          }, 1500);
      }
    }
  }, [isOpen, channel]);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setStep('verifying');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onLink({
          channel: channel,
          status: PlatformStatus.CONNECTED,
          accountName: channel === Channel.WECHAT ? 'WeChatUser_88' : '+1 (555) 867-5309',
          connectedAt: Date.now(),
          provider: channel === Channel.WECHAT ? 'wechat' : 'whatsapp'
        });
        onClose();
      }, 1500);
    }, 2000);
  };

  const handleEmailConnect = (provider: 'google' | 'microsoft' | 'custom') => {
      setEmailProvider(provider);
      setStep('verifying'); // Reusing verifying state for "Connecting..."
      
      // Simulate OAuth window delay
      setTimeout(() => {
          setStep('success');
          setTimeout(() => {
            onLink({
                channel: Channel.EMAIL,
                status: PlatformStatus.CONNECTED,
                accountName: 'sales@globalreach.com',
                connectedAt: Date.now(),
                provider: provider
            });
            onClose();
          }, 1500);
      }, 2500);
  };

  const getInstructions = () => {
    switch (channel) {
      case Channel.WHATSAPP:
        return (
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 mt-4">
            <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
            <li>Tap <strong>Menu</strong> (Android) or <strong>Settings</strong> (iOS).</li>
            <li>Select <strong>Linked Devices</strong> and then <strong>Link a Device</strong>.</li>
            <li>Point your phone at this screen to capture the QR code.</li>
          </ol>
        );
      case Channel.WECHAT:
        return (
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 mt-4">
            <li>Open <strong>WeChat</strong> on your mobile phone.</li>
            <li>Tap the <strong>+</strong> button in the top right.</li>
            <li>Select <strong>Scan</strong>.</li>
            <li>Point your phone at this screen to authorize login.</li>
          </ol>
        );
      default:
        return null;
    }
  };

  const getHeaderColor = () => {
      switch (channel) {
          case Channel.WHATSAPP: return 'bg-[#00a884]';
          case Channel.WECHAT: return 'bg-[#07C160]';
          case Channel.EMAIL: return 'bg-blue-600';
          default: return 'bg-slate-900';
      }
  };

  const getHeaderIcon = () => {
      switch (channel) {
          case Channel.EMAIL: return <Mail className="w-5 h-5" />;
          case Channel.WECHAT: return <MessageCircle className="w-5 h-5" />;
          default: return <Smartphone className="w-5 h-5" />;
      }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transition-all">
        
        {/* Header */}
        <div className={`p-6 flex justify-between items-center text-white ${getHeaderColor()}`}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            {getHeaderIcon()}
            Link {channel} Account
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center text-center min-h-[300px] justify-center">
          
          {/* EMAIL: Provider Selection */}
          {step === 'provider-select' && channel === Channel.EMAIL && (
              <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  <p className="text-slate-600 mb-6 text-sm">Select your email provider to authorize access via OAuth 2.0.</p>
                  
                  <button 
                    onClick={() => handleEmailConnect('google')}
                    className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:shadow-md group"
                  >
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform">
                          {/* Simple Google-ish G icon representation using text for simplicity or map generic Globe */}
                          <span className="font-bold text-lg">G</span>
                      </div>
                      <div className="ml-4 text-left">
                          <span className="block font-bold text-slate-800">Sign in with Google</span>
                          <span className="block text-xs text-slate-500">Gmail, G Suite, Workspace</span>
                      </div>
                  </button>

                  <button 
                    onClick={() => handleEmailConnect('microsoft')}
                    className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:shadow-md group"
                  >
                      <div className="w-10 h-10 bg-[#00a4ef] text-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="font-bold text-lg">M</span>
                      </div>
                      <div className="ml-4 text-left">
                          <span className="block font-bold text-slate-800">Sign in with Microsoft</span>
                          <span className="block text-xs text-slate-500">Outlook, Office 365</span>
                      </div>
                  </button>

                  <button 
                     onClick={() => handleEmailConnect('custom')}
                     className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:shadow-md group"
                  >
                      <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Server className="w-5 h-5" />
                      </div>
                      <div className="ml-4 text-left">
                          <span className="block font-bold text-slate-800">IMAP/SMTP</span>
                          <span className="block text-xs text-slate-500">Custom server configuration</span>
                      </div>
                  </button>
              </div>
          )}

          {/* QR FLOW: Generating */}
          {step === 'generating' && (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
              <p className="text-slate-500 text-sm">Generating Secure QR Code...</p>
            </div>
          )}

          {/* QR FLOW: Scan */}
          {step === 'scan' && (
            <div className="animate-in zoom-in duration-300 flex flex-col items-center w-full">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-inner mb-4 relative group">
                <img src={qrCodeUrl} alt="Auth QR Code" className="w-48 h-48" />
                {/* Simulation Overlay */}
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleSimulateScan}>
                   <span className="bg-white px-3 py-1 rounded-full shadow text-xs font-bold text-slate-800">Click to Simulate Scan</span>
                </div>
              </div>
              
              <div className="text-left w-full bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-1">Instructions:</h3>
                {getInstructions()}
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                 <RefreshCw className="w-3 h-3" />
                 <span>Code updates automatically in 20s</span>
              </div>
            </div>
          )}

          {/* SHARED: Verifying / OAuth Loading */}
          {step === 'verifying' && (
             <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <div className={`w-16 h-16 border-4 rounded-full animate-spin ${channel === Channel.EMAIL ? 'border-blue-200 border-t-blue-600' : (channel === Channel.WECHAT ? 'border-green-200 border-t-green-600' : 'border-indigo-200 border-t-indigo-600')}`} />
                <h3 className="font-bold text-slate-800">Authenticating...</h3>
                <p className="text-slate-500 text-sm">
                    {channel === Channel.EMAIL 
                        ? `Connecting to ${emailProvider === 'google' ? 'Google' : emailProvider === 'microsoft' ? 'Microsoft' : 'Server'}...`
                        : "Securely linking your device session."}
                </p>
             </div>
          )}

          {/* SHARED: Success */}
          {step === 'success' && (
             <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white mb-2 animate-in bounce-in ${channel === Channel.WECHAT ? 'bg-green-500' : 'bg-green-500'}`}>
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-800 text-xl">
                    {channel === Channel.EMAIL ? 'Email Linked!' : 'Device Linked!'}
                </h3>
                <p className="text-slate-500 text-sm">Redirecting back to settings...</p>
             </div>
          )}

        </div>

        {/* Footer for Demo purposes only (QR only) */}
        {step === 'scan' && (
            <div className="bg-slate-50 p-3 border-t border-slate-100 text-center">
                <button 
                    onClick={handleSimulateScan}
                    className={`text-xs hover:underline font-medium ${channel === Channel.WECHAT ? 'text-green-600' : 'text-indigo-600'}`}
                >
                    (Demo) Simulate Phone Scan
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PlatformConnectModal;
