import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Avatar.module.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

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
  { as, className, src, alt, name, size = 'md', shape = 'circle', ...rest }: AvatarProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';
  const initials = name ? getInitials(name) : '';
  const fallbackLabel = alt ?? name;

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.avatar, className)}
      data-size={size}
      data-shape={shape}
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
