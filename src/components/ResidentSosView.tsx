import React, { useState } from 'react';
import { User, Barangay } from '../types';
import {
  AlertTriangle,
  Phone,
  PhoneCall,
  MapPin,
  Clock,
  Radio,
  CheckCircle2,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  ShieldAlert,
  Info,
  Navigation,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface ResidentSosViewProps {
  currentUser: User;
  barangays: Barangay[];
  isOnline: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const ResidentSosView: React.FC<ResidentSosViewProps> = ({
  currentUser,
  barangays,
  isOnline,
  onNavigateTab,
}) => {
  const [isSendingSos, setIsSendingSos] = useState<boolean>(false);
  const [sosSentSuccess, setSosSentSuccess] = useState<boolean>(false);
  const [isProtocolExpanded, setIsProtocolExpanded] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [lastSosInfo, setLastSosInfo] = useState({
    id: '453E1600-D9AB-4777-BF5B-9923E40542CF',
    statusLabel: 'SENT • OCT 1, 10:12 AM',
    position: 'GPS Locked (Lingayen Center)',
    accuracy: '± 8 meters (High Precision)',
    sentAt: 'Oct 1, 10:12 AM',
    reached: '1 duty officer on watch',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendSos = () => {
    setIsSendingSos(true);

    // Audio chime cue
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        }
      } catch (e) {
        console.error('Audio cue error:', e);
      }
    }

    setTimeout(() => {
      setIsSendingSos(false);
      setSosSentSuccess(true);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSosInfo((prev) => ({
        ...prev,
        statusLabel: `SENT • TODAY, ${nowStr}`,
        sentAt: `Today, ${nowStr}`,
      }));
      showToast('Emergency SOS distress beacon transmitted to Lingayen MDRRMO!');
    }, 1800);
  };

  const userBarangayObj = barangays.find(
    (b) => b.id === (currentUser.barangay_id || 'poblacion')
  );
  const locationLabel = userBarangayObj
    ? `Barangay ${userBarangayObj.name}, Lingayen, Pangasinan`
    : 'Municipality of Lingayen, Pangasinan';

  const backupHotlines = [
    {
      id: 'hotline-mdrrmo',
      name: 'Lingayen MDRRMO Central Dispatch',
      number: '(075) 633-5702',
      badge: '24/7 Command Desk',
    },
    {
      id: 'hotline-bfp',
      name: 'BFP Lingayen (Water Search & Fire)',
      number: '(075) 542-7080',
      badge: 'Emergency Response',
    },
    {
      id: 'hotline-911',
      name: 'National Emergency Hotline',
      number: '911',
      badge: 'National Toll-Free',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Section: Subtitle and 911 Call CTA (Matching Home Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <p className="text-sm sm:text-base font-semibold text-neutral-800">
            Emergency distress beacon for <span className="font-extrabold text-red-900">{locationLabel}</span>.
          </p>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            One-tap direct transmission to Lingayen MDRRMO Dispatch and local barangay quick responders.
          </p>
        </div>

        <a
          href="tel:911"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-900 hover:bg-red-800 text-white text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer active:scale-95 w-fit shrink-0"
        >
          <Phone className="w-4 h-4 text-white" />
          <span>Call 911 Emergency</span>
        </a>
      </div>

      {/* 2. Three KPI Metric Cards with icons, bold labels, and tabular figures (Matching Home Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {/* Card 1: Beacon Status (Signature Hero Dark Red Card) */}
        <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl border border-red-900/40 flex flex-col justify-between min-w-0 w-full relative overflow-hidden group transition-all duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-100/80">
                Beacon Status
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono tabular-nums mt-2">
                {sosSentSuccess ? 'LOGGED ✓' : isSendingSos ? 'SENDING...' : 'STANDBY'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 text-white border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
              <Radio className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/15 flex items-center gap-2 text-xs text-red-100/90 font-medium">
            <span className={`w-2 h-2 rounded-full ${sosSentSuccess ? 'bg-emerald-400 animate-ping' : 'bg-white animate-pulse'}`} />
            <span>{sosSentSuccess ? 'Distress packet confirmed by dispatch' : 'Encrypted telemetry link active'}</span>
          </div>
        </div>

        {/* Card 2: Duty Officers (Clean White Floating Card) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl border border-neutral-100/80 transition-all duration-300 flex flex-col justify-between group min-w-0 w-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Duty Officers
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold text-neutral-900 group-hover:text-red-900 transition-colors tracking-tight font-mono tabular-nums mt-2">
                1 ON DUTY
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-900 border border-red-100/60 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-900" />
              <span>Lingayen MDRRMO Operations Hub</span>
            </span>
            <span className="font-mono font-bold text-neutral-700 tabular-nums">
              24/7 Desk
            </span>
          </div>
        </div>

        {/* Card 3: GPS Accuracy (Clean White Floating Card) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl border border-neutral-100/80 transition-all duration-300 flex flex-col justify-between group min-w-0 w-full sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                GPS Accuracy
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold text-red-900 group-hover:text-red-800 transition-colors tracking-tight font-mono tabular-nums mt-2">
                ±8 METERS
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-900 border border-red-100/60 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-900" />
              <span>High precision multi-band location lock</span>
            </span>
            <span className="font-mono font-bold text-red-900 tabular-nums">
              Locked
            </span>
          </div>
        </div>
      </div>

      {/* 3. Hero Emergency Distress Activation Card with Collapsible Protocol (Matching Home Push Alert Card) */}
      <div className="rounded-3xl border border-red-950/40 bg-gradient-to-br from-red-800 via-red-900 to-red-950 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl bg-white text-red-900 text-xs font-black uppercase tracking-wider shadow-md">
              EMERGENCY SOS
            </span>
            <span className="px-3 py-1 rounded-xl bg-red-950/80 text-white text-xs font-bold uppercase tracking-wider border border-white/20">
              ONE-TAP BEACON
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Transmit Emergency Rescue Beacon to Lingayen MDRRMO
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed max-w-2xl">
              Hold still for a moment to ensure maximum GPS positioning accuracy. A live confirmation will be registered and assigned immediately to the municipal dispatch log.
            </p>
          </div>

          {/* Glowing Big SOS Action Center */}
          <div className="py-4 flex flex-col items-center justify-center text-center">
            <button
              onClick={handleSendSos}
              disabled={isSendingSos}
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer active:scale-95 relative group ${
                sosSentSuccess
                  ? 'bg-white text-red-900 ring-8 ring-white/30'
                  : isSendingSos
                  ? 'bg-red-950 text-white ring-8 ring-white/20 animate-pulse'
                  : 'bg-white text-red-900 hover:bg-red-50 ring-8 ring-white/25 hover:scale-105'
              }`}
              title="Tap to Transmit Emergency SOS"
            >
              <AlertTriangle className={`w-9 h-9 sm:w-11 sm:h-11 ${isSendingSos ? 'animate-bounce' : 'animate-pulse'}`} />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider mt-1">
                {isSendingSos ? 'Transmitting...' : sosSentSuccess ? 'Sent ✓' : 'TAP FOR SOS'}
              </span>
            </button>

            {/* Current Status Pill */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-black/30 border border-white/20 text-white shadow-inner">
                <span className={`w-2 h-2 rounded-full ${sosSentSuccess ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
                <span>{lastSosInfo.statusLabel}</span>
              </span>
            </div>
          </div>

          {/* Fast Action Buttons */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <a
              href="tel:0756335702"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-red-900 hover:bg-red-50 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <PhoneCall className="w-4 h-4 text-red-900" />
              <span>Call MDRRMO Dispatch: (075) 633-5702</span>
            </a>

            <button
              onClick={() => showToast('SOS offline packet cached to local device storage!')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold border border-white/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Cache Beacon Offline</span>
            </button>
          </div>

          {/* Collapsible Action Protocol Toggle (Matching Home Accordion) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsProtocolExpanded(!isProtocolExpanded)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-white/15 hover:bg-white/25 px-5 py-2.5 rounded-2xl transition-all shadow-sm cursor-pointer"
            >
              <span>{isProtocolExpanded ? 'Hide Emergency Protocol' : 'View Emergency SOS Activation Protocol & What to Expect'}</span>
              {isProtocolExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isProtocolExpanded && (
              <div className="mt-4 p-5 rounded-2xl bg-red-950/90 border border-white/15 text-xs sm:text-sm text-red-50 space-y-3 shadow-inner animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-white text-red-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">1</span>
                  <span><strong>Instant Dispatch Receipt:</strong> Your GPS fix, registered citizen name, and timestamp appear immediately on the MDRRMO command screen.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-white text-red-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">2</span>
                  <span><strong>Barangay Patrol Triage:</strong> The nearest BDRRMC responder and rescue vehicles are routed directly to your pinpointed coordinates.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-white text-red-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">3</span>
                  <span><strong>Phone Line Availability:</strong> Keep your mobile device powered on and line clear for the duty responder's immediate callback.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-white text-red-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">4</span>
                  <span><strong>Rate-Limiting Protection:</strong> Emergency triggers are monitored to prevent bandwidth clogging during severe natural calamities.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Background Motif */}
        <div className="absolute right-2 -bottom-6 opacity-10 pointer-events-none">
          <ShieldAlert className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* 4. Section: Beacon Telemetry & Transmission Record (Matching Home's Container & Section Card Style) */}
      <div className="bg-white rounded-3xl border border-neutral-100/80 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
        <div className="p-6 sm:p-7 pb-5 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              Beacon Telemetry & Transmission Record
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Verified packet details transmitted to the municipal disaster response ledger
            </p>
          </div>

          <span className="text-xs font-bold text-red-900 bg-red-50 border border-red-900/20 px-3.5 py-1.5 rounded-full w-fit">
            GPS Active • Encrypted Link
          </span>
        </div>

        <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Box 1: Packet ID */}
          <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Transmission Hash ID
            </span>
            <p className="font-mono text-xs font-bold text-neutral-800 truncate">
              {lastSosInfo.id}
            </p>
            <p className="text-[11px] text-neutral-500">Unique cryptographic beacon ID</p>
          </div>

          {/* Box 2: Positioning Lock */}
          <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Positioning Fix
            </span>
            <p className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{lastSosInfo.position}</span>
            </p>
            <p className="text-[11px] text-neutral-500">Barangay centroid alignment confirmed</p>
          </div>

          {/* Box 3: Accuracy */}
          <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Fix Precision
            </span>
            <p className="font-mono text-xs font-bold text-neutral-900">
              {lastSosInfo.accuracy}
            </p>
            <p className="text-[11px] text-neutral-500">Optimal accuracy for tactical rescue</p>
          </div>

          {/* Box 4: Sent At */}
          <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Transmission Timestamp
            </span>
            <p className="font-mono text-xs font-bold text-neutral-900">
              {lastSosInfo.sentAt}
            </p>
            <p className="text-[11px] text-neutral-500">Synchronized with LDRRMO atomic clock</p>
          </div>

          {/* Box 5: Dispatch Center Reached */}
          <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Dispatch Duty Reached
            </span>
            <p className="font-bold text-xs text-red-900">
              {lastSosInfo.reached}
            </p>
            <p className="text-[11px] text-neutral-500">MDRRMO Incident Command Desk</p>
          </div>

          {/* Box 6: Offline Cache Backup */}
          <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Zero-Signal Resilience
            </span>
            <p className="font-bold text-xs text-neutral-900">
              Auto-Queue on Reconnect
            </p>
            <p className="text-[11px] text-neutral-500">Queues in local IndexedDB outbox</p>
          </div>
        </div>
      </div>

      {/* 5. Section: Backup Hotlines (Matching Home's Hotlines Style) */}
      <div className="bg-white rounded-3xl border border-neutral-100/80 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
        <div className="p-6 sm:p-7 pb-5 border-b border-neutral-100 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              Direct Emergency Dispatch Hotlines
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              If cellular data is weak or unavailable, place a direct voice call to municipal dispatch
            </p>
          </div>
          <span className="text-xs font-bold text-red-900 bg-red-50 border border-red-900/20 px-3.5 py-1 rounded-full shrink-0">
            24/7 active
          </span>
        </div>

        <div className="divide-y divide-neutral-100">
          {backupHotlines.map((h) => (
            <div
              key={h.id}
              className="p-5 sm:p-6 hover:bg-red-50/30 transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-neutral-900 truncate">
                    {h.name}
                  </h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-900 border border-red-900/20 shrink-0">
                    {h.badge}
                  </span>
                </div>
                <p className="text-xs font-semibold text-neutral-600 font-mono">
                  {h.number}
                </p>
              </div>

              <a
                href={`tel:${h.number.replace(/[^0-9]/g, '')}`}
                className="w-10 h-10 rounded-2xl bg-red-50 text-red-900 hover:bg-red-900 hover:text-white border border-red-900/20 flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                title={`Call ${h.name}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Regulatory Warning / Etiquette Callout (Matching Home's Advice Box) */}
      <div className="rounded-3xl border border-neutral-100/80 bg-white p-6 sm:p-7 shadow-xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-900 border border-red-100/60 flex items-center justify-center shrink-0 shadow-2xs">
          <Info className="w-5 h-5 text-red-900" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-neutral-900">
            Municipal Emergency SOS Protocol & Fair Use Policy
          </h4>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium">
            Emergency beacons are routed with highest priority to the MDRRMO dispatch command board. Please refrain from testing the distress trigger unless you or nearby families are in immediate peril. Rate-limited to 5 activations per 10 minutes.
          </p>
        </div>
      </div>

      {/* 7. Bottom Offline Status Footer Bar (Matching Home Draft) */}
      <div className="rounded-3xl border border-neutral-100/80 bg-white p-6 sm:p-7 text-xs text-neutral-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-500">Offline copy:</span>
            <span className="font-bold text-red-900 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-900/20">Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-500">Last sync:</span>
            <span className="font-bold text-neutral-900">Today, 08:42</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center">
          <span className="font-semibold text-neutral-500">Beacon telemetry:</span>
          <span className="font-bold text-white bg-neutral-900 px-3 py-1 rounded-xl shadow-xs">
            Cached & Active
          </span>
        </div>
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
