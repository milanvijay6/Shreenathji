
import { Importer, ValidationResult, Channel } from '../types';

export const validateContactFormat = (contact: string): { isValid: boolean; errors: string[]; channel: Channel } => {
  const errors: string[] = [];
  let channel = Channel.EMAIL;
  
  if (!contact || contact.trim().length === 0) {
    return { isValid: false, errors: ['Contact details missing'], channel: Channel.EMAIL };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Simple phone regex: allows +, spaces, digits, dashes. Min 7 digits.
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
  const hasMinDigits = (contact.match(/\d/g) || []).length >= 7;

  if (contact.includes('@')) {
    if (!emailRegex.test(contact)) {
      errors.push('Invalid email format');
    }
    channel = Channel.EMAIL;
  } else {
    channel = Channel.WHATSAPP; // Default to WhatsApp for phone numbers
    if (!hasMinDigits) {
      errors.push('Phone number too short');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    channel
  };
};

/**
 * Simulates an asynchronous check for MX records (Email) or WhatsApp/WeChat capability (Phone).
 * Returns a partial ValidationResult to be merged.
 */
export const simulateNetworkValidation = async (contact: string, channel: Channel): Promise<Partial<ValidationResult>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));

  const isLucky = Math.random() > 0.1; // 90% success rate for demo purposes

  if (channel === Channel.EMAIL) {
    return {
      emailMxValid: isLucky,
      whatsappAvailable: null,
      wechatAvailable: null
    };
  } else {
    // For phones, we simulate checking both WhatsApp and WeChat
    return {
      emailMxValid: null,
      whatsappAvailable: Math.random() > 0.2, // 80% have WhatsApp
      wechatAvailable: Math.random() > 0.8  // 20% have WeChat
    };
  }
};

/**
 * Helper to create initial validation state
 */
export const getInitialValidationState = (contact: string): ValidationResult => {
  const formatCheck = validateContactFormat(contact);
  return {
    isValid: formatCheck.isValid,
    errors: formatCheck.errors,
    emailMxValid: null,
    whatsappAvailable: null,
    wechatAvailable: null,
    checkedAt: Date.now()
  };
};

/**
 * Determines the best channel based on validation results and priority rules.
 * Priority: WhatsApp > WeChat > Email > SMS
 */
export const getOptimalChannel = (validation: ValidationResult): Channel => {
  if (validation.whatsappAvailable === true) return Channel.WHATSAPP;
  if (validation.wechatAvailable === true) return Channel.WECHAT;
  if (validation.emailMxValid === true) return Channel.EMAIL;
  
  // Fallback logic if explicit checks failed or are pending, rely on format
  // If it looks like an email and MX check isn't explicitly false, use email
  if (validation.emailMxValid !== false && !validation.whatsappAvailable && !validation.wechatAvailable) {
     // Check if original format was email (implicitly handled by app logic usually, but here we default to SMS if unsure)
     return Channel.SMS; 
  }
  
  return Channel.SMS;
};
