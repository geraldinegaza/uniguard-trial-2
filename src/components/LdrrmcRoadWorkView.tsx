import React, { useState, useMemo } from 'react';
import { Barangay, User } from '../types';
import { storage } from '../services/storage';
import {
  Construction,
  Megaphone,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Compass,
  X,
  Plus,
  Trash2,
  Check,
  Send,
  Navigation,
  RotateCcw,
  Radio,
  Layers,
  ChevronDown
} from 'lucide-react';

export interface RoadWorkPost {
  id: string;
  title: string;
  description: string;
  barangay: string;
  roadName: string;
  latitude: number;
  longitude: number;
  durationHours: number;
  status: 'Impassable' | 'Passable with Caution' | 'Under Clearing' | 'Cleared';
  createdAt: string;
  authorName: string;
}

const INITIAL_ROAD_POSTS: RoadWorkPost[] = [
  {
    id: 'rw-001',
    title: 'Road clearing: Aguila Rd',
    description: 'Fallen acacia branches and snapped cable lines blocking two-way traffic. DPWH and Municipal Engineering crews currently operating chainsaw clearing.',
    barangay: 'Poblacion',
    roadName: 'Aguila Rd',
    latitude: 16.0206,
    longitude: 120.2306,
    durationHours: 6,
    status: 'Under Clearing',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    authorName: 'LDRRMO Dispatcher',
  },
  {
    id: 'rw-002',
    title: 'Culvert & Drainage Overflow: Avenida Rizal East',
    description: 'Localized flash flood water 1.5 feet deep. Light passenger vehicles advised to take alternative detour via Maramba Boulevard.',
    barangay: 'Libsong',
    roadName: 'Avenida Rizal East',
    latitude: 16.0248,
    longitude: 120.2298,
    durationHours: 4,
    status: 'Passable with Caution',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    authorName: 'BDRRMC Libsong Team',
  },
  {
    id: 'rw-003',
    title: 'Emergency Pavement Repair: Domalandan Bridge Approach',
    description: 'Road embankment erosion along approach slab. Lane closure enforced with safety cones and flashing warning beacons.',
    barangay: 'Domalandan Center',
    roadName: 'Domalandan Bridge Approach',
    latitude: 16.0125,
    longitude: 120.2180,
    durationHours: 8,
    status: 'Impassable',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    authorName: 'Municipal Engineering Unit',
  },
];

const LINGAYEN_BARANGAY_OPTIONS = [
  'Municipality-wide',
  'Aliwekwek',
  'Baay',
  'Balangobong',
  'Balococ',
  'Bantayan',
  'Basing',
  'Capandanan',
  'Domalandan Center',
  'Domalandan East',
  'Domalandan West',
  'Dorongan',
  'Dulag',
  'Estanza',
  'Lasip',
  'Libsong',
  'Libsong East',
  'Libsong West',
  'Malawa',
  'Malimpuec',
  'Maniboc',
  'Matalava',
  'Naguelguel',
  'Namolan',
  'Pangapisan North',
  'Pangapisan Sur',
  'Poblacion',
  'Quibaol',
  'Rosario',
  'Sabangan',
  'Talogtog',
  'Tonton',
  'Tumbar',
  'Wawa',
];

interface LdrrmcRoadWorkViewProps {
  barangays: Barangay[];
  currentUser: User;
  onSelectOnMap?: (reportOrCoords: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LdrrmcRoadWorkView: React.FC<LdrrmcRoadWorkViewProps> = ({
  barangays,
  currentUser,
  onSelectOnMap,
  onNavigateTab,
}) => {
  const isBarangay = currentUser?.role === 'barangay';

  // Road work notices state with local storage persistence
  const [roadPosts, setRoadPosts] = useState<RoadWorkPost[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uniguard_road_work_posts');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_ROAD_POSTS;
  });

  // Form states matching initial draft screenshot
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [barangay, setBarangay] = useState('Municipality-wide');
  const [roadName, setRoadName] = useState('Aguila Rd');
  const [latitude, setLatitude] = useState<string>('16.0206');
  const [longitude, setLongitude] = useState<string>('120.2306');
  const [durationHours, setDurationHours] = useState<string>('6');
  const [status, setStatus] = useState<RoadWorkPost['status']>('Under Clearing');

  // UI state
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cleared'>('all');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Modal for adding extra road status overlay
  const [isOverlayModalOpen, setIsOverlayModalOpen] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const savePosts = (updated: RoadWorkPost[]) => {
    setRoadPosts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniguard_road_work_posts', JSON.stringify(updated));
    }
  };

  // Active count (not cleared)
  const activeCount = useMemo(() => {
    return roadPosts.filter((p) => p.status !== 'Cleared').length;
  }, [roadPosts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    if (statusFilter === 'active') {
      return roadPosts.filter((p) => p.status !== 'Cleared');
    }
    if (statusFilter === 'cleared') {
      return roadPosts.filter((p) => p.status === 'Cleared');
    }
    return roadPosts;
  }, [roadPosts, statusFilter]);

  // Geolocation Handler
  const handleGetLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(5));
          setLongitude(pos.coords.longitude.toFixed(5));
          setIsGettingLocation(false);
          setActionNotice('Fetched device coordinates successfully');
          setTimeout(() => setActionNotice(null), 3000);
        },
        () => {
          // fallback to Lingayen coordinates
          setLatitude('16.0206');
          setLongitude('120.2306');
          setIsGettingLocation(false);
        }
      );
    }
  };

  // Publish Form Submit
  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPost: RoadWorkPost = {
      id: `rw-${Date.now().toString(36)}`,
      title: title.trim(),
      description: description.trim() || `Road notice active along ${roadName}. Proceed with caution.`,
      barangay,
      roadName: roadName.trim() || 'Lingayen Arterial Road',
      latitude: parseFloat(latitude) || 16.0206,
      longitude: parseFloat(longitude) || 120.2306,
      durationHours: parseInt(durationHours, 10) || 6,
      status: status || 'Under Clearing',
      createdAt: new Date().toISOString(),
      authorName: currentUser.full_name || 'LDRRMO Dispatcher',
    };

    savePosts([newPost, ...roadPosts]);

    // Record system audit log
    storage.addAuditLog({
      event_type: 'emergency_broadcast',
      actor_name: `${currentUser.full_name} (${currentUser.role.toUpperCase()})`,
      description: `Published Road Work Notice: "${newPost.title}" for ${newPost.barangay} (${newPost.durationHours}h expected duration).`,
      target_id: newPost.id,
    });

    setActionNotice(`Published notice & dispatched push alert for "${newPost.title}"`);
    handleClearForm();
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Clear Form
  const handleClearForm = () => {
    setTitle('');
    setDescription('');
    setBarangay('Municipality-wide');
    setRoadName('Aguila Rd');
    setLatitude('16.0206');
    setLongitude('120.2306');
    setDurationHours('6');
    setStatus('Under Clearing');
  };

  // Mark Road Cleared
  const handleMarkCleared = (id: string) => {
    const updated = roadPosts.map((p) => {
      if (p.id === id) {
        return { ...p, status: 'Cleared' as const };
      }
      return p;
    });
    savePosts(updated);
    setActionNotice('Marked road as cleared and safe for vehicular transit');
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Reopen Road Notice
  const handleReopen = (id: string) => {
    const updated = roadPosts.map((p) => {
      if (p.id === id) {
        return { ...p, status: 'Under Clearing' as const };
      }
      return p;
    });
    savePosts(updated);
    setActionNotice('Reopened road obstruction notice');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Delete Record
  const handleDelete = (id: string) => {
    const updated = roadPosts.filter((p) => p.id !== id);
    savePosts(updated);
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* 1. Header Section matching reference: Title + Subtitle + Active Pill */}
      <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-semibold tracking-tight ${
            isBarangay ? 'text-[#011025]' : 'text-neutral-900'
          }`}>
            Road Work Posts
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed ${
            isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
          }`}>
            Publish a road work notice. Residents of the affected barangay get a push notification.
          </p>
        </div>

        {/* Top Right Counter Pill */}
        <span className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium shadow-2xs self-start sm:self-auto flex items-center gap-1.5 ${
          isBarangay
            ? 'bg-[#C2E8FF]/40 text-[#052659] border border-[#7EA0C5]/40'
            : 'bg-neutral-100 text-neutral-800 border border-neutral-200/80'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            activeCount > 0 ? (isBarangay ? 'bg-[#052659] animate-pulse' : 'bg-[#18181b] animate-pulse') : (isBarangay ? 'bg-[#7EA0C5]' : 'bg-neutral-300')
          }`} />
          <span>{activeCount} active</span>
        </span>
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

      {/* 2. First Card: New Road Work Post Form */}
      <div className={`rounded-[24px] shadow-xs overflow-hidden ${
        isBarangay ? 'bg-white border border-[#7EA0C5]/30 shadow-[0_2px_12px_rgba(1,16,37,0.03)]' : 'bg-white border border-neutral-200/70'
      }`}>
        {/* Card Header with Corner Accent */}
        <div className={`px-6 py-4.5 border-b flex items-center justify-between ${
          isBarangay ? 'bg-[#C2E8FF]/10 border-[#7EA0C5]/20' : 'bg-neutral-50/50 border-neutral-100'
        }`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${
            isBarangay ? 'text-[#011025]' : 'text-neutral-900'
          }`}>
            New Road Work Post
          </h2>
          <span className={`text-[11px] font-medium ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'}`}>
            Push Broadcast Ready
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePublishSubmit} className="p-6 space-y-4">
          {/* TITLE */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
              isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
            }`}>
              TITLE
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Road clearing: Aguila Rd"
              className={`w-full text-xs font-medium p-3 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                isBarangay
                  ? 'border border-[#7EA0C5]/30 bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] placeholder-[#5482B4]/60 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                  : 'border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
              }`}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
              isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
            }`}>
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is happening, what lane is closed, any detour to recommend."
              className={`w-full text-xs font-medium p-3 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                isBarangay
                  ? 'border border-[#7EA0C5]/30 bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] placeholder-[#5482B4]/60 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                  : 'border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
              }`}
            />
          </div>

          {/* Grid Row 1: BARANGAY & ROAD NAME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`}>
                BARANGAY
              </label>
              <div className="relative">
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className={`w-full text-xs font-medium rounded-xl p-3 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                    isBarangay
                      ? 'text-[#011025] bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/30 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                      : 'text-neutral-800 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                >
                  {LINGAYEN_BARANGAY_OPTIONS.map((brgy) => (
                    <option key={brgy} value={brgy}>
                      {brgy === 'Municipality-wide' ? 'Municipality-wide' : `Brgy. ${brgy}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-4 h-4 absolute right-3.5 top-3.5 pointer-events-none ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'
                }`} />
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`}>
                ROAD NAME
              </label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="Aguila Rd"
                className={`w-full text-xs font-medium p-3 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                  isBarangay
                    ? 'border border-[#7EA0C5]/30 bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] placeholder-[#5482B4]/60 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                    : 'border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                }`}
              />
            </div>
          </div>

          {/* Grid Row 2: LATITUDE, LONGITUDE, & My Location Button */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`}>
                LATITUDE
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="16.0206"
                className={`w-full text-xs font-mono font-medium p-3 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                  isBarangay
                    ? 'border border-[#7EA0C5]/30 bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] placeholder-[#5482B4]/60 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                    : 'border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                }`}
              />
            </div>

            <div className="md:col-span-5">
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`}>
                LONGITUDE
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="120.2306"
                className={`w-full text-xs font-mono font-medium p-3 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                  isBarangay
                    ? 'border border-[#7EA0C5]/30 bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] placeholder-[#5482B4]/60 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                    : 'border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className={`w-full p-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 ${
                  isBarangay
                    ? 'bg-[#C2E8FF]/20 hover:bg-[#C2E8FF]/40 border border-[#7EA0C5]/30 text-[#052659]'
                    : 'bg-neutral-50/70 hover:bg-neutral-100 border border-neutral-200 text-neutral-800'
                }`}
                title="Use current device GPS location"
              >
                <MapPin className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'}`} />
                <span>{isGettingLocation ? 'Detecting...' : 'My Location'}</span>
              </button>
            </div>
          </div>

          {/* Grid Row 3: EXPECTED DURATION (HOURS) & STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`}>
                EXPECTED DURATION (HOURS)
              </label>
              <input
                type="number"
                min={1}
                max={72}
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="6"
                className={`w-full text-xs font-mono font-medium p-3 rounded-xl focus:outline-hidden transition-all shadow-2xs ${
                  isBarangay
                    ? 'border border-[#7EA0C5]/30 bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white text-[#011025] placeholder-[#5482B4]/60 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                    : 'border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`}>
                ROAD PASSABILITY STATUS
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RoadWorkPost['status'])}
                  className={`w-full text-xs font-medium rounded-xl p-3 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                    isBarangay
                      ? 'text-[#011025] bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/30 focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]'
                      : 'text-neutral-800 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                >
                  <option value="Under Clearing">Under Clearing Operations</option>
                  <option value="Impassable">Impassable (Closed Road)</option>
                  <option value="Passable with Caution">Passable with Caution</option>
                  <option value="Cleared">Cleared (Open)</option>
                </select>
                <ChevronDown className={`w-4 h-4 absolute right-3.5 top-3.5 pointer-events-none ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'
                }`} />
              </div>
            </div>
          </div>

          {/* Bottom Actions: Publish & Notify + Clear */}
          <div className={`flex items-center gap-3 pt-3 border-t ${
            isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'
          }`}>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer ${
                isBarangay
                  ? 'bg-[#052659] hover:bg-[#031c42] text-white border border-[#011025]/20'
                  : 'bg-[#18181b] hover:bg-neutral-800 text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Publish & Notify</span>
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              className={`px-4 py-2.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                isBarangay
                  ? 'bg-white hover:bg-[#C2E8FF]/30 text-[#052659] border border-[#7EA0C5]/40'
                  : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
              }`}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* 3. Second Card: Road Status Overlay */}
      <div className={`rounded-[24px] shadow-xs overflow-hidden ${
        isBarangay ? 'bg-white border border-[#7EA0C5]/30 shadow-[0_2px_12px_rgba(1,16,37,0.03)]' : 'bg-white border border-neutral-200/70'
      }`}>
        {/* Card Header Bar with Title and + Add Road Status Button */}
        <div className={`px-6 py-4.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isBarangay ? 'bg-[#C2E8FF]/10 border-[#7EA0C5]/20' : 'bg-neutral-50/50 border-neutral-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <Layers className={`w-4 h-4 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`} />
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${
              isBarangay ? 'text-[#011025]' : 'text-neutral-900'
            }`}>
              Road Status Overlay
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className={`hidden sm:flex items-center gap-1 rounded-full p-1 text-xs font-medium border ${
              isBarangay ? 'bg-[#C2E8FF]/20 border-[#7EA0C5]/30' : 'bg-neutral-100/70 border-neutral-200/60'
            }`}>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                    : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/40' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  statusFilter === 'active'
                    ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                    : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/40' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('cleared')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  statusFilter === 'cleared'
                    ? isBarangay ? 'bg-[#052659] text-white shadow-2xs' : 'bg-[#2A2A2A] text-white shadow-2xs'
                    : isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/40' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                }`}
              >
                Cleared
              </button>
            </div>

            {/* + Add Road Status Button */}
            <button
              onClick={() => {
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full shadow-2xs transition-colors cursor-pointer ${
                isBarangay
                  ? 'bg-[#052659] hover:bg-[#031c42] text-white border border-[#011025]/20'
                  : 'bg-[#18181b] hover:bg-neutral-800 text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Road Status</span>
            </button>
          </div>
        </div>

        {/* Notices & Obstructions Listing */}
        <div className="p-5 sm:p-6 space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${
                isBarangay ? 'bg-[#C2E8FF]/30 text-[#052659] border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              }`}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className={`text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>
                No active road obstructions in this filter
              </p>
              <p className={`text-[11px] ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
                All arterial roadways and barangay bridges are currently reporting clear passability.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPosts.map((post) => {
                const isExpanded = expandedPostId === post.id;
                return (
                  <div
                    key={post.id}
                    onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    className={`group rounded-[20px] sm:rounded-[24px] p-5 shadow-xs transition-all space-y-3 flex flex-col justify-between cursor-pointer ${
                      isBarangay
                        ? isExpanded
                          ? 'bg-[#C2E8FF]/20 border border-[#052659] shadow-sm'
                          : 'bg-white border border-[#7EA0C5]/30 hover:border-[#5482B4]/60 hover:shadow-md'
                        : isExpanded
                        ? 'bg-neutral-50 border border-neutral-800 shadow-sm'
                        : 'bg-white border border-neutral-200/70 hover:border-neutral-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase border shadow-2xs shrink-0 ${
                            isBarangay
                              ? post.status === 'Impassable'
                                ? 'bg-[#052659] text-white border-[#011025]/40'
                                : post.status === 'Under Clearing'
                                ? 'bg-[#031c42] text-white border-[#052659]'
                                : post.status === 'Passable with Caution'
                                ? 'bg-[#C2E8FF]/60 text-[#052659] border-[#7EA0C5]/40'
                                : 'bg-[#5482B4] text-white border-[#5482B4]'
                              : post.status === 'Impassable'
                              ? 'bg-[#18181b] text-white border-neutral-800'
                              : post.status === 'Under Clearing'
                              ? 'bg-[#2A2A2A] text-white border-neutral-700'
                              : post.status === 'Passable with Caution'
                              ? 'bg-neutral-100 text-neutral-800 border-neutral-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {post.status !== 'Cleared' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                          <span>{post.status}</span>
                        </span>

                        <div className={`flex items-center gap-1 text-[11px] font-mono ${
                          isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{post.durationHours}h est.</span>
                        </div>
                      </div>

                      <h3 className={`text-xs sm:text-sm font-semibold leading-snug ${
                        isBarangay ? 'text-[#011025]' : 'text-neutral-900'
                      }`}>
                        {post.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-400'}`} />
                        <span className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>
                          {post.roadName} &bull; {post.barangay}
                        </span>
                      </div>

                      {/* Progressive Disclosure: Description and GPS reveal on hover or click */}
                      <div className={`overflow-hidden transition-all duration-200 space-y-1.5 ${
                        isExpanded
                          ? 'max-h-48 pt-2.5 border-t border-neutral-200/80 opacity-100'
                          : 'max-h-0 group-hover:max-h-48 group-hover:pt-2.5 group-hover:border-t group-hover:border-neutral-100 opacity-0 group-hover:opacity-100'
                      }`}>
                        <p className={`text-xs leading-relaxed font-normal ${
                          isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'
                        }`}>
                          {post.description}
                        </p>

                        <div className={`flex items-center justify-between font-mono text-[10px] pt-1 ${
                          isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 shrink-0" />
                            <span>GPS: {post.latitude.toFixed(4)}, {post.longitude.toFixed(4)}</span>
                          </div>
                          <span className="text-[10px] font-sans font-medium text-neutral-500">
                            {isExpanded ? 'Click to collapse' : 'Click to pin details'}
                          </span>
                        </div>
                      </div>
                    </div>

                  {/* Actions */}
                  <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                    isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {post.status !== 'Cleared' ? (
                        <button
                          onClick={() => handleMarkCleared(post.id)}
                          className={`px-3 py-1.5 text-[11px] font-medium rounded-full cursor-pointer transition-colors shadow-2xs ${
                            isBarangay
                              ? 'bg-[#052659] hover:bg-[#031c42] text-white border border-[#011025]/20'
                              : 'bg-[#18181b] hover:bg-neutral-800 text-white'
                          }`}
                        >
                          Mark Cleared
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReopen(post.id)}
                          className={`px-3 py-1.5 text-[11px] font-medium rounded-full cursor-pointer transition-colors ${
                            isBarangay
                              ? 'bg-[#C2E8FF]/30 hover:bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/30'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                          }`}
                        >
                          Reopen Notice
                        </button>
                      )}

                      {onSelectOnMap && (
                        <button
                          onClick={() => onSelectOnMap(post)}
                          className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                            isBarangay ? 'text-[#052659] hover:text-[#011025]' : 'text-neutral-900 hover:text-black'
                          }`}
                        >
                          Locate on Radar
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(post.id)}
                      className={`p-1.5 cursor-pointer transition-colors rounded-full ${
                        isBarangay
                          ? 'text-[#7EA0C5] hover:text-[#052659] hover:bg-[#C2E8FF]/30'
                          : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                      }`}
                      title="Delete notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
