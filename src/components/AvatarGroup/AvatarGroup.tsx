import React, { Children, forwardRef, isValidElement } from 'react';
import type { ElementType, ForwardRefRenderFunction, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { Avatar } from '../Avatar/Avatar';
import type { AvatarSize } from '../Avatar/Avatar';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupOwnProps {
  /** Caps how many `Avatar` children render before collapsing the rest into a "+N" indicator. */
  max?: number;
  /** Applied to every `Avatar` child (and the "+N" indicator) for a consistent size. */
  size?: AvatarSize;
  children: ReactNode;
}

export type AvatarGroupProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  AvatarGroupOwnProps
>;

type AvatarGroupComponent = <C extends ElementType = 'div'>(
  props: AvatarGroupProps<C>,
) => React.ReactElement | null;

// `children` is required on AvatarGroupOwnProps, which trips up forwardRef's
// generic type-checking the same way `level` does on `Heading` — see that
// component for why the render function is cast below instead of passed
// directly to `forwardRef`.
function AvatarGroupRender<C extends ElementType = 'div'>(
  { as, className, max, size, children, ...rest }: AvatarGroupProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';
  const items = Children.toArray(children).filter(isValidElement);
  const visible = max !== undefined ? items.slice(0, max) : items;
  const overflowCount = max !== undefined ? items.length - visible.length : 0;

  return (
    <Component ref={ref} className={mergeClasses(styles.group, className)} {...rest}>
      {visible.map((child, index) => (
        <span className={styles.item} key={index}>
          {isValidElement<{ size?: AvatarSize }>(child)
            ? React.cloneElement(child, { size: size ?? child.props.size })
            : child}
        </span>
      ))}
      {overflowCount > 0 && (
        <span className={styles.item}>
          <Avatar size={size} aria-label={`${overflowCount} more`} name={`+${overflowCount}`} />
        </span>
      )}
    </Component>
  );
}

/** Overlapping stack of `Avatar`s, collapsing anything past `max` into a "+N" `Avatar`-styled indicator. */
export const AvatarGroup = forwardRef(
  AvatarGroupRender as unknown as ForwardRefRenderFunction<
    Element,
    Omit<AvatarGroupProps<ElementType>, 'ref'>
  >,
) as unknown as AvatarGroupComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(AvatarGroup as any).displayName = 'AvatarGroup';
