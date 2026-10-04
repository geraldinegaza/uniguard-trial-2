import React, { useState } from 'react';
import {
  IncidentReport,
  Barangay,
  User,
  HazardType,
} from '../types';
import { storage } from '../services/storage';
import {
  Flame,
  Droplet,
  Zap,
  Wind,
  AlertTriangle,
  Users,
  CheckCircle2,
  Truck,
  CheckCheck,
  MapPin,
  Filter,
  Image as ImageIcon,
  X,
  Maximize2,
  Radio,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface IncidentCardItemProps {
  report: IncidentReport;
  currentUser: User;
  onSelectOnMap?: (report: IncidentReport) => void;
  onCorroborate: (report: IncidentReport) => void;
  onZoomPhoto: (url: string) => void;
  formatTimeAgo: (dateStr: string) => string;
  getHazardIcon: (type: HazardType) => React.ReactNode;
}

const IncidentCardItem: React.FC<IncidentCardItemProps> = ({
  report,
  currentUser,
  onSelectOnMap,
  onCorroborate,
  onZoomPhoto,
  formatTimeAgo,
  getHazardIcon,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState<boolean>(false);
  const corroborations = storage.getCorroborationsForReport(report.id);
  const userAlreadyCorroborated = corroborations.some((c) => c.user_id === currentUser.id);
  const isResolved = report.status === 'resolved';

  const isLongDesc = report.description.length > 130;
  const displayDescription = isLongDesc && !isDescExpanded
    ? `${report.description.slice(0, 130)}...`
    : report.description;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 flex flex-col justify-between min-w-0 w-full">
      <div>
        {/* Header Badge Row */}
        <div className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="p-2 rounded-xl bg-red-50 text-[#991B1B] flex items-center justify-center shrink-0 border border-red-100">
              {getHazardIcon(report.hazard_type)}
            </span>
            <div className="min-w-0">
              <span className="font-black text-slate-900 text-sm tracking-tight truncate block">
                {report.hazard_type}
              </span>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5 flex-wrap">
                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  Brgy. {report.barangay_id.toUpperCase()}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatTimeAgo(report.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider shrink-0 self-start sm:self-center ${
              report.status === 'unverified'
                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                : report.status === 'verified'
                ? 'bg-rose-50 text-[#b91c1c] border border-rose-200'
                : report.status === 'dispatched'
                ? 'bg-[#b91c1c] text-white border border-[#991b1b] shadow-xs'
                : 'bg-slate-900 text-white border border-slate-800'
            }`}
          >
            {report.status}
          </span>
        </div>

        {/* State Machine Sequential Stepper */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
            <span
              className={
                report.status === 'unverified' ||
                report.status === 'verified' ||
                report.status === 'dispatched' ||
                report.status === 'resolved'
                  ? 'text-[#b91c1c] font-black'
                  : 'text-slate-400'
              }
            >
              1. Reported
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={
                report.status === 'verified' ||
                report.status === 'dispatched' ||
                report.status === 'resolved'
                  ? 'text-[#b91c1c] font-black'
                  : 'text-slate-400'
              }
            >
              2. Verified
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={
                report.status === 'dispatched' || report.status === 'resolved'
                  ? 'text-[#b91c1c] font-black'
                  : 'text-slate-400'
              }
            >
              3. Dispatched
            </span>
            <span className="text-slate-300">→</span>
            <span className={report.status === 'resolved' ? 'text-[#b91c1c] font-black' : 'text-slate-400'}>
              4. Resolved
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Description Paragraph with Collapsible Accordion toggle for long content */}
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
            <p className="inline">{displayDescription}</p>
            {isLongDesc && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="ml-1 text-xs font-bold text-[#b91c1c] hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                <span>{isDescExpanded ? 'Show less' : 'Read more'}</span>
                {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Photo Thumbnail if available */}
          {report.photo_url && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
              <img
                src={report.photo_url}
                alt={report.hazard_type}
                className="w-full h-36 sm:h-40 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => onZoomPhoto(report.photo_url || '')}
              />
              <button
                type="button"
                onClick={() => onZoomPhoto(report.photo_url || '')}
                className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Zoom Photo</span>
              </button>
            </div>
          )}

          {/* Operational Notes if Dispatched */}
          {report.assigned_team && (
            <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Truck className="w-3.5 h-3.5 text-[#b91c1c] shrink-0" />
                <span>Response Team: <strong className="text-[#b91c1c]">{report.assigned_team}</strong></span>
              </div>
              {report.dispatch_notes && (
                <p className="text-slate-700 text-[11px] pl-5 leading-normal">{report.dispatch_notes}</p>
              )}
            </div>
          )}

          {/* Resolution Notes if Resolved */}
          {report.resolution_notes && (
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <CheckCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span>Resolved ({formatTimeAgo(report.resolved_at || report.updated_at)})</span>
              </div>
              <p className="text-slate-700 text-[11px] pl-5 leading-normal">{report.resolution_notes}</p>
            </div>
          )}

          {/* Crowd Corroboration Engine Box with Collapsible Notes */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Users className="w-3.5 h-3.5 text-[#b91c1c] shrink-0" />
                <span>Corroboration:</span>
                <span className="font-mono tabular-nums text-[#b91c1c] font-black">
                  {report.corroboration_count} / 3
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {report.corroboration_count >= 3
                  ? 'Auto-verified by Crowd'
                  : `${3 - report.corroboration_count} more needed`}
              </span>
            </div>

            {/* Progress Bar in Monochromatic Red */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500 bg-[#b91c1c]"
                style={{
                  width: `${Math.min(100, (report.corroboration_count / 3) * 100)}%`,
                }}
              />
            </div>

            {/* Collapsible community notes */}
            {corroborations.length > 0 && (
              <div className="pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span>{corroborations.length} community {corroborations.length === 1 ? 'note' : 'notes'}</span>
                  {isNotesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {isNotesExpanded && (
                  <div className="mt-1.5 space-y-1 pl-1">
                    {corroborations.map((c, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <span className="font-bold text-slate-700 shrink-0">• {c.user_name}:</span>
                        <span className="italic text-slate-500 leading-tight">{c.comment || 'Confirmed on-site'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-3 sm:p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
          GPS: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
        </div>

        <div className="flex items-center gap-2">
          {onSelectOnMap && (
            <button
              type="button"
              onClick={() => onSelectOnMap(report)}
              className="text-xs text-[#b91c1c] hover:text-[#991b1b] font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>On Radar</span>
            </button>
          )}

          {!isResolved && (
            <button
              type="button"
              onClick={() => onCorroborate(report)}
              disabled={userAlreadyCorroborated}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                userAlreadyCorroborated
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-[#b91c1c] hover:bg-[#991b1b] text-white shadow-xs cursor-pointer active:scale-95'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{userAlreadyCorroborated ? 'Confirmed' : 'Confirm'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface HazardFeedProps {
  reports: IncidentReport[];
  barangays: Barangay[];
  currentUser: User;
  onOpenReportModal: () => void;
  onSelectOnMap?: (report: IncidentReport) => void;
}

export const HazardFeed: React.FC<HazardFeedProps> = ({
  reports,
  barangays,
  currentUser,
  onOpenReportModal,
  onSelectOnMap,
}) => {
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [corroborateModalReport, setCorroborateModalReport] = useState<IncidentReport | null>(null);
  const [corroborateComment, setCorroborateComment] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);

  const isCitizen = currentUser.role === 'citizen' || currentUser.role === 'barangay';

  const getHazardIcon = (type: HazardType) => {
    switch (type) {
      case 'Flood':
        return <Droplet className="w-4 h-4 text-[#b91c1c]" />;
      case 'Fire':
        return <Flame className="w-4 h-4 text-[#b91c1c]" />;
      case 'Downed Powerline':
        return <Zap className="w-4 h-4 text-[#b91c1c]" />;
      case 'Storm Surge':
      case 'Typhoon / Strong Winds':
        return <Wind className="w-4 h-4 text-[#b91c1c]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#b91c1c]" />;
    }
  };

  const filteredReports = reports.filter((r) => {
    if (selectedHazard !== 'all' && r.hazard_type !== selectedHazard) return false;
    if (selectedBarangay !== 'all' && r.barangay_id !== selectedBarangay) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    return true;
  });

  const handleCorroborateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corroborateModalReport) return;

    const res = storage.corroborateReport(
      corroborateModalReport.id,
      currentUser,
      corroborateComment.trim() || undefined
    );

    setStatusMessage({
      text: res.message,
      isError: !res.success,
    });
    setCorroborateModalReport(null);
    setCorroborateComment('');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Render an individual incident card with collapsible details and high scannability
  const renderIncidentCard = (report: IncidentReport) => {
    return (
      <IncidentCardItem
        key={report.id}
        report={report}
        currentUser={currentUser}
        onSelectOnMap={onSelectOnMap}
        onCorroborate={(rep) => setCorroborateModalReport(rep)}
        onZoomPhoto={(url) => setLightboxImage(url)}
        formatTimeAgo={formatTimeAgo}
        getHazardIcon={getHazardIcon}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert Feedback */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm transition-all ${
            statusMessage.isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isCitizen ? (
        /* Citizen Unified Card: Combined Filter Toolbar + Upper Right Symbol + Minimized Scroll Pane */
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Combined Header: Filter Feed Title, 3 Dropdowns, and View All Button Unit */}
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Left: Filter Feed Title */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#b91c1c]" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Filter Feed ({filteredReports.length} Incidents)
                </span>
              </div>

              {/* Right: Dropdowns + Square Red View All Button with 'View All' label below */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Hazard Filter */}
                <select
                  value={selectedHazard}
                  onChange={(e) => setSelectedHazard(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Hazard Categories</option>
                  <option value="Flood">🌊 Flood</option>
                  <option value="Downed Powerline">⚡ Downed Powerline</option>
                  <option value="Road Obstruction">🚧 Road Obstruction</option>
                  <option value="Storm Surge">🌀 Storm Surge</option>
                  <option value="Fire">🔥 Fire</option>
                  <option value="Medical Emergency">🚑 Medical Emergency</option>
                </select>

                {/* Barangay Filter */}
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Lingayen Barangays</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      Brgy. {b.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Lifecycle Stages</option>
                  <option value="unverified">Stage 1: Unverified</option>
                  <option value="verified">Stage 2: Verified (3+ Crowd)</option>
                  <option value="dispatched">Stage 3: Response Dispatched</option>
                  <option value="resolved">Stage 4: Resolved</option>
                </select>

                {/* Red Square Expand Button + View All Label (Matching Screenshot) */}
                <div className="flex flex-col items-center shrink-0 ml-0.5">
                  <button
                    onClick={() => setIsViewAllModalOpen(true)}
                    className="w-9 h-9 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white flex items-center justify-center transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                    title="View All Hazards & Incidents"
                    aria-label="View All Hazards and Incidents"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-semibold tracking-tight leading-none mt-1 select-none">
                    View All
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimized Scroll Pane inside the combined card */}
          <div className="p-3 sm:p-4 bg-slate-50/50">
            {filteredReports.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Incidents Reported Under This Filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  There are currently no active hazards matching your selected parameters in Lingayen.
                </p>
                <button
                  onClick={() => {
                    setSelectedHazard('all');
                    setSelectedBarangay('all');
                    setSelectedStatus('all');
                  }}
                  className="mt-3 text-xs font-bold text-[#b91c1c] hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto pr-1.5 scroll-smooth">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
                  {filteredReports.map((report) => renderIncidentCard(report))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Standard Unconstrained Grid for Admin & Operations Roles (Untouched) */
        <>
          {/* Filter Toolbar */}
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#b91c1c]" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Filter Feed ({filteredReports.length} Incidents)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Hazard Filter */}
                <select
                  value={selectedHazard}
                  onChange={(e) => setSelectedHazard(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Hazard Categories</option>
                  <option value="Flood">🌊 Flood</option>
                  <option value="Downed Powerline">⚡ Downed Powerline</option>
                  <option value="Road Obstruction">🚧 Road Obstruction</option>
                  <option value="Storm Surge">🌀 Storm Surge</option>
                  <option value="Fire">🔥 Fire</option>
                  <option value="Medical Emergency">🚑 Medical Emergency</option>
                </select>

                {/* Barangay Filter */}
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Lingayen Barangays</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      Brgy. {b.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Lifecycle Stages</option>
                  <option value="unverified">Stage 1: Unverified</option>
                  <option value="verified">Stage 2: Verified (3+ Crowd)</option>
                  <option value="dispatched">Stage 3: Response Dispatched</option>
                  <option value="resolved">Stage 4: Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No Incidents Reported Under This Filter</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are currently no active hazards matching your selected parameters in Lingayen.
              </p>
              <button
                onClick={() => {
                  setSelectedHazard('all');
                  setSelectedBarangay('all');
                  setSelectedStatus('all');
                }}
                className="mt-4 text-xs font-bold text-[#b91c1c] hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
              {filteredReports.map((report) => renderIncidentCard(report))}
            </div>
          )}
        </>
      )}

      {/* View All Pop-Up Modal for Citizen Portal */}
      {isViewAllModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsViewAllModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#991B1B] flex items-center justify-center">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      All Community Hazard Observations
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-[#991B1B] font-bold tabular-nums">
                      {filteredReports.length} Reports
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Live ground reports and verification status across the Municipality of Lingayen
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsViewAllModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
                {filteredReports.map((report) => renderIncidentCard(report))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>MDRRMC Lingayen Citizen Hazard Verification Portal</span>
              <button
                onClick={() => setIsViewAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Feed Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corroboration Confirmation Modal */}
      {corroborateModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#b91c1c]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Crowd Corroborate Incident
                </h3>
              </div>
              <button
                onClick={() => setCorroborateModalReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-950 space-y-1">
              <p className="font-bold">
                Incident: {corroborateModalReport.hazard_type} in Brgy. {corroborateModalReport.barangay_id.toUpperCase()}
              </p>
              <p className="text-[11px] text-red-900">
                Rule: When 3 or more independent citizens corroborate this hazard, UniGuard will automatically elevate it to <strong>Verified</strong> for rapid emergency dispatch.
              </p>
            </div>

            <form onSubmit={handleCorroborateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Current Observation / Ground Update (Optional)
                </label>
                <textarea
                  value={corroborateComment}
                  onChange={(e) => setCorroborateComment(e.target.value)}
                  placeholder="e.g. Water is still rising, impassable for motorcycles as of right now..."
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#b91c1c] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorroborateModalReport(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#b91c1c] hover:bg-[#991b1b] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Submit Corroboration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-slate-900 border border-slate-700">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxImage} alt="Hazard Evidence" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
