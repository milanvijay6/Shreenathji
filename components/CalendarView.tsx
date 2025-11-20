
import React from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, Video, Mail } from 'lucide-react';

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (eventId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onEventClick }) => {
  // Simplified: Displays next 7 days
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return d;
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.start);
      return eDate.getDate() === date.getDate() && 
             eDate.getMonth() === date.getMonth() &&
             eDate.getFullYear() === date.getFullYear();
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'meeting': return <Video className="w-3 h-3" />;
      case 'follow_up': return <Clock className="w-3 h-3" />;
      default: return <Mail className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CalIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Schedule</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-1.5 hover:bg-slate-100 rounded"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
          <button className="p-1.5 hover:bg-slate-100 rounded"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {dates.map((date, i) => (
          <div key={i} className="flex-1 border-r border-slate-200 last:border-r-0 flex flex-col min-w-[120px]">
            <div className={`p-3 text-center border-b border-slate-100 ${i === 0 ? 'bg-indigo-50' : 'bg-white'}`}>
              <span className={`text-xs font-bold uppercase block ${i === 0 ? 'text-indigo-600' : 'text-slate-500'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-xl font-bold block ${i === 0 ? 'text-indigo-700' : 'text-slate-800'}`}>
                {date.getDate()}
              </span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-slate-50/50">
              {getEventsForDate(date).length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 italic">No events</span>
                </div>
              )}
              {getEventsForDate(date).map(evt => (
                <button 
                  key={evt.id}
                  onClick={() => onEventClick(evt.id)}
                  className={`w-full text-left p-2 rounded border shadow-sm text-xs hover:shadow-md transition-all
                    ${evt.type === 'meeting' ? 'bg-purple-100 border-purple-200 text-purple-800' : 
                      evt.type === 'campaign_step' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-700'}
                  `}
                >
                  <div className="flex justify-between items-center mb-1 opacity-70">
                    <span className="flex items-center gap-1">{getIcon(evt.type)} {evt.type.replace('_', ' ')}</span>
                    <span>{new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                  </div>
                  <div className="font-bold truncate">{evt.title}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
