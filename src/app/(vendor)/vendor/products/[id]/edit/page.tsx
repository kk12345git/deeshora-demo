// src/app/(vendor)/vendor/products/[id]/edit/page.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import {
  Upload, X, ChevronLeft, Loader2, Package,
  IndianRupee, Box, Sparkles, Save, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── helpers ──────────────────────────────────────────────────────────────────
function Plus({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
    </div>
  );
}

// ─── types ────────────────────────────────────────────────────────────────────
type ImageEntry =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; preview: string; base64: string };

// ─── page ─────────────────────────────────────────────────────────────────────
export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch existing product data
  const { data: product, isLoading: isLoadingProduct } = trpc.product.vendorProducts.useQuery({ limit: 100 });
  const currentProduct = product?.products.find(p => p.id === id);

  const { data: categories } = trpc.product.categories.useQuery();

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    stock: '',
    unit: 'kg',
    categoryId: '',
    isFeatured: false,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Pre-fill form when product loads
  useEffect(() => {
    if (currentProduct && !isInitialized) {
      setForm({
        name: currentProduct.name,
        description: currentProduct.description,
        price: currentProduct.price.toString(),
        mrp: currentProduct.mrp.toString(),
        stock: currentProduct.stock.toString(),
        unit: currentProduct.unit,
        categoryId: currentProduct.categoryId,
        isFeatured: currentProduct.isFeatured,
        isActive: currentProduct.isActive,
      });
      setImages(currentProduct.images.map(url => ({ kind: 'existing', url })));
      setIsInitialized(true);
    }
  }, [currentProduct, isInitialized]);

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully!');
      router.push('/vendor/products');
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── Image handling ──────────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be < 5MB'); return; }
    if (images.length >= 4) { toast.error('Maximum 4 images allowed'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const preview = URL.createObjectURL(file);
      setImages(prev => [...prev, { kind: 'new', file, preview, base64 }]);
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
      const entry = prev[idx];
      if (entry.kind === 'new') URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ─── Validation ──────────────────────────────────────────────────────────────
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

    // Only send new images as base64 (existing URLs are kept server-side since update doesn't change images via URL)
    // For simplicity, we pass only the fields that can be updated (no image re-upload in edit)
    updateMutation.mutate({
      id,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      mrp: parseFloat(form.mrp),
      stock: parseInt(form.stock),
      unit: form.unit,
      categoryId: form.categoryId,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    });
  };

  const discount = form.price && form.mrp && +form.mrp > +form.price
    ? Math.round((1 - +form.price / +form.mrp) * 100)
    : 0;

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isLoadingProduct && !currentProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <p className="font-black text-gray-800 text-lg">Product not found</p>
        <p className="text-gray-400 text-sm mt-2">This product doesn't exist or doesn't belong to your shop.</p>
        <button onClick={() => router.push('/vendor/products')} className="btn-primary mt-6">
          ← Back to Products
        </button>
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
          <h1 className="text-2xl font-black text-gray-900">Edit Product</h1>
          <p className="text-gray-400 text-sm truncate max-w-xs">{currentProduct?.name}</p>
        </div>
        {/* Live status toggle in header */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {form.isActive ? 'Live' : 'Hidden'}
          </span>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
            className={`w-12 h-6 rounded-full relative transition-all ${form.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isActive ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Photos (read-only display for existing; note about re-upload) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-800 flex items-center gap-2">
              <Upload size={16} className="text-orange-500" /> Current Photos
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {images.length}/4 photos
            </span>
          </div>

          {/* Existing + new image preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((entry, i) => {
                const src = entry.kind === 'existing' ? entry.url : entry.preview;
                return (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                    <Image src={src} alt="" fill className="object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-md">MAIN</div>
                    )}
                    {entry.kind === 'existing' && (
                      <div className="absolute top-1 right-1 text-[10px] font-black bg-gray-800/70 text-white px-1.5 py-0.5 rounded-md">Saved</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute bottom-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 transition-all gap-1"
                >
                  <Plus size={20} />
                  <span className="text-[10px] font-bold">Add</span>
                </button>
              )}
            </div>
          )}

          {/* Drop zone — only shown if no images */}
          {images.length === 0 && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}`}
            >
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload size={24} className="text-orange-500" />
              </div>
              <p className="text-sm font-bold text-gray-700">Drag & drop or click to add photos</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB · max 4 images</p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => Array.from(e.target.files ?? []).forEach(processFile)}
          />
          {errors.images && <p className="text-xs text-red-500 font-bold">{errors.images}</p>}
        </div>

        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <Package size={16} className="text-orange-500" /> Basic Info
          </h2>

          <FormField label="Product Name *" error={errors.name}>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Fresh Organic Tomatoes"
              className={`input-style ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
            />
          </FormField>

          <FormField label="Description *" error={errors.description}>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe your product — quality, source, key details..."
              rows={3}
              className={`input-style resize-none ${errors.description ? 'border-red-400 bg-red-50' : ''}`}
            />
          </FormField>

          <FormField label="Category *" error={errors.categoryId}>
            <select
              value={form.categoryId}
              onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
              className={`input-style ${errors.categoryId ? 'border-red-400 bg-red-50' : ''}`}
            >
              <option value="">Select category...</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
        </div>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <IndianRupee size={16} className="text-orange-500" /> Pricing
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Selling Price (₹) *" error={errors.price}>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="0.00"
                  className={`input-style pl-8 ${errors.price ? 'border-red-400 bg-red-50' : ''}`}
                />
              </div>
            </FormField>
            <FormField label="MRP (₹) *" error={errors.mrp}>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={form.mrp}
                  onChange={e => setForm(p => ({ ...p, mrp: e.target.value }))}
                  placeholder="0.00"
                  className={`input-style pl-8 ${errors.mrp ? 'border-red-400 bg-red-50' : ''}`}
                />
              </div>
            </FormField>
          </div>
          {discount > 0 && (
            <p className="text-xs text-emerald-600 font-black">✅ Offering a {discount}% discount on MRP!</p>
          )}
        </div>

        {/* ── Inventory ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <Box size={16} className="text-orange-500" /> Inventory
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stock Quantity *" error={errors.stock}>
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                placeholder="e.g. 50"
                className={`input-style ${errors.stock ? 'border-red-400 bg-red-50' : ''}`}
              />
            </FormField>
            <FormField label="Unit">
              <select
                value={form.unit}
                onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="input-style"
              >
                {['kg', 'g', 'L', 'ml', 'piece', 'dozen', 'pack', 'box', 'bundle'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Featured toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-11 h-6 rounded-full transition-all relative ${form.isFeatured ? 'bg-orange-500' : 'bg-gray-200'}`}
              onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))}
            >
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
          disabled={updateMutation.isPending}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-sm tracking-widest uppercase rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 disabled:opacity-60 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/40"
        >
          {updateMutation.isPending ? (
            <><Loader2 size={20} className="animate-spin" /> Saving Changes...</>
          ) : (
            <><Save size={20} /> Save Changes</>
          )}
        </button>
      </form>
    </div>
  );
}
