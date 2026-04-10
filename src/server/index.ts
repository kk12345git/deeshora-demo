// src/server/index.ts
import { createTRPCRouter } from '@/server/trpc';
import { productRouter } from './routers/product';
import { orderRouter } from './routers/order';
import { cartRouter } from './routers/cart';
import { vendorRouter } from './routers/vendor';
import { adminRouter } from './routers/admin';
import { userRouter } from './routers/user';


export const appRouter = createTRPCRouter({
  product: productRouter,
  order: orderRouter,
  cart: cartRouter,
  vendor: vendorRouter,
  admin: adminRouter,
  user: userRouter,
});


export type AppRouter = typeof appRouter;