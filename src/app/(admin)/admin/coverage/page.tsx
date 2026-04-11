// src/app/(admin)/admin/coverage/page.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  MapPin, Plus, Trash2, CheckCircle, Clock, Edit3, Save, X,
  Loader2, ToggleLeft, ToggleRight, EyeOff, Eye, AlertTriangle,
} from 'lucide-react';
import type { ServiceArea } from '@prisma/client';

type EditingArea = Partial<ServiceArea> & { isNew?: boolean };

export default function CoveragePage() {
  const utils = trpc.useUtils();
  const { data: areas = [], isLoading } = trpc.admin.getAllServiceAreas.useQuery();

  const [editing, setEditing] = useState<EditingArea | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const createArea = trpc.admin.createServiceArea.useMutation({
    onSuccess: () => { utils.admin.getAllServiceAreas.invalidate(); utils.admin.getServiceAreas.invalidate(); setEditing(null); },
  });
  const updateArea = trpc.admin.updateServiceArea.useMutation({
    onSuccess: () => { utils.admin.getAllServiceAreas.invalidate(); utils.admin.getServiceAreas.invalidate(); setEditing(null); },
  });
  const deleteArea = trpc.admin.deleteServiceArea.useMutation({
    onSuccess: () => { utils.admin.getAllServiceAreas.invalidate(); utils.admin.getServiceAreas.invalidate(); setDeleteConfirm(null); },
  });

  // Quick toggles (no modal needed)
  const toggleServiceable = (area: ServiceArea) =>
    updateArea.mutate({ id: area.id, isServiceable: !area.isServiceable });
  const toggleActive = (area: ServiceArea) =>
    updateArea.mutate({ id: area.id, isActive: !area.isActive });

  const liveCount   = areas.filter(a => a.isServiceable && a.isActive).length;
  const soonCount   = areas.filter(a => !a.isServiceable && a.isActive).length;
  const hiddenCount = areas.filter(a => !a.isActive).length;

  const startNew = () =>
    setEditing({ isNew: true, label: '', value: '', zone: 'Thiruvottriyur', pincode: '', isServiceable: true, sortOrder: 0 });

  const handleSave = () => {
    if (!editing) return;
    if (editing.isNew) {
      createArea.mutate({
        label: editing.label ?? '',
        value: editing.value ?? '',
        zone: editing.zone ?? 'Thiruvottriyur',
        pincode: editing.pincode ?? undefined,
        isServiceable: editing.isServiceable ?? true,
        sortOrder: editing.sortOrder ?? 0,
      });
    } else {
      updateArea.mutate({
        id: editing.id!,
        label: editing.label,
        zone: editing.zone,
        pincode: editing.pincode ?? undefined,
        isServiceable: editing.isServiceable,
        sortOrder: editing.sortOrder,
      });
    }
  };

  const isSaving = createArea.isPending || updateArea.isPending;

  // Group by zone
  const zones = Array.from(new Set(areas.map(a => a.zone)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Coverage Areas</h1>
          <p className="text-gray-400 text-sm mt-1">Control which localities customers can select for delivery.</p>
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus size={18} /> Add Locality
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Live Now',     value: liveCount,   color: 'emerald', icon: <CheckCircle size={20} /> },
          { label: 'Coming Soon',  value: soonCount,   color: 'orange',  icon: <Clock size={20} /> },
          { label: 'Hidden',       value: hiddenCount, color: 'gray',    icon: <EyeOff size={20} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-5 flex items-center gap-4`}>
            <div className={`w-11 h-11 bg-${color}-100 rounded-xl flex items-center justify-center text-${color}-600`}>{icon}</div>
            <div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className={`text-xs font-bold text-${color}-600 uppercase tracking-widest`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      {editing && (
        <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-lg">
              {editing.isNew ? '➕ Add New Locality' : `✏️ Edit: ${editing.label}`}
            </h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Display Label *" placeholder="e.g. Kathivakkam">
              <input
                value={editing.label ?? ''}
                onChange={e => setEditing(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Kathivakkam"
                className="input-style"
              />
            </Field>
            <Field label="DB Value * (unique key)" placeholder="e.g. Kathivakkam">
              <input
                value={editing.value ?? ''}
                onChange={e => setEditing(p => ({ ...p, value: e.target.value }))}
                placeholder="e.g. Kathivakkam"
                disabled={!editing.isNew}
                className={`input-style ${!editing.isNew ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {editing.isNew && <p className="text-[10px] text-gray-400 mt-1">Cannot be changed after creation.</p>}
            </Field>
            <Field label="Zone / Parent Area">
              <input
                value={editing.zone ?? ''}
                onChange={e => setEditing(p => ({ ...p, zone: e.target.value }))}
                placeholder="e.g. Thiruvottriyur"
                className="input-style"
              />
            </Field>
            <Field label="Pincode (optional)">
              <input
                value={editing.pincode ?? ''}
                onChange={e => setEditing(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="e.g. 600019"
                className="input-style"
              />
            </Field>
            <Field label="Sort Order (lower = first)">
              <input
                type="number"
                value={editing.sortOrder ?? 0}
                onChange={e => setEditing(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                className="input-style"
              />
            </Field>
            <Field label="Status">
              <div className="flex gap-3 mt-1">
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    onClick={() => setEditing(p => ({ ...p, isServiceable: val }))}
                    className={`flex-1 py-3 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${
                      editing.isServiceable === val
                        ? val ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {val ? '✅ Live Now' : '⏳ Coming Soon'}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !editing.label || !editing.value}
              className="btn-primary flex-1 h-11 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editing.isNew ? 'Create Locality' : 'Save Changes'}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 h-11 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Areas Table by Zone */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
      ) : (
        <div className="space-y-6">
          {zones.map(zone => {
            const zoneAreas = areas.filter(a => a.zone === zone);
            return (
              <div key={zone} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Zone Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                  <MapPin size={16} className="text-orange-500" />
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest">{zone}</h3>
                  <span className="ml-auto text-xs text-gray-400 font-bold">{zoneAreas.length} localities</span>
                </div>

                {/* Table */}
                <div className="divide-y divide-gray-50">
                  {zoneAreas.map(area => (
                    <div key={area.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${!area.isActive ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                      {/* Status pill */}
                      <div className="flex-shrink-0">
                        {!area.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                            <EyeOff size={9} /> Hidden
                          </span>
                        ) : area.isServiceable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <CheckCircle size={9} /> Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                            <Clock size={9} /> Soon
                          </span>
                        )}
                      </div>

                      {/* Label + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{area.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          key: <code className="font-mono text-gray-500">{area.value}</code>
                          {area.pincode && <> · {area.pincode}</>}
                          {' '}· order: {area.sortOrder}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Toggle serviceable */}
                        <button
                          onClick={() => toggleServiceable(area)}
                          title={area.isServiceable ? 'Mark as Coming Soon' : 'Mark as Live'}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            area.isServiceable
                              ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                              : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          }`}
                        >
                          {area.isServiceable ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>

                        {/* Toggle visibility */}
                        <button
                          onClick={() => toggleActive(area)}
                          title={area.isActive ? 'Hide from customers' : 'Show to customers'}
                          className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-all"
                        >
                          {area.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditing({ ...area })}
                          className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-all"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Delete */}
                        {deleteConfirm === area.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteArea.mutate({ id: area.id })}
                              disabled={deleteArea.isPending}
                              className="text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {deleteArea.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(area.id)}
                            className="w-9 h-9 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
        <AlertTriangle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 space-y-1">
          <p className="font-black">How this works</p>
          <p>• <strong>Live</strong> — shown as selectable options in onboarding &amp; profile</p>
          <p>• <strong>Coming Soon</strong> — shown as greyed-out tiles with "Coming soon" label</p>
          <p>• <strong>Hidden</strong> — completely invisible to customers</p>
          <p>• The <strong>DB Value</strong> field is what gets saved in the user's profile — don't change it if users have already selected it.</p>
        </div>
      </div>
    </div>
  );
}

// Reusable field wrapper
function Field({ label, children, placeholder }: { label: string; children: React.ReactNode; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</label>
      {children}
    </div>
  );
}
