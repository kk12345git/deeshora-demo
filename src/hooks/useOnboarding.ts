'use client';
// src/hooks/useOnboarding.ts

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';

export function useOnboarding() {
  const { isSignedIn } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const { data: canOrderData, isLoading } = trpc.user.canOrder.useQuery(undefined, {
    enabled: !!isSignedIn,
    staleTime: 30_000,
  });

  /**
   * Call this before Add to Cart or Checkout.
   * If the user can order, runs the action immediately.
   * Otherwise, opens the onboarding modal and queues the action.
   */
  const requireOnboarding = (action: () => void) => {
    if (!isSignedIn) {
      // Redirect to sign in handled by Clerk
      window.location.href = '/sign-in';
      return;
    }
    if (isLoading) return;

    if (canOrderData?.canOrder) {
      action();
    } else {
      // Queue the action to fire after successful onboarding
      setPendingAction(() => action);
      setIsModalOpen(true);
    }
  };

  const handleOnboardingSuccess = () => {
    setIsModalOpen(false);
    // Fire the queued action after a brief delay for UX
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 400);
    }
  };

  return {
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => { setIsModalOpen(false); setPendingAction(null); },
    requireOnboarding,
    handleOnboardingSuccess,
    canOrder: canOrderData?.canOrder ?? false,
    orderBlockReason: canOrderData?.reason,
    isCheckingStatus: isLoading,
  };
}
