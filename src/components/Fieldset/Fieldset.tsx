import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Fieldset.module.css';

export interface FieldsetOwnProps {
  legend?: ReactNode;
}

export type FieldsetProps = ComponentPropsWithoutRef<'fieldset'> & FieldsetOwnProps;

/** Native `<fieldset>`/`<legend>` wrapper for grouping related controls — `disabled` here natively disables every control inside, unlike `Field`'s per-control `disabled`. */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset(
  { className, legend, children, ...rest },
  ref,
) {
  return (
    <fieldset ref={ref} className={mergeClasses(styles.fieldset, className)} {...rest}>
      {legend && <legend className={styles.legend}>{legend}</legend>}
      {children}
    </fieldset>
  );
});

Fieldset.displayName = 'Fieldset';
