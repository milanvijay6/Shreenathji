
import React, { useMemo, useState } from 'react';
import { Importer, LeadStatus, Language, SentimentData, EmotionData } from '../types';
import { CheckCircle, XCircle, Clock, MessageCircle, AlertCircle, AlertTriangle, Search, Filter, Phone, Mail, MessageSquare, UserCog, Flame, Smile, Frown, Meh, AlertOctagon, Zap, HelpCircle, Heart } from 'lucide-react';
import { t } from '../services/i18n';

interface ImporterListProps {
  importers: Importer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  language: Language;
}

const StatusIcon = ({ status }: { status: LeadStatus }) => {
  switch (status) {
    case LeadStatus.INTERESTED:
    case LeadStatus.NEGOTIATION:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case LeadStatus.COLD:
    case LeadStatus.CLOSED:
      return <XCircle className="w-4 h-4 text-red-500" />;
    case LeadStatus.SAMPLE_SENT:
      return <CheckCircle className="w-4 h-4 text-purple-500" />;
    case LeadStatus.CONTACTED:
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case LeadStatus.ENGAGED:
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
};

const SatisfactionBadge = ({ index }: { index?: number }) => {
    if (index === undefined) return null;

    let color = 'text-slate-400 bg-slate-100 border-slate-200';
    if (index >= 75) color = 'text-purple-600 bg-purple-50 border-purple-200';
    else if (index >= 50) color = 'text-blue-600 bg-blue-50 border-blue-200';
    else if (index < 30) color = 'text-red-600 bg-red-50 border-red-200';

    return (
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${color}`} title={`Satisfaction Index: ${index}`}>
            <Heart className="w-3 h-3 fill-current" />
            {index}
        </div>
    );
};

const ScoreBadge = ({ score }: { score?: number }) => {
    if (score === undefined) return null;
    
    let color = 'bg-slate-100 text-slate-600';
    let icon = null;

    if (score >= 80) {
        color = 'bg-green-100 text-green-700 border-green-200';
        icon = <Flame className="w-3 h-3 fill-current" />;
    } else if (score >= 50) {
        color = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    } else {
        color = 'bg-slate-100 text-slate-500 border-slate-200';
    }

    return (
        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${color} font-bold`} title="Lead Score (Buying Intent)">
            {icon}
            <span>{score}</span>
        </div>
    );
};

const EmotionIcons = ({ emotions }: { emotions?: EmotionData[] }) => {
    if (!emotions || emotions.length === 0) return null;
    
    // Only show critical emotions (> 50% confidence) in list view
    const criticalEmotions = emotions.filter(e => e.confidence > 0.5 && ['Urgency', 'Frustration', 'Confusion'].includes(e.label));
    
    if (criticalEmotions.length === 0) return null;

    return (
        <div className="flex gap-1 ml-1">
            {criticalEmotions.some(e => e.label === 'Urgency') && (
                <div title="Urgent">
                    <Zap className="w-3 h-3 text-amber-500 fill-current" />
                </div>
            )}
            {criticalEmotions.some(e => e.label === 'Frustration') && (
                <div title="Frustrated">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                </div>
            )}
            {criticalEmotions.some(e => e.label === 'Confusion') && (
                <div title="Confused">
                    <HelpCircle className="w-3 h-3 text-blue-400" />
                </div>
            )}
        </div>
    );
};

const ImporterList: React.FC<ImporterListProps> = ({ importers, selectedId, onSelect, statusFilter, onStatusFilterChange, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date'); // date | score | satisfaction_asc | satisfaction_desc
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilters, setShowDateFilters] = useState(false);

  // Extract unique countries for filter
  const countries = useMemo(() => {
    const unique = new Set(importers.map(i => i.country));
    return Array.from(unique).sort();
  }, [importers]);

  // Filter logic
  const filteredImporters = useMemo(() => {
    const filtered = importers.filter(imp => {
      const matchesSearch = 
        imp.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        imp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imp.productsImported.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || imp.status === statusFilter;
      const matchesCountry = countryFilter === 'all' || imp.country === countryFilter;
      const matchesSentiment = sentimentFilter === 'all' || imp.sentimentAnalysis?.label === sentimentFilter;

      let matchesDate = true;
      if (startDate || endDate) {
        if (!imp.lastContacted) {
            matchesDate = false; 
        } else {
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (imp.lastContacted < start.getTime()) matchesDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (imp.lastContacted > end.getTime()) matchesDate = false;
            }
        }
      }

      return matchesSearch && matchesStatus && matchesCountry && matchesDate && matchesSentiment;
    });

    // Sort logic
    return filtered.sort((a, b) => {
        if (sortBy === 'score') {
            return (b.leadScore || 0) - (a.leadScore || 0);
        }
        if (sortBy === 'satisfaction_asc') {
            return (a.satisfactionIndex || 50) - (b.satisfactionIndex || 50); // Low first
        }
        if (sortBy === 'satisfaction_desc') {
            return (b.satisfactionIndex || 50) - (a.satisfactionIndex || 50); // High first
        }
        // Default by date
        return (b.lastContacted || 0) - (a.lastContacted || 0);
    });

  }, [importers, searchTerm, statusFilter, countryFilter, sentimentFilter, startDate, endDate, sortBy]);

  return (
    <div className="bg-white md:rounded-lg md:shadow md:border border-slate-200 flex flex-col h-full w-full">
      {/* Filters Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 md:rounded-t-lg space-y-3">
        <div className="flex items-center justify-between">
           <h2 className="font-semibold text-slate-800">{t('leads', language)}</h2>
           <span className="text-xs font-medium bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{filteredImporters.length}</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('search', language)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search leads"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select 
            value={statusFilter} 
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter by status"
            className="flex-1 text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none"
          >
            <option value="all">Status: All</option>
            {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort leads"
            className="w-[120px] text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none"
          >
            <option value="date">Recent</option>
            <option value="score">Top Score</option>
            <option value="satisfaction_asc">Unhappy First</option>
            <option value="satisfaction_desc">Happy First</option>
          </select>
        </div>
        
        <div className="flex gap-2">
            <select 
                value={countryFilter} 
                onChange={(e) => setCountryFilter(e.target.value)}
                aria-label="Filter by country"
                className="flex-1 text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none"
            >
                <option value="all">Country: All</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
                value={sentimentFilter} 
                onChange={(e) => setSentimentFilter(e.target.value)}
                aria-label="Filter by sentiment"
                className="flex-1 text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none"
            >
                <option value="all">Sentiment: All</option>
                <option value="Positive">Positive</option>
                <option value="Neutral">Neutral</option>
                <option value="Negative">Negative</option>
                <option value="Critical">Critical</option>
            </select>
        </div>

        {/* Advanced Filter Toggle */}
        <div className="pt-1 border-t border-slate-100 mt-2">
            <button 
            onClick={() => setShowDateFilters(!showDateFilters)}
            className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium w-full justify-between"
            >
            <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> Date Filter</span>
            {showDateFilters ? <span className="text-[10px] text-slate-400">Hide</span> : <span className="text-[10px] text-slate-400">Show</span>}
            </button>
            
            {showDateFilters && (
                <div className="flex gap-2 mt-2 items-center animate-in slide-in-from-top-2 duration-200">
                    <div className="flex-1">
                    <label className="text-[10px] text-slate-400 block mb-1">From</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-[10px] border border-slate-300 rounded px-1 py-1 bg-white"
                    />
                    </div>
                    <div className="flex-1">
                    <label className="text-[10px] text-slate-400 block mb-1">To</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-[10px] border border-slate-300 rounded px-1 py-1 bg-white"
                    />
                    </div>
                    {(startDate || endDate) && (
                    <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="self-end mb-1 p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Clear Date Filter"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 p-2 space-y-2 scrollbar-hide">
        {filteredImporters.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8 flex flex-col items-center h-full justify-center">
            <Search className="w-8 h-8 mb-2 opacity-20" />
            <p>No leads match your filters.</p>
            {(startDate || endDate) && (
                <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-indigo-500 text-xs mt-2 hover:underline"
                >
                    Clear date filters
                </button>
            )}
          </div>
        ) : (
          filteredImporters.map((imp) => {
            const { isValid, errors, whatsappAvailable, wechatAvailable, emailMxValid } = imp.validation;
            
            return (
              <button
                key={imp.id}
                onClick={() => isValid && onSelect(imp.id)}
                disabled={!isValid}
                className={`
                  w-full text-left relative p-3 md:p-4 rounded-lg border transition-all duration-200 active:scale-[0.99]
                  ${!isValid ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-80' : 'cursor-pointer hover:shadow-md'}
                  ${isValid && selectedId === imp.id 
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300 shadow-sm' 
                    : (isValid ? 'bg-white border-slate-100 hover:border-slate-300' : '')}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold text-sm truncate w-2/3 ${!isValid ? 'text-red-800' : 'text-slate-800'}`}>
                    {imp.companyName}
                  </h3>
                  <div className="flex items-center gap-1">
                     <SatisfactionBadge index={imp.satisfactionIndex} />
                     <ScoreBadge score={imp.leadScore} />
                     <EmotionIcons emotions={imp.detectedEmotions} />
                     {imp.needsHumanReview && (
                        <div title="Human Review Required" className="text-orange-500 animate-pulse">
                            <UserCog className="w-4 h-4" />
                        </div>
                     )}
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-400 block mb-2">{imp.country}</span>

                {!isValid ? (
                  <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mb-2 bg-white/50 p-1.5 rounded border border-red-100">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span className="truncate">Invalid: {errors[0] || 'Check Contact'}</span>
                  </div>
                ) : (
                  // Validation Indicators
                  <div className="flex items-center gap-2 mb-3">
                     {whatsappAvailable === true && <div title="WhatsApp Available" className="p-1 bg-green-100 rounded-full text-green-600"><Phone className="w-3 h-3" /></div>}
                     {wechatAvailable === true && <div title="WeChat Available" className="p-1 bg-blue-100 rounded-full text-blue-600"><MessageSquare className="w-3 h-3" /></div>}
                     {emailMxValid === true && <div title="Email Verified (MX)" className="p-1 bg-indigo-100 rounded-full text-indigo-600"><Mail className="w-3 h-3" /></div>}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                  <span className="truncate max-w-[100px] font-medium">{imp.name}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="truncate text-slate-400">{imp.contactDetail}</span>
                </div>
                
                <div className={`flex justify-between items-center mt-2 ${!isValid ? 'opacity-50' : ''}`}>
                  <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-opacity-10 font-bold
                      ${imp.status === LeadStatus.INTERESTED ? 'bg-green-500 text-green-700' : 'bg-slate-200 text-slate-600'}
                  `}>
                    <StatusIcon status={imp.status} />
                    <span>{imp.status}</span>
                  </div>
                  {imp.lastContacted && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(imp.lastContacted).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ImporterList;
