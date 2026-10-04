import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Advisory,
  User,
  Barangay,
  AdvisorySeverity,
  AdvisoryType
} from '../types';
import { storage } from '../services/storage';
import {
  Bell,
  Radio,
  Search,
  X,
  Send,
  Megaphone,
  Smartphone,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Users,
  Eye,
  Check,
  Info,
  ShieldAlert,
  ChevronRight,
  Flag,
  Waves,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface AdvisoryCenterProps {
  advisories: Advisory[];
  currentUser: User;
  barangays: Barangay[];
  onAdvisoryPublished: (advisory: Advisory) => void;
  onNavigateTab?: (tab: string) => void;
  selectedAdvisoryId?: string | null;
  onClearSelectedAdvisory?: () => void;
}

export const AdvisoryCenter: React.FC<AdvisoryCenterProps> = ({
  advisories,
  currentUser,
  barangays,
  onAdvisoryPublished,
  onNavigateTab,
  selectedAdvisoryId,
  onClearSelectedAdvisory,
}) => {
  // Compose Form State (for Admin / LDRRMC)
  const [advisoryTitle, setAdvisoryTitle] = useState('');
  const [severity, setSeverity] = useState<'Warning' | 'Emergency' | 'Advisory' | 'Notice'>('Warning');
  const [broadcastType, setBroadcastType] = useState<'Emergency' | 'Preparedness' | 'Weather' | 'Evacuation'>('Emergency');
  const [affectedArea, setAffectedArea] = useState<string>('Municipality-wide (Lingayen)');
  const [message, setMessage] = useState('');
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveFeedActive, setIsLiveFeedActive] = useState(true);
  const [selectedPublishedAdvisory, setSelectedPublishedAdvisory] = useState<Advisory | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [pushNotificationToast, setPushNotificationToast] = useState<{ title: string; body: string } | null>(null);

  // Resident Filter State: 'All' | 'Emergency' | 'Warning' | 'Advisory' | 'Preparedness'
  const [residentFilter, setResidentFilter] = useState<'All' | 'Emergency' | 'Warning' | 'Advisory' | 'Preparedness'>('All');
  
  // For Admins: Toggle between Broadcast Console and Resident Feed Preview
  const isAdmin = currentUser.role === 'lgu_admin' || currentUser.role === 'citizen';
  const isBarangay = currentUser.role === 'barangay';
  const [adminViewMode, setAdminViewMode] = useState<'broadcast' | 'resident'>('broadcast');

  // Selected advisory for full modal reading
  const [activeModalAdvisory, setActiveModalAdvisory] = useState<Advisory | null>(null);

  // Automatically open designated advisory when redirected from Alert Banner
  useEffect(() => {
    if (selectedAdvisoryId) {
      const target = advisories.find((a) => a.id === selectedAdvisoryId);
      if (target) {
        setActiveModalAdvisory(target);
        setSelectedPublishedAdvisory(target);
        setAdminViewMode('resident');
      }
    }
  }, [selectedAdvisoryId, advisories]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut ⌘K / Ctrl+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Request browser push notification permission if push is enabled
  const handleTogglePush = () => {
    if (!isPushEnabled) {
      setIsPushEnabled(true);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    } else {
      setIsPushEnabled(false);
    }
  };

  const handleClear = () => {
    setAdvisoryTitle('');
    setMessage('');
    setSeverity('Warning');
    setBroadcastType('Emergency');
    setAffectedArea('Municipality-wide (Lingayen)');
  };

  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryTitle.trim() || !message.trim()) return;

    let mappedSeverity: AdvisorySeverity = 'high';
    if (severity === 'Emergency') mappedSeverity = 'critical';
    else if (severity === 'Warning') mappedSeverity = 'high';
    else if (severity === 'Advisory') mappedSeverity = 'medium';
    else mappedSeverity = 'low';

    const mappedType: AdvisoryType =
      broadcastType === 'Preparedness' ? 'preparedness' : 'emergency_alert';

    const targetBarangay =
      affectedArea === 'Municipality-wide (Lingayen)' ||
      affectedArea === 'Citywide' ||
      affectedArea === 'Coastal barangays'
        ? null
        : barangays.find((b) => b.name === affectedArea)?.id || null;

    const newAdv = storage.publishAdvisory({
      title: advisoryTitle.trim(),
      content: message.trim(),
      type: mappedType,
      severity: mappedSeverity,
      target_barangay_id: targetBarangay,
      author: currentUser,
    });

    onAdvisoryPublished(newAdv);

    if (isPushEnabled) {
      triggerPushToast(newAdv.title, newAdv.content);
    }

    setActionSuccessNotice(`Broadcast successfully published to residents of ${affectedArea}!`);
    setTimeout(() => setActionSuccessNotice(null), 4000);

    handleClear();
  };

  const triggerPushToast = (titleText: string, bodyText: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`🚨 UniGuard Alert: ${titleText}`, {
            body: bodyText,
            icon: '/shield-alert.svg',
          });
        } catch {
          // Ignore notification constructor errors
        }
      }
    }

    setPushNotificationToast({ title: titleText, body: bodyText });
    setTimeout(() => setPushNotificationToast(null), 6000);
  };

  // Helper to format date cleanly as 9/19/2026
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return '9/19/2026';
    }
  };

  // Format advisory location text
  const getAdvisoryLocationDisplay = (adv: Advisory) => {
    if (adv.id === 'adv_pangapisan_overflow' || adv.title.toLowerCase().includes('pangapisan')) return 'Pangapisan North, Pangapisan Sur';
    if (adv.id === 'adv_coastal_surge') return 'Coastal barangays';
    if (!adv.target_barangay_id) return 'Municipality-wide (Lingayen)';
    const b = barangays.find((brgy) => brgy.id === adv.target_barangay_id);
    return b ? `Brgy. ${b.name}` : 'Municipality-wide (Lingayen)';
  };

  // Format category badge: "Emergency" or "Preparedness"
  const getAdvisoryCategory = (adv: Advisory) => {
    if (adv.type === 'preparedness') return 'Preparedness';
    return 'Emergency';
  };

  // Map advisory to specific visual tag for filter pills
  const getAdvisoryDisplayTag = (adv: Advisory): 'Emergency' | 'Warning' | 'Advisory' | 'Preparedness' => {
    if (adv.type === 'preparedness') return 'Preparedness';
    if (adv.id === 'adv_pangapisan_overflow' || adv.severity === 'critical') return 'Emergency';
    if (adv.id === 'adv_class_suspension' || adv.title.toLowerCase().includes('suspension')) return 'Warning';
    if (adv.id === 'adv_coastal_surge' || adv.title.toLowerCase().includes('advisory')) return 'Advisory';
    if (adv.severity === 'high') return 'Warning';
    return 'Advisory';
  };

  // Compute filter pill counts
  const filterCounts = useMemo(() => {
    let all = 0;
    let emergency = 0;
    let warning = 0;
    let advisory = 0;
    let preparedness = 0;

    advisories.forEach((a) => {
      all++;
      const tag = getAdvisoryDisplayTag(a);
      if (tag === 'Emergency') emergency++;
      else if (tag === 'Warning') warning++;
      else if (tag === 'Advisory') advisory++;
      else if (tag === 'Preparedness') preparedness++;
    });

    return { all, emergency, warning, advisory, preparedness };
  }, [advisories]);

  // Status dot color for published item in admin list
  const getStatusDotColor = (adv: Advisory) => {
    if (adv.severity === 'critical') return isBarangay ? 'bg-[#052659]' : 'bg-[#18181b]';
    if (adv.severity === 'high') return isBarangay ? 'bg-[#5482B4]' : 'bg-[#2A2A2A]';
    if (adv.type === 'preparedness') return isBarangay ? 'bg-[#7EA0C5]' : 'bg-[#70757a]';
    return isBarangay ? 'bg-[#052659]' : 'bg-[#18181b]';
  };

  // Filter published list by search query & resident pill filter
  const residentFilteredAdvisories = useMemo(() => {
    return advisories.filter((adv) => {
      // 1. Tag Filter
      if (residentFilter !== 'All') {
        const tag = getAdvisoryDisplayTag(adv);
        if (tag !== residentFilter) return false;
      }
      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const loc = getAdvisoryLocationDisplay(adv).toLowerCase();
        const cat = getAdvisoryCategory(adv).toLowerCase();
        const titleMatch = adv.title.toLowerCase().includes(q);
        const contentMatch = adv.content.toLowerCase().includes(q);
        return titleMatch || contentMatch || loc.includes(q) || cat.includes(q);
      }
      return true;
    });
  }, [advisories, residentFilter, searchQuery]);

  // Admin search filtered advisories
  const adminFilteredAdvisories = useMemo(() => {
    if (!searchQuery.trim()) return advisories;
    const q = searchQuery.toLowerCase().trim();
    return advisories.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        getAdvisoryLocationDisplay(a).toLowerCase().includes(q) ||
        getAdvisoryCategory(a).toLowerCase().includes(q)
    );
  }, [advisories, searchQuery]);

  // Determines whether to display the resident card grid
  const showResidentView = isBarangay || (isAdmin && adminViewMode === 'resident');

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Push Notification Toast Notification in Refined Theme */}
      {pushNotificationToast && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white ${
          isBarangay ? 'text-[#011025] border-[#7EA0C5]/40' : 'text-neutral-900 border-neutral-200/80'
        } p-4 rounded-[20px] shadow-2xl border animate-in slide-in-from-top-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-xl ${isBarangay ? 'bg-[#052659]' : 'bg-[#18181b]'} text-white shrink-0 mt-0.5`}>
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <div className={`flex items-center gap-1.5 text-[10px] ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                } font-semibold uppercase tracking-wider`}>
                  <span>UNIGUARD BROADCAST</span>
                  <span>•</span>
                  <span>NOW</span>
                </div>
                <h4 className={`text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} mt-0.5`}>
                  {pushNotificationToast.title}
                </h4>
                <p className={`text-[11px] ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'} mt-1 line-clamp-2`}>
                  {pushNotificationToast.body}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPushNotificationToast(null)}
              className={`${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-600'} p-1 cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action Flash Notice */}
      {actionSuccessNotice && (
        <div className={`p-3.5 rounded-2xl ${
          isBarangay ? 'bg-[#C2E8FF]/30 border-[#7EA0C5]/40 text-[#011025]' : 'bg-neutral-100/90 border-neutral-200/80 text-neutral-800'
        } border text-xs font-medium flex items-center justify-between animate-in fade-in`}>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${isBarangay ? 'text-[#052659]' : 'text-neutral-800'} shrink-0`} />
            <span>{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className={`cursor-pointer ${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Page Title Header & Admin View Switcher */}
      <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl sm:text-2xl font-semibold tracking-tight ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
            Advisories and Alerts
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
            {showResidentView
              ? 'Official broadcasts from the Municipal Disaster Risk Reduction and Management Office (MDRRMO Lingayen).'
              : 'Publish official broadcasts and preparedness content to residents.'}
          </p>
        </div>

        {/* Admin Toggle between Broadcast Console and Resident Feed */}
        {isAdmin && (
          <div className={`flex items-center p-1 rounded-full border ${
            isBarangay ? 'bg-[#C2E8FF]/20 border-[#7EA0C5]/30' : 'bg-neutral-100/80 border-neutral-200/70'
          }`}>
            <button
              onClick={() => setAdminViewMode('broadcast')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                adminViewMode === 'broadcast'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025]' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Broadcast Console
            </button>
            <button
              onClick={() => setAdminViewMode('resident')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                adminViewMode === 'resident'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025]' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Resident Feed
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3A. RESIDENT VIEW: Filter Pills with Counts & Cards Grid        */}
      {/* ============================================================== */}
      {showResidentView ? (
        <div className="space-y-5 animate-in fade-in">
          {/* Filter Pills with Counts: All 5 | Emergency 1 | Warning 1 | Advisory 1 | Preparedness 2 */}
          <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none ${isBarangay ? 'bg-[#C2E8FF]/20 border-[#7EA0C5]/30' : 'bg-neutral-100/60 border-neutral-200/60'} p-1.5 rounded-full border w-fit max-w-full`}>
            {/* All Pill */}
            <button
              type="button"
              onClick={() => setResidentFilter('All')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                residentFilter === 'All'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  residentFilter === 'All' ? 'bg-white/20 text-white' : isBarangay ? 'bg-[#C2E8FF]/60 text-[#052659]' : 'bg-neutral-200/80 text-neutral-700'
                }`}
              >
                {filterCounts.all}
              </span>
            </button>

            {/* Emergency Pill */}
            <button
              type="button"
              onClick={() => setResidentFilter('Emergency')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                residentFilter === 'Emergency'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <span>Emergency</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  residentFilter === 'Emergency' ? 'bg-white/20 text-white' : isBarangay ? 'bg-[#C2E8FF]/60 text-[#052659]' : 'bg-neutral-200/80 text-neutral-700'
                }`}
              >
                {filterCounts.emergency}
              </span>
            </button>

            {/* Warning Pill */}
            <button
              type="button"
              onClick={() => setResidentFilter('Warning')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                residentFilter === 'Warning'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <span>Warning</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  residentFilter === 'Warning' ? 'bg-white/20 text-white' : isBarangay ? 'bg-[#C2E8FF]/60 text-[#052659]' : 'bg-neutral-200/80 text-neutral-700'
                }`}
              >
                {filterCounts.warning}
              </span>
            </button>

            {/* Advisory Pill */}
            <button
              type="button"
              onClick={() => setResidentFilter('Advisory')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                residentFilter === 'Advisory'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <span>Advisory</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  residentFilter === 'Advisory' ? 'bg-white/20 text-white' : isBarangay ? 'bg-[#C2E8FF]/60 text-[#052659]' : 'bg-neutral-200/80 text-neutral-700'
                }`}
              >
                {filterCounts.advisory}
              </span>
            </button>

            {/* Preparedness Pill */}
            <button
              type="button"
              onClick={() => setResidentFilter('Preparedness')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                residentFilter === 'Preparedness'
                  ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                  : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <span>Preparedness</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  residentFilter === 'Preparedness' ? 'bg-white/20 text-white' : isBarangay ? 'bg-[#C2E8FF]/60 text-[#052659]' : 'bg-neutral-200/80 text-neutral-700'
                }`}
              >
                {filterCounts.preparedness}
              </span>
            </button>
          </div>

          {/* Cards Grid */}
          {residentFilteredAdvisories.length === 0 ? (
            <div className={`bg-white rounded-[24px] border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/70'} shadow-xs p-12 text-center space-y-2`}>
              <Megaphone className={`w-10 h-10 ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-300'} mx-auto`} />
              <h3 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>No advisories match this filter</h3>
              <p className={`text-xs ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>Check other categories or reset search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
              {residentFilteredAdvisories.map((adv) => {
                const tag = getAdvisoryDisplayTag(adv);
                const locationText = getAdvisoryLocationDisplay(adv);
                const categoryText = getAdvisoryCategory(adv);
                const hasImageBanner = adv.id === 'adv_pangapisan_overflow' || adv.title.toLowerCase().includes('pangapisan') || adv.title.toLowerCase().includes('river overflow');

                return (
                  <div
                    key={adv.id}
                    onClick={() => setActiveModalAdvisory(adv)}
                    className={`bg-white rounded-[24px] border ${
                      isBarangay ? 'border-[#7EA0C5]/40 hover:border-[#5482B4]' : 'border-neutral-200/70 hover:border-neutral-300'
                    } shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden cursor-pointer group`}
                  >
                    {/* Top Container on Card 1 (River overflow warning visual banner) */}
                    {hasImageBanner && (
                      <div className={`h-32 w-full ${
                        isBarangay
                          ? 'bg-gradient-to-tr from-[#011025] via-[#052659] to-[#5482B4]'
                          : 'bg-gradient-to-tr from-[#18181b] via-[#27272a] to-[#3f3f46]'
                      } relative overflow-hidden flex items-center justify-center p-4`}>
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
                        <div className="relative text-center space-y-1">
                          <Waves className={`w-8 h-8 ${isBarangay ? 'text-[#C2E8FF]' : 'text-neutral-300'} mx-auto`} />
                          <span className={`text-[10px] font-semibold ${isBarangay ? 'text-[#C2E8FF]' : 'text-neutral-200'} uppercase tracking-widest block`}>
                            River Embankment Monitor
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Card Content Area */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {/* Tag Badge & Date Row */}
                        <div className="flex items-center justify-between gap-2">
                          {/* Tag Badge */}
                          {tag === 'Emergency' && (
                            <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                              isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#18181b] text-white shadow-2xs'
                            } tracking-wider`}>
                              EMERGENCY
                            </span>
                          )}
                          {tag === 'Warning' && (
                            <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                              isBarangay ? 'bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                            } tracking-wider`}>
                              WARNING
                            </span>
                          )}
                          {tag === 'Advisory' && (
                            <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                              isBarangay ? 'bg-[#C2E8FF]/40 text-[#052659] border border-[#7EA0C5]/30' : 'bg-neutral-100/80 text-neutral-700 border border-neutral-200/70'
                            } tracking-wider`}>
                              ADVISORY
                            </span>
                          )}
                          {tag === 'Preparedness' && (
                            <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                              isBarangay ? 'bg-[#C2E8FF]/30 text-[#5482B4] border border-[#7EA0C5]/30' : 'bg-neutral-100/80 text-neutral-600 border border-neutral-200/70'
                            } tracking-wider`}>
                              PREPAREDNESS
                            </span>
                          )}

                          {/* Date on Right */}
                          <span className={`font-mono text-xs ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} font-medium`}>
                            {formatDate(adv.created_at)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-sm font-semibold leading-snug ${
                          isBarangay ? 'text-[#011025] group-hover:text-[#052659]' : 'text-neutral-900 group-hover:text-neutral-700'
                        } transition-colors`}>
                          {adv.title}
                        </h3>

                        {/* Description */}
                        <p className={`text-xs ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'} leading-relaxed line-clamp-3`}>
                          {adv.content}
                        </p>
                      </div>

                      {/* Bottom Metadata: Location on Left & Category on Right */}
                      <div className={`pt-3 border-t ${isBarangay ? 'border-[#7EA0C5]/20 text-[#5482B4]' : 'border-neutral-100 text-neutral-500'} flex items-center justify-between text-[11px] font-medium gap-2`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'} shrink-0`} />
                          <span className={`truncate ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-700'}`}>{locationText}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Flag className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'} shrink-0`} />
                          <span className={isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}>{categoryText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Advisory Reader Modal */}
          {activeModalAdvisory && (
            <div className={`fixed inset-0 z-50 ${isBarangay ? 'bg-[#011025]/40' : 'bg-black/40'} backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in`}>
              <div className={`bg-white rounded-[24px] max-w-lg w-full border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/80'} shadow-2xl p-6 space-y-4 animate-in zoom-in-95`}>
                <div className={`flex items-start justify-between gap-3 pb-3 border-b ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'}`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                      isBarangay ? 'bg-[#052659] text-white' : 'bg-[#18181b] text-white'
                    } tracking-wider`}>
                      {getAdvisoryDisplayTag(activeModalAdvisory)}
                    </span>
                    <h3 className={`text-base font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} mt-1`}>
                      {activeModalAdvisory.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setActiveModalAdvisory(null);
                      if (onClearSelectedAdvisory) onClearSelectedAdvisory();
                    }}
                    className={`p-1 ${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-400 hover:text-neutral-700'} rounded-lg cursor-pointer`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`text-xs ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} leading-relaxed whitespace-pre-line space-y-3`}>
                  <p>{activeModalAdvisory.content}</p>
                </div>

                <div className={`p-3.5 rounded-2xl ${isBarangay ? 'bg-[#C2E8FF]/10 border border-[#7EA0C5]/30' : 'bg-neutral-50 border border-neutral-200/80 text-neutral-700'} text-[11px] space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>Target Jurisdiction:</span>
                    <span className={isBarangay ? 'text-[#5482B4]' : ''}>{getAdvisoryLocationDisplay(activeModalAdvisory)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>Date Issued:</span>
                    <span className={isBarangay ? 'text-[#5482B4]' : ''}>{formatDate(activeModalAdvisory.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>Issuing Authority:</span>
                    <span className={isBarangay ? 'text-[#5482B4]' : ''}>{activeModalAdvisory.author_name}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => {
                      triggerPushToast(activeModalAdvisory.title, activeModalAdvisory.content);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-medium ${
                      isBarangay ? 'text-[#052659] bg-[#C2E8FF]/40 hover:bg-[#C2E8FF] border border-[#7EA0C5]/40' : 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80'
                    } transition-colors cursor-pointer`}
                  >
                    Send Push Test
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalAdvisory(null);
                      if (onClearSelectedAdvisory) onClearSelectedAdvisory();
                    }}
                    className={`px-5 py-2 rounded-full text-xs font-medium text-white ${
                      isBarangay ? 'bg-[#052659] hover:bg-[#5482B4] border border-[#011025]' : 'bg-[#18181b] hover:bg-neutral-800'
                    } transition-colors cursor-pointer shadow-xs`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* 3B. ADMIN BROADCAST CONSOLE (Compose & Published Queue)        */
        /* ============================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Compose Broadcast Panel (7 cols) */}
          <div className={`lg:col-span-7 bg-white rounded-[24px] border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/70'} shadow-xs p-6 relative`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'} mb-5`}>
              <h2 className={`text-base font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} tracking-tight`}>
                Compose Broadcast
              </h2>

              <button
                type="button"
                onClick={handleTogglePush}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  isPushEnabled
                    ? isBarangay
                      ? 'bg-[#C2E8FF] text-[#052659] border-[#7EA0C5]/60 hover:bg-[#C2E8FF]/80'
                      : 'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                    : isBarangay
                      ? 'bg-[#C2E8FF]/20 text-[#5482B4] border-[#7EA0C5]/30 hover:bg-[#C2E8FF]/40'
                      : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`} />
                <span>{isPushEnabled ? 'Push enabled' : 'Push disabled'}</span>
              </button>
            </div>

            <form onSubmit={handlePublishBroadcast} className="space-y-4">
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} mb-1.5`}>
                  ADVISORY TITLE
                </label>
                <input
                  type="text"
                  required
                  value={advisoryTitle}
                  onChange={(e) => setAdvisoryTitle(e.target.value)}
                  placeholder="e.g. River overflow warning: Pangapisan North"
                  className={`w-full text-xs font-medium ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'text-neutral-800 placeholder-neutral-400 bg-neutral-50/60 border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50'
                  } border rounded-xl p-3 focus:bg-white outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} mb-1.5`}>
                    SEVERITY
                  </label>
                  <select
                    value={severity}
                    onChange={(e) =>
                      setSeverity(e.target.value as 'Warning' | 'Emergency' | 'Advisory' | 'Notice')
                    }
                    className={`w-full text-xs font-medium ${
                      isBarangay
                        ? 'text-[#011025] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4]'
                        : 'text-neutral-800 bg-neutral-50/60 border-neutral-200 focus:border-neutral-400'
                    } border rounded-xl p-3 focus:bg-white outline-hidden cursor-pointer`}
                  >
                    <option value="Warning">Warning</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Notice">Notice</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} mb-1.5`}>
                    BROADCAST TYPE
                  </label>
                  <select
                    value={broadcastType}
                    onChange={(e) =>
                      setBroadcastType(
                        e.target.value as 'Emergency' | 'Preparedness' | 'Weather' | 'Evacuation'
                      )
                    }
                    className={`w-full text-xs font-medium ${
                      isBarangay
                        ? 'text-[#011025] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4]'
                        : 'text-neutral-800 bg-neutral-50/60 border-neutral-200 focus:border-neutral-400'
                    } border rounded-xl p-3 focus:bg-white outline-hidden cursor-pointer`}
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="Preparedness">Preparedness</option>
                    <option value="Weather">Weather Warning</option>
                    <option value="Evacuation">Evacuation Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} mb-1.5`}>
                  AFFECTED AREA
                </label>
                <select
                  value={affectedArea}
                  onChange={(e) => setAffectedArea(e.target.value)}
                  className={`w-full text-xs font-medium ${
                    isBarangay
                      ? 'text-[#011025] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4]'
                      : 'text-neutral-800 bg-neutral-50/60 border-neutral-200 focus:border-neutral-400'
                  } border rounded-xl p-3 focus:bg-white outline-hidden cursor-pointer`}
                >
                  <option value="Municipality-wide (Lingayen)">Municipality-wide (Lingayen)</option>
                  <option value="Coastal barangays">Coastal barangays (Lingayen Gulf)</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.city || 'Lingayen'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} mb-1.5`}>
                  MESSAGE
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write the advisory residents will receive as a push notification."
                  className={`w-full text-xs font-medium ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'text-neutral-800 placeholder-neutral-400 bg-neutral-50/60 border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50'
                  } border rounded-xl p-3.5 focus:bg-white outline-hidden transition-all focus:ring-2`}
                />
                <p className={`text-[11px] ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} mt-1.5`}>
                  Keep it short. Residents read this on a lock screen during an emergency.
                </p>
              </div>

              <div className={`pt-3 border-t ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'} flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-white ${
                      isBarangay
                        ? 'bg-[#052659] hover:bg-[#5482B4] border border-[#011025]'
                        : 'bg-[#18181b] hover:bg-neutral-800'
                    } transition-colors shadow-xs cursor-pointer`}
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Publish Broadcast</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className={`px-4 py-2.5 rounded-full text-xs font-medium ${
                      isBarangay
                        ? 'text-[#052659] bg-[#C2E8FF]/40 hover:bg-[#C2E8FF] border border-[#7EA0C5]/40'
                        : 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80'
                    } transition-colors cursor-pointer`}
                  >
                    Clear
                  </button>
                </div>

                <div className={`flex items-center gap-1.5 text-xs ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} font-medium`}>
                  <Users className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-600'}`} />
                  <span>
                    Reach {typeof navigator !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? '1' : '0'} subscribed devices
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Preview (Top) + Published (Bottom) (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`bg-white rounded-[24px] border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/70'} shadow-xs p-5 space-y-4`}>
              <h3 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} tracking-tight`}>
                Preview
              </h3>

              <div className={`p-4 rounded-2xl ${isBarangay ? 'bg-[#C2E8FF]/15 border-[#7EA0C5]/30' : 'bg-neutral-50 border-neutral-200/70'} border shadow-2xs space-y-2`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg ${isBarangay ? 'bg-[#052659]' : 'bg-[#18181b]'} text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>UniGuard</span>
                  <span className={`text-[10px] ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} font-medium`}>now</span>
                </div>

                <h4 className={`text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} leading-snug`}>
                  {advisoryTitle.trim() || 'Advisory title appears here'}
                </h4>

                <p className={`text-xs ${isBarangay ? 'text-[#052659]' : 'text-neutral-600'} leading-relaxed line-clamp-3`}>
                  {message.trim() || 'Your message appears here as residents will see it'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border tracking-wider transition-colors ${
                    severity === 'Warning'
                      ? isBarangay
                        ? 'bg-[#052659] text-white border-[#011025] shadow-2xs'
                        : 'bg-[#18181b] text-white border-neutral-800 shadow-2xs'
                      : isBarangay
                        ? 'bg-[#C2E8FF]/40 text-[#052659] border-[#7EA0C5]/40'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                  }`}
                >
                  WARNING
                </span>

                <span
                  className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border tracking-wider transition-colors ${
                    severity === 'Emergency'
                      ? isBarangay
                        ? 'bg-[#052659] text-white border-[#011025] shadow-2xs'
                        : 'bg-[#18181b] text-white border-neutral-800 shadow-2xs'
                      : isBarangay
                        ? 'bg-[#C2E8FF]/40 text-[#052659] border-[#7EA0C5]/40'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                  }`}
                >
                  EMERGENCY
                </span>
              </div>
            </div>

            {/* Published Advisories List */}
            <div className={`bg-white rounded-[24px] border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/70'} shadow-xs overflow-hidden flex flex-col`}>
              <div className={`px-5 py-3.5 border-b ${isBarangay ? 'border-[#7EA0C5]/20 bg-[#C2E8FF]/10' : 'border-neutral-100 bg-neutral-50/50'} flex items-center justify-between`}>
                <h3 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} tracking-tight`}>
                  Published
                </h3>
                <span className={`text-xs font-medium ${isBarangay ? 'text-[#052659] bg-[#C2E8FF] border-[#7EA0C5]/40' : 'text-neutral-700 bg-neutral-200/80 border-neutral-300/60'} px-2 py-0.5 rounded-full font-mono border`}>
                  {adminFilteredAdvisories.length}
                </span>
              </div>

              <div className={`divide-y ${isBarangay ? 'divide-[#7EA0C5]/15' : 'divide-neutral-100'} max-h-[460px] overflow-y-auto`}>
                {adminFilteredAdvisories.length === 0 ? (
                  <div className={`p-8 text-center text-xs ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'}`}>
                    No advisories match your search.
                  </div>
                ) : (
                  adminFilteredAdvisories.map((adv) => {
                    const locationText = getAdvisoryLocationDisplay(adv);
                    const categoryText = getAdvisoryCategory(adv);
                    const isSelected = selectedPublishedAdvisory?.id === adv.id;

                    return (
                      <div
                        key={adv.id}
                        onClick={() =>
                          setSelectedPublishedAdvisory(isSelected ? null : adv)
                        }
                        className={`p-4 transition-colors cursor-pointer space-y-1.5 ${
                          isSelected
                            ? isBarangay
                              ? 'bg-[#C2E8FF]/25 border-l-4 border-[#052659]'
                              : 'bg-neutral-100/80 border-l-4 border-neutral-900'
                            : isBarangay
                              ? 'hover:bg-[#C2E8FF]/15'
                              : 'hover:bg-neutral-50/80'
                        }`}
                      >
                        <div>
                          <h4 className={`text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} leading-snug`}>
                            {adv.title}
                          </h4>
                        </div>

                        <div className={`flex flex-wrap items-center gap-2 text-[11px] ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
                          <div className="flex items-center gap-1">
                            <MapPin className={`w-3 h-3 ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} shrink-0`} />
                            <span className={`font-medium ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'} truncate`}>
                              {locationText}
                            </span>
                          </div>

                          <span>•</span>

                          <span
                            className={`font-medium ${
                              categoryText === 'Emergency'
                                ? isBarangay ? 'text-[#011025] font-semibold' : 'text-neutral-900 font-semibold'
                                : isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'
                            }`}
                          >
                            {categoryText}
                          </span>

                          <span>•</span>

                          <span className={`font-mono ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'}`}>
                            {formatDate(adv.created_at)}
                          </span>
                        </div>

                        {isSelected && (
                          <div className={`mt-2.5 pt-2 border-t ${isBarangay ? 'border-[#7EA0C5]/30 text-[#052659]' : 'border-neutral-200/60 text-neutral-700'} text-xs space-y-2 pl-4.5 animate-in fade-in`}>
                            <p className="leading-relaxed">{adv.content}</p>
                            <div className={`flex items-center justify-between text-[10px] ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} pt-1`}>
                              <span>Author: {adv.author_name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerPushToast(adv.title, adv.content);
                                }}
                                className={`${isBarangay ? 'text-[#052659] hover:text-[#011025]' : 'text-neutral-900 hover:text-black'} font-semibold underline cursor-pointer`}
                              >
                                Push Test to Phone
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
