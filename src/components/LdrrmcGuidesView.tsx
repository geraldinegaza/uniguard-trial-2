import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import {
  BookOpen,
  Plus,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit3,
  Trash2,
  Eye,
  Check,
  X,
  ShieldAlert,
  HelpCircle,
  Phone,
  Layers,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const ALL_HAZARD_CATEGORIES = [
  'Flood',
  'River Overflow',
  'Drainage Blockage',
  'Storm Surge',
  'Coastal Erosion',
  'Strong Wind / Typhoon Damage',
  'Fallen Tree',
  'Landslide / Soil Erosion',
  'Earthquake',
  'Road Damage',
  'Vehicular Accident',
  'Fire',
  'Electrical / Power Line Hazard',
  'General',
] as const;

export type HazardCategory = typeof ALL_HAZARD_CATEGORIES[number];
export type DisasterPhase = 'Before' | 'During' | 'After';

export interface PreparednessGuideItem {
  id: string;
  category: HazardCategory;
  phase: DisasterPhase;
  title: string;
  summary: string;
  actionSteps: string[];
  precautions: string[];
  emergencyContact: string;
  updatedAt: string;
  author: string;
}

const INITIAL_GUIDES: PreparednessGuideItem[] = [
  {
    id: 'gd-flood-before-1',
    category: 'Flood',
    phase: 'Before',
    title: 'Pre-Monsoon Drainage Clearance & Sandbag Staging',
    summary: 'Essential household and community preparations prior to high tide and torrential monsoon alerts.',
    actionSteps: [
      'Monitor PAGASA flood bulletins and Lingayen MDRRMC localized sirens.',
      'Elevate electrical socket lines, breaker switches, and food reserves above the 2-meter flood marker.',
      'Inspect and secure family emergency go-bag (3-day non-perishable rations, potable water, medical cards).',
      'Identify the quickest elevated route to your Barangay Evacuation Center.',
    ],
    precautions: [
      'Do not stack sandbags against fragile glass doors or non-load-bearing partitions.',
      'Do not leave low-lying drainage exits clogged with domestic plastics.',
    ],
    emergencyContact: 'Lingayen MDRRMO Operations: (075) 633-5702',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'LDRRMO Public Safety Bureau',
  },
  {
    id: 'gd-flood-during-1',
    category: 'Flood',
    phase: 'During',
    title: 'Flood Water Inundation Protocols & Electrical Safety',
    summary: 'Immediate life-safety procedures when floodwaters breach residential perimeters.',
    actionSteps: [
      'Switch off main electrical breaker and LPG gas tanks before floodwaters enter living quarters.',
      'Evacuate immediately upon Signal 2/3 preemptive evacuation orders issued by BDRRMC patrols.',
      'Stay on reinforced upper storeys or structural centers if caught by rapid water surges.',
      'Signal rescuers with flashlights, whistles, or brightly colored flags.',
    ],
    precautions: [
      'Never attempt to wade, swim, or drive through moving floodwaters (15 cm of moving water can sweep adults).',
      'Never touch submerged electrical appliances or downed wire poles.',
    ],
    emergencyContact: 'Water Rescue Dispatch: 911 / (075) 633-5702',
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    author: 'Philippine Coast Guard & MDRRMO',
  },
  {
    id: 'gd-surge-before-1',
    category: 'Storm Surge',
    phase: 'Before',
    title: 'Coastal Evacuation & Seawall Perimeter Defense',
    summary: 'Protective measures for beachside residents facing gale-force tidal swells.',
    actionSteps: [
      'Fisherfolk must ground and moor all motorized bangkas in inland protective coves.',
      'Pack essential documents in airtight waterproof drybags.',
      'Evacuate immediately to designated inland multi-purpose evacuation shelters.',
    ],
    precautions: [
      'Never visit shorelines or breakwaters to witness storm surge wave action.',
    ],
    emergencyContact: 'Coastal Disaster Watchdesk: (075) 542-7080',
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'MDRRMC Maritime Safety Division',
  },
];

interface LdrrmcGuidesViewProps {
  currentUser: User;
}

export const LdrrmcGuidesView: React.FC<LdrrmcGuidesViewProps> = ({ currentUser }) => {
  const isBarangay = currentUser?.role === 'barangay';

  // Guides state with persistence
  const [guides, setGuides] = useState<PreparednessGuideItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uniguard_custom_guides');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_GUIDES;
  });

  // Selected Category and Phase matching draft screenshot
  const [selectedCategory, setSelectedCategory] = useState<HazardCategory>('Flood');
  const [selectedPhase, setSelectedPhase] = useState<DisasterPhase>('Before');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<PreparednessGuideItem | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState<HazardCategory>('Flood');
  const [formPhase, setFormPhase] = useState<DisasterPhase>('Before');
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formSteps, setFormSteps] = useState('');
  const [formPrecautions, setFormPrecautions] = useState('');
  const [formContact, setFormContact] = useState('Lingayen MDRRMO Operations: (075) 633-5702');

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const saveGuides = (updated: PreparednessGuideItem[]) => {
    setGuides(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniguard_custom_guides', JSON.stringify(updated));
    }
  };

  // Filtered guides for current category & phase combination
  const currentCombinationGuides = useMemo(() => {
    return guides.filter(
      (g) => g.category === selectedCategory && g.phase === selectedPhase
    );
  }, [guides, selectedCategory, selectedPhase]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingGuide(null);
    setFormCategory(selectedCategory);
    setFormPhase(selectedPhase);
    setFormTitle('');
    setFormSummary('');
    setFormSteps('');
    setFormPrecautions('');
    setFormContact('Lingayen MDRRMO Operations: (075) 633-5702');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (guide: PreparednessGuideItem) => {
    setEditingGuide(guide);
    setFormCategory(guide.category);
    setFormPhase(guide.phase);
    setFormTitle(guide.title);
    setFormSummary(guide.summary);
    setFormSteps(guide.actionSteps.join('\n'));
    setFormPrecautions(guide.precautions.join('\n'));
    setFormContact(guide.emergencyContact);
    setIsModalOpen(true);
  };

  // Save Guide
  const handleSaveGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedSteps = formSteps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedPrecautions = formPrecautions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingGuide) {
      // Update
      const updated = guides.map((g) => {
        if (g.id === editingGuide.id) {
          return {
            ...g,
            category: formCategory,
            phase: formPhase,
            title: formTitle.trim(),
            summary: formSummary.trim(),
            actionSteps: parsedSteps,
            precautions: parsedPrecautions,
            emergencyContact: formContact.trim(),
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });
      saveGuides(updated);
      setActionNotice(`Updated guide: "${formTitle.trim()}"`);
    } else {
      // Create new
      const newGuide: PreparednessGuideItem = {
        id: `gd-${Date.now().toString(36)}`,
        category: formCategory,
        phase: formPhase,
        title: formTitle.trim(),
        summary: formSummary.trim() || 'Official LDRRMC disaster preparedness instructional protocol.',
        actionSteps: parsedSteps.length > 0 ? parsedSteps : ['Follow standard barangay emergency response directives.'],
        precautions: parsedPrecautions,
        emergencyContact: formContact.trim() || 'Lingayen MDRRMO Operations: (075) 633-5702',
        updatedAt: new Date().toISOString(),
        author: currentUser.full_name || 'LDRRMO Public Safety Bureau',
      };
      saveGuides([newGuide, ...guides]);
      setActionNotice(`Published guide: "${newGuide.title}"`);
    }

    setIsModalOpen(false);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Delete Guide
  const handleDeleteGuide = (id: string) => {
    const updated = guides.filter((g) => g.id !== id);
    saveGuides(updated);
    setActionNotice('Guide removed from publication directory');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-semibold tracking-tight ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
            Preparedness Guides
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
            Add or edit disaster preparedness content. Changes appear in the citizen app immediately — no release required.
          </p>
        </div>

        {/* Top Right Action Button: + Add Guide */}
        <button
          onClick={handleOpenAdd}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto ${
            isBarangay
              ? 'bg-[#052659] hover:bg-[#031c42] text-white'
              : 'bg-[#18181b] hover:bg-neutral-800 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Guide</span>
        </button>
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
            className={`cursor-pointer ${isBarangay ? 'text-[#5482B4] hover:text-[#011025]' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Structured Hazard Category & Disaster Phase Filter Card */}
      <div className={`p-4 sm:p-5 rounded-[24px] shadow-xs ${
        isBarangay ? 'bg-white border border-[#7EA0C5]/30 shadow-[0_2px_12px_rgba(1,16,37,0.03)]' : 'bg-white border border-neutral-200/70'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Hazard Category Dropdown Filtering */}
          <div className="flex-1 max-w-sm">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="hazard-category-select" className={`block text-[10px] font-semibold uppercase tracking-wider ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`}>
                Hazard Category
              </label>
              <span className={`text-[11px] font-mono ${isBarangay ? 'text-[#7EA0C5]' : 'text-neutral-400'}`}>
                {ALL_HAZARD_CATEGORIES.length} categories
              </span>
            </div>
            <div className="relative">
              <select
                id="hazard-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as HazardCategory)}
                className={`w-full text-xs font-medium rounded-full px-4 py-2.5 pr-10 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                  isBarangay
                    ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                    : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                }`}
              >
                {ALL_HAZARD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className={`w-4 h-4 absolute right-3.5 top-3 pointer-events-none ${
                isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
              }`} />
            </div>
          </div>

          {/* Disaster Phase: Before | During | After Segmented Control */}
          <div>
            <span className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
              isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
            }`}>
              Disaster Phase
            </span>
            <div className={`inline-flex p-1 rounded-full self-start sm:self-auto ${
              isBarangay ? 'bg-[#C2E8FF]/20 border border-[#7EA0C5]/30' : 'bg-neutral-100/90 border border-neutral-200/80'
            }`}>
              {(['Before', 'During', 'After'] as DisasterPhase[]).map((phase) => {
                const isSelected = selectedPhase === phase;
                return (
                  <button
                    key={phase}
                    onClick={() => setSelectedPhase(phase)}
                    className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer uppercase tracking-wider ${
                      isSelected
                        ? isBarangay
                          ? 'bg-[#052659] text-white shadow-2xs'
                          : 'bg-[#2A2A2A] text-white shadow-2xs'
                        : isBarangay
                          ? 'text-[#5482B4] hover:text-[#011025]'
                          : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {phase}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Card: [Category] · [Phase] with Counter Badge */}
      <div className={`bg-white rounded-[24px] shadow-xs overflow-hidden ${
        isBarangay ? 'border border-[#7EA0C5]/30 shadow-[0_2px_12px_rgba(1,16,37,0.03)]' : 'border border-neutral-200/70'
      }`}>
        {/* Card Header Bar */}
        <div className={`px-6 py-4.5 flex items-center justify-between ${
          isBarangay ? 'bg-[#C2E8FF]/10 border-b border-[#7EA0C5]/20' : 'bg-neutral-50/50 border-b border-neutral-100'
        }`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
            {selectedCategory} &bull; {selectedPhase}
          </h2>

          <span className={`px-3 py-1 rounded-full text-xs font-mono font-medium shadow-2xs ${
            isBarangay
              ? 'bg-[#C2E8FF]/60 text-[#052659] border border-[#7EA0C5]/40'
              : 'bg-neutral-100 text-neutral-800 border border-neutral-200/80'
          }`}>
            {currentCombinationGuides.length} {currentCombinationGuides.length === 1 ? 'guide' : 'guides'}
          </span>
        </div>

        {/* Card Body: Empty State or Guide Records */}
        {currentCombinationGuides.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-3">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-2xs ${
              isBarangay ? 'bg-[#C2E8FF]/30 text-[#052659] border border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
            }`}>
              <FileText className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-semibold ${isBarangay ? 'text-[#011025]' : 'text-neutral-800'}`}>
              No guides yet for this combination
            </h3>
            <p className={`text-xs max-w-sm mx-auto ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
              Add the first one.
            </p>
            <div className="pt-2">
              <button
                onClick={handleOpenAdd}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer ${
                  isBarangay ? 'bg-[#052659] hover:bg-[#031c42] text-white' : 'bg-[#18181b] hover:bg-neutral-800 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Guide for {selectedCategory} ({selectedPhase})</span>
              </button>
            </div>
          </div>
        ) : (
          /* Guide List Cards */
          <div className="p-6 space-y-4">
            {currentCombinationGuides.map((guide) => (
              <div
                key={guide.id}
                className={`rounded-2xl p-5 transition-shadow space-y-4 ${
                  isBarangay
                    ? 'bg-white border border-[#7EA0C5]/30 hover:border-[#7EA0C5]/60 hover:shadow-xs shadow-2xs'
                    : 'bg-white border border-neutral-200/70 hover:shadow-xs shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        isBarangay ? 'bg-[#052659] text-white' : 'bg-[#18181b] text-white'
                      }`}>
                        {guide.phase}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        isBarangay ? 'bg-[#C2E8FF]/50 text-[#052659] border border-[#7EA0C5]/40' : 'bg-neutral-100 text-neutral-800 border border-neutral-200/80'
                      }`}>
                        {guide.category}
                      </span>
                    </div>
                    <h3 className={`text-base font-semibold mt-2 ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
                      {guide.title}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'}`}>
                      {guide.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => handleOpenEdit(guide)}
                      className={`p-2 rounded-full cursor-pointer transition-colors ${
                        isBarangay
                          ? 'text-[#5482B4] hover:text-[#052659] hover:bg-[#C2E8FF]/30'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                      title="Edit guide"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGuide(guide.id)}
                      className={`p-2 rounded-full cursor-pointer transition-colors ${
                        isBarangay
                          ? 'text-[#7EA0C5] hover:text-[#052659] hover:bg-[#C2E8FF]/30'
                          : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                      }`}
                      title="Delete guide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action Steps */}
                <div className={`space-y-2 pt-3 ${isBarangay ? 'border-t border-[#7EA0C5]/20' : 'border-t border-neutral-100'}`}>
                  <h4 className={`text-[10px] font-semibold uppercase tracking-wider ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`}>
                    Priority Instructions & Action Steps:
                  </h4>
                  <ul className="space-y-1.5">
                    {guide.actionSteps.map((step, idx) => (
                      <li key={idx} className={`flex items-start gap-2 text-xs ${isBarangay ? 'text-[#011025]' : 'text-neutral-700'}`}>
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`} />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Precautions / Warnings if present */}
                {guide.precautions.length > 0 && (
                  <div className={`p-3.5 rounded-xl space-y-1.5 text-xs ${
                    isBarangay ? 'bg-[#C2E8FF]/15 border border-[#7EA0C5]/30' : 'bg-neutral-50 border border-neutral-200/80'
                  }`}>
                    <div className={`flex items-center gap-1.5 font-semibold text-[11px] ${isBarangay ? 'text-[#052659]' : 'text-neutral-800'}`}>
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`} />
                      <span>Critical Warnings / Do Not:</span>
                    </div>
                    <ul className={`space-y-1 pl-5 list-disc text-[11px] ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-600'}`}>
                      {guide.precautions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 text-[11px] ${
                  isBarangay ? 'border-t border-[#7EA0C5]/20 text-[#7EA0C5]' : 'border-t border-neutral-100 text-neutral-400'
                }`}>
                  <span className="flex items-center gap-1">
                    <Phone className={`w-3 h-3 ${isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'}`} />
                    <span className={`font-medium ${isBarangay ? 'text-[#052659]' : 'text-neutral-700'}`}>{guide.emergencyContact}</span>
                  </span>
                  <span>Published by {guide.author} &bull; {new Date(guide.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Preparedness Guide */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white rounded-[24px] max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ${
            isBarangay ? 'border border-[#7EA0C5]/40 shadow-[0_8px_30px_rgba(5,38,89,0.12)]' : 'border border-neutral-200/80'
          }`}>
            <div className={`flex items-center justify-between pb-3.5 ${isBarangay ? 'border-b border-[#7EA0C5]/20' : 'border-b border-neutral-100'}`}>
              <h3 className={`font-semibold text-base ${isBarangay ? 'text-[#011025]' : 'text-neutral-900'}`}>
                {editingGuide ? 'Edit Preparedness Guide' : 'Add Preparedness Guide'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`cursor-pointer p-1 rounded-full transition-colors ${
                  isBarangay ? 'text-[#5482B4] hover:text-[#011025] hover:bg-[#C2E8FF]/30' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuide} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                    isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                  }`}>
                    Hazard Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as HazardCategory)}
                    className={`w-full text-xs font-medium rounded-xl p-2.5 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                      isBarangay
                        ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                        : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                    }`}
                  >
                    {ALL_HAZARD_CATEGORIES.map((cat) => (
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
                    Disaster Phase *
                  </label>
                  <select
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value as DisasterPhase)}
                    className={`w-full text-xs font-medium rounded-xl p-2.5 appearance-none focus:outline-hidden shadow-2xs cursor-pointer transition-all ${
                      isBarangay
                        ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                        : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                    }`}
                  >
                    <option value="Before">Before (Preparedness & Staging)</option>
                    <option value="During">During (Evacuation & Life Safety)</option>
                    <option value="After">After (Post-Impact Recovery & Return)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Guide Title *
                </label>
                <input
                  required
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Pre-Monsoon Drainage Clearance & Sandbag Staging"
                  className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Summary / Overview
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Short briefing for citizens in Lingayen..."
                  className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Priority Action Steps (One step per line)
                </label>
                <textarea
                  rows={4}
                  value={formSteps}
                  onChange={(e) => setFormSteps(e.target.value)}
                  placeholder="Elevate electrical socket lines above flood markers&#10;Inspect family 72-hour survival go-bag&#10;Confirm nearest elevated evacuation center"
                  className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Critical Warnings / Do Not (One warning per line)
                </label>
                <textarea
                  rows={2}
                  value={formPrecautions}
                  onChange={(e) => setFormPrecautions(e.target.value)}
                  placeholder="Never attempt to walk through flowing floodwaters&#10;Never touch downed power lines or flooded wiring"
                  className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                  isBarangay ? 'text-[#5482B4]' : 'text-neutral-500'
                }`}>
                  Emergency Desk Contact
                </label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className={`w-full text-xs font-medium p-2.5 rounded-xl focus:outline-hidden shadow-2xs transition-all ${
                    isBarangay
                      ? 'bg-[#C2E8FF]/10 hover:bg-[#C2E8FF]/20 focus:bg-white border border-[#7EA0C5]/40 text-[#011025] focus:border-[#052659] focus:ring-2 focus:ring-[#C2E8FF]/50'
                      : 'bg-neutral-50/70 hover:bg-neutral-50 focus:bg-white border border-neutral-200 text-neutral-800 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-2 pt-3 ${isBarangay ? 'border-t border-[#7EA0C5]/20' : 'border-t border-neutral-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  Publish to Citizen App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
