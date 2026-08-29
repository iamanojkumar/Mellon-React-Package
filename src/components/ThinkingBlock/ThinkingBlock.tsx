import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Accordion } from '../Accordion/Accordion';
import { mergeClasses } from '../../utilities/mergeClasses';
import spinnerStyles from '../Spinner/Spinner.module.css';
import styles from './ThinkingBlock.module.css';

const ITEM_VALUE = 'reasoning';
/** A defined-but-not-`ITEM_VALUE` sentinel for the controlled-and-closed state — `Accordion`'s `useControllableState` treats `value={undefined}` as "uncontrolled", so `open={false}` can't map to `undefined` the way `open={undefined}` does, or the two collapse into the same (wrong) behavior. */
const CLOSED_VALUE = '';

/** Rounds up to a whole second — a trace that took 0.4s still took a moment, and "Thought for 0s" reads as a broken readout rather than a fast one. */
export function formatThinkingDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

export interface ThinkingBlockProps {
  /**
   * Trigger label. Overrides the `thinking`/`duration` label entirely when
   * set — the escape hatch for wording and localization. Unset, the label is
   * `"Thinking…"` while `thinking`, `"Thought for 8s"` once it finishes, and
   * `"Show reasoning"` when neither applies.
   */
  label?: ReactNode;
  /** Whether reasoning is still in progress. Flipping it to `false` is what swaps the label to the elapsed-time form. */
  thinking?: boolean;
  /**
   * Elapsed reasoning time in **seconds**. Supply it when the real duration
   * is known from the transport (a streamed trace's own timings); omit it and
   * the block measures the `thinking` true→false transition itself, which is
   * the only span it can observe. A non-finite value is ignored rather than
   * rendered, the same refusal to state a measurement nobody took that the
   * charts make.
   */
  duration?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

/**
 * A collapsible reasoning-trace summary — a fixed single-item preset over
 * `Accordion` (the same "thin wrapper" shape `TimePicker`/`Autocomplete`
 * already established for other components), rather than a new disclosure
 * widget. No `ref` prop: `Accordion`'s own root is a plain function
 * component with no `ref` support either, so there's nothing to forward.
 *
 * The trigger doubles as the turn's own progress readout — `thinking` spins
 * a decorative `Spinner` glyph beside "Thinking…", and the moment it clears,
 * the label settles to "Thought for 8s". Deliberately **not** a live region:
 * `StatusLine` is the announced-moment component in this cluster, and a
 * consumer showing both would double-announce the same transition (the same
 * reason `StreamingCursor` and `TokenCounter` don't announce either). Pair
 * this with a `StatusLine` when the moment needs announcing.
 */
export function ThinkingBlock({
  label,
  thinking = false,
  duration,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
}: ThinkingBlockProps) {
  const startedAt = useRef<number | undefined>(undefined);
  const [measured, setMeasured] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (thinking) {
      startedAt.current = Date.now();
      setMeasured(undefined);
      return;
    }
    // Only a real true→false transition has a span to report; mounting already
    // finished (the common case for a replayed conversation) measures nothing.
    if (startedAt.current !== undefined) {
      setMeasured((Date.now() - startedAt.current) / 1000);
      startedAt.current = undefined;
    }
  }, [thinking]);

  const elapsed = duration !== undefined && Number.isFinite(duration) ? duration : measured;

  let resolvedLabel: ReactNode;
  if (label !== undefined) {
    resolvedLabel = label;
  } else if (thinking) {
    resolvedLabel = 'Thinking…';
  } else if (elapsed !== undefined) {
    resolvedLabel = `Thought for ${formatThinkingDuration(elapsed)}`;
  } else {
    resolvedLabel = 'Show reasoning';
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={open === undefined ? undefined : open ? ITEM_VALUE : CLOSED_VALUE}
      defaultValue={defaultOpen ? ITEM_VALUE : undefined}
      onValueChange={(value) => onOpenChange?.(value === ITEM_VALUE)}
      className={mergeClasses(styles.block, className)}
    >
      <Accordion.Item value={ITEM_VALUE} className={styles.item}>
        <Accordion.Trigger className={styles.trigger}>
          <span className={styles.labelRow}>
            {thinking && (
              <span
                className={mergeClasses(spinnerStyles.spinner, styles.spinner)}
                aria-hidden="true"
                data-size="sm"
              />
            )}
            {resolvedLabel}
          </span>
        </Accordion.Trigger>
        <Accordion.Content className={styles.content}>{children}</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

ThinkingBlock.displayName = 'ThinkingBlock';
