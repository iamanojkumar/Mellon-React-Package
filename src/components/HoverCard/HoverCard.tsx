import type { ElementType } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import type { PopoverContentProps, PopoverProps, PopoverTriggerProps } from '../Popover/Popover';

export type HoverCardProps = Omit<PopoverProps, 'triggerMode'>;
export type HoverCardTriggerProps<C extends ElementType = 'button'> = PopoverTriggerProps<C>;
export type HoverCardContentProps = PopoverContentProps;

/**
 * `Popover` preset with `triggerMode="hover"` and a longer default
 * `closeDelay` (300ms vs `Popover`'s 150) — hover cards typically hold
 * richer, sometimes-interactive content (a profile preview with a link or
 * button in it) than a quick tooltip, so a bit more time to move the
 * pointer from the trigger into the card matters more here.
 *
 * `HoverCard.Trigger`/`HoverCard.Content` *are* `Popover.Trigger`/
 * `Popover.Content` (the same component references, re-exported) — unlike
 * `Tooltip`, a hover card's trigger is naturally a real interactive
 * element already (a link, a `@mention`, a button), so `Popover.Trigger`'s
 * popup semantics (`aria-haspopup="dialog"`, `aria-expanded`,
 * `aria-controls`) are the *correct* wiring here, not a mismatch — see
 * `Tooltip.tsx` for the case where they aren't.
 *
 * Compound component:
 * `<HoverCard><HoverCard.Trigger as="a" href="...">...</HoverCard.Trigger><HoverCard.Content>...</HoverCard.Content></HoverCard>`.
 */
function HoverCardRoot({ closeDelay = 300, ...rest }: HoverCardProps) {
  return <Popover triggerMode="hover" closeDelay={closeDelay} {...rest} />;
}

export const HoverCard = Object.assign(HoverCardRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  displayName: 'HoverCard',
});

export { PopoverTrigger as HoverCardTrigger, PopoverContent as HoverCardContent };
