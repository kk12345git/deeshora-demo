// src/hooks/useCart.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';


export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
}


interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  itemCount: () => number;
  total: () => number;
}


export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const existingItem = get().items.find((i) => i.productId === item.productId);
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > item.stock) {
            toast.error(`Only ${item.stock} units available for ${item.name}`);
            return;
          }
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === item.productId ? { ...i, quantity: newQuantity } : i
            ),
          }));
        } else {
          if (quantity > item.stock) {
            toast.error(`Only ${item.stock} units available for ${item.name}`);
            return;
          }
          set((state) => ({
            items: [...state.items, { ...item, quantity }],
          }));
        }
        toast.success(`${item.name} added to cart`);
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
        toast.success('Item removed from cart');
      },
      updateQuantity: (productId, quantity) => {
        if (quantity === 0) {
          get().removeItem(productId);
          return;
        }
        const itemToUpdate = get().items.find((i) => i.productId === productId);
        if (itemToUpdate && quantity > itemToUpdate.stock) {
          toast.error(`Only ${itemToUpdate.stock} units available for ${itemToUpdate.name}`);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));
      },
      setItems: (items) => set({ items }),
      clearCart: () => set({ items: [] }),
      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      total: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'deeshora-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);