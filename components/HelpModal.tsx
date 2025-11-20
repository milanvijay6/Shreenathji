
import React, { useState } from 'react';
import { X, Book, HelpCircle, Terminal, Shield, AlertTriangle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string | null>('getting-started');

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
      setActiveSection(activeSection === id ? null : id);
  };

  const Section = ({ id, title, icon: Icon, children }: any) => (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection(id)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500">
                      <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-700">{title}</span>
              </div>
              {activeSection === id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
          {activeSection === id && (
              <div className="p-4 bg-white border-t border-slate-200 text-sm text-slate-600 space-y-3 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                  {children}
              </div>
          )}
      </div>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-indigo-600" />
                Help & Documentation
             </h2>
             <p className="text-sm text-slate-500">Guides, troubleshooting, and support resources.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
            
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex gap-3">
                <Book className="w-5 h-5 text-indigo-600 mt-1" />
                <div>
                    <h3 className="font-bold text-indigo-800 text-sm">Quick Start Guide</h3>
                    <p className="text-xs text-indigo-700 mt-1">
                        New to GlobalReach? Check out our <a href="#" className="underline font-bold">Online Video Tutorials</a> for a walkthrough of the main features.
                    </p>
                </div>
            </div>

            <Section id="getting-started" title="Getting Started" icon={Shield}>
                <p><strong>1. Configuration:</strong> Ensure you have completed the Setup Wizard. You need a valid Gemini API key for AI features to work.</p>
                <p><strong>2. Connecting Accounts:</strong> Go to Settings &gt; Integrations to link your WhatsApp or WeChat accounts. Use the QR code scanner on your mobile device.</p>
                <p><strong>3. Importing Leads:</strong> Use the Bulk Import tool (Upload Icon) to paste CSV data. Ensure your format matches: <code>Name, Company, Country, Contact...</code></p>
            </Section>

            <Section id="webhooks" title="Webhooks & Tunneling" icon={Terminal}>
                <p>To receive messages, the outside world needs to reach your local app. We recommend using <strong>ngrok</strong> or a similar tunneling service.</p>
                <div className="bg-slate-100 p-3 rounded font-mono text-xs border border-slate-200 my-2">
                    ngrok http 4000
                </div>
                <p>Copy the HTTPS URL provided by ngrok (e.g., <code>https://a1b2.ngrok.io</code>) into <strong>Settings &gt; System &gt; Tunnel URL</strong>.</p>
                <p><strong>Verification:</strong> Use the default token <code>globalreach_secret_token</code> when configuring the webhook callback in your WhatsApp/WeChat developer portal.</p>
            </Section>

            <Section id="troubleshooting" title="Troubleshooting" icon={AlertTriangle}>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>AI Not Responding:</strong> Check your API Key in Settings. Ensure you have quota available.</li>
                    <li><strong>Messages Not Sending:</strong> Check the "Diagnostics" tab in Settings to test connection health. Verify your internet connection.</li>
                    <li><strong>Update Failed:</strong> Try restarting the application manually. If persistent, download the latest installer from our website.</li>
                </ul>
                <p className="mt-2 font-bold">Still stuck?</p>
                <p>Export your Diagnostic Logs (Settings &gt; Diagnostics) and email them to <a href="mailto:support@globalreach.com" className="text-indigo-600 underline">support@globalreach.com</a>.</p>
            </Section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl text-center">
            <a href="#" className="text-xs text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1">
                Visit Online Knowledge Base <ExternalLink className="w-3 h-3" />
            </a>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
