// src/app/(admin)/admin/products/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { Upload, X, Loader2, Store } from "lucide-react";

export default function AdminNewProductPage() {
  const router = useRouter();
  const { data: categories } = trpc.product.categories.useQuery();
  const { data: vendors } = trpc.admin.vendors.useQuery({ limit: 100 });
  
  const createProductMutation = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      router.push("/admin/products");
    },
    onError: (error) => toast.error(error.message),
  });

  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (images.length + files.length > 6) {
        toast.error("You can upload a maximum of 6 images.");
        return;
      }
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    createProductMutation.mutate({
      vendorId: formData.get('vendorId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      categoryId: formData.get('categoryId') as string,
      price: parseFloat(formData.get('price') as string),
      mrp: parseFloat(formData.get('mrp') as string),
      stock: parseInt(formData.get('stock') as string),
      unit: formData.get('unit') as string,
      isFeatured: formData.get('isFeatured') === 'on',
      images,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
           <Store size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Universal Product</h1>
          <p className="text-gray-500 text-sm">Add a product on behalf of any local business vendor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-8 bg-white/80 backdrop-blur-md shadow-xl border-white/20">
        {/* Vendor Selection */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs">1</span>
            Vendor Assignment
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700">Assign to Local Shop</label>
              <select name="vendorId" id="vendorId" className="input mt-1 shadow-sm" required>
                <option value="">Select a vendor</option>
                {vendors?.vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.shopName} ({vendor.city})</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Image Upload */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs">2</span>
            Display Images
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {images.map((src, index) => (
              <div key={index} className="relative aspect-square group">
                <img src={src} className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md transition-transform group-hover:scale-[1.02]" />
                <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
                {index === 0 && <div className="absolute bottom-2 left-2 badge bg-orange-500 text-white text-[10px] shadow-sm">MAIN VISUAL</div>}
              </div>
            ))}
            {images.length < 6 && (
              <label className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:bg-orange-50/50 hover:border-orange-200 transition-all">
                <Upload size={24} />
                <span className="text-xs mt-2 font-medium">Upload Image</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </section>

        {/* Product Info */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs">3</span>
            Basic Information
          </h3>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                <input type="text" name="name" id="name" className="input mt-1" placeholder="e.g. Fresh Farm Eggs" required />
              </div>
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
                <select name="categoryId" id="categoryId" className="input mt-1" required>
                  <option value="">Select a category</option>
                  {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Product Description</label>
              <textarea name="description" id="description" rows={4} className="input mt-1" placeholder="Detailed description of the product..." required />
            </div>
          </div>
        </section>

        {/* Pricing & Stock */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs">4</span>
            Inventory & Price
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
              <input type="number" name="price" id="price" step="0.01" className="input mt-1" placeholder="0.00" required />
            </div>
            <div>
              <label htmlFor="mrp" className="block text-sm font-medium text-gray-700">MRP (₹)</label>
              <input type="number" name="mrp" id="mrp" step="0.01" className="input mt-1" placeholder="0.00" required />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Opening Stock</label>
              <input type="number" name="stock" id="stock" className="input mt-1" placeholder="0" required />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Inventory Unit</label>
              <select name="unit" id="unit" className="input mt-1" defaultValue="piece" required>
                <option>piece</option>
                <option>kg</option>
                <option>g</option>
                <option>litre</option>
                <option>ml</option>
                <option>pack</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
           <div className="flex items-center">
            <input type="checkbox" name="isFeatured" id="isFeatured" className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
            <label htmlFor="isFeatured" className="ml-3 block text-sm font-medium text-gray-900">Feature this product prominently on the hometown storefront</label>
          </div>
        </section>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary min-w-[140px]" disabled={createProductMutation.isPending}>
            {createProductMutation.isPending ? <Loader2 className="animate-spin" /> : 'Publish Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
