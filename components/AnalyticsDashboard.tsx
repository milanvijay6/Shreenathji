
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { Importer, LeadStatus, ReportConfig, SalesForecast, StrategicInsight, TrainingModule, CoachingTip } from '../types';
import { TrendingUp, Users, DollarSign, Sparkles, Settings, X, Heart, Activity, Zap, Download, FileText, ChevronDown, Brain, ArrowUpRight, AlertTriangle, Quote, GraduationCap, Lightbulb, UserCheck, ChevronRight } from 'lucide-react';
import { AnalyticsService } from '../services/analyticsService';
import { generateTrainingProgram } from '../services/geminiService';

interface AnalyticsDashboardProps {
  importers: Importer[];
  forecastData: SalesForecast[] | null;
  reportConfig: ReportConfig;
  onDrillDown: (status: string) => void;
  onGenerateForecast: () => void;
  onConfigure: () => void;
  onClose: () => void;
  isForecasting: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
    importers, 
    forecastData, 
    reportConfig, 
    onDrillDown, 
    onGenerateForecast,
    onConfigure,
    onClose,
    isForecasting 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'insights' | 'training'>('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [isGeneratingTraining, setIsGeneratingTraining] = useState(false);
  const [showManagerView, setShowManagerView] = useState(false); // Toggle for Team View
  
  // --- OVERVIEW DATA ---
  const funnelOrder = [
      LeadStatus.PENDING, 
      LeadStatus.CONTACTED, 
      LeadStatus.ENGAGED, 
      LeadStatus.INTERESTED, 
      LeadStatus.SAMPLE_SENT, 
      LeadStatus.NEGOTIATION, 
      LeadStatus.CLOSED
  ];

  const funnelData = useMemo(() => funnelOrder.map(status => {
      const count = importers.filter(i => i.status === status).length;
      return {
          name: status,
          count,
          fill: status === LeadStatus.INTERESTED || status === LeadStatus.NEGOTIATION ? '#4f46e5' : '#94a3b8'
      };
  }).filter(d => d.count > 0), [importers]);

  const activeLeads = importers.filter(i => ![LeadStatus.CLOSED, LeadStatus.COLD, LeadStatus.PENDING].includes(i.status)).length;
  const qualifiedLeads = importers.filter(i => [LeadStatus.INTERESTED, LeadStatus.NEGOTIATION, LeadStatus.SAMPLE_SENT].includes(i.status)).length;
  const projectedRevenue = qualifiedLeads * 15000; 

  // --- SENTIMENT DATA ---
  const sentimentTrendData = useMemo(() => {
      const days = reportConfig.timeFrame === '7d' ? 7 : reportConfig.timeFrame === '90d' ? 90 : 30;
      return AnalyticsService.getSentimentTrend(importers, days);
  }, [importers, reportConfig.timeFrame]);

  const emotionData = useMemo(() => {
      return AnalyticsService.getEmotionDistribution(importers);
  }, [importers]);

  // --- INSIGHTS DATA ---
  const strategicInsights = useMemo(() => {
      return AnalyticsService.generateStrategicInsights(importers);
  }, [importers]);

  const skillMetrics = useMemo(() => {
      return AnalyticsService.getSkillImprovementMetrics(importers);
  }, [importers]);

  const coachingTips = useMemo(() => {
      return AnalyticsService.generateCoachingTips(importers);
  }, [importers]);

  const teamStats = useMemo(() => {
      return AnalyticsService.getTeamStats();
  }, []);

  const handleGenerateTraining = async () => {
      setIsGeneratingTraining(true);
      const modules = await generateTrainingProgram(strategicInsights);
      setTrainingModules(modules);
      setIsGeneratingTraining(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0 bg-slate-100/50">
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {activeTab === 'overview' ? <TrendingUp className="w-4 h-4 text-indigo-600" /> : 
                     activeTab === 'sentiment' ? <Heart className="w-4 h-4 text-pink-600" /> :
                     activeTab === 'training' ? <GraduationCap className="w-4 h-4 text-green-600" /> :
                     <Brain className="w-4 h-4 text-amber-600" />}
                    Analytics
                </h3>
                <div className="flex bg-slate-200 rounded-lg p-0.5 ml-4">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Funnel
                    </button>
                    <button 
                        onClick={() => setActiveTab('sentiment')}
                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${activeTab === 'sentiment' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Mood
                    </button>
                    <button 
                        onClick={() => setActiveTab('insights')}
                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${activeTab === 'insights' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Insights
                    </button>
                    <button 
                        onClick={() => setActiveTab('training')}
                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${activeTab === 'training' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Training
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {/* Export Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="flex items-center gap-1 p-1.5 hover:bg-slate-200 rounded text-slate-500 transition-colors mr-1" 
                        title="Export Reports"
                    >
                        <Download className="w-4 h-4" />
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Download Reports (CSV)
                            </div>
                            <button 
                                onClick={() => { AnalyticsService.exportLeadsPerformance(importers); setShowExportMenu(false); }}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                                <FileText className="w-3 h-3 text-indigo-500" /> Lead Performance
                            </button>
                            <button 
                                onClick={() => { AnalyticsService.exportSentimentReport(importers); setShowExportMenu(false); }}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                                <Heart className="w-3 h-3 text-pink-500" /> Sentiment Analysis
                            </button>
                        </div>
                    )}
                </div>

                <button onClick={onConfigure} className="p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-colors" title="Configure Report">
                    <Settings className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-colors" title="Close Panel">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-6 scrollbar-hide">
            {/* Date Filter Badge */}
            {activeTab !== 'training' && (
                <div className="flex justify-end">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                        {reportConfig.timeFrame === 'all' ? 'All Time' : `Last ${reportConfig.timeFrame}`}
                    </span>
                </div>
            )}

            {activeTab === 'overview' ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {reportConfig.kpis.leads && (
                            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Active
                                </p>
                                <p className="text-xl font-bold text-slate-800 mt-1">{activeLeads}</p>
                            </div>
                        )}
                        {reportConfig.kpis.revenue && (
                            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Value
                                </p>
                                <p className="text-xl font-bold text-green-600 mt-1">${(projectedRevenue / 1000).toFixed(1)}k</p>
                            </div>
                        )}
                    </div>

                    {/* Sales Funnel */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Funnel</h4>
                            <span className="text-[10px] text-slate-400">Tap bar to filter</span>
                        </div>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={funnelData} 
                                    layout="vertical" 
                                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                                    onClick={(data) => data && data.activeLabel && onDrillDown(data.activeLabel)}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={70} 
                                        tick={{fontSize: 10, fill: '#64748b'}} 
                                        interval={0}
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f1f5f9'}}
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16} className="cursor-pointer">
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Forecasting */}
                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI Forecast
                            </h4>
                            {!forecastData && (
                                <button 
                                    onClick={onGenerateForecast}
                                    disabled={isForecasting}
                                    className="text-[10px] bg-white hover:bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-200 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {isForecasting ? '...' : 'Predict'}
                                </button>
                            )}
                        </div>
                        
                        {forecastData ? (
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastData}>
                                        <defs>
                                            <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{fontSize: '10px'}} />
                                        <Area type="monotone" dataKey="predictedConversions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPred)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <p className="text-[10px] text-center text-slate-400 mt-1">Conversion trend (Next 4 wks)</p>
                            </div>
                        ) : (
                            <div className="h-20 flex items-center justify-center text-slate-400 text-xs italic">
                                Click predict to see trends
                            </div>
                        )}
                    </div>
                </>
            ) : activeTab === 'sentiment' ? (
                <>
                    {/* SENTIMENT TREND */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Interaction Sentiment
                            </h4>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sentimentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{fontSize: '11px', borderRadius: '8px'}} />
                                    
                                    <Area type="monotone" dataKey="Critical" stackId="1" stroke="#ef4444" fill="url(#colorCrit)" />
                                    <Area type="monotone" dataKey="Negative" stackId="1" stroke="#f97316" fill="#fff7ed" />
                                    <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#94a3b8" fill="#f8fafc" />
                                    <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="url(#colorPos)" />
                                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* EMOTION DISTRIBUTION */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Emotion Breakdown
                            </h4>
                        </div>
                        {emotionData.length > 0 ? (
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={emotionData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10}} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{fontSize: '11px', borderRadius: '8px'}} />
                                        <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]}>
                                            {emotionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-slate-400 text-xs italic">
                                Not enough data to analyze emotions
                            </div>
                        )}
                    </div>
                </>
            ) : activeTab === 'insights' ? (
                /* INSIGHTS TAB */
                <div className="space-y-4 animate-in fade-in">
                    {/* Skill Tracking */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-3">
                            <Activity className="w-3 h-3" /> Skill Improvement (Satisfaction)
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {skillMetrics.map(skill => (
                                <div key={skill.label} className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-600">{skill.label}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-slate-800">{skill.score}</span>
                                        {skill.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                        {skill.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                         <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2 mb-1">
                             <Brain className="w-3 h-3" /> Strategic Intelligence
                         </h4>
                         <p className="text-[10px] text-amber-700">
                             AI-detected patterns linking emotions to sales outcomes.
                         </p>
                    </div>

                    {strategicInsights.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                             No strong patterns detected yet.
                        </div>
                    ) : (
                        strategicInsights.map(insight => (
                            <div key={insight.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {insight.category === 'negative' ? (
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                                        )}
                                        <span className={`text-xs font-bold ${insight.category === 'negative' ? 'text-red-700' : 'text-green-700'}`}>
                                            {insight.title}
                                        </span>
                                    </div>
                                    {insight.impactScore && (
                                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">
                                            Impact: {insight.impactScore}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                                    {insight.description}
                                </p>
                                
                                {insight.dataPoints && insight.dataPoints.length > 0 && (
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-2">
                                        {insight.dataPoints.map((dp, i) => (
                                            <div key={i} className="flex gap-2 items-start text-[10px] text-slate-500 italic">
                                                <Quote className="w-3 h-3 shrink-0 opacity-50" />
                                                <span>{dp}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
               /* TRAINING TAB */
               <div className="space-y-6 animate-in fade-in">
                   {/* View Toggle */}
                   <div className="flex justify-between items-center">
                       <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           <GraduationCap className="w-4 h-4 text-green-600" /> Learning & Development
                       </h4>
                       <button 
                        onClick={() => setShowManagerView(!showManagerView)}
                        className="text-xs flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                       >
                           {showManagerView ? <UserCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                           {showManagerView ? 'Switch to My Coaching' : 'Switch to Manager View'}
                       </button>
                   </div>

                   {showManagerView ? (
                       // MANAGER VIEW
                       <div className="space-y-4">
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                               <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Team Progress</h5>
                               <table className="w-full text-left text-xs">
                                   <thead className="text-slate-400 font-medium border-b border-slate-200">
                                       <tr>
                                           <th className="pb-2">Rep</th>
                                           <th className="pb-2">Leads</th>
                                           <th className="pb-2">Satisfaction</th>
                                           <th className="pb-2">Conversion</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {teamStats.map((stat, i) => (
                                           <tr key={i} className="hover:bg-white transition-colors">
                                               <td className="py-2 font-medium text-slate-700">{stat.name}</td>
                                               <td className="py-2 text-slate-500">{stat.leads}</td>
                                               <td className="py-2">
                                                   <div className="flex items-center gap-1">
                                                       <span className={`font-bold ${stat.satisfaction > 80 ? 'text-green-600' : stat.satisfaction < 70 ? 'text-red-500' : 'text-amber-600'}`}>{stat.satisfaction}</span>
                                                   </div>
                                               </td>
                                               <td className="py-2 text-slate-600">{stat.conversion}%</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                   ) : (
                       // PERSONAL VIEW
                       <>
                           {/* Coaching Tips */}
                           <div className="grid grid-cols-1 gap-3">
                               {coachingTips.length === 0 && <p className="text-xs text-slate-400 italic">No immediate tips.</p>}
                               {coachingTips.map(tip => (
                                   <div key={tip.id} className={`p-3 rounded-lg border shadow-sm flex gap-3 items-start ${tip.type === 'alert' ? 'bg-red-50 border-red-100' : tip.type === 'praise' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                                       <div className={`p-1.5 rounded-full ${tip.type === 'alert' ? 'bg-red-100 text-red-600' : tip.type === 'praise' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                           <Lightbulb className="w-4 h-4" />
                                       </div>
                                       <div>
                                           <h5 className={`text-xs font-bold mb-0.5 ${tip.type === 'alert' ? 'text-red-800' : tip.type === 'praise' ? 'text-green-800' : 'text-blue-800'}`}>{tip.title}</h5>
                                           <p className="text-xs text-slate-600 mb-2">{tip.message}</p>
                                           {tip.actionable && (
                                               <div className="bg-white/50 p-2 rounded text-[10px] font-medium border border-black/5 flex items-center gap-1">
                                                   <Sparkles className="w-3 h-3 opacity-70" /> {tip.actionable}
                                               </div>
                                           )}
                                       </div>
                                   </div>
                               ))}
                           </div>

                           {/* Module Generator */}
                           <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                               {trainingModules.length === 0 ? (
                                   <div className="py-4">
                                       <GraduationCap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                       <p className="text-xs text-slate-500 mb-3">Generate personalized training based on your recent chats.</p>
                                       <button 
                                            onClick={handleGenerateTraining}
                                            disabled={isGeneratingTraining}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                                       >
                                           {isGeneratingTraining ? 'Generating Curriculum...' : 'Create Training Program'}
                                       </button>
                                   </div>
                               ) : (
                                   <div className="text-left space-y-4">
                                       <div className="flex justify-between items-center">
                                            <h5 className="text-sm font-bold text-slate-800">Your Curriculum</h5>
                                            <button onClick={() => setTrainingModules([])} className="text-[10px] text-red-500 hover:underline">Clear</button>
                                       </div>
                                       {trainingModules.map(module => (
                                           <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                               <div className="bg-slate-50 p-3 border-b border-slate-200">
                                                   <div className="flex justify-between items-start">
                                                       <div>
                                                           <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500">{module.focusArea}</span>
                                                           <h6 className="text-sm font-bold text-slate-800">{module.title}</h6>
                                                       </div>
                                                   </div>
                                                   <p className="text-xs text-slate-500 mt-1">{module.description}</p>
                                               </div>
                                               <div className="p-3 space-y-3 bg-white">
                                                   <div>
                                                       <span className="text-[10px] font-bold text-slate-400 uppercase">Suggested Phrases</span>
                                                       <div className="flex flex-wrap gap-1 mt-1">
                                                           {module.suggestedPhrases.map((p, i) => (
                                                               <span key={i} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">{p}</span>
                                                           ))}
                                                       </div>
                                                   </div>
                                                   <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                                       <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Roleplay Scenario</span>
                                                       <p className="text-xs text-slate-600 italic mb-2">"{module.scenarios[0].situation}"</p>
                                                       <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                           <div className="text-red-600 bg-red-50 p-1 rounded">
                                                               <strong>Poor:</strong> {module.scenarios[0].poorResponse}
                                                           </div>
                                                           <div className="text-green-600 bg-green-50 p-1 rounded">
                                                               <strong>Better:</strong> {module.scenarios[0].betterResponse}
                                                           </div>
                                                       </div>
                                                   </div>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                       </>
                   )}
               </div>
            )}
        </div>
    </div>
  );
};

export default AnalyticsDashboard;
