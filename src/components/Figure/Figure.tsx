import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Figure.module.css';

export interface FigureOwnProps {
  caption?: ReactNode;
}

export type FigureProps = ComponentPropsWithoutRef<'figure'> & FigureOwnProps;

/** Semantic `<figure>` + optional `<figcaption>` — typically wraps an `Image`. */
export const Figure = forwardRef<HTMLElement, FigureProps>(function Figure(
  { className, caption, children, ...rest },
  ref,
) {
  return (
    <figure ref={ref} className={mergeClasses(styles.figure, className)} {...rest}>
      {children}
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
});

Figure.displayName = 'Figure';
