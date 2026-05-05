// src/app/(vendor)/vendor/products/new/page.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import { Upload, X, ChevronLeft, Loader2, Package, IndianRupee, Box, Sparkles, AlertTriangle, CheckCircle2, Lightbulb, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = trpc.product.categories.useQuery();
  const { data: vendorStatus, isLoading: isStatusLoading } = trpc.product.myVendorStatus.useQuery();

  const [images, setImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', mrp: '',
    stock: '', unit: 'kg', categoryId: '', isFeatured: false,
    gstRate: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoFillApplied, setAutoFillApplied] = useState(false);

  const debouncedName = useDebounce(form.name, 600);

  // ─── Auto-analyze product name when it changes ────────────────────────────
  const { data: analysis, isFetching: isAnalyzing } = trpc.product.autoAnalyze.useQuery(
    { name: debouncedName, description: form.description },
    { enabled: debouncedName.trim().length >= 3 }
  );

  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success('🎉 Product added successfully!');
      router.push('/vendor/products');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // ─── Auto-apply category suggestion ──────────────────────────────────────
  const applyAutoCategory = useCallback(() => {
    if (analysis?.suggestedCategoryId) {
      setForm(p => ({ ...p, categoryId: analysis.suggestedCategoryId! }));
      setAutoFillApplied(true);
      toast.success(`Category set to "${analysis.suggestedCategoryName}"`, { icon: '🤖' });
    }
  }, [analysis]);

  // Auto-apply if form.categoryId is empty and we have a suggestion
  useEffect(() => {
    if (!form.categoryId && analysis?.suggestedCategoryId && !autoFillApplied) {
      setForm(p => ({ ...p, categoryId: analysis.suggestedCategoryId! }));
    }
  }, [analysis, form.categoryId, autoFillApplied]);

  // ─── Image handling ───────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be < 5MB'); return; }
    if (images.length >= 4) { toast.error('Maximum 4 images allowed'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const preview = URL.createObjectURL(file);
      setImages(prev => [...prev, { file, preview, base64 }]);
    };
    reader.readAsDataURL(file);
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  }, [processFile]);

  const removeImage = (idx: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 3) e.name = 'Min 3 characters';
    if (!form.description.trim() || form.description.length < 10) e.description = 'Min 10 characters';
    if (!form.price || isNaN(+form.price) || +form.price <= 0) e.price = 'Enter valid price';
    if (!form.mrp || isNaN(+form.mrp) || +form.mrp <= 0) e.mrp = 'Enter valid MRP';
    if (+form.price > +form.mrp) e.price = 'Selling price cannot exceed MRP';
    if (!form.stock || isNaN(+form.stock) || +form.stock < 0) e.stock = 'Enter stock count';
    if (!form.categoryId) e.categoryId = 'Select a category';
    if (images.length === 0) e.images = 'Add at least one photo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      mrp: parseFloat(form.mrp),
      stock: parseInt(form.stock),
      unit: form.unit,
      categoryId: form.categoryId,
      images: images.map(img => img.base64),
      isFeatured: form.isFeatured,
      gstRate: parseFloat(form.gstRate),
    });
  };

  const discount = form.price && form.mrp && +form.mrp > +form.price
    ? Math.round((1 - +form.price / +form.mrp) * 100)
    : 0;

  // ─── Vendor status banner helper ──────────────────────────────────────────
  const isBlocked = vendorStatus?.status === 'PENDING' || vendorStatus?.status === 'SUSPENDED';

  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Add New Product</h1>
          <p className="text-gray-400 text-sm">Fill in the details to list your product on Deeshora</p>
        </div>
      </div>

      {/* ─── Vendor Status Banner ────────────────────────────────────────────── */}
      {vendorStatus?.status === 'PENDING' && (
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-amber-800">Account Pending Approval</p>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              Your vendor account is under review. You can fill in the product details now and save them, 
              but products will only go live once an admin approves your account. 
              <strong className="text-amber-800"> This usually takes 24-48 hours.</strong>
            </p>
          </div>
        </div>
      )}

      {vendorStatus?.status === 'SUSPENDED' && (
        <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-red-800">Account Suspended</p>
            <p className="text-sm text-red-600 mt-1">
              Your vendor account has been suspended. You cannot add new products at this time. 
              Please contact <a href="mailto:deeshorasupport@gmail.com" className="underline font-bold">support</a> for assistance.
            </p>
          </div>
        </div>
      )}

      {vendorStatus?.status === 'APPROVED' && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-bold text-emerald-800">
            {vendorStatus.shopName} — Your account is approved. Products will go live immediately.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Photos ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2"><Upload size={16} className="text-orange-500" /> Product Photos</h2>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
            }`}
          >
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Upload size={24} className="text-orange-500" />
            </div>
            <p className="text-sm font-bold text-gray-700">Drag &amp; drop photos here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse · PNG, JPG up to 5MB · max 4 images</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => Array.from(e.target.files ?? []).forEach(processFile)} />
          </div>

          {/* Preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <Image src={img.preview} alt="" fill className="object-cover" />
                  {i === 0 && (
                    <div className="absolute top-1 left-1 text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-md">MAIN</div>
                  )}
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-all">
                  <PlusIcon size={20} />
                </button>
              )}
            </div>
          )}
          {errors.images && <p className="text-xs text-red-500 font-bold">{errors.images}</p>}
        </div>

        {/* ── Basic Info ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2"><Package size={16} className="text-orange-500" /> Basic Info</h2>
          
          <FormField label="Product Name *" error={errors.name}>
            <div className="relative">
              <input
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setAutoFillApplied(false); }}
                placeholder="e.g. Fresh Organic Tomatoes"
                className={`input-style pr-10 ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
              />
              {isAnalyzing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={14} className="animate-spin text-orange-400" />
                </div>
              )}
            </div>
          </FormField>

          {/* ── AI Analysis Result ─────────────────────────────────── */}
          {analysis && !isAnalyzing && debouncedName.length >= 3 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">AI Analysis</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    analysis.confidence === 'high' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {analysis.confidence} confidence
                  </span>
                </div>
                {analysis.suggestedCategoryId && form.categoryId !== analysis.suggestedCategoryId && (
                  <button
                    type="button"
                    onClick={applyAutoCategory}
                    className="text-xs font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                )}
                {analysis.suggestedCategoryId && form.categoryId === analysis.suggestedCategoryId && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Applied
                  </span>
                )}
              </div>

              {analysis.suggestedCategoryName && (
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-800">
                    Detected category: <strong className="font-black">{analysis.suggestedCategoryName}</strong>
                  </p>
                </div>
              )}

              {analysis.hints.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-emerald-200">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    <Lightbulb size={11} /> Description Tips
                  </div>
                  {analysis.hints.map((hint, i) => (
                    <p key={i} className="text-xs text-emerald-700 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">→</span> {hint}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <FormField label="Description *" error={errors.description}>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe your product — quality, source, key details..."
              rows={3}
              className={`input-style resize-none ${errors.description ? 'border-red-400 bg-red-50' : ''}`} />
          </FormField>

          <FormField label="Category *" error={errors.categoryId}>
            <div className="relative">
              <select value={form.categoryId} onChange={e => { setForm(p => ({ ...p, categoryId: e.target.value })); setAutoFillApplied(true); }}
                className={`input-style ${errors.categoryId ? 'border-red-400 bg-red-50' : ''} ${
                  analysis?.suggestedCategoryId === form.categoryId && form.categoryId ? 'border-emerald-400 bg-emerald-50' : ''
                }`}>
                <option value="">Select category...</option>
                {categories?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {analysis?.suggestedCategoryId === c.id ? '← AI Suggestion' : ''}
                  </option>
                ))}
              </select>
              {analysis?.suggestedCategoryId === form.categoryId && form.categoryId && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={9} /> AI
                  </span>
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* ── Pricing ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2"><IndianRupee size={16} className="text-orange-500" /> Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Selling Price (₹) *" error={errors.price}>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="0.00" className={`input-style pl-8 ${errors.price ? 'border-red-400 bg-red-50' : ''}`} />
              </div>
            </FormField>
            <FormField label="MRP (₹) *" error={errors.mrp}>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" step="0.01" value={form.mrp} onChange={e => setForm(p => ({ ...p, mrp: e.target.value }))}
                  placeholder="0.00" className={`input-style pl-8 ${errors.mrp ? 'border-red-400 bg-red-50' : ''}`} />
              </div>
            </FormField>
          </div>

          <FormField label="GST Rate (%)" hint="Applied to create GST invoices">
            <select
              value={form.gstRate}
              onChange={e => setForm(p => ({ ...p, gstRate: e.target.value }))}
              className="input-style"
            >
              <option value="0">Exempt (0%)</option>
              <option value="0.05">GST 5%</option>
              <option value="0.12">GST 12%</option>
              <option value="0.18">GST 18%</option>
              <option value="0.28">GST 28%</option>
            </select>
          </FormField>

          {discount > 0 && (
            <p className="text-xs text-emerald-600 font-black">✅ You&apos;re offering a {discount}% discount!</p>
          )}
        </div>

        {/* ── Stock & Unit ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2"><Box size={16} className="text-orange-500" /> Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stock Quantity *" error={errors.stock}>
              <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                placeholder="e.g. 50" className={`input-style ${errors.stock ? 'border-red-400 bg-red-50' : ''}`} />
            </FormField>
            <FormField label="Unit">
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="input-style">
                {['kg', 'g', 'L', 'ml', 'piece', 'dozen', 'pack', 'box', 'bundle'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-11 h-6 rounded-full transition-all relative ${form.isFeatured ? 'bg-orange-500' : 'bg-gray-200'}`}
              onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isFeatured ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Feature this product</p>
              <p className="text-xs text-gray-400">Shown on the homepage featured section</p>
            </div>
            <Sparkles size={16} className={`ml-auto transition-colors ${form.isFeatured ? 'text-orange-500' : 'text-gray-300'}`} />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createMutation.isPending || vendorStatus?.status === 'SUSPENDED'}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-sm tracking-widest uppercase rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 disabled:opacity-60 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/40 disabled:hover:translate-y-0"
        >
          {createMutation.isPending ? (
            <><Loader2 size={20} className="animate-spin" /> Uploading Product...</>
          ) : isBlocked && vendorStatus?.status !== 'PENDING' ? (
            <><AlertTriangle size={20} /> Account Suspended</>
          ) : (
            <><Package size={20} /> Add to Deeshora</>
          )}
        </button>

        {vendorStatus?.status === 'PENDING' && (
          <p className="text-center text-xs text-amber-600 font-bold">
            ⏳ Product will be saved but won&apos;t be visible to customers until your account is approved.
          </p>
        )}
      </form>
    </div>
  );
}

function FormField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</label>
        {hint && <span className="text-[10px] text-gray-400 font-bold uppercase">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
    </div>
  );
}

function PlusIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}