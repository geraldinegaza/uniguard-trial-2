import React, { useState, useMemo } from 'react';
import { IncidentReport, Barangay, User, HazardType } from '../types';
import { storage } from '../services/storage';
import {
  HelpCircle,
  Tag,
  CheckCircle2,
  Trash2,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  Plus,
  X,
  Check,
  Navigation,
  FileQuestion,
  Filter
} from 'lucide-react';

export interface LdrrmcOthersReviewViewProps {
  reports: IncidentReport[];
  barangays: Barangay[];
  currentUser: User;
  onUpdateReportStatus?: (reportId: string, status: any) => void;
  onSelectOnMap?: (coords: { latitude: number; longitude: number; label: string }) => void;
  onNavigateTab?: (tab: string) => void;
}

const CANONICAL_HAZARD_CATEGORIES: HazardType[] = [
  'Flood',
  'River Overflow' as any,
  'Drainage Blockage' as any,
  'Storm Surge',
  'Coastal Erosion' as any,
  'Strong Wind / Typhoon Damage' as any,
  'Fallen Tree',
  'Landslide / Soil Erosion' as any,
  'Earthquake' as any,
  'Road Damage',
  'Vehicular Accident' as any,
  'Fire' as any,
  'Downed Powerline',
  'Emergency SOS',
];

export const LdrrmcOthersReviewView: React.FC<LdrrmcOthersReviewViewProps> = ({
  reports = [],
  barangays = [],
  currentUser,
  onUpdateReportStatus,
  onSelectOnMap,
  onNavigateTab,
}) => {
  const isBarangay = currentUser?.role === 'barangay';

  // Filter for reports that have hazard_type 'Others' or uncategorized
  // Also provide local state if commanders simulate new "Others" reports
  const [localOthersReports, setLocalOthersReports] = useState<IncidentReport[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uniguard_custom_others_reports');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [];
  });

  const [promoteModalReport, setPromoteModalReport] = useState<IncidentReport | null>(null);
  const [selectedTargetCategory, setSelectedTargetCategory] = useState<string>('Drainage Blockage');
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // New simulated report state
  const [simText, setSimText] = useState('Severe coastal plastic drift clogging the fish port outlet gate.');
  const [simBarangay, setSimBarangay] = useState('poblacion');
  const [simReporter, setSimReporter] = useState('Fisherfolk Association Leader');

  const saveLocalReports = (updated: IncidentReport[]) => {
    setLocalOthersReports(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniguard_custom_others_reports', JSON.stringify(updated));
    }
  };

  // Combine system reports marked as "Others" with local ones
  const allOthersReports = useMemo(() => {
    const fromProps = reports.filter(
      (r) =>
        r.hazard_type === ('Others' as any) ||
        r.hazard_type === ('General' as any) ||
        (r.hazard_type as string)?.toLowerCase() === 'others'
    );
    const combined = [...localOthersReports, ...fromProps];
    // de-duplicate by ID
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [reports, localOthersReports]);

  // Handle Promote to Canonical Category
  const handlePromoteCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteModalReport) return;

    const chosenCat = customCategoryName.trim() || selectedTargetCategory;

    // Update in local store or via callback
    const updated = localOthersReports.map((r) => {
      if (r.id === promoteModalReport.id) {
        return {
          ...r,
          hazard_type: chosenCat as any,
          status: 'verified' as const,
        };
      }
      return r;
    });
    saveLocalReports(updated.filter((r) => r.id !== promoteModalReport.id));

    if (onUpdateReportStatus) {
      onUpdateReportStatus(promoteModalReport.id, 'verified');
    }

    setActionNotice(`Successfully promoted entry to canonical category "${chosenCat}"`);
    setPromoteModalReport(null);
    setCustomCategoryName('');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Simulate new Others report
  const handleSimulateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;

    const newReport: IncidentReport = {
      id: `rep-others-${Date.now().toString(36)}`,
      reporter_id: currentUser.id || 'usr-sim-01',
      reporter_name: simReporter.trim() || 'Citizen Caller',
      barangay_id: simBarangay,
      hazard_type: 'Others' as any,
      description: simText.trim(),
      latitude: 16.0210 + (Math.random() - 0.5) * 0.02,
      longitude: 120.2315 + (Math.random() - 0.5) * 0.02,
      status: 'unverified',
      corroboration_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalReports([newReport, ...localOthersReports]);
    setIsSimulateModalOpen(false);
    setActionNotice('New "Others" free-text hazard report received and queued');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Delete / Dismiss
  const handleDeleteReport = (id: string) => {
    const updated = localOthersReports.filter((r) => r.id !== id);
    saveLocalReports(updated);
    setActionNotice('Report entry dismissed');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* 1. Header Section from Initial Draft: Title + Subtitle + Entries Counter */}
      <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-semibold tracking-tight ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
            &ldquo;Others&rdquo; Hazard Review
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
            Aggregated free-text from reports filed as &ldquo;Others&rdquo;. Use it to spot new hazard categories worth promoting into the canonical list.
          </p>
        </div>

        {/* Top Right Counter Pill matching draft: "0 entries" / "X entries" */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer shrink-0 ${
              isBarangay ? 'bg-[#052659] hover:bg-[#031c42] text-white' : 'bg-[#18181b] hover:bg-neutral-800 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate &ldquo;Others&rdquo;</span>
          </button>

          <span className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium shadow-2xs ${
            isBarangay
              ? 'bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/40'
              : 'bg-neutral-100 text-neutral-800 border border-neutral-200/80'
          }`}>
            {allOthersReports.length} {allOthersReports.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {/* Action Flash Notification */}
      {actionNotice && (
        <div className={`p-3.5 rounded-[20px] text-xs font-medium flex items-center justify-between animate-in fade-in ${
          isBarangay
            ? 'bg-[#C2E8FF]/30 border border-[#7EA0C5]/40 text-[#052659]'
            : 'bg-neutral-100/90 border border-neutral-200/80 text-neutral-800'
        }`}>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 shrink-0 ${isBarangay ? 'text-[#052659]' : 'text-neutral-800'}`} />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className={`cursor-pointer p-1 rounded-full transition-colors ${
              isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main Card Section matching Initial Draft */}
      <div className={`bg-white rounded-[24px] shadow-xs overflow-hidden ${
        isBarangay ? 'border border-[#7EA0C5]/30 shadow-[0_2px_12px_rgba(1,16,37,0.03)]' : 'border border-neutral-200/70'
      }`}>
        {allOthersReports.length === 0 ? (
          /* Empty State matching initial draft screenshot */
          <div className="p-16 text-center space-y-3">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-2xs ${
              isBarangay ? 'bg-[#C2E8FF]/30 text-[#052659] border border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
            }`}>
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
              No &ldquo;Others&rdquo; reports yet
            </h3>
            <p className={`text-xs max-w-md mx-auto leading-relaxed ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
              When residents file a report with the &ldquo;Others&rdquo; hazard type and a free-text description, those entries aggregate here.
            </p>
          </div>
        ) : (
          /* Aggregated Free-Text Entries List */
          <div className={`divide-y ${isBarangay ? 'divide-[#7EA0C5]/15' : 'divide-neutral-100'}`}>
            {allOthersReports.map((report) => (
              <div
                key={report.id}
                className={`p-5 sm:p-6 transition-colors space-y-3 ${
                  isBarangay ? 'hover:bg-[#C2E8FF]/10' : 'hover:bg-neutral-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        isBarangay ? 'bg-[#052659] text-white' : 'bg-[#18181b] text-white'
                      }`}>
                        Free-Text Report
                      </span>
                      <span className={`text-[10px] font-mono tracking-wider ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'}`}>
                        ID: {report.id}
                      </span>
                    </div>

                    <p className={`text-sm sm:text-base font-semibold pt-1 leading-relaxed ${
                      isBarangay ? 'text-[#011025]' : 'text-neutral-900'
                    }`}>
                      &ldquo;{report.description}&rdquo;
                    </p>

                    <div className={`flex flex-wrap items-center gap-3 text-xs pt-1 ${
                      isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                    }`}>
                      <span className={`flex items-center gap-1 font-medium ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>
                        <MapPin className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-600'}`} />
                        <span>Brgy. {report.barangay_id.toUpperCase()}</span>
                      </span>
                      <span>&bull;</span>
                      <span>Filed by: {report.reporter_name}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'}`} />
                        <span>{new Date(report.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {report.latitude && report.longitude && onSelectOnMap && (
                      <button
                        onClick={() =>
                          onSelectOnMap({
                            latitude: report.latitude,
                            longitude: report.longitude,
                            label: `Others: ${report.description.slice(0, 20)}...`,
                          })
                        }
                        className={`p-2 rounded-full transition-colors cursor-pointer shadow-2xs ${
                          isBarangay
                            ? 'border border-[#7EA0C5]/40 bg-white text-[#5482B4] hover:text-[#052659] hover:bg-[#C2E8FF]/30'
                            : 'border border-neutral-200/70 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                        title="View coordinates on radar map"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setPromoteModalReport(report)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer ${
                        isBarangay
                          ? 'bg-[#052659] hover:bg-[#031c42] text-white'
                          : 'bg-[#18181b] hover:bg-neutral-800 text-white'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Promote Category</span>
                    </button>

                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className={`p-2 rounded-full transition-colors cursor-pointer shadow-2xs ${
                        isBarangay
                          ? 'border border-[#7EA0C5]/40 bg-white text-[#7EA0C5] hover:text-[#052659] hover:bg-[#C2E8FF]/30'
                          : 'border border-neutral-200/70 bg-white text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                      }`}
                      title="Dismiss entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Promote to Canonical Category */}
      {promoteModalReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
            isBarangay ? 'border border-[#7EA0C5]/40 shadow-[0_8px_30px_rgba(5,38,89,0.12)]' : 'border border-neutral-200/80'
          }`}>
            <div className={`flex items-center justify-between pb-3.5 ${isBarangay ? 'border-b border-[#7EA0C5]/20' : 'border-b border-neutral-100'}`}>
              <h3 className={`font-semibold text-base ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
                Promote to Canonical Category
              </h3>
              <button
                onClick={() => setPromoteModalReport(null)}
                className={`cursor-pointer p-1 rounded-full transition-colors ${
                  isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>Citizen free-text submission:</p>
              <p className={`text-xs font-medium p-3 rounded-xl mt-1 leading-relaxed ${
                isBarangay
                  ? 'bg-[#C2E8FF]/15 border border-[#7EA0C5]/30 text-[#011025]'
                  : 'bg-neutral-50/80 border border-neutral-200/70 text-neutral-800'
              }`}>
                &ldquo;{promoteModalReport.description}&rdquo;
              </p>
            </div>

            <form onSubmit={handlePromoteCategory} className="space-y-4">
              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Assign to Existing Canonical Hazard
                </label>
                <select
                  value={selectedTargetCategory}
                  onChange={(e) => {
                    setSelectedTargetCategory(e.target.value);
                    setCustomCategoryName('');
                  }}
                  className={`w-full text-xs font-medium rounded-xl p-2.5 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                >
                  {CANONICAL_HAZARD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Or Propose Brand-New Hazard Category Name
                </label>
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="e.g. Coastal Plastic Drift / Estero Siltation"
                  className={`w-full text-xs font-medium rounded-xl p-2.5 focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] placeholder-[#7EA0C5] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-2 pt-3 ${isBarangay ? 'border-t border-[#7EA0C5]/20' : 'border-t border-neutral-100'}`}>
                <button
                  type="button"
                  onClick={() => setPromoteModalReport(null)}
                  className={`px-4 py-2 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                    isBarangay
                      ? 'text-[#5482B4] hover:bg-[#C2E8FF]/20'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-medium text-white rounded-full shadow-xs cursor-pointer transition-colors ${
                    isBarangay
                      ? 'bg-[#052659] hover:bg-[#031c42]'
                      : 'bg-[#18181b] hover:bg-neutral-800'
                  }`}
                >
                  Confirm & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Simulate / Test Others Report */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
            isBarangay ? 'border border-[#7EA0C5]/40 shadow-[0_8px_30px_rgba(5,38,89,0.12)]' : 'border border-neutral-200/80'
          }`}>
            <div className={`flex items-center justify-between pb-3.5 ${isBarangay ? 'border-b border-[#7EA0C5]/20' : 'border-b border-neutral-100'}`}>
              <h3 className={`font-semibold text-base ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
                Simulate Citizen &ldquo;Others&rdquo; Report
              </h3>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className={`cursor-pointer p-1 rounded-full transition-colors ${
                  isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateReport} className="space-y-4 pt-4">
              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Citizen Free-Text Observation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="Describe unusual hazard observed in the barangay..."
                  className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] placeholder-[#7EA0C5] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Barangay *
                </label>
                <select
                  value={simBarangay}
                  onChange={(e) => setSimBarangay(e.target.value)}
                  className={`w-full text-xs font-medium rounded-xl p-2.5 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                >
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Citizen Reporter Name
                </label>
                <input
                  type="text"
                  value={simReporter}
                  onChange={(e) => setSimReporter(e.target.value)}
                  className={`w-full text-xs font-medium rounded-xl p-2.5 focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] placeholder-[#7EA0C5] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-2 pt-3 ${isBarangay ? 'border-t border-[#7EA0C5]/20' : 'border-t border-neutral-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className={`px-4 py-2 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                    isBarangay
                      ? 'text-[#5482B4] hover:bg-[#C2E8FF]/20'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-medium text-white rounded-full shadow-xs cursor-pointer transition-colors ${
                    isBarangay
                      ? 'bg-[#052659] hover:bg-[#031c42]'
                      : 'bg-[#18181b] hover:bg-neutral-800'
                  }`}
                >
                  Queue Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
