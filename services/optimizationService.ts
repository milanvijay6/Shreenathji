
import { Importer, AppTemplates, OptimizationInsight, LeadStatus } from '../types';
import { analyzeAndOptimize } from './geminiService';

export const OptimizationService = {
  
  /**
   * Extracts conversation snippets from "Successful" and "Failed" interactions
   * and uses Gemini to generate improved templates.
   */
  generateTemplateImprovements: async (
    importers: Importer[],
    currentTemplates: AppTemplates
  ): Promise<OptimizationInsight> => {
    
    // 1. Filter Successful Leads (High Satisfaction + Interested/Negotiation)
    const successfulLeads = importers.filter(i => 
      (i.satisfactionIndex && i.satisfactionIndex > 70) || 
      [LeadStatus.INTERESTED, LeadStatus.NEGOTIATION, LeadStatus.SAMPLE_SENT].includes(i.status)
    );

    // 2. Filter Needs Improvement Leads (Critical Sentiment or Low Satisfaction)
    const failedLeads = importers.filter(i => 
      (i.satisfactionIndex && i.satisfactionIndex < 40) ||
      i.sentimentAnalysis?.label === 'Critical' ||
      i.sentimentAnalysis?.label === 'Negative'
    );

    // 3. Extract Excerpts (Limit to avoid token limits)
    const getExcerpts = (leads: Importer[]) => {
        return leads.slice(0, 5).map(i => {
            const snippets = i.chatHistory
                .filter(m => m.sender === 'agent' && m.feedback === 'helpful') // Prioritize helpful messages if marked
                .slice(-3)
                .map(m => `Agent: ${m.content}`)
                .join('\n');
            
            // If no feedback, just take last few messages
            const fallback = i.chatHistory.slice(-4).map(m => `${m.sender}: ${m.content}`).join('\n');
            return `Lead: ${i.companyName}\n${snippets || fallback}`;
        }).join('\n---\n');
    };

    const successfulExcerpts = getExcerpts(successfulLeads);
    const failedExcerpts = getExcerpts(failedLeads);

    // 4. Call AI
    return await analyzeAndOptimize(successfulExcerpts, failedExcerpts, currentTemplates);
  }
};
