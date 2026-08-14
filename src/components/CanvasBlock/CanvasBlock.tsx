import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, PointerEvent, ReactNode } from 'react';
import { StickyNote } from '../StickyNote/StickyNote';
import { CanvasShape } from '../CanvasShape/CanvasShape';
import { CanvasEmbed } from '../CanvasEmbed/CanvasEmbed';
import { CanvasFrame } from '../CanvasFrame/CanvasFrame';
import { Image } from '../Image/Image';
import { Divider } from '../Divider/Divider';
import { Code } from '../Code/Code';
import { Table } from '../Table/Table';
import { Link } from '../Link/Link';
import { ChartSurface } from '../ChartSurface/ChartSurface';
import { CanvasChecklist } from '../CanvasChecklist/CanvasChecklist';
import { mergeClasses } from '../../utilities/mergeClasses';
import { canvasBlockLabel } from '../../utilities/canvasReducer';
import type { CanvasBlockData } from '../../utilities/canvasReducer';
import styles from './CanvasBlock.module.css';

/** The eight handles around a selected block. */
export const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
export type CanvasResizeHandle = (typeof RESIZE_HANDLES)[number];

export interface CanvasBlockOwnProps {
  block: CanvasBlockData;
  selected?: boolean;
  /** Called out by an AI answer. An annotation — the block has not been changed. */
  highlighted?: boolean;
  /** This block's text is being edited, so pointer gestures belong to the editor. */
  editing?: boolean;
  /** Renders resize handles. The canvas owns the drag itself. */
  resizable?: boolean;
  onResizeStart?: (event: PointerEvent, handle: CanvasResizeHandle) => void;
  onTextChange?: (text: string) => void;
  onEditingEnd?: () => void;
  /** A checklist item was ticked. The canvas turns it into an `update` command. */
  onItemToggle?: (itemId: string, done: boolean) => void;
  /** Forwarded to text-bearing faces. Inert without an `AIProvider`. */
  aiRewrite?: boolean;
  /** Replaces the rendered face entirely, for block kinds a consumer owns. */
  renderBlock?: (block: CanvasBlockData) => ReactNode;
}

export type CanvasBlockProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> &
  CanvasBlockOwnProps;

/**
 * Renders one block's face for its kind. A kind gets its own component only
 * when it's genuinely new; `text`, `image` and `divider` are pure delegation to
 * `RichTextEditor`-shaped HTML, `Image` and `Divider`, so giving them wrapper
 * folders would add files without adding behaviour.
 */
function BlockFace({
  block,
  editing,
  onTextChange,
  onEditingEnd,
  onItemToggle,
  aiRewrite,
}: Pick<
  CanvasBlockOwnProps,
  'block' | 'editing' | 'onTextChange' | 'onEditingEnd' | 'onItemToggle' | 'aiRewrite'
>) {
  switch (block.kind) {
    case 'sticky':
      return (
        <StickyNote
          text={block.text}
          {...(block.tone ? { tone: block.tone } : {})}
          editing={editing ?? false}
          aiRewrite={aiRewrite ?? false}
          {...(onTextChange ? { onTextChange } : {})}
          {...(onEditingEnd ? { onEditingEnd } : {})}
        />
      );

    case 'shape':
      return (
        <CanvasShape
          shape={block.shape}
          {...(block.text ? { text: block.text } : {})}
          {...(block.tone ? { tone: block.tone } : {})}
        />
      );

    case 'embed':
      return (
        <CanvasEmbed
          title={block.title}
          {...(block.url ? { url: block.url } : {})}
          {...(block.html ? { html: block.html } : {})}
        />
      );

    case 'frame':
      return <CanvasFrame title={block.title} {...(block.tone ? { tone: block.tone } : {})} />;

    case 'image':
      return <Image className={styles.image} src={block.src} alt={block.alt} fit="cover" />;

    case 'divider':
      return (
        <div className={styles.divider}>
          <Divider orientation={block.orientation ?? 'horizontal'} />
        </div>
      );

    case 'text':
      // Rendered as HTML the consumer already owns and trusts — the same value
      // `RichTextEditor` round-trips. Untrusted markup belongs in `embed`,
      // which sandboxes it.
      return <div className={styles.richText} dangerouslySetInnerHTML={{ __html: block.html }} />;

    case 'code':
      return (
        <div className={styles.code}>
          <Code block>{block.code}</Code>
          {block.language && <span className={styles.codeLanguage}>{block.language}</span>}
        </div>
      );

    case 'table':
      return (
        <div className={styles.table}>
          <Table>
            {block.caption && <caption className={styles.tableCaption}>{block.caption}</caption>}
            <Table.Head>
              <Table.Row>
                {block.columns.map((column, index) => (
                  <Table.HeaderCell key={`${column}-${index}`}>{column}</Table.HeaderCell>
                ))}
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {block.rows.map((row, rowIndex) => (
                <Table.Row key={rowIndex}>
                  {/* Indexed off the columns, not the row: a short row becomes
                      empty cells instead of a ragged grid the header no longer
                      lines up with. */}
                  {block.columns.map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>{row[cellIndex] ?? ''}</Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      );

    case 'link':
      return (
        <div className={styles.link}>
          {/* `rel` is not optional: a canvas link is usually somebody else's
              URL, and `noopener` is what stops the opened page reaching back
              through `window.opener`. */}
          <Link
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkTitle}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {block.title || block.url}
          </Link>
          {block.description && <p className={styles.linkDescription}>{block.description}</p>}
          <span className={styles.linkUrl}>{block.url}</span>
        </div>
      );

    case 'checklist':
      return (
        <CanvasChecklist
          items={block.items}
          {...(block.title ? { title: block.title } : {})}
          {...(onItemToggle ? { onItemToggle } : {})}
        />
      );

    case 'chart':
      return (
        <div className={styles.chart}>
          <ChartSurface
            label={block.label}
            data={block.data}
            {...(block.chartType ? { type: block.chartType } : {})}
          />
        </div>
      );
  }
}

/**
 * The positioned, selectable, resizable wrapper every block sits in.
 *
 * Position comes from the block's own canvas coordinates and nothing else —
 * the viewport transform lives on an ancestor, so this element never needs to
 * know about pan or zoom.
 *
 * It is a real focusable DOM node, which is the whole reason this canvas is
 * built from DOM rather than a `<canvas>`: blocks stay in the accessibility
 * tree, keyboard-reachable, and styled by the same tokens as everything else.
 */
export const CanvasBlock = forwardRef<HTMLDivElement, CanvasBlockProps>(function CanvasBlock(
  {
    block,
    selected = false,
    highlighted = false,
    editing = false,
    resizable = false,
    onResizeStart,
    onTextChange,
    onEditingEnd,
    onItemToggle,
    aiRewrite = false,
    renderBlock,
    className,
    style,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={mergeClasses(styles.block, className)}
      style={{
        transform: `translate(${block.x}px, ${block.y}px)`,
        width: block.width,
        height: block.height,
        ...style,
      }}
      data-kind={block.kind}
      data-selected={selected ? '' : undefined}
      data-highlighted={highlighted ? '' : undefined}
      data-editing={editing ? '' : undefined}
      // A labelled group rather than a bare div: an `aria-label` on a roleless
      // element is ignored by most screen readers, and on a canvas the block
      // boundary is genuinely useful — you need to know where one ends and the
      // next begins.
      //
      // Except for `frame` and `checklist`, whose faces are already labelled
      // groups of their own; labelling the wrapper too would announce the same
      // name twice around nested groups that mean the same thing.
      {...(block.kind === 'frame' || block.kind === 'checklist'
        ? {}
        : {
            role: 'group',
            'aria-label': canvasBlockLabel(block),
            'aria-roledescription': 'Canvas block',
          })}
      {...rest}
    >
      {renderBlock ? (
        renderBlock(block)
      ) : (
        <BlockFace
          block={block}
          editing={editing}
          aiRewrite={aiRewrite}
          {...(onTextChange ? { onTextChange } : {})}
          {...(onEditingEnd ? { onEditingEnd } : {})}
          {...(onItemToggle ? { onItemToggle } : {})}
        />
      )}

      {/* Pointer-only affordance: keyboard resizing is Shift+arrows on the
          block itself, so the handles add nothing for a keyboard user and
          would only add eight tab stops per block. */}
      {resizable && selected && (
        <span aria-hidden="true" className={styles.handles} data-canvas-resize-handles="">
          {RESIZE_HANDLES.map((handle) => (
            <span
              key={handle}
              className={styles.handle}
              data-handle={handle}
              onPointerDown={(event) => onResizeStart?.(event, handle)}
            />
          ))}
        </span>
      )}
    </div>
  );
});

CanvasBlock.displayName = 'CanvasBlock';
