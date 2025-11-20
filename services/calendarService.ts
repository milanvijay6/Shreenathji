
import { CalendarEvent } from '../types';

export const CalendarService = {
  connectProvider: async (provider: 'google' | 'outlook'): Promise<boolean> => {
    // Simulate OAuth
    return new Promise(resolve => setTimeout(() => resolve(true), 1500));
  },

  getEvents: async (): Promise<CalendarEvent[]> => {
    // Mock Sync
    return [
      {
        id: 'evt-1',
        title: 'Follow up with David Chen',
        start: Date.now() + 86400000, // Tomorrow
        end: Date.now() + 86400000 + 3600000,
        type: 'follow_up',
        status: 'pending',
        importerId: '1'
      },
      {
        id: 'evt-2',
        title: 'Strategy Meeting',
        start: Date.now() + 172800000, // Day after tomorrow
        end: Date.now() + 172800000 + 3600000,
        type: 'meeting',
        status: 'pending'
      }
    ];
  }
};
