import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './FormSection.module.css';

export interface FormSectionOwnProps {
  title: ReactNode;
  description?: ReactNode;
}

export type FormSectionProps = ComponentPropsWithoutRef<'section'> & FormSectionOwnProps;

/** A titled section within a longer form — heading, optional description, then the grouped fields. */
export const FormSection = forwardRef<HTMLElement, FormSectionProps>(function FormSection(
  { className, title, description, children, ...rest },
  ref,
) {
  return (
    <section ref={ref} className={mergeClasses(styles.section, className)} {...rest}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
});

FormSection.displayName = 'FormSection';
