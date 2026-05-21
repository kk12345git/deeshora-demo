// src/components/customer/NotificationBell.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  X,
  Loader2,
  Package,
  Percent,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@/navigation";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } =
    trpc.user.myNotifications.useQuery(undefined, {
      refetchInterval: 30000, // Refetch every 30s
    });
  const markRead = trpc.user.markNotificationRead.useMutation({
    onSuccess: () => utils.user.myNotifications.invalidate(),
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER_STATUS":
        return <Package size={16} className="text-blue-500" />;
      case "PROMOTION":
        return <Percent size={16} className="text-emerald-500" />;
      case "SYSTEM":
        return <AlertTriangle size={16} className="text-brand-500" />;
      default:
        return <MessageCircle size={16} className="text-gray-500" />;
    }
  };
  return (
    <div className="relative">
      {" "}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${isOpen ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
      >
        {" "}
        <Bell size={20} strokeWidth={isOpen ? 3 : 2} />{" "}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            {" "}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>{" "}
            <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-600 text-white text-[9px] font-black items-center justify-center">
              {" "}
              {unreadCount}{" "}
            </span>{" "}
          </span>
        )}{" "}
      </button>{" "}
      <AnimatePresence>
        {" "}
        {isOpen && (
          <>
            {" "}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />{" "}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
            >
              {" "}
              <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                {" "}
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">
                  Notifications
                </h3>{" "}
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black text-brand-500 uppercase tracking-tighter bg-brand-50 dark:bg-brand-950/30 px-2 py-0.5 rounded-full">
                    {" "}
                    {unreadCount} New{" "}
                  </span>
                )}{" "}
              </div>{" "}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                {" "}
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    {" "}
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      No notifications
                    </p>{" "}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 flex gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.isRead ? "bg-brand-50/30 dark:bg-brand-950/10" : ""}`}
                    >
                      {" "}
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        {" "}
                        {getIcon(n.type)}{" "}
                      </div>{" "}
                      <div className="flex-1 min-w-0">
                        {" "}
                        <div className="flex items-start justify-between gap-1">
                          {" "}
                          <p className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">
                            {n.title}
                          </p>{" "}
                          {!n.isRead && (
                            <button
                              onClick={() => markRead.mutate({ id: n.id })}
                              className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                            >
                              {" "}
                              <Check size={12} />{" "}
                            </button>
                          )}{" "}
                        </div>{" "}
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>{" "}
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-tighter">
                          {" "}
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>
                  ))
                )}{" "}
              </div>{" "}
              {notifications.length > 0 && (
                <Link
                  href="/profile/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-3.5 text-center text-[10px] font-black text-gray-400 hover:text-brand-500 uppercase tracking-[0.2em] transition-colors border-t border-gray-50 dark:border-gray-800"
                >
                  {" "}
                  View All Activity{" "}
                </Link>
              )}{" "}
            </motion.div>{" "}
          </>
        )}{" "}
      </AnimatePresence>{" "}
    </div>
  );
}
