import { createTRPCRouter } from '@/server/trpc';
import { productRouter } from './routers/product';
import { orderRouter } from './routers/order';
import { cartRouter } from './routers/cart';
import { adminRouter } from './routers/admin';
import { userRouter } from './routers/user';
import { couponRouter } from './routers/coupon';
import { deliveryRouter } from './routers/delivery';
import { communityRouter } from './routers/community';
import { walletRouter } from './routers/wallet';
import { deliverySlotRouter } from './routers/deliverySlot';
import { subscriptionRouter } from './routers/subscription';

export const appRouter = createTRPCRouter({
  product: productRouter,
  order: orderRouter,
  cart: cartRouter,
  admin: adminRouter,
  user: userRouter,
  coupon: couponRouter,
  delivery: deliveryRouter,
  community: communityRouter,
  wallet: walletRouter,
  deliverySlot: deliverySlotRouter,
  subscription: subscriptionRouter,
});


export type AppRouter = typeof appRouter;
