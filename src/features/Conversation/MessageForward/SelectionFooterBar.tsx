'use client';

import { Flexbox, Icon, Text } from '@lobehub/ui';
import { Button, confirmModal } from '@lobehub/ui/base-ui';
import { App } from 'antd';
import { createStaticStyles, cssVar } from 'antd-style';
import { Forward, Trash2, X } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { messageStateSelectors, useConversationStore } from '../store';
import ForwardModal from './ForwardModal';

const styles = createStaticStyles(({ css }) => ({
  bar: css`
    padding-block: 12px;
    padding-inline: 16px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
    background: ${cssVar.colorBgContainer};
  `,
}));

/**
 * Bottom action bar that replaces the chat input while multi-selecting: reports
 * the selected count and offers Forward / Delete / Cancel. Mounted in place of
 * the composer (see {@link MessageForwardFooter}).
 */
const SelectionFooterBar = memo(() => {
  const { t } = useTranslation('chat');
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const selectedCount = useConversationStore(messageStateSelectors.selectedMessageCount);
  const selectedMessageIds = useConversationStore((s) => s.selectedMessageIds);
  const exitSelectionMode = useConversationStore((s) => s.exitSelectionMode);
  const deleteMessages = useConversationStore((s) => s.deleteMessages);

  const disabled = selectedCount === 0;

  const handleDelete = () => {
    confirmModal({
      cancelText: t('cancel', { ns: 'common' }),
      content: t('messageForward.deleteConfirm.desc', { count: selectedCount }),
      okButtonProps: { danger: true },
      okText: t('delete', { ns: 'common' }),
      onOk: async () => {
        await deleteMessages([...selectedMessageIds]);
        exitSelectionMode();
        message.success(t('messageForward.deleteConfirm.success', { count: selectedCount }));
      },
      title: t('messageForward.deleteConfirm.title'),
    });
  };

  return (
    <>
      <Flexbox horizontal align={'center'} className={styles.bar} justify={'space-between'}>
        <Text type={'secondary'}>{t('messageForward.bar.selected', { count: selectedCount })}</Text>
        <Flexbox horizontal align={'center'} gap={8}>
          <Button icon={<Icon icon={X} />} onClick={exitSelectionMode}>
            {t('messageForward.bar.cancel')}
          </Button>
          <Button danger disabled={disabled} icon={<Icon icon={Trash2} />} onClick={handleDelete}>
            {t('messageForward.bar.delete')}
          </Button>
          <Button
            disabled={disabled}
            icon={<Icon icon={Forward} />}
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

SelectionFooterBar.displayName = 'MessageForwardSelectionFooterBar';

export default SelectionFooterBar;
