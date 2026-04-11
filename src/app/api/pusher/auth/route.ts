// src/app/api/pusher/auth/route.ts
import { pusherServer } from '@/lib/pusher';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }


  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }


  const data = await req.formData();
  const socketId = data.get('socket_id') as string;
  const channel = data.get('channel_name') as string;


  let isAuthorized = false;


  if (channel.startsWith('private-order-')) {
    const orderId = channel.replace('private-order-', '');
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });
    if (order) {
      isAuthorized = true;
    }
  }


  if (channel.startsWith('private-vendor-')) {
    const vendorId = channel.replace('private-vendor-', '');
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, userId: user.id },
    });
    if (vendor) {
      isAuthorized = true;
    }
  }


  if (channel === 'private-admin') {
    if (user.role === 'ADMIN') {
      isAuthorized = true;
    }
  }


  if (!isAuthorized) {
    return new NextResponse('Forbidden', { status: 403 });
  }


  const authResponse = pusherServer.authorizeChannel(socketId, channel);
  return NextResponse.json(authResponse);
}