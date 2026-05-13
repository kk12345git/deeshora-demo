// src/lib/activity.ts
import prisma from "./prisma";
import { pusherServer, CHANNELS, EVENTS } from "./pusher";

type ActivityType =
  | "ORDER"
  | "VENDOR"
  | "USER"
  | "SYSTEM"
  | "PAYMENT"
  | "PRODUCT"
  | "SEARCH";
type ActivityAction =
  | "STATUS_UPDATE"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVAL"
  | "PAYOUT"
  | "LOGIN"
  | "SUBSCRIPTION"
  | "QUERY"
  | "PAYMENT_VERIFY";

interface LogActivityParams {
  type: ActivityType;
  action: ActivityAction;
  entityId?: string;
  entityType?: string;
  actorId?: string;
  actorName?: string;
  message?: string;
  metadata?: any;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        type: params.type,
        action: params.action,
        entityId: params.entityId,
        entityType: params.entityType,
        actorId: params.actorId,
        actorName: params.actorName,
        message: params.message,
        metadata: params.metadata || {},
      },
    });

    // Real-time notification to admin Command Center
    try {
      await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.NEW_ACTIVITY, {
        id: log.id,
        type: log.type,
        message: log.message,
        actorName: log.actorName,
        createdAt: log.createdAt,
      });

      // Also trigger a general stats update event
      await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.STATS_UPDATED, {});
    } catch (pusherErr) {
      console.error("[ActivityLog] Pusher trigger failed:", pusherErr);
    }

    return log;
  } catch (error) {
    console.error("[ActivityLog] Error logging activity:", error);
    // Don't throw — activity logging shouldn't break the main flow
  }
}
