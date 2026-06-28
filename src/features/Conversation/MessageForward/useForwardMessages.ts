import { nanoid } from '@lobechat/utils';
import { App } from 'antd';
import isEqual from 'fast-deep-equal';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useNavigateToAgent } from '@/hooks/useNavigateToAgent';

import { useConversationStore } from '../store';
import { buildForwardedContent } from './forwardDispatch';
import { useForwardDispatchStore } from './forwardDispatchStore';

interface ForwardTarget {
  id: string;
  title?: string | null;
}

/**
 * Returns a callback that forwards the currently-selected messages to a target
 * agent: it serialises them into a Markdown transcript, parks it in the
 * forward-dispatch store, then navigates to the target agent where
 * {@link ForwardMessageDispatcher} sends it as the opening turn of a new topic.
 */
export const useForwardMessages = () => {
  const { t } = useTranslation('chat');
  const { message } = App.useApp();
  const navigateToAgent = useNavigateToAgent();
  const setPendingForward = useForwardDispatchStore((s) => s.setPendingForward);
  const exitSelectionMode = useConversationStore((s) => s.exitSelectionMode);

  // The conversation store is context-scoped (no global getState), so read the
  // selected messages reactively. They're frozen while the picker is open.
  const selectedMessages = useConversationStore((s) => {
    const selected = new Set(s.selectedMessageIds);
    return s.displayMessages.filter((m) => selected.has(m.id));
  }, isEqual);

  return useCallback(
    (target: ForwardTarget) => {
      if (selectedMessages.length === 0) {
        message.warning(t('messageForward.empty'));
        return;
      }

      const content = buildForwardedContent(selectedMessages, {
        header: t('messageForward.transcript.header', { count: selectedMessages.length }),
        roleLabel: (role) =>
          role === 'user' ? t('messageForward.role.user') : t('messageForward.role.assistant'),
      });

      setPendingForward({
        content,
        dispatchId: nanoid(),
        messageCount: selectedMessages.length,
        targetAgentId: target.id,
      });

      exitSelectionMode();
      navigateToAgent(target.id);

      message.success(t('messageForward.success', { title: target.title || '' }));
    },
    [t, message, navigateToAgent, setPendingForward, exitSelectionMode, selectedMessages],
  );
};
