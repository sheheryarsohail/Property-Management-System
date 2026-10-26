// minimal, extend if you have richer metadata
export type IdemResponse = {
  key?: string;
  reused?: boolean;
  stored?: boolean;
  skipped?: boolean;
  meta?: Record<string, unknown>;
};

// Accept either a typed object or a raw header string
export type IdemLike = IdemResponse | string | undefined;
