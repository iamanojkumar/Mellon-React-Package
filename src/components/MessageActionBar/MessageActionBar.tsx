import { forwardRef, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, FocusEvent } from 'react';
import { mergeRefs } from '../../utilities/mergeRefs';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { mergeClasses } from '../../utilities/mergeClasses';
import { Button } from '../Button/Button';
import styles from './MessageActionBar.module.css';

export interface MessageAction {
  id: string;
  label: string;
  onClick: () => void;
}

export interface MessageActionBarOwnProps {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onContinue?: () => void;
  onSimplify?: () => void;
  onExplain?: () => void;
  /** Anything not covered by the named props above (translate, summarize, expand, shorten, ...) — appended after them in the same toolbar. */
  extraActions?: MessageAction[];
}

export type MessageActionBarProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  MessageActionBarOwnProps;

/**
 * The curated row of actions shown below/beside a completed `MessageBubble`
 * (copy, regenerate, continue, simplify, explain, plus any app-specific
 * `extraActions`). Each named action renders only when its handler is
 * given — the same "conditional on handler presence" convention `Alert`'s
 * `onDismiss` already established.
 *
 * Ghost `size="sm"` `Button`s, not `ButtonGroup` — `ButtonGroup`'s CSS
 * visually joins its items with shared borders/corner-radius, the wrong
 * look for a loosely-gapped action row, so this reuses `useRovingFocus`
 * directly instead (the same "reuse the hook, not the JSX" precedent
 * `Tooltip` set against `Popover`), rolling its own `role="toolbar"` +
 * roving-tabindex bookkeeping — mirroring `ButtonGroup`'s own internal
 * shape, just without its box styling. Renders nothing when no action is
 * given.
 */
export const MessageActionBar = forwardRef<HTMLDivElement, MessageActionBarProps>(
  function MessageActionBar(
    {
      className,
      onCopy,
      onRegenerate,
      onContinue,
      onSimplify,
      onExplain,
      extraActions = [],
      ...rest
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const actions: MessageAction[] = [
      onCopy && { id: 'copy', label: 'Copy', onClick: onCopy },
      onRegenerate && { id: 'regenerate', label: 'Regenerate', onClick: onRegenerate },
      onContinue && { id: 'continue', label: 'Continue', onClick: onContinue },
      onSimplify && { id: 'simplify', label: 'Simplify', onClick: onSimplify },
      onExplain && { id: 'explain', label: 'Explain', onClick: onExplain },
      ...extraActions,
    ].filter((action): action is MessageAction => Boolean(action));

    const handleKeyDown = useRovingFocus({
      itemSelector: '[data-message-action]',
      orientation: 'horizontal',
    });

    function handleFocus(event: FocusEvent<HTMLDivElement>) {
      const all = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>('[data-message-action]') ?? [],
      );
      const index = all.indexOf(event.target);
      if (index !== -1) setActiveIndex(index);
    }

    if (actions.length === 0) return null;

    return (
      <div
        ref={mergeRefs(containerRef, ref)}
        role="toolbar"
        aria-label="Message actions"
        className={mergeClasses(styles.bar, className)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        {...rest}
      >
        {actions.map((action, index) => (
          <Button
            key={action.id}
            type="button"
            variant="ghost"
            size="sm"
            data-message-action=""
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  },
);

MessageActionBar.displayName = 'MessageActionBar';
