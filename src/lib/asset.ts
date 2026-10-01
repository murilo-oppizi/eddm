/**
 * A file from /public, with the site's base path in front (empty normally, "/eddm" on the
 * GitHub Pages preview). Next adds it to links on its own, but not to next/image sources
 * or to files fetched in code, like the key sounds.
 */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

/** True on the GitHub Pages preview (a public preview, not the real eddm.com). */
export const isPreview = Boolean(process.env.NEXT_PUBLIC_BASE_PATH);
