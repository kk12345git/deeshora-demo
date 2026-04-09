// src/app/(vendor)/vendor/products/new/page.tsx
"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { Upload, X, Loader2 } from "lucide-react";


export default function NewProductPage() {
  const router = useRouter();
  const { data: categories } = trpc.product.categories.useQuery();
  const createProductMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      router.push("/vendor/products");
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (up to 6)</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {images.map((src, index) => (
              <div key={index} className="relative aspect-square">
                <img src={src} className="w-full h-full object-cover rounded-lg" />
                <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                  <X size={14} />
                </button>
                {index === 0 && <div className="absolute bottom-1 left-1 badge bg-black/50 text-white">MAIN</div>}
              </div>
            ))}
            {images.length < 6 && (
              <label className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-gray-400 hover:bg-gray-50">
                <Upload size={24} />
                <span className="text-xs mt-1">Upload</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>


        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
            <input type="text" name="name" id="name" className="input mt-1" required />
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" id="description" rows={4} className="input mt-1" required />
        </div>


        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
            <input type="number" name="price" id="price" step="0.01" className="input mt-1" required />
          </div>
          <div>
            <label htmlFor="mrp" className="block text-sm font-medium text-gray-700">MRP (₹)</label>
            <input type="number" name="mrp" id="mrp" step="0.01" className="input mt-1" required />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" name="stock" id="stock" className="input mt-1" required />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
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
        
        <div className="flex items-center">
          <input type="checkbox" name="isFeatured" id="isFeatured" className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
          <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">Feature this product on homepage</label>
        </div>


        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={createProductMutation.isPending}>
            {createProductMutation.isPending ? <Loader2 className="animate-spin" /> : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}