import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextColor, TextWeight } from '../Text/Text';
import styles from './Label.module.css';

export interface LabelOwnProps {
  weight?: TextWeight;
  color?: TextColor;
  /** Shows a required-field asterisk. `Field` already renders its own for the label it manages internally — this is for a standalone `Label` used outside `Field`. */
  required?: boolean;
}

export type LabelProps<C extends ElementType = 'label'> = PolymorphicComponentPropWithRef<
  C,
  LabelOwnProps
>;

type LabelComponent = <C extends ElementType = 'label'>(
  props: LabelProps<C>,
) => React.ReactElement | null;

/**
 * Standalone form-label text — shared by the Typography and Form
 * categories in docs/SPEC.md's Component Inventory (one component, not
 * two). `Field` (`src/components/Field/Field.tsx`) renders its own
 * `<label>` internally rather than composing this one, since it already
 * needs full control over the `htmlFor`/required-asterisk wiring; this
 * component is for labels used standalone, outside `Field`.
 */
export const Label = forwardRef(function Label<C extends ElementType = 'label'>(
  {
    as,
    className,
    weight = 'medium',
    color = 'primary',
    required = false,
    children,
    ...rest
  }: LabelProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'label';

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.label, className)}
      data-size="sm"
      data-weight={weight}
      data-color={color}
      {...rest}
    >
      {children}
      {required && (
        <span className={styles.required} aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </Component>
  );
}) as unknown as LabelComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Label as any).displayName = 'Label';
