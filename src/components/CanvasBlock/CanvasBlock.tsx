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
import { CanvasFillPicker } from '../CanvasFillPicker/CanvasFillPicker';
import { Document } from '../Document/Document';
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
  /**
   * A fill color was picked. Only offered — via a small trigger shown while
   * selected — for `sticky` and `shape`, the two kinds with a `color` field.
   */
  onColorChange?: (color: string) => void;
  /** A `document` block's pages changed — typing, or a page auto-added on overflow. */
  onPagesChange?: (pages: string[]) => void;
  /** A `document` block's header/footer changed — typed while editing. */
  onHeaderChange?: (header: string) => void;
  onFooterChange?: (footer: string) => void;
  /** Forwarded to text-bearing faces. Inert without an `AIProvider`. */
  aiRewrite?: boolean;
  /** Replaces the rendered face entirely, for block kinds a consumer owns. */
  renderBlock?: (block: CanvasBlockData) => ReactNode;
}

export type CanvasBlockProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> &
  CanvasBlockOwnProps;

/** `document`'s `header`/`footer` are stored as HTML strings (JSON-serializable block data), but `Document` takes them as `ReactNode` slots — this bridges the two, same trust model as the `text` block kind's own `dangerouslySetInnerHTML`. */
function RawHtml({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

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
  onPagesChange,
  onHeaderChange,
  onFooterChange,
  aiRewrite,
}: Pick<
  CanvasBlockOwnProps,
  | 'block'
  | 'editing'
  | 'onTextChange'
  | 'onEditingEnd'
  | 'onItemToggle'
  | 'onPagesChange'
  | 'onHeaderChange'
  | 'onFooterChange'
  | 'aiRewrite'
>) {
  switch (block.kind) {
    case 'sticky':
      return (
        <StickyNote
          text={block.text}
          {...(block.tone ? { tone: block.tone } : {})}
          {...(block.color ? { color: block.color } : {})}
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
          {...(block.color ? { color: block.color } : {})}
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

    case 'document': {
      // Editable header/footer is only opted into while this block is
      // actually being edited — otherwise a document with no header/footer
      // would gain an empty padded row it never had, since `headerValue`/
      // `footerValue` being set at all (even `''`) is what tells `Document`
      // to render the editable slot instead of the static `header`/`footer`
      // node.
      const editableHeaderFooter = editing
        ? { headerValue: block.header ?? '', footerValue: block.footer ?? '' }
        : {};
      return (
        <Document
          pages={block.pages}
          aspectRatio={block.aspectRatio ?? 'a4'}
          {...(block.layout ? { layout: block.layout } : {})}
          {...(block.header ? { header: <RawHtml html={block.header} /> } : {})}
          {...(block.footer ? { footer: <RawHtml html={block.footer} /> } : {})}
          {...editableHeaderFooter}
          editable={editing ?? false}
          chrome={false}
          aria-label={canvasBlockLabel(block)}
          {...(onPagesChange ? { onPagesChange } : {})}
          {...(onHeaderChange ? { onHeaderChange } : {})}
          {...(onFooterChange ? { onFooterChange } : {})}
        />
      );
    }
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
    onColorChange,
    onPagesChange,
    onHeaderChange,
    onFooterChange,
    aiRewrite = false,
    renderBlock,
    className,
    style,
    ...rest
  },
  ref,
) {
  const showFillPicker =
    selected && !editing && (block.kind === 'sticky' || block.kind === 'shape') && onColorChange;
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
      // Except for `frame`, `checklist`, and `document`, whose faces are
      // already labelled groups of their own; labelling the wrapper too
      // would announce the same name twice around nested groups that mean
      // the same thing.
      {...(block.kind === 'frame' || block.kind === 'checklist' || block.kind === 'document'
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
          {...(onPagesChange ? { onPagesChange } : {})}
          {...(onHeaderChange ? { onHeaderChange } : {})}
          {...(onFooterChange ? { onFooterChange } : {})}
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

      {/* Only offered for the two kinds with a `color` field, and only while
          selected — same "pointer-only, appears on selection" shape as the
          resize handles, marked so a press opens the popover instead of
          starting a drag. */}
      {showFillPicker && (block.kind === 'sticky' || block.kind === 'shape') && (
        <span
          className={styles.fillPicker}
          data-canvas-block-actions=""
          onPointerDown={(event) => event.stopPropagation()}
        >
          <CanvasFillPicker
            {...(block.color ? { value: block.color } : {})}
            onChange={(color) => onColorChange?.(color)}
          />
        </span>
      )}
    </div>
  );
});

CanvasBlock.displayName = 'CanvasBlock';
