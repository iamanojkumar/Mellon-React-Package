import { createContext, useContext, useId } from 'react';
import type { ElementType, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import styles from './Accordion.module.css';

export type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

function useAccordionContext(part: string): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error(`<Accordion.${part}> must be used within <Accordion>`);
  }
  return context;
}

interface AccordionItemContextValue {
  value: string;
  disabled: boolean;
  triggerId: string;
  contentId: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | undefined>(undefined);

function useAccordionItemContext(part: string): AccordionItemContextValue {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error(`<Accordion.${part}> must be used within <Accordion.Item>`);
  }
  return context;
}

export interface AccordionProps {
  /** `'single'` (default): opening an item closes any other open item. `'multiple'`: items open independently. */
  type?: AccordionType;
  /** Only used when `type="single"`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  /** Only used when `type="single"`. Whether clicking the open item's trigger again closes it. Defaults to `true`. */
  collapsible?: boolean;
  /** Only used when `type="multiple"`. */
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  /** Semantic heading level (1-6) wrapping each `Accordion.Trigger`, so the headers are reachable via AT heading navigation. Defaults to `3`. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
}

/**
 * Root: `<Accordion><Accordion.Item value="a"><Accordion.Trigger>...</Accordion.Trigger><Accordion.Content>...</Accordion.Content></Accordion.Item></Accordion>`.
 * Keyboard nav (Up/Down/Home/End, vertical, wrapping) reuses `useRovingFocus`
 * — manual activation (moving focus doesn't open/close an item; Enter/Space
 * on the focused trigger does, via the button's native activation), unlike
 * `Tabs.List`'s automatic activation.
 */
function AccordionRoot({
  type = 'single',
  value,
  defaultValue,
  onValueChange,
  collapsible = true,
  values,
  defaultValues,
  onValuesChange,
  headingLevel = 3,
  children,
  className,
}: AccordionProps) {
  const [singleValue, setSingleValue] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [multiValues, setMultiValues] = useControllableState<string[]>({
    value: values,
    defaultValue: defaultValues ?? [],
    onChange: onValuesChange,
  });

  function isOpen(itemValue: string): boolean {
    return type === 'multiple' ? multiValues.includes(itemValue) : singleValue === itemValue;
  }

  function toggle(itemValue: string) {
    if (type === 'multiple') {
      setMultiValues(
        multiValues.includes(itemValue)
          ? multiValues.filter((v) => v !== itemValue)
          : [...multiValues, itemValue],
      );
      return;
    }
    if (singleValue === itemValue) {
      if (collapsible) setSingleValue(undefined);
      return;
    }
    setSingleValue(itemValue);
  }

  const handleKeyDown = useRovingFocus({
    itemSelector: '[data-accordion-trigger]:not(:disabled)',
    orientation: 'vertical',
  });

  return (
    <AccordionContext.Provider value={{ headingLevel, isOpen, toggle }}>
      <div
        role="presentation"
        className={mergeClasses(styles.accordion, className)}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  value: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

function AccordionItem({ value, disabled = false, children, className }: AccordionItemProps) {
  const { isOpen } = useAccordionContext('Item');
  const idBase = useId();
  const open = isOpen(value);

  return (
    <AccordionItemContext.Provider
      value={{
        value,
        disabled,
        triggerId: `${idBase}-trigger`,
        contentId: `${idBase}-content`,
      }}
    >
      <div
        className={mergeClasses(styles.item, className)}
        data-state={open ? 'open' : 'closed'}
        data-disabled={disabled || undefined}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { headingLevel, isOpen, toggle } = useAccordionContext('Trigger');
  const { value, disabled, triggerId, contentId } = useAccordionItemContext('Trigger');
  const open = isOpen(value);
  const HeadingTag = `h${headingLevel}` as ElementType;

  return (
    <HeadingTag className={styles.header}>
      <button
        type="button"
        id={triggerId}
        data-accordion-trigger=""
        aria-expanded={open}
        aria-controls={contentId}
        disabled={disabled}
        data-state={open ? 'open' : 'closed'}
        className={mergeClasses(styles.trigger, className)}
        onClick={() => toggle(value)}
      >
        <span className={styles.triggerLabel}>{children}</span>
        <svg
          className={styles.chevron}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </HeadingTag>
  );
}

export interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

function AccordionContent({ children, className }: AccordionContentProps) {
  const { isOpen } = useAccordionContext('Content');
  const { value, triggerId, contentId } = useAccordionItemContext('Content');
  const open = isOpen(value);

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!open}
      className={mergeClasses(styles.content, className)}
    >
      {children}
    </div>
  );
}

AccordionItem.displayName = 'Accordion.Item';
AccordionTrigger.displayName = 'Accordion.Trigger';
AccordionContent.displayName = 'Accordion.Content';

/**
 * Compound component implementing the WAI-ARIA APG "Accordion (Sections
 * With Show/Hide Functionality)" pattern. Parts are also individually
 * named-exported — see docs/SPEC.md for the compound-component convention.
 */
export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
  displayName: 'Accordion',
});

export { AccordionItem, AccordionTrigger, AccordionContent };
