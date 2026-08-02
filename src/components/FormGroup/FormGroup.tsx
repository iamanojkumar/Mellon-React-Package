import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import styles from './FormGroup.module.css';

export interface FormGroupOwnProps {
  /** Vertical gap between children. Defaults to `md`. */
  gap?: SpaceValue;
}

export type FormGroupProps = ComponentPropsWithoutRef<'div'> & FormGroupOwnProps;

/**
 * Plain vertical spacing wrapper for a run of form controls — simpler than
 * `Field` (no label/error/`FieldContext` wiring), for grouping controls
 * that don't each need their own label, e.g. a row of `Checkbox`es under
 * one shared `Label`.
 */
export const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(function FormGroup(
  { className, style, gap = 'md', ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={mergeClasses(styles.formGroup, className)}
      style={{ gap: resolveSpace(gap), ...style }}
      {...rest}
    />
  );
});

FormGroup.displayName = 'FormGroup';
