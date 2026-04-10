// src/lib/trpc-server.ts
import { headers } from 'next/headers';
import { createTRPCContext, createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server';
import { cache } from 'react';


/**
 * This wraps the tRPC context creation in a way that can be used in Next.js Server Components.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set('x-trpc-source', 'rsc');


  return createTRPCContext({
    headers: heads,
  });
});


const createCaller = createCallerFactory(appRouter);


export const api = createCaller(createContext);
