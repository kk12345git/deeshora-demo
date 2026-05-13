import { NextResponse } from 'next/server';
import { Daily1MartBot } from '@/lib/whatsapp-bot';
import prisma from '@/lib/prisma';

// This is the endpoint WhatsApp will call
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if it's a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];
      
      if (!message) return NextResponse.json({ status: 'no message' });

      const from = message.from; // User's phone number
      const type = message.type;
      
      // Initialize Bot (Credentials should be in env or DB)
      const bot = new Daily1MartBot({
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneId: process.env.WHATSAPP_PHONE_ID || '',
      });

      // 1. Handle Interactive Replies (Buttons/Lists)
      if (type === 'interactive') {
        const interactive = message.interactive;
        const replyId = interactive.button_reply?.id || interactive.list_reply?.id;

        if (replyId === 'btn_browse') {
          const categories = await prisma.category.findMany({ take: 10 });
          await bot.sendCategoryList(from, categories);
        } else if (replyId === 'btn_track') {
          // Find last order for this phone
          const lastOrder = await prisma.order.findFirst({
            where: { user: { phone: from } },
            orderBy: { createdAt: 'desc' },
          });
          if (lastOrder) {
            await bot.sendOrderStatus(from, lastOrder);
          } else {
            // bot.sendSimpleMessage(from, "No orders found for this number.");
          }
        } else if (replyId.startsWith('cat_')) {
           const catId = replyId.replace('cat_', '');
           // Show products in category...
        }
      } 
      
      // 2. Handle Text Messages
      else if (type === 'text') {
        const text = message.text.body.toLowerCase();
        if (text === 'hi' || text === 'hello' || text === 'start') {
          await bot.sendWelcome(from);
        }
      }

      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ status: 'not whatsapp' });
  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

// Verification for Webhook setup
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new Response(challenge, { status: 200 });
    }
  }

  return new Response('Forbidden', { status: 403 });
}
