import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { AlertVariantIcon } from '../Alert/Alert';
import spinnerStyles from '../Spinner/Spinner.module.css';
import { Caption } from '../Caption/Caption';
import styles from './ToolTraceViewer.module.css';

export type ToolTraceStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface ToolTraceStep {
  id: string;
  label: ReactNode;
  status: ToolTraceStepStatus;
  /** Secondary detail rendered below the label, e.g. a search query or a result count. */
  detail?: ReactNode;
}

export interface ToolTraceViewerOwnProps {
  steps: ToolTraceStep[];
}

export type ToolTraceViewerProps = Omit<ComponentPropsWithoutRef<'ol'>, 'children'> &
  ToolTraceViewerOwnProps;

function StepIcon({ status }: { status: ToolTraceStepStatus }) {
  if (status === 'done') return <AlertVariantIcon variant="success" />;
  if (status === 'error') return <AlertVariantIcon variant="danger" />;
  if (status === 'active') return <span className={spinnerStyles.spinner} data-size="sm" />;
  return <span className={styles.pendingDot} />;
}

/**
 * A tool/search/read execution log — the sequence of steps an AI turn ran
 * through before responding (e.g. "Searching the web…" → "Reading 3
 * pages…" → "Done"). Reuses `AlertVariantIcon` for the done/error glyphs
 * (its `success`/`danger` variants) rather than drawing new checkmark/×
 * icons — the same "shapes used by multiple components are exported once
 * and reused" precedent `AlertVariantIcon` itself already established for
 * `Alert`/`Banner`/`Toast`. The in-progress icon reuses `Spinner`'s CSS
 * class directly (not the `Spinner` component) since its own
 * `role="status"` announcement would be redundant with — and would race
 * — the step's already-visible label text; each icon is purely decorative
 * (`aria-hidden`), with `aria-current="step"` on the active `<li>` instead.
 * An `<ol>`: the steps are a real sequence, not an unordered set.
 */
export const ToolTraceViewer = forwardRef<HTMLOListElement, ToolTraceViewerProps>(
  function ToolTraceViewer({ className, steps, ...rest }, ref) {
    return (
      <ol ref={ref} className={mergeClasses(styles.list, className)} {...rest}>
        {steps.map((step) => (
          <li
            key={step.id}
            className={styles.step}
            data-status={step.status}
            aria-current={step.status === 'active' ? 'step' : undefined}
          >
            <span className={styles.icon} aria-hidden="true">
              <StepIcon status={step.status} />
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{step.label}</span>
              {step.detail && <Caption>{step.detail}</Caption>}
            </span>
          </li>
        ))}
      </ol>
    );
  },
);

ToolTraceViewer.displayName = 'ToolTraceViewer';
