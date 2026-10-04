import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import {
  AlertCircle,
  Phone,
  MapPin,
  Clock,
  Radio,
  CheckCircle2,
  Trash2,
  PhoneCall,
  Navigation,
  Compass,
  Plus,
  X,
  Check,
  ShieldAlert
} from 'lucide-react';

export interface SosEvent {
  id: string;
  citizenName: string;
  phoneNumber: string;
  locationStatus: 'no fix' | 'GPS locked';
  latitude?: number;
  longitude?: number;
  barangay?: string;
  timestamp: string; // ISO string
  status: 'Active' | 'Responding' | 'Resolved';
  notes?: string;
}

// Seed with the exact record from the initial draft screenshot (9h 36m ago)
const INITIAL_SOS_EVENTS: SosEvent[] = [
  {
    id: 'sos-001',
    citizenName: 'Leb Cervantes',
    phoneNumber: '09309405122',
    locationStatus: 'no fix',
    timestamp: new Date(Date.now() - (9 * 60 + 36) * 60 * 1000).toISOString(),
    status: 'Active',
    notes: 'One-tap emergency trigger activated via mobile device without GPS lock.',
  },
];

interface LdrrmcSosLogViewProps {
  currentUser: User;
  onSelectOnMap?: (coords: { latitude: number; longitude: number; label: string }) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LdrrmcSosLogView: React.FC<LdrrmcSosLogViewProps> = ({
  currentUser,
  onSelectOnMap,
  onNavigateTab,
}) => {
  const isBarangay = currentUser?.role === 'barangay';

  // State with localStorage persistence
  const [events, setEvents] = useState<SosEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uniguard_sos_log_events');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_SOS_EVENTS;
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Resolved'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // New simulated SOS state
  const [testName, setTestName] = useState('Juan Dela Cruz');
  const [testPhone, setTestPhone] = useState('09171234567');
  const [testLocationStatus, setTestLocationStatus] = useState<'no fix' | 'GPS locked'>('GPS locked');
  const [testBarangay, setTestBarangay] = useState('Poblacion');

  const saveEvents = (updated: SosEvent[]) => {
    setEvents(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniguard_sos_log_events', JSON.stringify(updated));
    }
  };

  // Format relative time: e.g. "9h 36m ago"
  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0) return 'just now';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    if (totalMinutes < 1) return 'just now';
    if (totalMinutes < 60) return `${totalMinutes}m ago`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours < 24) {
      return `${hours}h ${mins}m ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterStatus === 'Active' && ev.status === 'Resolved') return false;
      if (filterStatus === 'Resolved' && ev.status !== 'Resolved') return false;
      return true;
    });
  }, [events, filterStatus]);

  // Handle status update
  const handleToggleStatus = (id: string) => {
    const updated = events.map((ev) => {
      if (ev.id === id) {
        const nextStatus = ev.status === 'Active' ? ('Resolved' as const) : ('Active' as const);
        return { ...ev, status: nextStatus };
      }
      return ev;
    });
    saveEvents(updated);
    setActionNotice('Updated SOS event dispatch status');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    saveEvents(updated);
  };

  // Add test emergency SOS
  const handleAddTestSos = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: SosEvent = {
      id: `sos-${Date.now().toString(36)}`,
      citizenName: testName.trim() || 'Anonymous Resident',
      phoneNumber: testPhone.trim() || '09000000000',
      locationStatus: testLocationStatus,
      latitude: testLocationStatus === 'GPS locked' ? 16.0206 : undefined,
      longitude: testLocationStatus === 'GPS locked' ? 120.2306 : undefined,
      barangay: testLocationStatus === 'GPS locked' ? testBarangay : undefined,
      timestamp: new Date().toISOString(),
      status: 'Active',
      notes: 'Incoming one-tap mobile distress broadcast.',
    };

    saveEvents([newEvent, ...events]);
    setIsTestModalOpen(false);
    setActionNotice(`Logged new SOS event for ${newEvent.citizenName}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Section: SOS Log + Subtitle + Events Counter */}
      <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-semibold tracking-tight ${
            isBarangay ? 'text-[#011025]' : 'text-neutral-900'
          }`}>
            SOS Log
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed ${
            isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
          }`}>
            Every one-tap SOS received from a citizen, newest first.
          </p>
        </div>

        {/* Top Right Actions & Counter Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full shadow-2xs transition-colors cursor-pointer ${
              isBarangay
                ? 'bg-[#052659] hover:bg-[#031c42] text-white border border-[#011025]/20'
                : 'bg-[#18181b] hover:bg-neutral-800 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate SOS</span>
          </button>

          <span className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium shadow-2xs flex items-center gap-1.5 ${
            isBarangay
              ? 'bg-[#C2E8FF]/40 text-[#052659] border border-[#7EA0C5]/40'
              : 'bg-neutral-100 text-neutral-800 border border-neutral-200/80'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isBarangay ? 'bg-[#052659]' : 'bg-[#18181b]'}`} />
            <span>{events.length} {events.length === 1 ? 'event' : 'events'}</span>
          </span>
        </div>
      </div>

      {/* Action Flash Notification */}
      {actionNotice && (
        <div className={`p-3.5 rounded-[20px] text-xs font-medium flex items-center justify-between animate-in fade-in ${
          isBarangay
            ? 'bg-[#C2E8FF]/30 border border-[#7EA0C5]/40 text-[#011025]'
            : 'bg-neutral-100/90 border border-neutral-200/80 text-neutral-800'
        }`}>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 shrink-0 ${isBarangay ? 'text-[#052659]' : 'text-neutral-800'}`} />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className={`cursor-pointer ${
            isBarangay ? 'text-[#5482B4] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'
          }`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. SOS Events Table Card matching Reference Image List Styling */}
      <div className={`rounded-[24px] shadow-xs overflow-hidden ${
        isBarangay ? 'bg-white border border-[#7EA0C5]/30 shadow-[0_2px_12px_rgba(1,16,37,0.03)]' : 'bg-white border border-neutral-200/70'
      }`}>
        {/* Card Header Bar with Title, Filter Tabs, and Action Icons */}
        <div className={`px-6 py-4.5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isBarangay ? 'bg-[#C2E8FF]/10 border-[#7EA0C5]/20' : 'bg-neutral-50/50 border-neutral-100'
        }`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${
            isBarangay ? 'text-[#011025]' : 'text-neutral-900'
          }`}>
            SOS Events
          </h2>

          {/* Filter Pills matching reference image time tabs */}
          <div className={`flex items-center gap-1 rounded-full p-1 text-xs font-medium self-start lg:self-auto border ${
            isBarangay ? 'bg-[#C2E8FF]/20 border-[#7EA0C5]/30' : 'bg-neutral-100/70 border-neutral-200/60'
          }`}>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/40' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilterStatus('Active')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filterStatus === 'Active'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/40' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              Active Distress ({events.filter((e) => e.status === 'Active').length})
            </button>
            <button
              onClick={() => setFilterStatus('Resolved')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filterStatus === 'Resolved'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/40' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              Handled ({events.filter((e) => e.status === 'Resolved').length})
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${
                isBarangay ? 'bg-[#C2E8FF]/30 text-[#052659] border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              }`}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className={`text-xs sm:text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>
                No SOS events in this view
              </p>
              <p className={`text-[11px] max-w-sm mx-auto ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
                All incoming one-tap distress calls have been cleared or resolved.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className={`text-[11px] font-medium border-b ${
                  isBarangay ? 'bg-[#C2E8FF]/5 text-[#5482B4] border-[#7EA0C5]/20' : 'bg-neutral-50/50 text-neutral-400 border-neutral-100'
                }`}>
                  <th className="px-6 py-3.5">Citizen / Caller</th>
                  <th className="px-6 py-3.5">Contact Number</th>
                  <th className="px-6 py-3.5">Location / GPS</th>
                  <th className="px-6 py-3.5">Reported</th>
                  <th className="px-6 py-3.5 text-right">Status & Actions</th>
                </tr>
              </thead>
              <tbody className={`text-xs ${isBarangay ? 'divide-y divide-[#7EA0C5]/15' : 'divide-y divide-neutral-100'}`}>
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={`transition-colors ${
                      isBarangay ? 'hover:bg-[#C2E8FF]/15' : 'hover:bg-neutral-50/60'
                    }`}
                  >
                    {/* Citizen / Caller */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isBarangay
                              ? event.status === 'Active'
                                ? 'bg-[#052659] animate-pulse ring-4 ring-[#C2E8FF]'
                                : 'bg-[#7EA0C5]/40'
                              : event.status === 'Active'
                              ? 'bg-[#18181b] animate-pulse ring-4 ring-neutral-200/60'
                              : 'bg-neutral-300'
                          }`}
                        />
                        <div>
                          <div className={`font-semibold text-sm ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
                            {event.citizenName}
                          </div>
                          {event.notes && (
                            <div
                              title={event.notes}
                              className={`text-[11px] truncate max-w-xs ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'} cursor-help`}
                            >
                              {event.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Number */}
                    <td className="px-6 py-4 font-mono text-xs">
                      <a
                        href={`tel:${event.phoneNumber}`}
                        className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
                          isBarangay ? 'text-[#011025] hover:text-[#052659]' : 'text-neutral-800 hover:text-black'
                        }`}
                      >
                        <Phone className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'}`} />
                        <span>{event.phoneNumber}</span>
                      </a>
                    </td>

                    {/* Location / GPS */}
                    <td className={`px-6 py-4 text-xs ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'}`}>
                      <div
                        className="inline-flex items-center gap-1.5 cursor-help"
                        title={
                          event.locationStatus === 'no fix'
                            ? 'GPS: No satellite fix'
                            : `Exact GPS Coordinates: ${event.latitude?.toFixed(5)}, ${event.longitude?.toFixed(5)}`
                        }
                      >
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'}`} />
                        <span className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>
                          {event.barangay ? `Brgy. ${event.barangay}` : 'Lingayen'}
                        </span>
                        {event.latitude && event.longitude && (
                          <span className={`font-mono text-[10px] ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'}`}>
                            &bull; GPS ready
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reported */}
                    <td className={`px-6 py-4 text-xs font-mono ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'}`} />
                        <span>{formatTimeAgo(event.timestamp)}</span>
                      </div>
                    </td>

                    {/* Status & Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        {/* Direct Dial Call Button */}
                        <a
                          href={`tel:${event.phoneNumber}`}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 ${
                            isBarangay
                              ? 'bg-[#C2E8FF]/30 hover:bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/40'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                          }`}
                          title="Call citizen immediately"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>

                        {/* Locate on Radar if coordinates present */}
                        {event.latitude && event.longitude && onSelectOnMap && (
                          <button
                            onClick={() =>
                              onSelectOnMap({
                                latitude: event.latitude!,
                                longitude: event.longitude!,
                                label: `SOS: ${event.citizenName}`,
                              })
                            }
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 ${
                              isBarangay
                                ? 'bg-[#C2E8FF]/30 hover:bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/40'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                            }`}
                            title="View coordinates on radar"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Status Toggle: Mark Handled / Reopen - Equal width/height container */}
                        <button
                          onClick={() => handleToggleStatus(event.id)}
                          className={`w-28 h-8 rounded-full inline-flex items-center justify-center text-center text-xs font-medium transition-all cursor-pointer shadow-2xs shrink-0 ${
                            isBarangay
                              ? event.status === 'Active'
                                ? 'bg-[#052659] hover:bg-[#031c42] text-white border border-[#011025]/20'
                                : 'bg-[#C2E8FF]/30 hover:bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/40'
                              : event.status === 'Active'
                              ? 'bg-[#18181b] hover:bg-neutral-800 text-white'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                          }`}
                        >
                          {event.status === 'Active' ? 'Mark Handled' : 'Reopen'}
                        </button>

                        {/* SOS Right Pill - Equal width/height container */}
                        <span className={`w-20 h-8 rounded-full inline-flex items-center justify-center text-center text-xs font-medium tracking-wide shadow-2xs shrink-0 ${
                          isBarangay
                            ? event.status === 'Active'
                              ? 'bg-[#052659] text-white border border-[#011025]/20'
                              : 'bg-[#5482B4] text-white'
                            : 'bg-[#70757a] text-white'
                        }`}>
                          {event.status === 'Active' ? 'SOS' : 'Handled'}
                        </span>

                        {/* Delete Event */}
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className={`p-1.5 cursor-pointer transition-colors rounded-full ml-1 ${
                            isBarangay
                              ? 'text-[#7EA0C5] hover:text-[#052659] hover:bg-[#C2E8FF]/30'
                              : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                          }`}
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Simulate / Drill Citizen SOS */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
            isBarangay ? 'border border-[#7EA0C5]/40' : 'border border-neutral-200/80'
          }`}>
            <div className={`flex items-center justify-between pb-3.5 border-b ${
              isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'
            }`}>
              <h3 className={`font-semibold text-base ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
                Simulate Citizen SOS Dispatch
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className={`cursor-pointer ${isBarangay ? 'text-[#5482B4] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTestSos} className="space-y-4 pt-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`}>
                  Citizen Full Name
                </label>
                <input
                  required
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] border border-[#7EA0C5]/30 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`}>
                  Contact Mobile Number
                </label>
                <input
                  required
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className={`w-full text-xs font-mono font-medium p-2.5 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] border border-[#7EA0C5]/30 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`}>
                  GPS Location Fix
                </label>
                <select
                  value={testLocationStatus}
                  onChange={(e) => setTestLocationStatus(e.target.value as any)}
                  className={`w-full text-xs font-medium rounded-xl p-2.5 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] border border-[#7EA0C5]/30 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                      : 'text-neutral-800 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                >
                  <option value="no fix">no fix (No GPS satellite lock)</option>
                  <option value="GPS locked">GPS locked (Include coordinates)</option>
                </select>
              </div>

              {testLocationStatus === 'GPS locked' && (
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`}>
                    Barangay
                  </label>
                  <input
                    type="text"
                    value={testBarangay}
                    onChange={(e) => setTestBarangay(e.target.value)}
                    className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                      isBarangay
                        ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] border border-[#7EA0C5]/30 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                        : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                    }`}
                  />
                </div>
              )}

              <div className={`flex items-center justify-end gap-2.5 pt-2 border-t ${
                isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className={`px-4 py-2 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                    isBarangay ? 'text-[#5482B4] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-medium text-white rounded-full shadow-xs cursor-pointer transition-colors ${
                    isBarangay ? 'bg-[#052659] hover:bg-[#031c42] border border-[#011025]/20' : 'bg-[#18181b] hover:bg-neutral-800'
                  }`}
                >
                  Trigger SOS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
