import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './EmptyState.module.css';

export interface EmptyStateOwnProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export type EmptyStateProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  EmptyStateOwnProps;

/** Centered placeholder for an empty list/section — icon, title, optional description and action. Not polymorphic — a fixed structural layout. */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { className, icon, title, description, action, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={mergeClasses(styles.emptyState, className)} {...rest}>
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
