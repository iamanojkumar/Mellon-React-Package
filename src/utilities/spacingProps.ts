import type { CSSProperties } from 'react';
import { resolveSpace } from './resolveSpace';
import type { SpaceValue } from './resolveSpace';

export interface SpacingProps {
  p?: SpaceValue;
  px?: SpaceValue;
  py?: SpaceValue;
  pt?: SpaceValue;
  pr?: SpaceValue;
  pb?: SpaceValue;
  pl?: SpaceValue;
  m?: SpaceValue;
  mx?: SpaceValue;
  my?: SpaceValue;
  mt?: SpaceValue;
  mr?: SpaceValue;
  mb?: SpaceValue;
  ml?: SpaceValue;
}

/** Resolves Box-style spacing props (p/px/.../ml) to a CSS style object. */
export function resolveSpacingStyle({
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
}: SpacingProps): CSSProperties {
  return {
    ...(p !== undefined && { padding: resolveSpace(p) }),
    ...(px !== undefined && { paddingInline: resolveSpace(px) }),
    ...(py !== undefined && { paddingBlock: resolveSpace(py) }),
    ...(pt !== undefined && { paddingTop: resolveSpace(pt) }),
    ...(pr !== undefined && { paddingRight: resolveSpace(pr) }),
    ...(pb !== undefined && { paddingBottom: resolveSpace(pb) }),
    ...(pl !== undefined && { paddingLeft: resolveSpace(pl) }),
    ...(m !== undefined && { margin: resolveSpace(m) }),
    ...(mx !== undefined && { marginInline: resolveSpace(mx) }),
    ...(my !== undefined && { marginBlock: resolveSpace(my) }),
    ...(mt !== undefined && { marginTop: resolveSpace(mt) }),
    ...(mr !== undefined && { marginRight: resolveSpace(mr) }),
    ...(mb !== undefined && { marginBottom: resolveSpace(mb) }),
    ...(ml !== undefined && { marginLeft: resolveSpace(ml) }),
  };
}
