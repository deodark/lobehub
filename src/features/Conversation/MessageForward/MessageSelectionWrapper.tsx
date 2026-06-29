'use client';

import { Flexbox } from '@lobehub/ui';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { memo, type ReactNode, useCallback } from 'react';

import { messageStateSelectors, useConversationStore } from '../store';
import { isSelectableRole } from './selectableRoles';
import SelectCircle from './SelectCircle';

const styles = createStaticStyles(({ css }) => ({
  // Content is non-interactive while selecting — the whole row is the toggle.
  content: css`
    pointer-events: none;
    flex: 1;
    min-width: 0;
  `,
  disabled: css`
    cursor: not-allowed;
    opacity: 0.4;
  `,
  // Full-width single-row band, WeChat-style: highlight spans the whole row.
  row: css`
    cursor: pointer;

    inline-size: 100%;
    padding-block: 4px;
    padding-inline: 12px;

    transition: background-color 0.1s ${cssVar.motionEaseInOut};

    &:hover {
      background-color: ${cssVar.colorFillQuaternary};
    }
  `,
  rowSelected: css`
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
 * In multi-select mode, wraps a message with a leading round checkbox and turns
 * the whole full-width row into a single toggle target (selected rows get a
 * banner highlight). Outside selection mode it renders the message untouched.
 */
const MessageSelectionWrapper = memo<MessageSelectionWrapperProps>(({ children, id, role }) => {
  const isSelectionMode = useConversationStore(messageStateSelectors.isSelectionMode);
  const isSelected = useConversationStore(messageStateSelectors.isMessageSelected(id));
  const toggleMessageSelected = useConversationStore((s) => s.toggleMessageSelected);

  const selectable = isSelectableRole(role);

  const handleToggle = useCallback(() => {
    if (!selectable) return;
    toggleMessageSelected(id);
  }, [selectable, toggleMessageSelected, id]);

  if (!isSelectionMode) return <>{children}</>;

  if (!selectable) {
    return <div className={styles.disabled}>{children}</div>;
  }

  return (
    <Flexbox
      horizontal
      align={'center'}
      className={cx(styles.row, isSelected && styles.rowSelected)}
      gap={12}
      onClick={handleToggle}
    >
      <SelectCircle checked={isSelected} />
      <div className={styles.content}>{children}</div>
    </Flexbox>
  );
});

MessageSelectionWrapper.displayName = 'MessageSelectionWrapper';

export default MessageSelectionWrapper;
