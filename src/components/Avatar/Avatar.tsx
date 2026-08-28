import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Avatar.module.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarColor = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * The rotation `colorFrom` hashes into. Deliberately the whole `AvatarColor`
 * vocabulary, neutral included — grey is a legitimate avatar tint, and
 * excluding it would mean the default look never appears for a derived one.
 *
 * Five slots is also the ceiling this design system can honestly offer:
 * every entry is a foundation `*-subtle` / `*-on-subtle` pair, and those
 * exist for exactly four status families. See `AvatarOwnProps['color']` for
 * why there's no `brand` tint.
 */
const AVATAR_COLOR_ROTATION: readonly AvatarColor[] = [
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
];

/**
 * FNV-1a, 32-bit. Chosen over `key.length` or a character sum because those
 * collide badly on the keys avatars are actually derived from (sequential
 * account ids, same-length uuids) — a hash whose output doesn't change when
 * one character does would tint half a member list identically.
 */
function hashKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Exported so a consumer can tint a non-`Avatar` element (a chip, a row marker) to match. */
export function avatarColorFromKey(key: string): AvatarColor {
  return AVATAR_COLOR_ROTATION[hashKey(key) % AVATAR_COLOR_ROTATION.length]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export interface AvatarOwnProps {
  src?: string;
  /** Accessible alt text for the image. Falls back to `name` when not given. */
  alt?: string;
  /** Used for the fallback initials shown when there's no `src` (or it fails to load). */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /**
   * Tints the initials fallback. **Decorative only** — an avatar's tint
   * makes no claim about the person it stands for; the initials and the
   * accessible name carry identity, and the tint is redundant with both.
   * The values are named for the foundation role each one maps to, not for
   * a status, so `color="danger"` says nothing about the account. (This is
   * why CLAUDE.md's "status colour is never the sole carrier of meaning"
   * rule doesn't apply here: there's no meaning to carry — same reasoning
   * as `StickyNote`'s `tone`.)
   *
   * No `brand` tint exists: every value here is a foundation
   * `*-subtle` / `*-on-subtle` pair, and the foundation ships
   * `accent-subtle` without an `accent-on-subtle` counterpart. Defaults to
   * `'neutral'`, which is exactly today's untinted look.
   *
   * Ignored when `src` renders — the image covers the fill.
   */
  color?: AvatarColor;
  /**
   * Derives a stable `color` from an arbitrary key (an account id, an email)
   * so the same account is the same colour on every screen and across
   * reloads, without the consumer maintaining a palette. `color` wins when
   * both are given.
   */
  colorFrom?: string;
}

export type AvatarProps<C extends ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  AvatarOwnProps
>;

type AvatarComponent = <C extends ElementType = 'span'>(
  props: AvatarProps<C>,
) => React.ReactElement | null;

/** Renders an image when `src` is given, otherwise initials derived from `name`. */
export const Avatar = forwardRef(function Avatar<C extends ElementType = 'span'>(
  {
    as,
    className,
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    color,
    colorFrom,
    ...rest
  }: AvatarProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';
  const initials = name ? getInitials(name) : '';
  const fallbackLabel = alt ?? name;
  const resolvedColor = color ?? (colorFrom ? avatarColorFromKey(colorFrom) : 'neutral');

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.avatar, className)}
      data-size={size}
      data-shape={shape}
      data-color={resolvedColor}
      // When falling back to initials, the wrapper carries the accessible
      // name (like an image would) and the initials text is decorative —
      // otherwise the visible initials and this label would both be
      // announced. The `src` case needs neither: the `<img>` below already
      // has its own `alt`.
      role={!src && fallbackLabel ? 'img' : undefined}
      aria-label={!src ? fallbackLabel : undefined}
      {...rest}
    >
      {src ? (
        <img className={styles.image} src={src} alt={alt ?? name ?? ''} />
      ) : (
        <span aria-hidden="true" className={styles.initials}>
          {initials}
        </span>
      )}
    </Component>
  );
}) as unknown as AvatarComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Avatar as any).displayName = 'Avatar';
