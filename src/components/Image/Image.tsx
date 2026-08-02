import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Image.module.css';

export type ImageFit = 'cover' | 'contain' | 'fill';

export interface ImageOwnProps {
  /** Required — pass `alt=""` explicitly for a purely decorative image, rather than omitting it. */
  alt: string;
  fit?: ImageFit;
  /** Width divided by height, e.g. `16 / 9`. Omit to size naturally. */
  ratio?: number;
  /** Rounds the corners. Defaults to `false`. */
  rounded?: boolean;
}

export type ImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'alt'> & ImageOwnProps;

/** `<img>` wrapper with `object-fit`, an optional `aspect-ratio`, and rounded corners. `alt` is required at the type level (unlike native `<img>`) — pass `alt=""` explicitly for decorative images. Not polymorphic — always a real `<img>`. */
export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { className, style, alt, fit = 'cover', ratio, rounded = false, ...rest },
  ref,
) {
  return (
    <img
      ref={ref}
      alt={alt}
      className={mergeClasses(styles.image, className)}
      style={{ ...(ratio !== undefined && { aspectRatio: String(ratio) }), ...style }}
      data-fit={fit}
      data-rounded={rounded || undefined}
      {...rest}
    />
  );
});

Image.displayName = 'Image';
