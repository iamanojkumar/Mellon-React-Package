import { createContext, useContext, useId } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import styles from './Tabs.module.css';

interface TabsContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
  idBase: string;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`<Tabs.${part}> must be used within <Tabs>`);
  }
  return context;
}

export interface TabsProps {
  value?: string;
  /** Which tab is selected initially. Tabs has no implicit "first tab" default — pass this or `value`. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

function TabsRoot({ value, defaultValue, onValueChange, children, className }: TabsProps) {
  const [selected, setSelected] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });
  const idBase = useId();

  return (
    <TabsContext.Provider value={{ value: selected, setValue: setSelected, idBase }}>
      <div className={mergeClasses(styles.tabs, className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

/** Arrow-key nav (Left/Right/Home/End) uses "automatic activation" — moving
 * focus also selects, per the WAI-ARIA APG Tabs pattern. */
function TabsList({ children, className }: TabsListProps) {
  const { setValue } = useTabsContext('List');

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)'),
    );
    if (tabs.length === 0) return;
    const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);

    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = tabs[nextIndex];
    if (!next) return;
    next.focus();
    const nextValue = next.dataset.value;
    if (nextValue !== undefined) setValue(nextValue);
  }

  return (
    <div
      role="tablist"
      tabIndex={-1}
      className={mergeClasses(styles.list, className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

export interface TabsTabProps {
  value: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

function TabsTab({ value, disabled = false, children, className }: TabsTabProps) {
  const { value: selected, setValue, idBase } = useTabsContext('Tab');
  const isSelected = selected === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${idBase}-tab-${value}`}
      aria-selected={isSelected}
      aria-controls={`${idBase}-panel-${value}`}
      disabled={disabled}
      tabIndex={isSelected ? 0 : -1}
      data-value={value}
      className={mergeClasses(styles.tab, className)}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

export interface TabsPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

/** Stays mounted (toggling `hidden`) rather than unmounting when not
 * selected, per the WAI-ARIA APG pattern — preserves in-panel state and
 * lets browser find-in-page reach every panel. */
function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { value: selected, idBase } = useTabsContext('Panel');
  const isSelected = selected === value;

  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${value}`}
      aria-labelledby={`${idBase}-tab-${value}`}
      hidden={!isSelected}
      tabIndex={0}
      className={mergeClasses(styles.panel, className)}
    >
      {children}
    </div>
  );
}

TabsList.displayName = 'Tabs.List';
TabsTab.displayName = 'Tabs.Tab';
TabsPanel.displayName = 'Tabs.Panel';

/**
 * Compound component: `<Tabs><Tabs.List><Tabs.Tab value="a">...</Tabs.Tab></Tabs.List><Tabs.Panel value="a">...</Tabs.Panel></Tabs>`.
 * Parts are also individually named-exported for consumers who prefer that
 * import style — see docs/SPEC.md for the compound-component convention.
 */
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
  displayName: 'Tabs',
});

export { TabsList, TabsTab, TabsPanel };
