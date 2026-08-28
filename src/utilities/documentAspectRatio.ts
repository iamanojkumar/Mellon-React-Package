/**
 * Named presets plus a custom escape hatch — the same shape `Image`'s own
 * `ratio` prop uses (a plain width/height pair), just with a small set of
 * named shortcuts for the common cases. New presets are additive later
 * without touching the type consumers already depend on.
 */
export type DocumentAspectRatioPreset = 'a4' | '16:9' | '4:3';

export interface DocumentAspectRatioSize {
  width: number;
  height: number;
}

export type DocumentAspectRatio = DocumentAspectRatioPreset | DocumentAspectRatioSize;

/**
 * Ratios, not physical sizes — A4's 210×297mm is expressed as that same
 * ratio in arbitrary units, since CSS `aspect-ratio` only ever cares about
 * the proportion.
 */
export const DOCUMENT_ASPECT_RATIOS: Record<DocumentAspectRatioPreset, DocumentAspectRatioSize> = {
  a4: { width: 210, height: 297 },
  '16:9': { width: 16, height: 9 },
  '4:3': { width: 4, height: 3 },
};

export function resolveDocumentAspectRatio(ratio: DocumentAspectRatio): DocumentAspectRatioSize {
  return typeof ratio === 'string' ? DOCUMENT_ASPECT_RATIOS[ratio] : ratio;
}

/** Ready to drop onto a `style` prop as the CSS `aspect-ratio` value. */
export function documentAspectRatioCss(ratio: DocumentAspectRatio): string {
  const { width, height } = resolveDocumentAspectRatio(ratio);
  return `${width} / ${height}`;
}
