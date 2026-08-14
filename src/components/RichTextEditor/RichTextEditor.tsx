import { forwardRef, useEffect, useRef, useState, useId } from 'react';
import type { ComponentPropsWithoutRef, FocusEvent, FormEvent } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { Button } from '../Button/Button';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { Popover } from '../Popover/Popover';
import inputStyles from '../Input/Input.module.css';
import styles from './RichTextEditor.module.css';

export interface RichTextEditorOwnProps {
  /** Controlled value, as an HTML string. */
  value?: string;
  /** Initial value for uncontrolled usage, as an HTML string. */
  defaultValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export type RichTextEditorProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'onChange' | 'defaultValue' | 'children' | 'contentEditable'
> &
  RichTextEditorOwnProps;

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
}

const emptyFormatState: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  insertUnorderedList: false,
  insertOrderedList: false,
};

function BoldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path d="M7 5h6.5a3.5 3.5 0 0 1 0 7H7zM7 12h7.5a3.5 3.5 0 0 1 0 7H7z" fill="currentColor" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path
        d="M10 5h7M7 19h7M14 5l-4 14"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path
        d="M6 4v7a6 6 0 0 0 12 0V4M4 20h16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BulletedListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
      <path
        d="M9 6h11M9 12h11M9 18h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NumberedListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <text x="0" y="8" fontSize="6" fill="currentColor">
        1.
      </text>
      <text x="0" y="14" fontSize="6" fill="currentColor">
        2.
      </text>
      <text x="0" y="20" fontSize="6" fill="currentColor">
        3.
      </text>
      <path
        d="M9 6h11M9 12h11M9 18h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path
        d="M10 14a4 4 0 0 0 5.66 0l2-2a4 4 0 1 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-2 2a4 4 0 1 0 5.66 5.66l1-1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A minimal WYSIWYG editor: bold/italic/underline, bulleted/numbered lists,
 * and link insertion over a `contentEditable` surface, with `value`/
 * `onChange` exchanging HTML strings (same controlled/uncontrolled shape as
 * every other form control here). Built directly on `document.execCommand`
 * rather than pulling in a rich-text engine (ProseMirror/Slate/TipTap) —
 * those are a different order of dependency weight than anything else in
 * this library, and the minimal formatting set this component targets
 * doesn't need one.
 *
 * The DOM, not React, owns the `contentEditable` element's children —
 * `value` is only written back into it when it changes from *outside*
 * (tracked via `lastEmittedRef`), never on every render, since re-writing
 * `innerHTML` to the same content on every keystroke would reset the
 * caret. This is the same technique the (unmaintained) `react-
 * contenteditable` package popularized.
 *
 * Toolbar buttons `onMouseDown={(e) => e.preventDefault()}` to stop the
 * click from shifting DOM focus away from the editable surface — without
 * that, clicking "Bold" would collapse the text selection before
 * `execCommand('bold')` ever runs. The link popover's URL input is the one
 * place focus *is* allowed to move (the user needs to type into it), so the
 * editable's `onBlur` saves the live `Range` beforehand; applying the link
 * restores that range immediately before `execCommand('createLink', ...)`.
 */
export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    {
      className,
      value: valueProp,
      defaultValue,
      onChange,
      placeholder,
      invalid,
      disabled,
      readOnly = false,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      ...rest
    },
    ref,
  ) {
    const field = useFieldContext();
    const generatedId = useId();
    const resolvedId = id ?? field?.id ?? generatedId;
    const resolvedInvalid = invalid ?? field?.invalid ?? false;
    const resolvedDisabled = disabled ?? field?.disabled ?? false;
    const isInteractive = !resolvedDisabled && !readOnly;

    const editableRef = useRef<HTMLDivElement>(null);
    const lastEmittedRef = useRef<string | undefined>(undefined);
    const savedRangeRef = useRef<Range | null>(null);
    const linkInputRef = useRef<HTMLInputElement>(null);

    const [value, setValue] = useControllableState<string>({
      value: valueProp,
      defaultValue: defaultValue ?? '',
      onChange,
    });
    const [active, setActive] = useState<FormatState>(emptyFormatState);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarActiveIndex, setToolbarActiveIndex] = useState(0);

    useEffect(() => {
      const node = editableRef.current;
      if (!node) return;
      if (value === lastEmittedRef.current) return;
      node.innerHTML = value ?? '';
    }, [value]);

    useEffect(() => {
      if (linkOpen) {
        setLinkUrl('');
        linkInputRef.current?.focus();
      }
    }, [linkOpen]);

    function updateActiveFormats() {
      if (typeof document.queryCommandState !== 'function') return;
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    }

    function emitChange() {
      const html = editableRef.current?.innerHTML ?? '';
      lastEmittedRef.current = html;
      setValue(html);
    }

    function exec(command: string) {
      if (!isInteractive) return;
      editableRef.current?.focus();
      document.execCommand(command);
      emitChange();
      updateActiveFormats();
    }

    function handleInput(event: FormEvent<HTMLDivElement>) {
      lastEmittedRef.current = event.currentTarget.innerHTML;
      setValue(event.currentTarget.innerHTML);
    }

    function handleBlur() {
      const selection = window.getSelection();
      const node = editableRef.current;
      if (selection && selection.rangeCount > 0 && node?.contains(selection.anchorNode)) {
        savedRangeRef.current = selection.getRangeAt(0).cloneRange();
      }
    }

    function applyLink(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const url = linkUrl.trim();
      if (!url) return;
      const node = editableRef.current;
      const selection = window.getSelection();
      if (node && selection && savedRangeRef.current) {
        node.focus();
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
      document.execCommand('createLink', false, url);
      emitChange();
      setLinkOpen(false);
    }

    const handleToolbarKeyDown = useRovingFocus({
      itemSelector: '[data-rte-action]',
      orientation: 'horizontal',
    });

    function handleToolbarFocus(event: FocusEvent<HTMLDivElement>) {
      const items = Array.from(
        toolbarRef.current?.querySelectorAll<HTMLElement>('[data-rte-action]') ?? [],
      );
      const index = items.indexOf(event.target);
      if (index !== -1) setToolbarActiveIndex(index);
    }

    let toolbarItemIndex = -1;
    function nextToolbarTabIndex() {
      toolbarItemIndex += 1;
      return toolbarItemIndex === toolbarActiveIndex ? 0 : -1;
    }

    const isEmpty = !value || value === '<br>';

    return (
      <div
        className={mergeClasses(styles.root, className)}
        data-disabled={resolvedDisabled || undefined}
        {...rest}
      >
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Text formatting"
          className={styles.toolbar}
          onKeyDown={handleToolbarKeyDown}
          onFocus={handleToolbarFocus}
        >
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Bold"
            data-rte-action=""
            tabIndex={nextToolbarTabIndex()}
            pressed={active.bold}
            onPressedChange={() => exec('bold')}
            onMouseDown={(event) => event.preventDefault()}
            disabled={!isInteractive}
          >
            <BoldIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Italic"
            data-rte-action=""
            tabIndex={nextToolbarTabIndex()}
            pressed={active.italic}
            onPressedChange={() => exec('italic')}
            onMouseDown={(event) => event.preventDefault()}
            disabled={!isInteractive}
          >
            <ItalicIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Underline"
            data-rte-action=""
            tabIndex={nextToolbarTabIndex()}
            pressed={active.underline}
            onPressedChange={() => exec('underline')}
            onMouseDown={(event) => event.preventDefault()}
            disabled={!isInteractive}
          >
            <UnderlineIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Bulleted list"
            data-rte-action=""
            tabIndex={nextToolbarTabIndex()}
            pressed={active.insertUnorderedList}
            onPressedChange={() => exec('insertUnorderedList')}
            onMouseDown={(event) => event.preventDefault()}
            disabled={!isInteractive}
          >
            <BulletedListIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Numbered list"
            data-rte-action=""
            tabIndex={nextToolbarTabIndex()}
            pressed={active.insertOrderedList}
            onPressedChange={() => exec('insertOrderedList')}
            onMouseDown={(event) => event.preventDefault()}
            disabled={!isInteractive}
          >
            <NumberedListIcon />
          </ToggleButton>
          <Popover open={linkOpen} onOpenChange={setLinkOpen}>
            <Popover.Trigger
              className={mergeClasses(styles.linkTrigger)}
              data-rte-action=""
              tabIndex={nextToolbarTabIndex()}
              aria-label="Insert link"
              disabled={!isInteractive}
              onMouseDown={(event) => event.preventDefault()}
            >
              <LinkIcon />
            </Popover.Trigger>
            <Popover.Content role="dialog" className={styles.linkPopover}>
              <form onSubmit={applyLink} className={styles.linkForm}>
                <input
                  ref={linkInputRef}
                  type="url"
                  className={inputStyles.input}
                  data-size="sm"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  aria-label="Link URL"
                />
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </form>
            </Popover.Content>
          </Popover>
        </div>
        <div
          ref={mergeRefs(editableRef, ref)}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={field?.describedById}
          aria-invalid={resolvedInvalid || undefined}
          aria-disabled={resolvedDisabled || undefined}
          aria-readonly={readOnly || undefined}
          id={resolvedId}
          tabIndex={isInteractive ? 0 : -1}
          contentEditable={isInteractive}
          suppressContentEditableWarning
          data-invalid={resolvedInvalid || undefined}
          data-disabled={resolvedDisabled || undefined}
          data-empty={isEmpty || undefined}
          data-placeholder={placeholder}
          className={mergeClasses(inputStyles.input, styles.editable)}
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onFocus={updateActiveFormats}
        />
      </div>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';
