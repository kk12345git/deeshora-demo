// src/lib/activity.ts
import prisma from './prisma';

type ActivityType = 'ORDER' | 'VENDOR' | 'USER' | 'SYSTEM' | 'PAYMENT' | 'PRODUCT';
type ActivityAction = 'STATUS_UPDATE' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVAL' | 'PAYOUT' | 'LOGIN' | 'SUBSCRIPTION';

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
    return await prisma.activityLog.create({
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
  } catch (error) {
    console.error('[ActivityLog] Error logging activity:', error);
    // Don't throw — activity logging shouldn't break the main flow
  }
}
