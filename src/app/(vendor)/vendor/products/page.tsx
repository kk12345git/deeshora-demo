// src/app/(vendor)/vendor/products/page.tsx
"use client";


import { trpc } from "@/lib/trpc";
import Link from "next/link";
import Image from "next/image";
import { Plus, ToggleLeft, ToggleRight, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";


export default function VendorProductsPage() {
  const { data, isLoading, refetch } = trpc.product.vendorProducts.useQuery({});
  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });


  const toggleActive = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, isActive: !currentStatus });
  };


  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate({ id });
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/vendor/products/new" className="btn-primary">
          <Plus size={18} className="mr-2" /> Add New Product
        </Link>
      </div>
      <div className="card">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {data?.products.map(product => (
              <div key={product.id} className="border rounded-2xl overflow-hidden">
                <Image src={product.images[0]} alt={product.name} width={300} height={200} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <p className="font-semibold truncate">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category.name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-bold">₹{product.price}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 border-t flex justify-end gap-2">
                  <button onClick={() => toggleActive(product.id, product.isActive)} className="btn-ghost p-2" title={product.isActive ? "Deactivate" : "Activate"}>
                    {product.isActive ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-400" />}
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}