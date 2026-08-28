import { Popover } from '../Popover/Popover';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import { IconButton } from '../IconButton/IconButton';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './CanvasFillPicker.module.css';

/**
 * A modest, hand-picked spread rather than a categorical palette — the same
 * gap `StickyNote`'s `tone` doc already explains (`variables.css` defines no
 * categorical hues). These are plain hex, not tokens: user-chosen fill,
 * same status as `Image.src`.
 */
export const DEFAULT_CANVAS_FILL_PRESETS = [
  '#fef3c7',
  '#fecaca',
  '#fed7aa',
  '#bbf7d0',
  '#bfdbfe',
  '#e9d5ff',
  '#fbcfe8',
  '#e5e7eb',
];

export interface CanvasFillPickerProps {
  /** Current fill, if any. Omit for "no custom fill set". */
  value?: string;
  onChange: (color: string) => void;
  presets?: string[];
  /** Accessible label for the trigger and the popover. Defaults to `'Change fill color'`. */
  triggerLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * The shared "small trigger → popover" shape `AISuggestionPopover` already
 * established, reused here for a block's fill rather than an AI result —
 * `Popover.Content` stays the only styled box (no nested overlay boxes), our
 * own markup inside it stays layout-only plus the one `ColorPicker` instance,
 * which already renders both preset swatches and the full picker.
 */
export function CanvasFillPicker({
  value,
  onChange,
  presets = DEFAULT_CANVAS_FILL_PRESETS,
  triggerLabel = 'Change fill color',
  open,
  defaultOpen,
  onOpenChange,
  className,
}: CanvasFillPickerProps) {
  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger
        as={IconButton}
        aria-label={triggerLabel}
        size="sm"
        variant="ghost"
        className={styles.trigger}
      >
        <span
          className={styles.swatch}
          aria-hidden="true"
          style={value ? { backgroundColor: value } : undefined}
          data-empty={value ? undefined : ''}
        />
      </Popover.Trigger>
      <Popover.Content placement="bottom-start">
        <div
          role="dialog"
          aria-label={triggerLabel}
          className={mergeClasses(styles.content, className)}
        >
          <ColorPicker value={value} onChange={onChange} presets={presets} />
        </div>
      </Popover.Content>
    </Popover>
  );
}

CanvasFillPicker.displayName = 'CanvasFillPicker';
