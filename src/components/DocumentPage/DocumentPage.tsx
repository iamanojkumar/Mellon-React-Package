import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Card } from '../Card/Card';
import { Grid } from '../Grid/Grid';
import { mergeClasses } from '../../utilities/mergeClasses';
import { documentAspectRatioCss } from '../../utilities/documentAspectRatio';
import type { DocumentAspectRatio } from '../../utilities/documentAspectRatio';
import styles from './DocumentPage.module.css';

export type DocumentPageLayout = 'single' | 'two-column' | 'sidebar';

export interface DocumentPageOwnProps {
  /** Defaults to `'a4'`. Named presets plus a custom `{width, height}` ratio. */
  aspectRatio?: DocumentAspectRatio;
  children?: ReactNode;
}

export type DocumentPageProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  DocumentPageOwnProps;

/**
 * One page's surface: a fixed-aspect-ratio "sheet of paper" reusing `Card`
 * for its box (border/shadow/radius) rather than duplicating that styling.
 * Structural only — `Header`/`Body`/`Footer` are the same optional-parts
 * shape `Dialog` already establishes, so a page with no header/footer is
 * just `<DocumentPage><DocumentPage.Body>...</DocumentPage.Body></DocumentPage>`.
 *
 * `overflow: hidden` on the root and on `Body` is deliberate: a page is a
 * fixed box, and content past its bottom is a `Document`-level concern
 * (auto-pagination), not something this component clips visually itself by
 * growing — growing would defeat the fixed aspect ratio entirely.
 */
const DocumentPageRoot = forwardRef<HTMLDivElement, DocumentPageProps>(function DocumentPage(
  { aspectRatio = 'a4', className, style, children, ...rest },
  ref,
) {
  return (
    <Card
      ref={ref}
      variant="outlined"
      padding="none"
      className={mergeClasses(styles.page, className)}
      style={{ aspectRatio: documentAspectRatioCss(aspectRatio), ...style }}
      {...rest}
    >
      {children}
    </Card>
  );
});

export interface DocumentPageHeaderProps {
  children?: ReactNode;
  className?: string;
}

function DocumentPageHeader({ children, className }: DocumentPageHeaderProps) {
  return <div className={mergeClasses(styles.header, className)}>{children}</div>;
}

export interface DocumentPageBodyProps {
  /**
   * Arranges `children` within the body. `'single'` (default) is plain flow
   * — a `Grid` wrapper only appears for the presets that need one, so a
   * single-column page's markup stays exactly what it would be without this
   * prop at all. New presets are additive here, the same "named union, room
   * to grow" shape `aspectRatio` uses.
   */
  layout?: DocumentPageLayout;
  children?: ReactNode;
  className?: string;
}

/**
 * Forwards its ref to the actual measurable box (fixed height, clipped
 * overflow) — `Document`'s auto-pagination reads this node's
 * `scrollHeight` vs `clientHeight` to tell whether a page's content has
 * outgrown it.
 */
const DocumentPageBody = forwardRef<HTMLDivElement, DocumentPageBodyProps>(
  function DocumentPageBody({ layout = 'single', children, className }, ref) {
    if (layout === 'single') {
      return (
        <div ref={ref} className={mergeClasses(styles.body, className)}>
          {children}
        </div>
      );
    }

    return (
      <div ref={ref} className={mergeClasses(styles.body, className)}>
        <Grid
          columns={layout === 'sidebar' ? '1fr 2fr' : 2}
          gap="lg"
          className={styles.bodyGrid}
          data-layout={layout}
        >
          {children}
        </Grid>
      </div>
    );
  },
);

export interface DocumentPageFooterProps {
  children?: ReactNode;
  className?: string;
}

function DocumentPageFooter({ children, className }: DocumentPageFooterProps) {
  return <div className={mergeClasses(styles.footer, className)}>{children}</div>;
}

DocumentPageRoot.displayName = 'DocumentPage';
DocumentPageHeader.displayName = 'DocumentPage.Header';
DocumentPageBody.displayName = 'DocumentPage.Body';
DocumentPageFooter.displayName = 'DocumentPage.Footer';

/**
 * Compound: `<DocumentPage><DocumentPage.Header/><DocumentPage.Body layout="sidebar"/><DocumentPage.Footer/></DocumentPage>`.
 * Parts are also individually named-exported — see docs/SPEC.md's
 * compound-component convention.
 */
export const DocumentPage = Object.assign(DocumentPageRoot, {
  Header: DocumentPageHeader,
  Body: DocumentPageBody,
  Footer: DocumentPageFooter,
  displayName: 'DocumentPage',
});

export { DocumentPageHeader, DocumentPageBody, DocumentPageFooter };
