// src/lib/trpc-server.ts
import { headers } from 'next/headers';
import { createTRPCContext, createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server';
import { cache } from 'react';


/**
 * This wraps the tRPC context creation in a way that can be used in Next.js Server Components.
 */
const createContext = cache(async () => {
  const heads = await headers();
  // Note: We can read from ReadonlyHeaders directly - no need to copy
  return createTRPCContext({
    headers: heads as unknown as Headers,
  });
});


const createCaller = createCallerFactory(appRouter);


export const api = createCaller(createContext);
