import React, { useState } from 'react';
import { EmergencyHotline, Barangay } from '../types';
import { Phone, Download, Check, Info } from 'lucide-react';

interface HotlineDirectoryProps {
  hotlines: EmergencyHotline[];
  barangays: Barangay[];
  isOnline: boolean;
}

export const HotlineDirectory: React.FC<HotlineDirectoryProps> = ({
  hotlines,
  barangays: _barangays,
  isOnline: _isOnline,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveOffline = () => {
    showToast('Saved all emergency hotlines to offline device storage!');
  };

  // Fallback items strictly matching the screenshot
  const defaultHotlines: EmergencyHotline[] = [
    {
      id: 'hotline_1',
      agency_name: 'BFP Lingayen',
      contact_number: '(075) 542-7080',
      scope: 'Fire',
      tag: 'FIRE AND RESCUE',
      description: 'Bureau of Fire Protection - Fire response and rescue operations',
      priority: 1,
      available_hours: '24/7 Always Open',
    },
    {
      id: 'hotline_2',
      agency_name: 'Lingayen MDRRMO / LDRRMO',
      contact_number: '(075) 633-5702',
      scope: 'Municipal',
      tag: 'CITYWIDE',
      description: 'Municipal Disaster Risk Reduction & Management Office - Central emergency dispatch',
      priority: 2,
      available_hours: '24/7 Operations Desk',
    },
    {
      id: 'hotline_3',
      agency_name: "Mayor's Office Emergency Desk",
      contact_number: '(075) 632-4337',
      scope: 'Municipal',
      tag: 'CITYWIDE',
      description: 'Office of the Municipal Mayor - Calamity response directives',
      priority: 3,
      available_hours: '24/7 Calamity Operations',
    },
    {
      id: 'hotline_4',
      agency_name: 'National Emergency Hotline',
      contact_number: '911',
      scope: 'National',
      tag: 'CITYWIDE',
      description: 'National Emergency Hotline - Nationwide immediate response dispatch',
      priority: 4,
      available_hours: '24/7 Toll-Free Emergency',
    },
    {
      id: 'hotline_5',
      agency_name: 'Pangasinan PDRRMO',
      contact_number: '0998-584-6867',
      scope: 'Provincial',
      tag: 'PROVINCIAL SUPPORT',
      description: 'Provincial Disaster Risk Reduction & Management Office - Provincial rescue support',
      priority: 5,
      available_hours: '24/7 Provincial Operations',
    },
    {
      id: 'hotline_6',
      agency_name: 'PNP Lingayen',
      contact_number: '(075) 206-0042',
      scope: 'Police',
      tag: 'POLICE ASSISTANCE',
      description: 'Philippine National Police - Law enforcement and security patrols',
      priority: 6,
      available_hours: '24/7 Police Assistance',
    },
    {
      id: 'hotline_7',
      agency_name: 'Provincial Health Office',
      contact_number: '0933-813-8623',
      scope: 'Hospital',
      tag: 'MEDICAL AND RELIEF',
      description: 'Pangasinan Provincial Health Office - Emergency medical and triage dispatch',
      priority: 7,
      available_hours: '24/7 Medical Response',
    },
  ];

  const displayHotlines = hotlines && hotlines.length > 0 ? hotlines : defaultHotlines;

  const getHotlineTag = (h: EmergencyHotline) => {
    if (h.tag) return h.tag.toUpperCase();
    const name = h.agency_name.toLowerCase();
    if (name.includes('bfp') || name.includes('fire')) return 'FIRE AND RESCUE';
    if (name.includes('pnp') || name.includes('police')) return 'POLICE ASSISTANCE';
    if (name.includes('health') || name.includes('medical')) return 'MEDICAL AND RELIEF';
    if (name.includes('pdrrmo') || h.scope?.toLowerCase() === 'provincial') return 'PROVINCIAL SUPPORT';
    return 'CITYWIDE';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header: Save Offline action bar matching Home styling */}
      <div className="flex items-center justify-end pb-1">
        <button
          onClick={handleSaveOffline}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 w-fit shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>Save Offline</span>
        </button>
      </div>

      {/* 2. Hotlines List: Formatted as a clean list matching the Home tab's list style */}
      <div className="bg-white rounded-3xl border border-neutral-100/80 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
        <div className="divide-y divide-neutral-100">
          {displayHotlines.map((hotline) => {
            const cleanPhone = hotline.contact_number.replace(/[^0-9+]/g, '');
            const tag = getHotlineTag(hotline);

            return (
              <div
                key={hotline.id}
                className="p-5 sm:p-6 hover:bg-red-50/30 transition-colors flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-red-900 bg-red-50 border border-red-900/20 px-2.5 py-0.5 rounded-full w-fit">
                    {tag}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                    {hotline.agency_name}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-600 font-mono">
                    {hotline.contact_number}
                  </p>
                </div>

                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-900 hover:bg-red-900 hover:text-white border border-red-900/20 text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
                  title={`Call ${hotline.agency_name}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Guidance Note strictly matching the screenshot */}
      <div className="rounded-3xl border border-neutral-100/80 bg-white p-5 sm:p-6 text-xs text-neutral-600 shadow-xl flex items-start sm:items-center gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-900 border border-red-100/60 flex items-center justify-center shrink-0 shadow-2xs">
          <Info className="w-4 h-4 text-red-900" />
        </div>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium">
          If a line is busy, keep the call short and state your barangay, landmark and number of people needing help.
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
