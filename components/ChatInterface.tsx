
import React, { useEffect, useRef, useState } from 'react';
import { Importer, Channel, LeadStatus, Language, MessageStatus, EmotionLabel, SentimentData } from '../types';
import { Send, User, Bot, Clock, AlertTriangle, UserCog, ChevronDown, Sparkles, TrendingUp, Zap, ChevronLeft, Lock, Check, Loader2, MailOpen, Phone, Mail, MessageSquare, Settings, Sparkle, Frown, Meh, Smile, AlertOctagon, HelpCircle, BarChart3, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { t } from '../services/i18n';
import { getOptimalChannel } from '../services/validationService';

interface ChatInterfaceProps {
  importer: Importer;
  isProcessing: boolean;
  isImporterTyping?: boolean;
  onSendMessage: (text: string, channel: Channel) => void;
  onSimulateResponse: () => void;
  onAutoReply: () => void;
  onBack?: () => void; 
  readOnly?: boolean;
  language: Language;
  onUpdateImporter: (id: string, updates: Partial<Importer>) => void;
  onMessageFeedback?: (messageId: string, isHelpful: boolean) => void;
}

const ChannelIcon = ({ channel }: { channel: Channel }) => {
  switch(channel) {
    case Channel.WHATSAPP: return <Phone className="w-3 h-3 text-green-600" />;
    case Channel.WECHAT: return <MessageSquare className="w-3 h-3 text-emerald-600" />;
    case Channel.EMAIL: return <Mail className="w-3 h-3 text-blue-600" />;
    default: return <Phone className="w-3 h-3 text-slate-400" />;
  }
};

const SentimentIcon = ({ sentiment }: { sentiment?: SentimentData }) => {
    if (!sentiment) return <Meh className="w-3 h-3 text-slate-300" />;
    
    // Use score for icon determination
    if (sentiment.score > 0.3) return <Smile className="w-3 h-3 text-green-500" />;
    if (sentiment.score < -0.3) return <Frown className="w-3 h-3 text-orange-500" />;
    if (sentiment.label === 'Critical') return <AlertOctagon className="w-3 h-3 text-red-600 animate-pulse" />;
    return <Meh className="w-3 h-3 text-slate-400" />;
};

const StatusIndicator = ({ status, channel }: { status?: MessageStatus, channel: Channel }) => {
    if (!status) return null;

    if (channel === Channel.EMAIL) {
        if (status === MessageStatus.SENDING) return <Loader2 className="w-3 h-3 animate-spin text-slate-400" />;
        if (status === MessageStatus.READ) return <span className="flex items-center gap-0.5 text-indigo-600" title="Opened"><MailOpen className="w-3 h-3" /> Opened</span>;
        return <span className="text-[10px] text-slate-400 capitalize">{status}</span>;
    }

    switch (status) {
        case MessageStatus.SENDING:
            return <Clock className="w-3 h-3 text-slate-400" />;
        case MessageStatus.SENT:
            return <div title="Sent to server"><Check className="w-3 h-3 text-slate-400" /></div>;
        case MessageStatus.DELIVERED:
            return <div className="flex -space-x-1" title="Delivered"><Check className="w-3 h-3 text-slate-400" /><Check className="w-3 h-3 text-slate-400" /></div>;
        case MessageStatus.READ:
            return <div className="flex -space-x-1" title="Read"><Check className="w-3 h-3 text-blue-500" /><Check className="w-3 h-3 text-blue-500" /></div>;
        case MessageStatus.FAILED:
            return <div title="Failed"><AlertTriangle className="w-3 h-3 text-red-500" /></div>;
        default:
            return null;
    }
};

const SentimentGauge = ({ score, intensity }: { score: number, intensity: number }) => {
    // Score: -1 to 1. Map to 0% to 100%.
    const percentage = ((score + 1) / 2) * 100;
    
    let barColor = 'bg-slate-300';
    if (percentage > 60) barColor = 'bg-gradient-to-r from-green-400 to-green-600';
    else if (percentage < 40) barColor = 'bg-gradient-to-r from-red-600 to-red-400';
    else barColor = 'bg-gradient-to-r from-yellow-400 to-yellow-500';

    return (
        <div className="w-full">
            <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold">
                <span>Neg</span>
                <span>Pos</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percentage}%`, opacity: 0.5 + (intensity * 0.5) }}
                />
                {/* Center Marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300/50"></div>
            </div>
            <div className="flex justify-between text-[9px] mt-0.5">
                <span className="text-slate-400">Int: {(intensity * 100).toFixed(0)}%</span>
                <span className="font-mono font-bold text-slate-600">{score.toFixed(2)}</span>
            </div>
        </div>
    );
};

const EmotionBars = ({ emotions }: { emotions: { label: EmotionLabel, confidence: number }[] }) => {
    if (!emotions || emotions.length === 0) return <span className="text-[10px] text-slate-400">No strong emotions detected.</span>;

    return (
        <div className="space-y-1.5">
            {emotions.map((emo, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-600 w-16 truncate">{emo.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${
                                emo.label === 'Urgency' ? 'bg-amber-500' : 
                                emo.label === 'Frustration' ? 'bg-red-500' : 
                                emo.label === 'Enthusiasm' ? 'bg-purple-500' : 
                                emo.label === 'Confusion' ? 'bg-blue-400' : 'bg-green-500'
                            }`}
                            style={{ width: `${emo.confidence * 100}%` }}
                        />
                    </div>
                    <span className="text-[9px] text-slate-400 w-6 text-right">{(emo.confidence * 100).toFixed(0)}%</span>
                </div>
            ))}
        </div>
    );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  importer, 
  isProcessing, 
  isImporterTyping = false,
  onSendMessage,
  onSimulateResponse,
  onAutoReply,
  onBack,
  readOnly = false,
  language,
  onUpdateImporter,
  onMessageFeedback
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [selectedChannel, setSelectedChannel] = useState<Channel>(importer.preferredChannel);
  const [showChannelSettings, setShowChannelSettings] = useState(false);

  // Sync local state when importer changes
  useEffect(() => {
    setSelectedChannel(importer.preferredChannel);
  }, [importer.id, importer.preferredChannel]);

  const scrollToBottom = () => {
    if (activeTab === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [importer.chatHistory, activeTab, isProcessing, isImporterTyping]);

  const handleSend = () => {
    if (inputText.trim() && !readOnly) {
      onSendMessage(inputText, selectedChannel);
      setInputText('');
    }
  };

  const handleChannelModeChange = (mode: 'auto' | 'manual', channel?: Channel) => {
      if (mode === 'auto') {
          const optimal = getOptimalChannel(importer.validation);
          onUpdateImporter(importer.id, { 
              channelSelectionMode: 'auto',
              preferredChannel: optimal
          });
      } else if (mode === 'manual' && channel) {
          onUpdateImporter(importer.id, { 
              channelSelectionMode: 'manual',
              preferredChannel: channel
          });
      }
      setShowChannelSettings(false);
  };

  const getBubbleClass = (sender: 'agent' | 'importer' | 'system') => {
    switch(sender) {
      case 'agent': return 'bg-blue-600 text-white self-end rounded-tr-none shadow-md';
      case 'importer': return 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none shadow-sm';
      case 'system': return 'bg-slate-100 text-slate-500 self-center text-xs rounded-full py-1 px-3 border border-slate-200';
      default: return '';
    }
  };

  const isEscalated = importer.needsHumanReview;
  const isCritical = importer.sentimentAnalysis?.label === 'Critical';
  const isAuto = importer.channelSelectionMode === 'auto' || !importer.channelSelectionMode;

  return (
    <div className="flex flex-col h-full bg-slate-50 md:rounded-lg md:border border-slate-200 overflow-hidden w-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="p-3 md:p-4 flex justify-between items-start">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden flex-1 min-w-0">
                {onBack && (
                  <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full shrink-0" aria-label="Back to list">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-200">
                        {importer.name.charAt(0)}
                    </div>
                    {isEscalated && (
                         <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-0.5 rounded-full border-2 border-white" title="Human Review Needed">
                            <UserCog className="w-3 h-3" />
                         </div>
                    )}
                </div>
                <div className="min-w-0 flex flex-col flex-1">
                    <h2 className="font-bold text-slate-800 truncate leading-tight text-sm md:text-base">{importer.companyName}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                        <span className="truncate font-medium">{importer.name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate hidden sm:inline">{importer.country}</span>
                    </div>
                    
                    {/* Channel Settings Trigger */}
                    <div className="relative mt-1">
                        <button 
                            onClick={() => setShowChannelSettings(!showChannelSettings)}
                            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors
                                ${isAuto ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                        >
                            {isAuto ? <Sparkle className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                            {isAuto ? 'Auto: ' : 'Manual: '}
                            <span className="uppercase truncate max-w-[80px] md:max-w-none">{importer.preferredChannel}</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        
                        {/* Popover */}
                        {showChannelSettings && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Preferred Channel
                                </div>
                                <button onClick={() => handleChannelModeChange('auto')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2">
                                    <Sparkle className="w-3 h-3 text-indigo-500" /> Auto-Detect
                                    {isAuto && <Check className="w-3 h-3 ml-auto text-green-500" />}
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                {[Channel.WHATSAPP, Channel.WECHAT, Channel.EMAIL].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => handleChannelModeChange('manual', c)}
                                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <ChannelIcon channel={c} /> {c}
                                        {!isAuto && importer.preferredChannel === c && <Check className="w-3 h-3 ml-auto text-green-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-2">
                <div className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border whitespace-nowrap shadow-sm
                    ${importer.status === LeadStatus.INTERESTED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {importer.status.toUpperCase()}
                </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex px-4 gap-6 text-sm font-medium text-slate-500 overflow-x-auto scrollbar-hide bg-slate-50/50 border-t border-slate-100 md:border-none">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`pb-2 pt-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'chat' ? 'text-indigo-600 border-indigo-600' : 'border-transparent hover:text-slate-700'}`}>
                {t('chat', language)}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`pb-2 pt-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'text-indigo-600 border-indigo-600' : 'border-transparent hover:text-slate-700'}`}>
                {t('history', language)}
              </button>
          </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' ? (
          <>
            {/* Critical / Escalation Banner */}
            {(isEscalated || isCritical) && (
                <div className={`border-b p-2 flex items-center justify-center gap-2 text-xs font-medium animate-in slide-in-from-top 
                    ${isCritical ? 'bg-red-100 border-red-200 text-red-800' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
                    {isCritical ? <AlertOctagon className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{isCritical ? 'CRITICAL: Negative Sentiment' : t('humanNeeded', language)}</span>
                </div>
            )}

            {/* AI Insights Panel - UPDATED FOR SCORING */}
            {(importer.interestShownIn || importer.nextStep || importer.leadScore !== undefined) && (
                <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 shadow-sm sticky top-0 z-0">
                    
                    {/* Col 1: Lead Score & Satisfaction */}
                    <div className="col-span-1 flex flex-col border-r border-slate-200 pr-2 overflow-hidden">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-blue-500" /> Health
                        </span>
                        <div className="flex flex-col gap-1">
                             <div className="flex justify-between items-center" title="Buying Intent">
                                 <span className="text-[10px] text-slate-500">Intent</span>
                                 <span className={`text-xs font-bold ${importer.leadScore && importer.leadScore > 70 ? 'text-green-600' : 'text-slate-700'}`}>
                                     {importer.leadScore || 0}
                                 </span>
                             </div>
                             <div className="flex justify-between items-center" title="Satisfaction Index">
                                 <span className="text-[10px] text-slate-500">Satisf.</span>
                                 <span className={`text-xs font-bold flex items-center gap-1 ${importer.satisfactionIndex && importer.satisfactionIndex > 70 ? 'text-purple-600' : 'text-slate-700'}`}>
                                     {importer.satisfactionIndex || 50} <Heart className="w-2.5 h-2.5" />
                                 </span>
                             </div>
                        </div>
                    </div>

                    {/* Col 2: Sentiment Gauge */}
                    <div className="col-span-1 flex flex-col md:border-r border-slate-200 pr-2 overflow-hidden justify-center">
                        {importer.sentimentAnalysis ? (
                            <SentimentGauge score={importer.sentimentAnalysis.score} intensity={importer.sentimentAnalysis.intensity} />
                        ) : <span className="text-xs text-slate-400">No Sentiment Data</span>}
                    </div>

                    {/* Col 3: Emotion Bars */}
                    <div className="col-span-1 flex flex-col border-r border-slate-200 pr-2 overflow-hidden justify-center border-t md:border-t-0 pt-2 md:pt-0">
                         {importer.detectedEmotions && importer.detectedEmotions.length > 0 ? (
                             <EmotionBars emotions={importer.detectedEmotions} />
                         ) : <span className="text-[10px] text-slate-400 italic">Neutral Tone</span>}
                    </div>

                    {/* Col 4: Next Step */}
                    <div className="col-span-1 flex flex-col pl-1 overflow-hidden border-t md:border-t-0 pt-2 md:pt-0">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" /> Next
                        </span>
                         <span className="text-xs text-indigo-600 font-bold line-clamp-2">{importer.nextStep || 'Continue'}</span>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div 
                onClick={() => setShowChannelSettings(false)}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')]"
            >
                {importer.chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                        <Bot className="w-12 h-12 mb-2 opacity-20" />
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    importer.chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[80%] ${msg.sender === 'agent' ? 'self-end items-end' : (msg.sender === 'system' ? 'self-center' : 'self-start items-start')}`}>
                        <div className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed relative ${getBubbleClass(msg.sender)} group`}>
                            {msg.content}
                            
                            {/* Message Feedback Controls for Agent Messages */}
                            {msg.sender === 'agent' && onMessageFeedback && (
                                <div className="absolute -left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button 
                                        onClick={() => onMessageFeedback(msg.id, false)}
                                        className={`p-1 rounded-full hover:bg-red-50 ${msg.feedback === 'unhelpful' ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-400'}`}
                                        title="Mark as unhelpful"
                                    >
                                        <ThumbsDown className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={() => onMessageFeedback(msg.id, true)}
                                        className={`p-1 rounded-full hover:bg-green-50 ${msg.feedback === 'helpful' ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-green-400'}`}
                                        title="Mark as helpful"
                                    >
                                        <ThumbsUp className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {msg.sender !== 'system' && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 px-1 font-medium">
                                <div className="flex items-center gap-1 opacity-80">
                                   <ChannelIcon channel={msg.channel} />
                                   <span className="capitalize">{msg.channel}</span>
                                </div>
                                <span>•</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {msg.sender === 'agent' && msg.status && (
                                    <>
                                        <span>•</span>
                                        <StatusIndicator status={msg.status} channel={msg.channel} />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    ))
                )}
                
                {/* Importer Typing Indicator */}
                {isImporterTyping && (
                    <div className="self-start flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                             <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-400 ml-1 mt-1 font-medium">{importer.name} is typing...</span>
                    </div>
                )}

                {/* Agent (System) Processing Indicator */}
                {isProcessing && !isImporterTyping && (
                    <div className="self-end flex flex-col items-end animate-in fade-in slide-in-from-bottom-2">
                         <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl rounded-tr-none shadow-sm flex items-center gap-2">
                            <Bot className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">{t('typing', language)}</span>
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Controls */}
            <div className="p-3 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {readOnly ? (
                     <div className="flex items-center justify-center gap-2 text-slate-400 py-2 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                         <Lock className="w-4 h-4" />
                         <span className="text-xs font-medium">Read-only access enabled</span>
                     </div>
                ) : (
                    <>
                        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                            <button 
                                onClick={onSimulateResponse}
                                disabled={isProcessing || isImporterTyping || importer.chatHistory.length === 0}
                                className="whitespace-nowrap flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 border border-slate-200 font-medium">
                                <User className="w-3 h-3" /> {t('simulate', language)}
                            </button>
                            <button 
                                onClick={onAutoReply}
                                disabled={isProcessing || isImporterTyping || importer.chatHistory.length === 0 || !!isEscalated || !!isCritical}
                                className={`whitespace-nowrap flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 border font-medium ${isEscalated || isCritical ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'}`}>
                                <Bot className="w-3 h-3" /> {(isEscalated || isCritical) ? 'Auto-Reply Disabled' : t('autoReply', language)}
                            </button>
                        </div>
                        <div className="flex gap-2 items-center">
                            {/* Channel Selector */}
                            <div className="relative group shrink-0">
                                <select 
                                    value={selectedChannel}
                                    onChange={(e) => setSelectedChannel(e.target.value as Channel)}
                                    aria-label="Select Channel"
                                    className="appearance-none bg-slate-100 border border-transparent hover:border-slate-300 text-xs font-medium text-slate-600 py-2 pl-8 pr-8 rounded-lg outline-none cursor-pointer w-[100px] md:w-full transition-all focus:ring-2 focus:ring-indigo-500/20 truncate"
                                >
                                    {Object.values(Channel).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="absolute left-3 top-2.5 pointer-events-none">
                                    <ChannelIcon channel={selectedChannel} />
                                </div>
                                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
                            </div>

                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isEscalated || isCritical ? "Human reply required..." : "Type message..."}
                                aria-label="Message input"
                                className={`flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-full px-4 py-2 text-sm transition-all outline-none w-full min-w-0 placeholder:text-slate-400 ${isCritical ? 'border-red-200 bg-red-50 placeholder:text-red-400' : ''}`}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                aria-label="Send message"
                                className="shrink-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
          </>
      ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
              <div className="max-w-2xl mx-auto relative border-l-2 border-slate-200 pl-4 md:pl-6 space-y-6">
                  {importer.activityLog.slice().reverse().map((log) => (
                      <div key={log.id} className="relative">
                          <div className={`absolute -left-[23px] md:-left-[31px] w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-sm top-0.5
                                ${log.type === 'status_change' ? 'bg-blue-500' : 
                                  log.type === 'validation' ? 'bg-green-500' : 
                                  log.type === 'note' ? 'bg-amber-500' : 'bg-slate-400'}`} 
                          />
                          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">{log.type.replace('_', ' ')}</span>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(log.timestamp).toLocaleString()}
                                  </span>
                              </div>
                              <p className="text-sm text-slate-700">{log.description}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatInterface;
