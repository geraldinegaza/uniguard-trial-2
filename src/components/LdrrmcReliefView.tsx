import React, { useState, useMemo } from 'react';
import { Barangay, User as UserType } from '../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  Check,
  X,
  Trash2,
  ChevronDown,
  Tag,
  IdCard,
  QrCode,
  ShieldCheck,
  Sun
} from 'lucide-react';

export interface DistributionDrive {
  id: string;
  title: string;
  barangay: string;
  location: string;
  schedule: string;
  targetHouseholds?: number;
  eligibility?: string;
  requiredDocuments?: string;
  status?: 'In Progress' | 'Scheduled' | 'Completed';
  createdAt?: string;
  contactNumber?: string;
}

export interface BeneficiaryRecord {
  id: string;
  controlNo: string;
  name: string;
  barangay: string;
  address: string;
  contactNumber: string;
  familyMembers: number;
  category: '4Ps / Indigent' | 'Senior Citizen' | 'Coastal Evacuee' | 'PWD' | 'Solo Parent';
  status: 'Pending Claim' | 'Claimed';
  claimedAt?: string;
  distributionDriveId?: string;
}

const INITIAL_DISTRIBUTIONS: DistributionDrive[] = [
  {
    id: 'dist-001',
    title: 'Coastal Relief Distribution',
    barangay: 'Pangapisan North',
    location: 'Pangapisan North',
    schedule: 'Sun, Oct 4, 01:32 PM',
    contactNumber: '0917-408-2210',
    targetHouseholds: 250,
    eligibility: 'Coastal residents and fisherfolk affected by storm surge.',
    requiredDocuments: 'Valid Government or Barangay ID',
    status: 'In Progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dist-002',
    title: 'Family Food Pack Distribution',
    barangay: 'Poblacion',
    location: 'Poblacion',
    schedule: 'Sat, Oct 3, 01:32 PM',
    contactNumber: '(075) 632-2222',
    targetHouseholds: 300,
    eligibility: 'Low-income households and registered evacuees.',
    requiredDocuments: 'Valid ID or Household Disaster Pass',
    status: 'In Progress',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_BENEFICIARIES: BeneficiaryRecord[] = [
  {
    id: 'ben-001',
    controlNo: 'BNF-2026-0142',
    name: 'Juan Dela Cruz',
    barangay: 'Poblacion',
    address: 'Zone 2, Rizal Avenue East',
    contactNumber: '0917-542-1102',
    familyMembers: 5,
    category: '4Ps / Indigent',
    status: 'Pending Claim',
    distributionDriveId: 'dist-002',
  },
  {
    id: 'ben-002',
    controlNo: 'BNF-2026-0089',
    name: 'Maria Santos',
    barangay: 'Maniboc',
    address: 'Sitio Beachside, Coastal Purok 4',
    contactNumber: '0920-881-9923',
    familyMembers: 4,
    category: 'Coastal Evacuee',
    status: 'Claimed',
    claimedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    distributionDriveId: 'dist-001',
  },
  {
    id: 'ben-003',
    controlNo: 'BNF-2026-0034',
    name: 'Roberto Gomez',
    barangay: 'Baay',
    address: 'Purok 3, Riverbank Sector',
    contactNumber: '0918-442-7811',
    familyMembers: 6,
    category: 'Senior Citizen',
    status: 'Pending Claim',
    distributionDriveId: 'dist-001',
  },
  {
    id: 'ben-004',
    controlNo: 'BNF-2026-0201',
    name: 'Elena Ramos',
    barangay: 'Libsong East',
    address: 'Fish Port Road, Block 12',
    contactNumber: '0927-331-5509',
    familyMembers: 3,
    category: '4Ps / Indigent',
    status: 'Claimed',
    claimedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    distributionDriveId: 'dist-001',
  },
  {
    id: 'ben-005',
    controlNo: 'BNF-2026-0112',
    name: 'Antonio Reyes',
    barangay: 'Pangapisan North',
    address: 'Zone 1, Highway Crossing',
    contactNumber: '0919-228-4471',
    familyMembers: 5,
    category: 'PWD',
    status: 'Pending Claim',
    distributionDriveId: 'dist-001',
  },
  {
    id: 'ben-006',
    controlNo: 'BNF-2026-0058',
    name: 'Teresa Aquino',
    barangay: 'Domalandan Center',
    address: 'Purok 5, Drainage Canal Boundary',
    contactNumber: '0908-112-9904',
    familyMembers: 4,
    category: 'Solo Parent',
    status: 'Pending Claim',
    distributionDriveId: 'dist-001',
  },
];

const LINGAYEN_BARANGAY_LIST = [
  'All',
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

interface LdrrmcReliefViewProps {
  barangays: Barangay[];
  currentUser: UserType;
}

export const LdrrmcReliefView: React.FC<LdrrmcReliefViewProps> = ({
  barangays,
  currentUser,
}) => {
  const isBarangay = currentUser?.role === 'barangay';

  // State for distributions & beneficiaries with localStorage persistence
  const [distributions, setDistributions] = useState<DistributionDrive[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uniguard_relief_distributions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.some((d: DistributionDrive) => d.title.includes('DSWD') || d.title.includes('Subsidy Packs') || d.title.includes('Hygiene'))) {
            localStorage.setItem('uniguard_relief_distributions', JSON.stringify(INITIAL_DISTRIBUTIONS));
            return INITIAL_DISTRIBUTIONS;
          }
          return parsed;
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_DISTRIBUTIONS;
  });

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uniguard_relief_beneficiaries');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_BENEFICIARIES;
  });

  // Filter states matching screenshot
  const [filterBarangay, setFilterBarangay] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddDistributionOpen, setIsAddDistributionOpen] = useState<boolean>(false);
  const [isAddBeneficiaryOpen, setIsAddBeneficiaryOpen] = useState<boolean>(false);
  const [editingDistId, setEditingDistId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Distribution form state
  const [newDistTitle, setNewDistTitle] = useState('');
  const [newDistBarangay, setNewDistBarangay] = useState('Poblacion');
  const [newDistLocation, setNewDistLocation] = useState('');
  const [newDistSchedule, setNewDistSchedule] = useState('');
  const [newDistHouseholds, setNewDistHouseholds] = useState<number>(200);
  const [newDistEligibility, setNewDistEligibility] = useState('Evacuated families, coastal residents, 4Ps beneficiaries');
  const [newDistDocs, setNewDistDocs] = useState('Valid ID, Barangay Clearance, DAFAC Card');

  // New Beneficiary form state
  const [newBenName, setNewBenName] = useState('');
  const [newBenBarangay, setNewBenBarangay] = useState('Poblacion');
  const [newBenAddress, setNewBenAddress] = useState('');
  const [newBenContact, setNewBenContact] = useState('');
  const [newBenMembers, setNewBenMembers] = useState<number>(4);
  const [newBenCategory, setNewBenCategory] = useState<BeneficiaryRecord['category']>('4Ps / Indigent');

  // Save to localStorage whenever state changes
  const saveDistributions = (updated: DistributionDrive[]) => {
    setDistributions(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniguard_relief_distributions', JSON.stringify(updated));
    }
  };

  const saveBeneficiaries = (updated: BeneficiaryRecord[]) => {
    setBeneficiaries(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniguard_relief_beneficiaries', JSON.stringify(updated));
    }
  };

  // Filtered beneficiaries based on Barangay dropdown and Search input
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      // Barangay filter
      if (filterBarangay !== 'All') {
        const matchesBarangay =
          b.barangay.toLowerCase() === filterBarangay.toLowerCase() ||
          b.barangay.toLowerCase().includes(filterBarangay.toLowerCase());
        if (!matchesBarangay) return false;
      }

      // Search filter (Name or ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesId = b.controlNo.toLowerCase().includes(q);
        const matchesContact = b.contactNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesContact) return false;
      }

      return true;
    });
  }, [beneficiaries, filterBarangay, searchQuery]);

  const handleEditDistribution = (dist: DistributionDrive) => {
    setEditingDistId(dist.id);
    setNewDistTitle(dist.title);
    setNewDistBarangay(dist.barangay);
    setNewDistLocation(dist.location);
    setNewDistSchedule(dist.schedule);
    setNewDistHouseholds(dist.targetHouseholds || 250);
    setNewDistEligibility(dist.eligibility || '');
    setNewDistDocs(dist.requiredDocuments || '');
    setIsAddDistributionOpen(true);
  };

  // Form Submissions
  const handleAddDistributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistTitle.trim()) return;

    if (editingDistId) {
      const updated = distributions.map((d) =>
        d.id === editingDistId
          ? {
              ...d,
              title: newDistTitle.trim(),
              barangay: newDistBarangay,
              location: newDistLocation.trim() || `${newDistBarangay} Center`,
              schedule: newDistSchedule.trim() || 'Daily: 8:00 AM – 4:00 PM',
              targetHouseholds: Number(newDistHouseholds) || 100,
              eligibility: newDistEligibility.trim(),
              requiredDocuments: newDistDocs.trim(),
            }
          : d
      );
      saveDistributions(updated);
      setActionNotice(`Updated distribution: "${newDistTitle.trim()}"`);
    } else {
      const newDrive: DistributionDrive = {
        id: `dist-${Date.now().toString(36)}`,
        title: newDistTitle.trim(),
        barangay: newDistBarangay,
        location: newDistLocation.trim() || `${newDistBarangay} Barangay Hall & Gymnasium`,
        schedule: newDistSchedule.trim() || 'Daily: 8:00 AM – 4:00 PM',
        targetHouseholds: Number(newDistHouseholds) || 100,
        eligibility: newDistEligibility.trim(),
        requiredDocuments: newDistDocs.trim(),
        status: 'In Progress',
        createdAt: new Date().toISOString(),
      };

      saveDistributions([newDrive, ...distributions]);
      setActionNotice(`Added distribution schedule: "${newDrive.title}"`);
    }

    setEditingDistId(null);
    setIsAddDistributionOpen(false);
    setNewDistTitle('');
    setNewDistLocation('');
    setNewDistSchedule('');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleAddBeneficiarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBenName.trim()) return;

    const autoCode = `BNF-2026-${String(beneficiaries.length + 1).padStart(4, '0')}`;
    const newRecord: BeneficiaryRecord = {
      id: `ben-${Date.now().toString(36)}`,
      controlNo: autoCode,
      name: newBenName.trim(),
      barangay: newBenBarangay,
      address: newBenAddress.trim() || `Zone 1, ${newBenBarangay}`,
      contactNumber: newBenContact.trim() || '0917-000-0000',
      familyMembers: Number(newBenMembers) || 1,
      category: newBenCategory,
      status: 'Pending Claim',
    };

    saveBeneficiaries([newRecord, ...beneficiaries]);
    setIsAddBeneficiaryOpen(false);
    setNewBenName('');
    setNewBenAddress('');
    setNewBenContact('');
    setActionNotice(`Added authorized beneficiary: ${newRecord.name} (${autoCode})`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleToggleClaimStatus = (id: string) => {
    const updated = beneficiaries.map((b) => {
      if (b.id === id) {
        const nextStatus: BeneficiaryRecord['status'] =
          b.status === 'Claimed' ? 'Pending Claim' : 'Claimed';
        return {
          ...b,
          status: nextStatus,
          claimedAt: nextStatus === 'Claimed' ? new Date().toISOString() : undefined,
        };
      }
      return b;
    });
    saveBeneficiaries(updated);
    setActionNotice('Updated beneficiary claim status');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleDeleteBeneficiary = (id: string) => {
    const updated = beneficiaries.filter((b) => b.id !== id);
    saveBeneficiaries(updated);
  };

  const handleDeleteDistribution = (id: string) => {
    const updated = distributions.filter((d) => d.id !== id);
    saveDistributions(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} tracking-tight`}>
            Relief Assistance
          </h1>
          <p className={`text-xs sm:text-sm ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} mt-0.5 max-w-2xl leading-relaxed`}>
            Manage per-barangay distribution schedules, eligibility, required documents and the authorized-beneficiary list.
          </p>
        </div>

        {/* Top Right Action Button: + Add Distribution */}
        <button
          onClick={() => setIsAddDistributionOpen(true)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 ${
            isBarangay
              ? 'bg-[#052659] hover:bg-[#5482B4] text-white border border-[#011025]'
              : 'bg-[#18181b] hover:bg-neutral-800 text-white'
          } text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer shrink-0`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Distribution</span>
        </button>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div className={`p-3.5 rounded-2xl ${
          isBarangay ? 'bg-[#C2E8FF]/30 border-[#7EA0C5]/40 text-[#011025]' : 'bg-neutral-100/90 border-neutral-200/80 text-neutral-800'
        } border text-xs font-medium flex items-center justify-between animate-in fade-in`}>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${isBarangay ? 'text-[#052659]' : 'text-neutral-800'} shrink-0`} />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className={`cursor-pointer ${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Active Distributions Section Card */}
      <div className={`bg-white rounded-[24px] border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/70'} shadow-xs overflow-hidden`}>
        {/* Card Header Bar */}
        <div className={`px-6 py-4.5 ${isBarangay ? 'bg-[#C2E8FF]/10 border-[#7EA0C5]/20' : 'bg-neutral-50/50 border-neutral-100'} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <Package className={`w-4 h-4 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`} />
            <h2 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} uppercase tracking-wide`}>
              Active Distributions
            </h2>
          </div>

          {/* Right counter pill matching reference: "X records" */}
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-medium ${
            isBarangay ? 'bg-[#C2E8FF] text-[#052659] border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-700 border-neutral-200/80'
          } border shadow-2xs`}>
            {distributions.length} {distributions.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Card Body: Lists Active Distributions with contents ONLY from screenshot */}
        {distributions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className={`w-12 h-12 rounded-2xl ${isBarangay ? 'bg-[#C2E8FF]/40 text-[#052659] border-[#7EA0C5]/30' : 'bg-neutral-100 text-neutral-600 border-neutral-200'} mx-auto flex items-center justify-center border`}>
              <Package className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>No Active Distributions</h3>
            <p className={`text-xs ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} max-w-sm mx-auto`}>
              There are currently no active distribution drives recorded. Click the button below to schedule relief operations.
            </p>
            <button
              onClick={() => {
                setEditingDistId(null);
                setIsAddDistributionOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 ${
                isBarangay
                  ? 'bg-[#052659] hover:bg-[#5482B4] text-white border border-[#011025]'
                  : 'bg-[#18181b] hover:bg-neutral-800 text-white'
              } text-xs font-medium rounded-full cursor-pointer shadow-xs`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Distribution</span>
            </button>
          </div>
        ) : (
          <div className={`divide-y ${isBarangay ? 'divide-[#7EA0C5]/15' : 'divide-neutral-100'}`}>
            {distributions.map((dist) => (
              <div
                key={dist.id}
                className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                  isBarangay ? 'hover:bg-[#C2E8FF]/15' : 'hover:bg-neutral-50/60'
                } transition-colors`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="min-w-0 space-y-1">
                    <h3 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} tracking-tight`}>
                      {dist.title}
                    </h3>

                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} font-normal`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} shrink-0`} />
                        <span>{dist.location || dist.barangay}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} shrink-0`} />
                        <span>{dist.schedule}</span>
                      </div>

                      {dist.contactNumber && (
                        <span>{dist.contactNumber}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleEditDistribution(dist)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                      isBarangay
                        ? 'border-[#7EA0C5]/40 bg-[#C2E8FF]/20 hover:bg-[#C2E8FF]/50 text-[#052659]'
                        : 'border-neutral-200/80 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900'
                    } shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5`}
                  >
                    <Sun className={`w-3.5 h-3.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-400'}`} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Authorized Beneficiaries Section Card */}
      <div className={`bg-white rounded-[24px] border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/70'} shadow-xs overflow-hidden space-y-4`}>
        {/* Card Header Bar with Title and + Add Button */}
        <div className={`px-6 py-4.5 ${isBarangay ? 'bg-[#C2E8FF]/10 border-[#7EA0C5]/20' : 'bg-neutral-50/50 border-neutral-100'} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <Users className={`w-4 h-4 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`} />
            <h2 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} uppercase tracking-wide`}>
              Authorized Beneficiaries
            </h2>
          </div>

          {/* Right Action Button: + Add */}
          <button
            onClick={() => setIsAddBeneficiaryOpen(true)}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 ${
              isBarangay
                ? 'bg-[#052659] hover:bg-[#5482B4] text-white border border-[#011025]'
                : 'bg-[#18181b] hover:bg-neutral-800 text-white'
            } text-xs font-medium rounded-full shadow-2xs transition-colors cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Filter Bar: FILTER BY BARANGAY & SEARCH */}
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: FILTER BY BARANGAY */}
          <div>
            <label className={`block text-[10px] font-semibold ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} uppercase tracking-wider mb-1.5`}>
              FILTER BY BARANGAY
            </label>
            <div className="relative">
              <select
                value={filterBarangay}
                onChange={(e) => setFilterBarangay(e.target.value)}
                className={`w-full text-xs font-medium ${
                  isBarangay
                    ? 'text-[#011025] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                    : 'text-neutral-800 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50'
                } border rounded-full px-4 py-2.5 appearance-none focus:outline-hidden focus:ring-2 cursor-pointer shadow-2xs`}
              >
                {LINGAYEN_BARANGAY_LIST.map((brgy) => (
                  <option key={brgy} value={brgy}>
                    {brgy === 'All' ? 'All (Municipality-wide)' : `Brgy. ${brgy}`}
                  </option>
                ))}
              </select>
              <ChevronDown className={`w-4 h-4 ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} absolute right-4 top-3 pointer-events-none`} />
            </div>
          </div>

          {/* Right: SEARCH */}
          <div>
            <label className={`block text-[10px] font-semibold ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'} uppercase tracking-wider mb-1.5`}>
              SEARCH
            </label>
            <div className="relative flex items-center">
              <Search className={`w-4 h-4 ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} absolute left-3.5 pointer-events-none`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or ID"
                className={`w-full pl-10 pr-9 py-2.5 text-xs font-medium ${
                  isBarangay
                    ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                    : 'text-neutral-800 placeholder-neutral-400 bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50'
                } border rounded-full focus:outline-hidden focus:ring-2 shadow-2xs`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3.5 ${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'} cursor-pointer`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Statistics Bar */}
        <div className={`px-6 flex items-center justify-between text-xs ${isBarangay ? 'text-[#5482B4] border-[#7EA0C5]/20' : 'text-neutral-500 border-neutral-100'} border-t pt-3 pb-1`}>
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>{filteredBeneficiaries.length}</strong> records
            </span>
            <span>•</span>
            <span className={`${isBarangay ? 'text-[#052659]' : 'text-neutral-900'} font-semibold`}>
              {filteredBeneficiaries.filter((b) => b.status === 'Pending Claim').length} Pending
            </span>
            <span>•</span>
            <span className={`${isBarangay ? 'text-[#5482B4]' : 'text-neutral-700'} font-medium`}>
              {filteredBeneficiaries.filter((b) => b.status === 'Claimed').length} Claimed
            </span>
          </div>

          {filterBarangay !== 'All' && (
            <button
              onClick={() => setFilterBarangay('All')}
              className={`text-[11px] font-semibold ${isBarangay ? 'text-[#052659] hover:text-[#011025]' : 'text-neutral-900'} hover:underline cursor-pointer`}
            >
              Reset to All Barangays
            </button>
          )}
        </div>

        {/* Beneficiaries Table */}
        <div className={`border-t ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'} overflow-x-auto`}>
          {filteredBeneficiaries.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className={`w-10 h-10 rounded-full ${isBarangay ? 'bg-[#C2E8FF]/40 text-[#052659]' : 'bg-neutral-100 text-neutral-400'} mx-auto flex items-center justify-center`}>
                <Search className="w-5 h-5" />
              </div>
              <p className={`text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>No matching beneficiaries found</p>
              <p className={`text-[11px] ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
                Try adjusting your search query or selecting a different barangay.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className={`${isBarangay ? 'bg-[#C2E8FF]/10 text-[#5482B4] border-[#7EA0C5]/20' : 'bg-neutral-50/50 text-neutral-400 border-neutral-100'} text-[10px] font-semibold uppercase tracking-wider border-b`}>
                  <th className="px-6 py-3.5">BENEFICIARY ID</th>
                  <th className="px-6 py-3.5">HEAD OF HOUSEHOLD</th>
                  <th className="px-6 py-3.5">BARANGAY / ADDRESS</th>
                  <th className="px-6 py-3.5 text-center">CATEGORY</th>
                  <th className="px-6 py-3.5 text-center">MEMBERS</th>
                  <th className="px-6 py-3.5 text-center">STATUS</th>
                  <th className="px-6 py-3.5 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isBarangay ? 'divide-[#7EA0C5]/15' : 'divide-neutral-100'} text-xs`}>
                {filteredBeneficiaries.map((b) => (
                  <tr key={b.id} className={`${isBarangay ? 'hover:bg-[#C2E8FF]/15' : 'hover:bg-neutral-50/60'} transition-colors`}>
                    <td className={`px-6 py-4 font-mono font-medium align-middle ${isBarangay ? 'text-[#052659]' : 'text-neutral-600'}`}>
                      {b.controlNo}
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>{b.name}</div>
                      <div className={`text-[10px] ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'}`}>{b.contactNumber}</div>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div
                        className="cursor-help"
                        title={`Full Address: ${b.address}, Brgy. ${b.barangay}, Lingayen`}
                      >
                        <div className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>Brgy. {b.barangay}</div>
                        <div className={`text-[10px] ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'} truncate max-w-[180px]`}>{b.address}</div>
                      </div>
                    </td>

                    {/* Category: Equal width & height, centralized text */}
                    <td className="px-6 py-4 text-center align-middle">
                      <span className={`inline-flex items-center justify-center w-32 h-7 px-2.5 rounded-full text-[10px] font-medium text-center ${
                        isBarangay ? 'bg-[#C2E8FF]/40 text-[#052659] border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-700 border-neutral-200/80'
                      } border shadow-2xs`}>
                        {b.category}
                      </span>
                    </td>

                    {/* Members: Centered text */}
                    <td className={`px-6 py-4 text-center font-mono font-medium align-middle ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'}`}>
                      {b.familyMembers}
                    </td>

                    {/* Status: Equal width & height, centralized text */}
                    <td className="px-6 py-4 text-center align-middle">
                      <div className="flex flex-col items-center justify-center">
                        <span
                          className={`w-32 h-7 rounded-full inline-flex items-center justify-center text-center text-[10px] font-semibold uppercase tracking-wider ${
                            b.status === 'Claimed'
                              ? isBarangay
                                ? 'bg-[#052659] text-white shadow-2xs'
                                : 'bg-[#18181b] text-white shadow-2xs'
                              : isBarangay
                                ? 'bg-[#C2E8FF]/50 text-[#052659] border border-[#7EA0C5]/40'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200/80'
                          }`}
                        >
                          {b.status === 'Claimed' ? (
                            <span className="inline-flex items-center justify-center gap-1.5">
                              <Check className="w-3 h-3 text-white" />
                              <span>Claimed</span>
                            </span>
                          ) : (
                            <span>Pending Claim</span>
                          )}
                        </span>
                        <span className={`text-[9px] font-mono h-3.5 flex items-center justify-center text-center mt-1 ${
                          b.claimedAt ? (isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400') : 'invisible'
                        }`}>
                          {b.claimedAt ? new Date(b.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Action: Equal width & height, centralized text */}
                    <td className="px-6 py-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleClaimStatus(b.id)}
                          className={`w-28 h-8 rounded-full inline-flex items-center justify-center text-center text-[11px] font-medium transition-all cursor-pointer shadow-2xs ${
                            b.status === 'Claimed'
                              ? isBarangay
                                ? 'bg-[#C2E8FF]/30 hover:bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/40'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                              : isBarangay
                                ? 'bg-[#052659] hover:bg-[#5482B4] text-white border border-[#011025]'
                                : 'bg-[#18181b] hover:bg-neutral-800 text-white'
                          }`}
                        >
                          {b.status === 'Claimed' ? 'Undo' : 'Mark Claimed'}
                        </button>
                        <button
                          onClick={() => handleDeleteBeneficiary(b.id)}
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025] hover:bg-[#C2E8FF]/20' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'} cursor-pointer transition-colors`}
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

      {/* Modal 1: Add Distribution Schedule */}
      {isAddDistributionOpen && (
        <div className={`fixed inset-0 z-50 ${isBarangay ? 'bg-[#011025]/40' : 'bg-black/40'} backdrop-blur-xs flex items-center justify-center p-4`}>
          <div className={`bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/80'} animate-in zoom-in-95 duration-200`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'}`}>
              <h3 className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} text-base`}>
                {editingDistId ? 'Edit Relief Distribution Schedule' : 'Add Relief Distribution Schedule'}
              </h3>
              <button
                onClick={() => {
                  setIsAddDistributionOpen(false);
                  setEditingDistId(null);
                }}
                className={`${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'} cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDistributionSubmit} className="space-y-4 pt-4">
              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Distribution Title / Aid Package Name *
                </label>
                <input
                  required
                  type="text"
                  value={newDistTitle}
                  onChange={(e) => setNewDistTitle(e.target.value)}
                  placeholder="e.g. DSWD Family Food Packs (FFPs) — Batch 2"
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                    Target Barangay *
                  </label>
                  <select
                    value={newDistBarangay}
                    onChange={(e) => setNewDistBarangay(e.target.value)}
                    className={`w-full text-xs p-2.5 border ${
                      isBarangay
                        ? 'text-[#011025] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                        : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                    } rounded-xl outline-hidden transition-all focus:ring-2 cursor-pointer`}
                  >
                    {LINGAYEN_BARANGAY_LIST.filter((b) => b !== 'All').map((brgy) => (
                      <option key={brgy} value={brgy}>
                        Brgy. {brgy}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                    Target Households
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDistHouseholds}
                    onChange={(e) => setNewDistHouseholds(Number(e.target.value))}
                    className={`w-full text-xs p-2.5 border ${
                      isBarangay
                        ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                        : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                    } rounded-xl outline-hidden transition-all focus:ring-2`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Distribution Venue / Location *
                </label>
                <input
                  required
                  type="text"
                  value={newDistLocation}
                  onChange={(e) => setNewDistLocation(e.target.value)}
                  placeholder="e.g. Libsong East Elementary School Gymnasium"
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Schedule Date & Operating Hours *
                </label>
                <input
                  required
                  type="text"
                  value={newDistSchedule}
                  onChange={(e) => setNewDistSchedule(e.target.value)}
                  placeholder="e.g. Daily: 8:00 AM – 4:00 PM"
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Eligibility Criteria
                </label>
                <textarea
                  rows={2}
                  value={newDistEligibility}
                  onChange={(e) => setNewDistEligibility(e.target.value)}
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Required Documents
                </label>
                <input
                  type="text"
                  value={newDistDocs}
                  onChange={(e) => setNewDistDocs(e.target.value)}
                  placeholder="e.g. Valid ID, Barangay Clearance, DAFAC Card"
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div className={`flex items-center justify-end gap-2.5 pt-2 border-t ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDistributionOpen(false);
                    setEditingDistId(null);
                  }}
                  className={`px-4 py-2 text-xs font-medium ${isBarangay ? 'text-[#052659] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:bg-neutral-100'} rounded-full cursor-pointer transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-medium text-white ${
                    isBarangay
                      ? 'bg-[#052659] hover:bg-[#5482B4] border border-[#011025]'
                      : 'bg-[#18181b] hover:bg-neutral-800'
                  } rounded-full shadow-xs cursor-pointer transition-colors`}
                >
                  {editingDistId ? 'Save Changes' : 'Publish Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Authorized Beneficiary */}
      {isAddBeneficiaryOpen && (
        <div className={`fixed inset-0 z-50 ${isBarangay ? 'bg-[#011025]/40' : 'bg-black/40'} backdrop-blur-xs flex items-center justify-center p-4`}>
          <div className={`bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border ${isBarangay ? 'border-[#7EA0C5]/40' : 'border-neutral-200/80'} animate-in zoom-in-95 duration-200`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'}`}>
              <h3 className={`font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'} text-base`}>
                Add Authorized Beneficiary
              </h3>
              <button
                onClick={() => setIsAddBeneficiaryOpen(false)}
                className={`${isBarangay ? 'text-[#7EA0C5] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'} cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBeneficiarySubmit} className="space-y-4 pt-4">
              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Head of Household Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={newBenName}
                  onChange={(e) => setNewBenName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                    Barangay *
                  </label>
                  <select
                    value={newBenBarangay}
                    onChange={(e) => setNewBenBarangay(e.target.value)}
                    className={`w-full text-xs p-2.5 border ${
                      isBarangay
                        ? 'text-[#011025] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                        : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                    } rounded-xl outline-hidden transition-all focus:ring-2 cursor-pointer`}
                  >
                    {LINGAYEN_BARANGAY_LIST.filter((b) => b !== 'All').map((brgy) => (
                      <option key={brgy} value={brgy}>
                        Brgy. {brgy}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                    Family Members
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newBenMembers}
                    onChange={(e) => setNewBenMembers(Number(e.target.value))}
                    className={`w-full text-xs p-2.5 border ${
                      isBarangay
                        ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                        : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                    } rounded-xl outline-hidden transition-all focus:ring-2`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Residential Address / Purok
                </label>
                <input
                  type="text"
                  value={newBenAddress}
                  onChange={(e) => setNewBenAddress(e.target.value)}
                  placeholder="e.g. Zone 2, Beachside Road"
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Contact Mobile Number
                </label>
                <input
                  type="text"
                  value={newBenContact}
                  onChange={(e) => setNewBenContact(e.target.value)}
                  placeholder="e.g. 0917-123-4567"
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] placeholder-[#7EA0C5] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'} mb-1`}>
                  Eligibility Category
                </label>
                <select
                  value={newBenCategory}
                  onChange={(e) => setNewBenCategory(e.target.value as BeneficiaryRecord['category'])}
                  className={`w-full text-xs p-2.5 border ${
                    isBarangay
                      ? 'text-[#011025] bg-[#C2E8FF]/10 border-[#7EA0C5]/30 focus:border-[#5482B4] focus:ring-[#C2E8FF]/50'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-200/50 bg-neutral-50/60 focus:bg-white'
                  } rounded-xl outline-hidden transition-all focus:ring-2 cursor-pointer`}
                >
                  <option value="4Ps / Indigent">4Ps / Indigent</option>
                  <option value="Coastal Evacuee">Coastal Evacuee</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="PWD">PWD</option>
                  <option value="Solo Parent">Solo Parent</option>
                </select>
              </div>

              <div className={`flex items-center justify-end gap-2.5 pt-2 border-t ${isBarangay ? 'border-[#7EA0C5]/20' : 'border-neutral-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddBeneficiaryOpen(false)}
                  className={`px-4 py-2 text-xs font-medium ${isBarangay ? 'text-[#052659] hover:bg-[#C2E8FF]/30' : 'text-neutral-600 hover:bg-neutral-100'} rounded-full cursor-pointer transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-medium text-white ${
                    isBarangay
                      ? 'bg-[#052659] hover:bg-[#5482B4] border border-[#011025]'
                      : 'bg-[#18181b] hover:bg-neutral-800'
                  } rounded-full shadow-xs cursor-pointer transition-colors`}
                >
                  Register Beneficiary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
