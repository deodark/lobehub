'use client';

import { Flexbox } from '@lobehub/ui';
import { Checkbox } from 'antd';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { memo, type ReactNode, useCallback } from 'react';

import { messageStateSelectors, useConversationStore } from '../store';

/**
 * Roles that carry forwardable text. Tool calls, tasks, verify cards etc. are
 * not meaningful as standalone forwarded context, so they stay un-selectable.
 */
const SELECTABLE_ROLES = new Set(['user', 'assistant', 'assistantGroup']);

const styles = createStaticStyles(({ css }) => ({
  checkbox: css`
    flex: none;
    padding-block-start: 4px;
  `,
  content: css`
    flex: 1;
    min-width: 0;
  `,
  // Content is non-interactive while selecting — the whole row is the toggle.
  contentBlocked: css`
    pointer-events: none;
  `,
  disabled: css`
    cursor: not-allowed;
    opacity: 0.4;
  `,
  selectable: css`
    cursor: pointer;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadiusLG};
    transition: background-color 0.1s ${cssVar.motionEaseInOut};

    &:hover {
      background-color: ${cssVar.colorFillTertiary};
    }
  `,
  selected: css`
    background-color: ${cssVar.colorFillSecondary};

    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
}));

interface MessageSelectionWrapperProps {
  children: ReactNode;
  id: string;
  role?: string;
}

/**
 * In multi-select mode, wraps a message with a leading checkbox and turns the
 * whole row into a single toggle target. Outside selection mode it renders the
 * message untouched.
 */
const MessageSelectionWrapper = memo<MessageSelectionWrapperProps>(({ children, id, role }) => {
  const isSelectionMode = useConversationStore(messageStateSelectors.isSelectionMode);
  const isSelected = useConversationStore(messageStateSelectors.isMessageSelected(id));
  const toggleMessageSelected = useConversationStore((s) => s.toggleMessageSelected);

  const isSelectable = !!role && SELECTABLE_ROLES.has(role);

  const handleToggle = useCallback(() => {
    if (!isSelectable) return;
    toggleMessageSelected(id);
  }, [isSelectable, toggleMessageSelected, id]);

  if (!isSelectionMode) return <>{children}</>;

  if (!isSelectable) {
    return <div className={styles.disabled}>{children}</div>;
  }

  return (
    <Flexbox
      horizontal
      align={'flex-start'}
      className={cx(styles.selectable, isSelected && styles.selected)}
      gap={8}
      onClick={handleToggle}
    >
      <Checkbox checked={isSelected} className={styles.checkbox} />
      <div className={cx(styles.content, styles.contentBlocked)}>{children}</div>
    </Flexbox>
  );
});

MessageSelectionWrapper.displayName = 'MessageSelectionWrapper';

export default MessageSelectionWrapper;
