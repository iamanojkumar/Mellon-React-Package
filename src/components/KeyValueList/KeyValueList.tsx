import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './KeyValueList.module.css';

export interface KeyValueItem {
  label: ReactNode;
  value: ReactNode;
}

export interface KeyValueListOwnProps {
  items: KeyValueItem[];
}

export type KeyValueListProps = Omit<ComponentPropsWithoutRef<'dl'>, 'children'> &
  KeyValueListOwnProps;

/** Label/value metadata pairs — a native `<dl>` of `<dt>`/`<dd>` rows, not polymorphic (that's the correct semantic element for this data shape). */
export const KeyValueList = forwardRef<HTMLDListElement, KeyValueListProps>(function KeyValueList(
  { className, items, ...rest },
  ref,
) {
  return (
    <dl ref={ref} className={mergeClasses(styles.list, className)} {...rest}>
      {items.map((item, index) => (
        <div className={styles.row} key={index}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
});

KeyValueList.displayName = 'KeyValueList';
