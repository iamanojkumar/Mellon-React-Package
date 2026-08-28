import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_ASPECT_RATIOS,
  documentAspectRatioCss,
  resolveDocumentAspectRatio,
} from './documentAspectRatio';

describe('resolveDocumentAspectRatio', () => {
  it('resolves each named preset', () => {
    expect(resolveDocumentAspectRatio('a4')).toEqual(DOCUMENT_ASPECT_RATIOS.a4);
    expect(resolveDocumentAspectRatio('16:9')).toEqual({ width: 16, height: 9 });
    expect(resolveDocumentAspectRatio('4:3')).toEqual({ width: 4, height: 3 });
  });

  it('passes a custom ratio through unchanged', () => {
    expect(resolveDocumentAspectRatio({ width: 3, height: 5 })).toEqual({ width: 3, height: 5 });
  });
});

describe('documentAspectRatioCss', () => {
  it('formats as a CSS aspect-ratio value', () => {
    expect(documentAspectRatioCss('16:9')).toBe('16 / 9');
    expect(documentAspectRatioCss({ width: 3, height: 5 })).toBe('3 / 5');
  });
});
