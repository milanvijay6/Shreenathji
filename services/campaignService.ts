
import { Importer, Campaign, AppTemplates, Channel, LeadStatus, MessageStatus, Enrollment } from '../types';
import { generateCampaignMessage } from './geminiService';
import { MessagingService } from './messagingService';

// In-memory store for enrollments (in a real app, this would be DB backed)
let activeEnrollments: Enrollment[] = [];

export const CampaignService = {
  enroll: (importerId: string, campaignId: string) => {
    // Remove existing enrollment if any
    activeEnrollments = activeEnrollments.filter(e => e.importerId !== importerId);
    
    activeEnrollments.push({
      importerId,
      campaignId,
      currentStepIndex: 0,
      nextRunTime: Date.now(), // Start immediately (or handled by dayOffset in logic)
      status: 'active'
    });
  },

  stopEnrollment: (importerId: string) => {
    const enrollment = activeEnrollments.find(e => e.importerId === importerId && e.status === 'active');
    if (enrollment) {
      enrollment.status = 'stopped';
      console.log(`[Campaign] Stopped campaign for ${importerId} due to reply/intervention.`);
    }
  },

  processCampaigns: async (
    importers: Importer[],
    campaigns: Campaign[],
    templates: AppTemplates,
    sendMessageFn: (importer: Importer, content: string, channel: Channel) => Promise<{ success: boolean }>
  ) => {
    const now = Date.now();
    const updatedImportersMap = new Map<string, Importer>();
    const newEvents: any[] = [];

    for (const enrollment of activeEnrollments) {
      if (enrollment.status !== 'active') continue;
      if (now < enrollment.nextRunTime) continue;

      const campaign = campaigns.find(c => c.id === enrollment.campaignId);
      if (!campaign || campaign.status !== 'active') continue;

      const step = campaign.steps[enrollment.currentStepIndex];
      if (!step) {
        enrollment.status = 'completed';
        continue;
      }

      // Get fresh importer state (or from map if already modified in this tick)
      const importer = updatedImportersMap.get(enrollment.importerId) || importers.find(i => i.id === enrollment.importerId);
      if (!importer || importer.status === LeadStatus.CLOSED || importer.status === LeadStatus.COLD) {
        enrollment.status = 'stopped';
        continue;
      }

      // Execute Step
      console.log(`[Campaign] Executing step ${enrollment.currentStepIndex + 1} for ${importer.name}`);
      
      // Generate Content
      const content = await generateCampaignMessage(
        importer, 
        "Global Exports", 
        "Agri-Products", 
        step.template, 
        step.channel
      );

      if (content.startsWith("Error")) {
        console.warn(`[Campaign] Failed to generate message for ${importer.id}`);
        continue; // Retry next tick
      }

      // Send
      const result = await sendMessageFn(importer, content, step.channel);
      
      if (result.success) {
        // Create Calendar Event for the log
        newEvents.push({
          id: `evt-${Date.now()}-${importer.id}`,
          title: `Campaign Sent: ${campaign.name} (Step ${enrollment.currentStepIndex + 1})`,
          start: Date.now(),
          end: Date.now() + 1000 * 60 * 30,
          importerId: importer.id,
          type: 'campaign_step',
          status: 'done'
        });

        // Advance Step
        enrollment.currentStepIndex++;
        const nextStep = campaign.steps[enrollment.currentStepIndex];
        
        if (nextStep) {
          // Schedule next run
          // Logic: Current Time + Day Offset of next step - Day Offset of current step
          // Simplified: Just add 24h * (nextOffset - currentOffset)
          const delayDays = nextStep.dayOffset - step.dayOffset;
          enrollment.nextRunTime = now + (delayDays * 24 * 60 * 60 * 1000);
        } else {
          enrollment.status = 'completed';
        }

        // Update Importer in memory to reflect changes (log is handled by sendMessageFn usually, but we might need to update status)
        // Here we rely on the sendMessageFn to update the chat history/log in the App state
      }
    }

    return { 
      importers: Array.from(updatedImportersMap.values()).length > 0 ? Array.from(updatedImportersMap.values()) : null,
      events: newEvents 
    };
  }
};
