'use client';

import { Flexbox, Icon, SearchBar, Text } from '@lobehub/ui';
import { Button, Modal } from '@lobehub/ui/base-ui';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { Forward } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFetchAgentList } from '@/hooks/useFetchAgentList';
import AgentAvatar from '@/routes/(main)/home/_layout/Body/Agent/List/AgentItem/Avatar';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

import { contextSelectors, useConversationStore } from '../store';
import SelectCircle from './SelectCircle';
import { type ForwardTarget, useForwardMessages } from './useForwardMessages';

const styles = createStaticStyles(({ css }) => ({
  preview: css`
    overflow: hidden;

    padding-block: 10px;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorFillQuaternary};
  `,
  previewBody: css`
    overflow: hidden;
    color: ${cssVar.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  row: css`
    cursor: pointer;

    padding-block: 6px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadiusLG};

    transition: background-color 0.1s ${cssVar.motionEaseInOut};

    &:hover {
      background-color: ${cssVar.colorFillTertiary};
    }
  `,
  rowSelected: css`
    background-color: ${cssVar.colorFillSecondary};
  `,
}));

interface ForwardModalProps {
  onClose: () => void;
  open: boolean;
}

const ForwardModal = memo<ForwardModalProps>(({ open, onClose }) => {
  const { t } = useTranslation('chat');
  const [keyword, setKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const currentAgentId = useConversationStore(contextSelectors.agentId);
  const agents = useHomeStore(homeAgentListSelectors.allAgents);
  const forwardMessages = useForwardMessages();

  // Compact preview of what's being forwarded (count + first message snippet).
  const preview = useConversationStore((s) => {
    const selected = new Set(s.selectedMessageIds);
    const msgs = s.displayMessages.filter((m) => selected.has(m.id));
    return { count: msgs.length, snippet: msgs[0]?.content?.slice(0, 80) ?? '' };
  }, isEqual);

  useFetchAgentList();

  const candidates = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    return agents
      .filter((agent) => agent.type === 'agent' && agent.id !== currentAgentId)
      .filter((agent) => !trimmed || (agent.title || '').toLowerCase().includes(trimmed));
  }, [agents, currentAgentId, keyword]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleClose = () => {
    setSelectedIds([]);
    setKeyword('');
    onClose();
  };

  const handleForward = () => {
    const targets: ForwardTarget[] = selectedIds
      .map((id) => agents.find((a) => a.id === id))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map((a) => ({ id: a.id, title: a.title }));
    if (targets.length === 0) return;
    forwardMessages(targets);
    handleClose();
  };

  return (
    <Modal
      destroyOnHidden
      footer={null}
      open={open}
      title={t('messageForward.modal.title')}
      width={460}
      onCancel={handleClose}
    >
      <Flexbox gap={12}>
        <Flexbox className={styles.preview} gap={2}>
          <Text style={{ fontSize: 12 }} type={'secondary'}>
            {t('messageForward.transcript.header', { count: preview.count })}
          </Text>
          {preview.snippet && <div className={styles.previewBody}>{preview.snippet}</div>}
        </Flexbox>
        <SearchBar
          allowClear
          placeholder={t('messageForward.modal.searchPlaceholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Flexbox gap={2} style={{ maxHeight: '42vh', minHeight: 120, overflowY: 'auto' }}>
          {candidates.length === 0 ? (
            <Flexbox align={'center'} justify={'center'} padding={24}>
              <Text type={'secondary'}>{t('messageForward.modal.empty')}</Text>
            </Flexbox>
          ) : (
            candidates.map((agent) => {
              const checked = selectedIds.includes(agent.id);
              return (
                <Flexbox
                  horizontal
                  align={'center'}
                  className={cx(styles.row, checked && styles.rowSelected)}
                  gap={10}
                  key={agent.id}
                  onClick={() => toggle(agent.id)}
                >
                  <SelectCircle checked={checked} />
                  <AgentAvatar
                    avatar={typeof agent.avatar === 'string' ? agent.avatar : undefined}
                  />
                  <Text ellipsis style={{ flex: 1 }}>
                    {agent.title || t('untitledAgent')}
                  </Text>
                </Flexbox>
              );
            })
          )}
        </Flexbox>
        <Button
          block
          disabled={selectedIds.length === 0}
          icon={<Icon icon={Forward} />}
          type={'primary'}
          onClick={handleForward}
        >
          {selectedIds.length > 0
            ? t('messageForward.modal.sendCount', { count: selectedIds.length })
            : t('messageForward.bar.forward')}
        </Button>
      </Flexbox>
    </Modal>
  );
});

ForwardModal.displayName = 'ForwardModal';

export default ForwardModal;
