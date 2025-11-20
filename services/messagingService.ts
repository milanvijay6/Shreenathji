
import { Channel, MessageStatus } from '../types';

// Types for the internal mock event system
type IncomingHandler = (importerId: string | null, contactDetail: string, content: string, channel: Channel) => void;
type StatusUpdateHandler = (messageId: string, status: MessageStatus) => void;
type TypingHandler = (importerId: string, isTyping: boolean) => void;

let incomingListener: IncomingHandler | null = null;
let statusListener: StatusUpdateHandler | null = null;
let typingListener: TypingHandler | null = null;

export const MessagingService = {
  /**
   * Simulates sending a message through a specific provider API.
   * Handles encryption wrapping (WhatsApp), SMTP handshake (Email), etc.
   */
  sendMessage: async (
    messageId: string, 
    to: string, 
    content: string, 
    channel: Channel
  ): Promise<{ success: boolean; error?: string }> => {
    
    console.log(`[MessagingService] Outgoing via ${channel} to ${to}:`, content.substring(0, 20) + '...');

    // 1. Simulate Network Latency based on Channel
    const latency = channel === Channel.EMAIL ? 1500 : 600; // Email is slower than IM
    await new Promise(resolve => setTimeout(resolve, latency));

    // 2. Simulate Protocol Handshake & "Sent" status
    if (Math.random() > 0.98) {
      // 2% simulated failure rate
      return { success: false, error: 'Gateway Timeout' };
    }

    // Notify app that message left the server (SENT)
    if (statusListener) statusListener(messageId, MessageStatus.SENT);

    // 3. Simulate Delivery Receipt (Async)
    // WhatsApp/WeChat usually show 'Delivered' quickly. Email takes longer to 'Open'.
    const deliveryDelay = channel === Channel.EMAIL ? 3000 : 1000;
    
    setTimeout(() => {
      if (statusListener) statusListener(messageId, MessageStatus.DELIVERED);
      
      // 4. Simulate Read Receipt (Randomly)
      if (Math.random() > 0.3) {
         setTimeout(() => {
             if (statusListener) statusListener(messageId, MessageStatus.READ);
         }, 2000 + Math.random() * 4000);
      }
    }, deliveryDelay);

    return { success: true };
  },

  /**
   * Register a callback for when new messages arrive via Webhook/Socket
   */
  onIncomingMessage: (handler: IncomingHandler) => {
    incomingListener = handler;
  },

  /**
   * Register a callback for message status updates (Sent/Delivered/Read)
   */
  onMessageStatusUpdate: (handler: StatusUpdateHandler) => {
    statusListener = handler;
  },

  /**
   * Register a callback for typing indicators
   */
  onTypingStatus: (handler: TypingHandler) => {
    typingListener = handler;
  },

  /**
   * Internal helper to trigger a mock incoming message.
   * Used by the AI Simulator to inject replies.
   */
  receiveMockReply: (importerId: string, content: string, channel: Channel) => {
    // 1. Simulate "Typing Started"
    if (typingListener) typingListener(importerId, true);

    // Calculate a realistic typing duration based on length
    const typingDuration = Math.min(1000 + content.length * 30, 4000);

    setTimeout(() => {
        // 2. Simulate "Typing Stopped"
        if (typingListener) typingListener(importerId, false);

        // 3. Deliver Message
        if (incomingListener) {
            // For mock purposes we pass importerId directly
            incomingListener(importerId, 'unknown-contact', content, channel);
        }
    }, typingDuration);
  }
};
