'use client';

import { Flexbox, Icon, Text } from '@lobehub/ui';
import { Button } from '@lobehub/ui/base-ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { Forward, X } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { messageStateSelectors, useConversationStore } from '../store';
import ForwardModal from './ForwardModal';

const styles = createStaticStyles(({ css }) => ({
  bar: css`
    pointer-events: none;

    position: absolute;
    z-index: 50;
    inset-block-end: 16px;
    inset-inline: 0;
  `,
  pill: css`
    pointer-events: auto;

    padding-block: 8px;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorBgElevated};
    box-shadow: ${cssVar.boxShadowSecondary};
  `,
}));

/**
 * Floating bar shown while multi-selecting messages: it reports the selected
 * count and offers Forward (opens the agent picker) / Cancel (exits the mode).
 * Renders nothing outside selection mode.
 */
const SelectionBar = memo(() => {
  const { t } = useTranslation('chat');
  const [modalOpen, setModalOpen] = useState(false);
  const isSelectionMode = useConversationStore(messageStateSelectors.isSelectionMode);
  const selectedCount = useConversationStore(messageStateSelectors.selectedMessageCount);
  const exitSelectionMode = useConversationStore((s) => s.exitSelectionMode);

  if (!isSelectionMode) return null;

  return (
    <>
      <Flexbox align={'center'} className={styles.bar} justify={'center'}>
        <Flexbox horizontal align={'center'} className={styles.pill} gap={12}>
          <Text style={{ whiteSpace: 'nowrap' }}>
            {t('messageForward.bar.selected', { count: selectedCount })}
          </Text>
          <Button icon={<Icon icon={X} />} size={'small'} onClick={exitSelectionMode}>
            {t('messageForward.bar.cancel')}
          </Button>
          <Button
            disabled={selectedCount === 0}
            icon={<Icon icon={Forward} />}
            size={'small'}
            type={'primary'}
            onClick={() => setModalOpen(true)}
          >
            {t('messageForward.bar.forward')}
          </Button>
        </Flexbox>
      </Flexbox>
      <ForwardModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
});

SelectionBar.displayName = 'MessageForwardSelectionBar';

export default SelectionBar;
