
import { Importer, Message, SentimentData, EmotionData, SentimentLabel, EmotionLabel, LeadStatus, StrategicInsight, CoachingTip } from '../types';

export interface SentimentTrendPoint {
  date: string;
  timestamp: number;
  Positive: number;
  Neutral: number;
  Negative: number;
  Critical: number;
}

export interface EmotionDistributionPoint {
  name: string;
  count: number;
  avgConfidence: number;
  fill: string;
}

export const AnalyticsService = {
  /**
   * Aggregates sentiment data from chat history over a specific timeframe.
   * Returns data suitable for a Stacked Area Chart.
   */
  getSentimentTrend: (importers: Importer[], days: number): SentimentTrendPoint[] => {
    const now = Date.now();
    const msPerDay = 86400000;
    const startDate = now - (days * msPerDay);

    // Initialize map for the date range
    const dateMap = new Map<string, SentimentTrendPoint>();
    
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate + (i * msPerDay));
        const dateKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dateMap.set(dateKey, {
            date: dateKey,
            timestamp: d.getTime(),
            Positive: 0,
            Neutral: 0,
            Negative: 0,
            Critical: 0
        });
    }

    // Iterate all messages to find sentiment snapshots
    importers.forEach(imp => {
        imp.chatHistory.forEach(msg => {
            if (msg.timestamp < startDate) return;
            
            const dateKey = new Date(msg.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const point = dateMap.get(dateKey);
            
            if (point) {
                let label: SentimentLabel = 'Neutral';
                
                if (msg.sentiment) {
                    label = msg.sentiment.label;
                } else if (imp.sentimentAnalysis && Math.abs(msg.timestamp - (imp.lastContacted || 0)) < msPerDay) {
                     label = imp.sentimentAnalysis.label;
                }

                if (point[label] !== undefined) {
                    point[label]++;
                }
            }
        });
    });

    return Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Aggregates the distribution of detected emotions across the active lead base.
   */
  getEmotionDistribution: (importers: Importer[]): EmotionDistributionPoint[] => {
    const emotionMap = new Map<string, { count: number, totalConf: number, color: string }>();

    // Define colors
    const colors: Record<string, string> = {
        'Frustration': '#ef4444', // Red
        'Confusion': '#f59e0b',   // Amber
        'Urgency': '#f97316',     // Orange
        'Enthusiasm': '#8b5cf6',  // Violet
        'Gratitude': '#10b981',   // Emerald
        'Skepticism': '#64748b'   // Slate
    };

    importers.forEach(imp => {
        if (!imp.detectedEmotions) return;
        
        imp.detectedEmotions.forEach(emo => {
            // Filter out low confidence
            if (emo.confidence < 0.4) return;

            const current = emotionMap.get(emo.label) || { count: 0, totalConf: 0, color: colors[emo.label] || '#94a3b8' };
            emotionMap.set(emo.label, {
                count: current.count + 1,
                totalConf: current.totalConf + emo.confidence,
                color: current.color
            });
        });
    });

    return Array.from(emotionMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        avgConfidence: data.totalConf / data.count,
        fill: data.color
    })).sort((a, b) => b.count - a.count);
  },

  /**
   * Retrieves granular snippets based on criteria for drill-down.
   */
  getSentimentSnippets: (importers: Importer[], dateStr: string, sentiment: SentimentLabel): {id: string, name: string, content: string, timestamp: number}[] => {
      const snippets: {id: string, name: string, content: string, timestamp: number}[] = [];
      
      importers.forEach(imp => {
          imp.chatHistory.forEach(msg => {
              const d = new Date(msg.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              // Check date match
              if (d !== dateStr) return;
              
              // Check sentiment match
              const label = msg.sentiment ? msg.sentiment.label : (Math.abs(msg.timestamp - (imp.lastContacted||0)) < 86400000 ? imp.sentimentAnalysis?.label : 'Neutral');
              
              if (label === sentiment) {
                  snippets.push({
                      id: msg.id,
                      name: imp.companyName,
                      content: msg.content,
                      timestamp: msg.timestamp
                  });
              }
          });
      });
      return snippets.slice(0, 20); // Limit
  },

  getEmotionSnippets: (importers: Importer[], emotionLabel: string): {id: string, name: string, content: string, timestamp: number}[] => {
      const snippets: {id: string, name: string, content: string, timestamp: number}[] = [];
      
      importers.forEach(imp => {
          if (imp.detectedEmotions && imp.detectedEmotions.some(e => e.label === emotionLabel && e.confidence > 0.5)) {
              // Get last 2 messages to show context
              const relevantMsgs = imp.chatHistory.slice(-2);
              relevantMsgs.forEach(msg => {
                  snippets.push({
                      id: msg.id,
                      name: imp.companyName,
                      content: msg.content,
                      timestamp: msg.timestamp
                  });
              });
          }
      });
      return snippets.slice(0, 20);
  },

  /**
   * Generates high-level strategic insights by correlating outcomes with emotions/sentiment.
   */
  generateStrategicInsights: (importers: Importer[]): StrategicInsight[] => {
      const insights: StrategicInsight[] = [];
      
      const coldLeads = importers.filter(i => i.status === LeadStatus.COLD || i.status === LeadStatus.CLOSED);
      const wonLeads = importers.filter(i => i.status === LeadStatus.INTERESTED || i.status === LeadStatus.SAMPLE_SENT || i.status === LeadStatus.NEGOTIATION);
      
      // 1. PATTERN: Confusion in Lost Deals
      let confusedInCold = 0;
      coldLeads.forEach(i => {
          if (i.detectedEmotions?.some(e => e.label === 'Confusion')) confusedInCold++;
      });
      
      if (coldLeads.length > 0 && (confusedInCold / coldLeads.length) > 0.3) {
          insights.push({
              id: 'ins-confusion',
              type: 'correlation',
              category: 'negative',
              title: 'Confusion Correlates with Loss',
              description: `${Math.round((confusedInCold / coldLeads.length) * 100)}% of lost/cold leads expressed confusion. Consider simplifying pricing or terms early in the chat.`,
              impactScore: 80
          });
      }

      // 2. PATTERN: Gratitude in Won Deals
      let gratitudeInWon = 0;
      wonLeads.forEach(i => {
           if (i.detectedEmotions?.some(e => e.label === 'Gratitude' || e.label === 'Enthusiasm')) gratitudeInWon++;
      });
      
      if (wonLeads.length > 0 && (gratitudeInWon / wonLeads.length) > 0.5) {
           insights.push({
              id: 'ins-gratitude',
              type: 'correlation',
              category: 'positive',
              title: 'High Empathy Drive Success',
              description: `Leads expressing Gratitude or Enthusiasm are ${(gratitudeInWon / wonLeads.length * 100).toFixed(0)}% more likely to reach Negotiation.`,
              impactScore: 65
          });
      }

      // 3. SNIPPET: Poor Practice (Critical Sentiment)
      const criticalLeads = importers.filter(i => i.sentimentAnalysis?.label === 'Critical');
      if (criticalLeads.length > 0) {
          const snippets = criticalLeads.slice(0, 3).map(i => {
               const lastMsg = i.chatHistory.filter(m => m.sender === 'agent').pop();
               return lastMsg ? `"${lastMsg.content.substring(0, 60)}..." (Lead: ${i.companyName})` : '';
          }).filter(s => s);
          
          if (snippets.length > 0) {
              insights.push({
                  id: 'ins-critical-snippet',
                  type: 'snippet',
                  category: 'negative',
                  title: 'High Friction Interactions',
                  description: 'These recent agent messages preceded a Critical sentiment flag. Review tone.',
                  dataPoints: snippets
              });
          }
      }

      // 4. SNIPPET: Best Practice (High Satisfaction)
      const happyLeads = importers.filter(i => i.satisfactionIndex && i.satisfactionIndex > 85);
      if (happyLeads.length > 0) {
          const snippets = happyLeads.slice(0, 3).map(i => {
               const lastMsg = i.chatHistory.filter(m => m.sender === 'agent').pop();
               return lastMsg ? `"${lastMsg.content.substring(0, 60)}..." (Lead: ${i.companyName})` : '';
          }).filter(s => s);

           if (snippets.length > 0) {
              insights.push({
                  id: 'ins-best-practice',
                  type: 'snippet',
                  category: 'positive',
                  title: 'Successful Engagement Patterns',
                  description: 'Messages from highly satisfied leads. Use these as examples for the team.',
                  dataPoints: snippets
              });
          }
      }

      return insights;
  },

  /**
   * Generates immediate, rule-based coaching tips.
   */
  generateCoachingTips: (importers: Importer[]): CoachingTip[] => {
    const tips: CoachingTip[] = [];
    const avgSatisfaction = importers.length > 0 
      ? importers.reduce((acc, i) => acc + (i.satisfactionIndex || 50), 0) / importers.length 
      : 50;

    if (avgSatisfaction < 55) {
        tips.push({
            id: 'tip-sat-low',
            type: 'alert',
            title: 'Satisfaction Dip',
            message: 'Average Satisfaction is below 55. Customers may feel unheard.',
            actionable: 'Focus on acknowledging their needs before pitching products.'
        });
    } else if (avgSatisfaction > 80) {
        tips.push({
            id: 'tip-sat-high',
            type: 'praise',
            title: 'Excellent Engagement',
            message: 'Satisfaction is high. Your current tone is resonating well!',
            actionable: 'Share your recent "Best Practice" snippets with the team.'
        });
    }

    const confusionCount = importers.filter(i => i.detectedEmotions?.some(e => e.label === 'Confusion')).length;
    if (confusionCount > 2) {
        tips.push({
            id: 'tip-confusion',
            type: 'suggestion',
            title: 'Clarify Value Props',
            message: `Detected confusion in ${confusionCount} leads.`,
            actionable: 'Try simpler sentences. Avoid jargon like "FOB" if they seem new.'
        });
    }

    return tips;
  },

  /**
   * Calculates team skill tracking stats (mocked for single user context).
   */
  getSkillImprovementMetrics: (importers: Importer[]): { label: string, score: number, trend: 'up' | 'down' | 'flat' }[] => {
      const baseScore = importers.length > 0 
        ? importers.reduce((acc, i) => acc + (i.satisfactionIndex || 50), 0) / importers.length
        : 50;
        
      return [
          { label: 'Empathy', score: Math.round(baseScore + 5), trend: 'up' },
          { label: 'Clarity', score: Math.round(baseScore - 2), trend: 'flat' },
          { label: 'Response Time', score: 85, trend: 'up' },
          { label: 'Closing', score: Math.round(baseScore - 10), trend: 'down' },
      ];
  },
  
  /**
   * Mocks a team leaderboard for Manager View.
   */
  getTeamStats: () => {
      return [
          { name: 'Demo User (You)', leads: 12, satisfaction: 78, conversion: 25 },
          { name: 'Sarah Jenkins', leads: 45, satisfaction: 82, conversion: 31 },
          { name: 'Mike Ross', leads: 38, satisfaction: 65, conversion: 18 },
          { name: 'Jessica Pearson', leads: 22, satisfaction: 91, conversion: 45 },
      ];
  },

  // --- EXPORT FUNCTIONS ---

  triggerDownload: (filename: string, content: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  },

  exportLeadsPerformance: (importers: Importer[]) => {
      const headers = ['ID', 'Company Name', 'Country', 'Status', 'Lead Score', 'Satisfaction Index', 'Total Interactions', 'Last Contacted', 'Channel'];
      const rows = importers.map(i => [
          i.id,
          `"${i.companyName}"`,
          i.country,
          i.status,
          i.leadScore || 0,
          i.satisfactionIndex || 50,
          i.chatHistory.length,
          i.lastContacted ? new Date(i.lastContacted).toISOString() : '',
          i.preferredChannel
      ]);
      
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      AnalyticsService.triggerDownload(`GlobalReach_Performance_${new Date().toISOString().split('T')[0]}.csv`, csv);
  },

  exportSentimentReport: (importers: Importer[]) => {
      const headers = ['ID', 'Company Name', 'Sentiment Label', 'Sentiment Score (-1 to 1)', 'Intensity (0-1)', 'Critical Alert', 'Primary Emotion', 'Emotion Confidence', 'Conversation Summary'];
      
      const rows = importers.map(i => {
          const primaryEmotion = i.detectedEmotions && i.detectedEmotions.length > 0 
              ? i.detectedEmotions.reduce((prev, current) => (prev.confidence > current.confidence) ? prev : current)
              : { label: 'None', confidence: 0 };

          return [
              i.id,
              `"${i.companyName}"`,
              i.sentimentAnalysis?.label || 'Neutral',
              i.sentimentAnalysis?.score || 0,
              i.sentimentAnalysis?.intensity || 0,
              i.sentimentAnalysis?.label === 'Critical' ? 'YES' : 'NO',
              primaryEmotion.label,
              primaryEmotion.confidence.toFixed(2),
              `"${(i.conversationSummary || '').replace(/"/g, '""')}"`
          ];
      });

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      AnalyticsService.triggerDownload(`GlobalReach_Sentiment_${new Date().toISOString().split('T')[0]}.csv`, csv);
  }
};
