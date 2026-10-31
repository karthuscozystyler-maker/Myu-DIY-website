declare global {
  interface Window {
    /** Set by the SHOPLINE runtime to the folder it was loaded from. */
    __MYU_ASSET_BASE__?: string;
    /** Set by the SHOPLINE runtime: a build hash so cached images never outlive their runtime. */
    __MYU_ASSET_VERSION__?: string;
  }
}

/**
 * Resolves a file under client/public (e.g. "products/tin-front.webp").
 * The static site serves it from its own base; the SHOPLINE runtime loads it
 * from the same hosting folder as myu-runtime.js.
 */
export function assetUrl(file: string): string {
  const base =
    (typeof window !== "undefined" && window.__MYU_ASSET_BASE__) ||
    import.meta.env.BASE_URL ||
    "/";
  const version =
    typeof window !== "undefined" ? window.__MYU_ASSET_VERSION__ : undefined;
  return base.replace(/\/?$/, "/") + file + (version ? `?v=${version}` : "");
}
