'use client';

import { Flexbox, SearchBar, Text } from '@lobehub/ui';
import { Modal } from '@lobehub/ui/base-ui';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AgentItem from '@/features/PageEditor/Copilot/AgentSelector/AgentItem';
import { useFetchAgentList } from '@/hooks/useFetchAgentList';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

import { contextSelectors, useConversationStore } from '../store';
import { useForwardMessages } from './useForwardMessages';

interface ForwardModalProps {
  onClose: () => void;
  open: boolean;
}

const ForwardModal = memo<ForwardModalProps>(({ open, onClose }) => {
  const { t } = useTranslation('chat');
  const [keyword, setKeyword] = useState('');
  const currentAgentId = useConversationStore(contextSelectors.agentId);
  const agents = useHomeStore(homeAgentListSelectors.allAgents);
  const forwardMessages = useForwardMessages();

  useFetchAgentList();

  const candidates = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    return agents
      .filter((agent) => agent.type === 'agent' && agent.id !== currentAgentId)
      .filter((agent) => !trimmed || (agent.title || '').toLowerCase().includes(trimmed));
  }, [agents, currentAgentId, keyword]);

  return (
    <Modal
      destroyOnHidden
      footer={null}
      open={open}
      title={t('messageForward.modal.title')}
      width={420}
      onCancel={onClose}
    >
      <Flexbox gap={12}>
        <SearchBar
          allowClear
          placeholder={t('messageForward.modal.searchPlaceholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Flexbox gap={2} style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {candidates.length === 0 ? (
            <Flexbox align={'center'} justify={'center'} padding={24}>
              <Text type={'secondary'}>{t('messageForward.modal.empty')}</Text>
            </Flexbox>
          ) : (
            candidates.map((agent) => (
              <AgentItem
                active={false}
                agentId={agent.id}
                agentTitle={agent.title || t('untitledAgent')}
                avatar={agent.avatar}
                heterogeneousType={agent.heterogeneousType}
                key={agent.id}
                onAgentChange={(id) => forwardMessages({ id, title: agent.title })}
                onClose={onClose}
              />
            ))
          )}
        </Flexbox>
      </Flexbox>
    </Modal>
  );
});

ForwardModal.displayName = 'ForwardModal';

export default ForwardModal;
