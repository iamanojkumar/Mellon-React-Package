import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Code.module.css';

export interface CodeOwnProps {
  /** Renders as a padded, scrollable block instead of an inline snippet. Defaults to `false`. */
  block?: boolean;
}

export type CodeProps<C extends ElementType = 'code'> = PolymorphicComponentPropWithRef<
  C,
  CodeOwnProps
>;

type CodeComponent = <C extends ElementType = 'code'>(
  props: CodeProps<C>,
) => React.ReactElement | null;

/** Monospace code snippet, inline by default or a scrollable block via `block`. */
export const Code = forwardRef(function Code<C extends ElementType = 'code'>(
  { as, className, block = false, ...rest }: CodeProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'code';

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.code, className)}
      data-block={block || undefined}
      {...rest}
    />
  );
}) as unknown as CodeComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Code as any).displayName = 'Code';
