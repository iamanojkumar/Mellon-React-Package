import type { ReactNode } from 'react';
import { Accordion } from '../Accordion/Accordion';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ThinkingBlock.module.css';

const ITEM_VALUE = 'reasoning';
/** A defined-but-not-`ITEM_VALUE` sentinel for the controlled-and-closed state — `Accordion`'s `useControllableState` treats `value={undefined}` as "uncontrolled", so `open={false}` can't map to `undefined` the way `open={undefined}` does, or the two collapse into the same (wrong) behavior. */
const CLOSED_VALUE = '';

export interface ThinkingBlockProps {
  /** Trigger label. Defaults to `"Show reasoning"`. */
  label?: ReactNode;
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
 */
export function ThinkingBlock({
  label = 'Show reasoning',
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
}: ThinkingBlockProps) {
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
        <Accordion.Trigger className={styles.trigger}>{label}</Accordion.Trigger>
        <Accordion.Content className={styles.content}>{children}</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

ThinkingBlock.displayName = 'ThinkingBlock';
