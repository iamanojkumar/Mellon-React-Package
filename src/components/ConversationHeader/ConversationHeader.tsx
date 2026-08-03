import type { ReactNode } from 'react';
import { Heading } from '../Heading/Heading';
import { Tag } from '../Tag/Tag';
import { Badge } from '../Badge/Badge';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ConversationHeader.module.css';

export interface ConversationHeaderProps {
  title: ReactNode;
  /** Topic/category tags, rendered via `Tag`. */
  tags?: string[];
  /** e.g. `"GPT-4"`, shown as a small badge next to the tags. */
  modelUsed?: ReactNode;
  /** e.g. an `<AvatarGroup>` — this component doesn't reimplement presence display, same "accept a slot" precedent `MessageBubble`'s `avatar` prop set. */
  participants?: ReactNode;
  /** Trailing action slot (rename, share, delete, ...). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Session-level chrome above a conversation area — a `<header>` layout
 * shell, the same category `Navbar` is (no `ref` forwarding, no compound
 * context, purely presentational), just scoped to one conversation instead
 * of the whole app. `tags`/`modelUsed` compose `Tag`/`Badge` directly;
 * `participants`/`actions` are plain slots rather than baking in
 * `AvatarGroup`/`Button` opinions this component has no business making.
 */
export function ConversationHeader({
  title,
  tags,
  modelUsed,
  participants,
  actions,
  className,
}: ConversationHeaderProps) {
  const hasMeta = modelUsed !== undefined || (tags && tags.length > 0);

  return (
    <header className={mergeClasses(styles.header, className)}>
      <div className={styles.main}>
        <Heading level={2} className={styles.title}>
          {title}
        </Heading>
        {hasMeta && (
          <div className={styles.meta}>
            {modelUsed !== undefined && (
              <Badge color="neutral" variant="subtle">
                {modelUsed}
              </Badge>
            )}
            {tags?.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>
      {(participants !== undefined || actions !== undefined) && (
        <div className={styles.side}>
          {participants}
          {actions}
        </div>
      )}
    </header>
  );
}

ConversationHeader.displayName = 'ConversationHeader';
