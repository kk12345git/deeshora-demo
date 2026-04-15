"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

/**
 * CartSync handles synchronizing the local storage cart with the server database.
 * It pushes local items to the server when a user first logs in.
 */
export function CartSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { items, clearCart } = useCart();
  const syncMutation = trpc.cart.addItem.useMutation();
  const hasSyncedThisSession = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && items.length > 0 && !hasSyncedThisSession.current) {
      const syncKey = `deeshora_synced_${user.id}`;
      const alreadySynced = localStorage.getItem(syncKey);

      if (alreadySynced === 'true') {
         hasSyncedThisSession.current = true;
         return;
      }

      const sync = async () => {
        try {
          // Note: This is a basic merge. In a full production app, 
          // you might want to fetch the server cart first to compare.
          for (const item of items) {
            await syncMutation.mutateAsync({
              productId: item.productId,
              quantity: item.quantity,
            });
          }
          hasSyncedThisSession.current = true;
          localStorage.setItem(syncKey, 'true');
          console.log('Cart synchronized with server.');
        } catch (error) {
          console.error('Failed to sync cart:', error);
        }
      };

      sync();
    }
  }, [isLoaded, isSignedIn, items, syncMutation, user?.id]);

  return null;
}
