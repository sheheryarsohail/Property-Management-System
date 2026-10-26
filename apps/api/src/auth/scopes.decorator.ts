import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'scopes';
export type ScopeString = string;

/** Use on a route/handler to require one or more scopes */
export const RequiresScopes = (...scopes: ScopeString[]) =>
  SetMetadata(SCOPES_KEY, scopes);

/** Friendly alias */
export const Scopes = RequiresScopes;
