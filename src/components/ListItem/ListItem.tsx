import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextColor, TextSize } from '../Text/Text';
import styles from './ListItem.module.css';

export interface ListItemOwnProps {
  size?: TextSize;
  color?: TextColor;
}

export type ListItemProps<C extends ElementType = 'li'> = PolymorphicComponentPropWithRef<
  C,
  ListItemOwnProps
>;

type ListItemComponent = <C extends ElementType = 'li'>(
  props: ListItemProps<C>,
) => React.ReactElement | null;

/** `<li>` styled to match `Text` (see `Heading`) — pairs with `List`. */
export const ListItem = forwardRef(function ListItem<C extends ElementType = 'li'>(
  { as, className, size = 'md', color = 'primary', ...rest }: ListItemProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'li';

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.listItem, className)}
      data-size={size}
      data-weight="regular"
      data-color={color}
      {...rest}
    />
  );
}) as unknown as ListItemComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ListItem as any).displayName = 'ListItem';
