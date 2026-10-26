import { AsyncLocalStorage } from 'node:async_hooks';

export type AuthContextData = { tenantId: string; userId: string } | undefined;
export const authContextStorage = new AsyncLocalStorage<AuthContextData>();
