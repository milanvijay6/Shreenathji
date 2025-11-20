
export enum Channel {
  WHATSAPP = 'WhatsApp',
  WECHAT = 'WeChat',
  EMAIL = 'Email',
  SMS = 'SMS',
}

export enum LeadStatus {
  PENDING = 'Pending', // Not contacted
  CONTACTED = 'Contacted', // Initial message sent
  ENGAGED = 'Engaged', // Reply received
  INTERESTED = 'Interested', // Qualified lead
  NEGOTIATION = 'Negotiation',
  SAMPLE_SENT = 'Sample Sent',
  CLOSED = 'Closed', // Deal done or lost
  COLD = 'Cold', // Not interested
}

export enum UserRole {
  ADMIN = 'Admin',
  SALES = 'Sales',
  VIEWER = 'Viewer'
}

export enum PlatformStatus {
  DISCONNECTED = 'Disconnected',
  CONNECTING = 'Connecting',
  CONNECTED = 'Connected',
  ERROR = 'Error'
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',       // Server acknowledged
  DELIVERED = 'delivered', // Recipient device received
  READ = 'read',       // Recipient opened
  FAILED = 'failed'
}

export interface PlatformConnection {
  channel: Channel;
  status: PlatformStatus;
  accountName?: string; // e.g., +1 (555) 123-4567 or user@example.com
  connectedAt?: number;
  provider?: 'google' | 'microsoft' | 'custom' | 'whatsapp' | 'wechat';
  lastTested?: number;
  healthStatus?: 'healthy' | 'error';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  device: string;
  ip: string;
  lastActive: number;
  isCurrent: boolean;
}

export type Language = 'en' | 'es' | 'zh';
export type SentimentLabel = 'Positive' | 'Neutral' | 'Negative' | 'Critical';
export type EmotionLabel = 'Frustration' | 'Confusion' | 'Enthusiasm' | 'Urgency' | 'Skepticism' | 'Gratitude';

export interface SentimentData {
  label: SentimentLabel;
  score: number;      // -1.0 (Negative) to 1.0 (Positive)
  intensity: number;  // 0.0 (Weak) to 1.0 (Strong)
}

export interface EmotionData {
  label: EmotionLabel;
  confidence: number; // 0.0 to 1.0
}

export interface Message {
  id: string;
  sender: 'agent' | 'importer' | 'system';
  content: string;
  timestamp: number;
  channel: Channel;
  status?: MessageStatus;
  sentiment?: SentimentData; // Granular sentiment per message
  feedback?: 'helpful' | 'unhelpful'; // User feedback for AI optimization
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  type: 'status_change' | 'note' | 'validation' | 'system';
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  emailMxValid?: boolean | null; // null = checking, true = valid, false = invalid
  whatsappAvailable?: boolean | null;
  wechatAvailable?: boolean | null;
  checkedAt: number;
}

export interface Importer {
  id: string;
  name: string;
  companyName: string;
  country: string;
  contactDetail: string; // Phone or Email
  productsImported: string;
  quantity: string;
  priceRange: string;
  
  // Computed/AI Updated Fields
  interestShownIn?: string;
  conversationSummary?: string;
  nextStep?: string;
  status: LeadStatus;
  chatHistory: Message[];
  activityLog: ActivityLogEntry[];
  
  // Channel Preferences
  preferredChannel: Channel;
  channelSelectionMode?: 'auto' | 'manual';

  needsHumanReview?: boolean; // New: Escalation flag
  
  // Intelligent Insights & Scoring
  leadScore?: number; // 0-100 (Buying Likelihood)
  satisfactionIndex?: number; // 0-100 (Overall Happiness)
  
  sentimentAnalysis?: SentimentData;
  detectedEmotions?: EmotionData[];

  // Validation & Metadata
  validation: ValidationResult;
  lastContacted?: number;
}

export interface AnalysisResult {
  status: LeadStatus;
  summary: string;
  nextStep: string;
  interestShownIn: string;
  requiresHumanReview: boolean;
  leadScore: number; // Buying Intent
  satisfactionIndex: number; // Relationship Health
  sentiment: SentimentData;
  emotions: EmotionData[];
}

export interface DashboardStats {
  total: number;
  contacted: number;
  interested: number;
  conversionRate: number;
}

export interface AppTemplates {
  introTemplate: string;
  agentSystemInstruction: string;
}

export interface NotificationConfig {
  emailQualified: boolean; // Email user when lead becomes Interested
  pushMessages: boolean;   // Browser push for new inbound messages
  dailyDigest: boolean;    // Daily summary email
  criticalAlerts: boolean; // Alert on Critical sentiment
}

export interface ReportConfig {
  timeFrame: '7d' | '30d' | '90d' | 'all';
  kpis: {
    revenue: boolean;
    conversion: boolean;
    leads: boolean;
  };
  exportSchedule: 'daily' | 'weekly' | 'monthly' | 'never';
  emailRecipients: string;
}

export interface SalesForecast {
  date: string;
  predictedConversions: number;
  confidence: number; // 0-1
}

export interface WebhookConfig {
  webhookToken: string;
  tunnelUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  steps: CampaignStep[];
  status: 'active' | 'paused' | 'draft';
  createdAt: number;
}

export interface CampaignStep {
  id: string;
  dayOffset: number; // Days after enrollment
  channel: Channel;
  template: string; // With placeholders
}

export interface Enrollment {
  importerId: string;
  campaignId: string;
  currentStepIndex: number; // 0 = waiting for step 0
  nextRunTime: number; // Timestamp
  status: 'active' | 'completed' | 'stopped';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  importerId?: string;
  type: 'follow_up' | 'meeting' | 'campaign_step';
  status: 'pending' | 'done';
}

export interface OptimizationInsight {
    strengths: string[];
    weaknesses: string[];
    suggestedIntro: string;
    suggestedSystemInstruction: string;
    reasoning: string;
}

export interface MessageFeedback {
    messageId: string;
    isHelpful: boolean;
}

export interface StrategicInsight {
    id: string;
    type: 'pattern' | 'correlation' | 'snippet';
    category: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    impactScore?: number; // 0-100 impact on sales
    dataPoints?: string[]; // Snippets or stats
}

export interface TrainingModule {
  id: string;
  title: string;
  focusArea: 'Empathy' | 'Technique' | 'Intervention';
  description: string;
  scenarios: {
    situation: string;
    poorResponse: string;
    betterResponse: string;
    explanation: string;
  }[];
  suggestedPhrases: string[];
  toneAdjustments: string[];
}

export interface CoachingTip {
  id: string;
  type: 'alert' | 'suggestion' | 'praise';
  title: string;
  message: string;
  actionable?: string;
}

// Default Templates
export const DEFAULT_TEMPLATES: AppTemplates = {
  introTemplate: `Hello {{importerName}},
I noticed from your import profile that you are working with {{productCategory}}.
We supply high-quality {{myProduct}} that match the specifications typically required in your market.

We can offer:
Product: {{myProduct}}
Quality: High Grade
Capacity: Large Volume Available
Price Range: Competitive International Standards

If you are currently exploring suppliers, I would be happy to share details and samples.
May I know your current requirement and quantity?

Regards,
{{myCompany}}`,
  
  agentSystemInstruction: `You are an expert export sales representative for {{myCompany}}.
Goal: Build trust, qualify the lead, and move towards sending samples or a price quote.
Tone: Professional, polite, concise, solution-oriented. International Business English.

Instructions:
- Answer their specific questions.
- If they ask for price, give a general range or ask for specific Incoterms/Port.
- Always end with a small question to keep the conversation moving.
- Keep it under 100 words.
- If the user seems angry, confused, or asks for a manager, flag for human review.`
};

export const DEFAULT_NOTIFICATIONS: NotificationConfig = {
  emailQualified: true,
  pushMessages: true,
  dailyDigest: false,
  criticalAlerts: true
};

export const canEditSettings = (role: UserRole) => role === UserRole.ADMIN;
export const canExportData = (role: UserRole) => role === UserRole.ADMIN;
export const canSendMessages = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.SALES;
