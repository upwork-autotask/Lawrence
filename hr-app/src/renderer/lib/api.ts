import type { RendererApi } from '@shared/ipc/api';

/**
 * Convenience accessor. window.api is set by the preload script.
 * Importing this rather than reading window.api directly gives us
 * a single chokepoint to wrap (logging, telemetry, etc.) later.
 *
 * The preload also attaches `__setToken` / `__getToken` for the auth flow —
 * those aren't part of the canonical RendererApi shape but are exposed at runtime.
 */
type Api = RendererApi & {
  __setToken: (t: string | null) => void;
  __getToken: () => string | null;
};

export const api: Api = (window as unknown as { api: Api }).api;
