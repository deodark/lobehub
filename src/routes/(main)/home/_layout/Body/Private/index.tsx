'use client';

import { AccordionItem, ContextMenuTrigger, Flexbox, Icon, Text } from '@lobehub/ui';
import { LockIcon } from 'lucide-react';
import React, { memo, Suspense, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SkeletonList from '@/features/NavPanel/components/SkeletonList';

import { useCreateMenuItems } from '../../hooks';
import Actions from '../Agent/Actions';
import { useAgentModal } from '../Agent/ModalProvider';
import PrivateList from './List';
import { usePrivateActionsDropdownMenu } from './useDropdownMenu';

interface PrivateProps {
  itemKey: string;
}

// Top-level "Private" sidebar section, structurally mirroring the Agent
// accordion. Everything created from the `+` button is hard-pinned to
// `visibility: 'private'`, so users get a predictable bucket for personal
// work without ever having to think about visibility flags.
//
// Sidebar-level controls (manage groups, move up/down, customize sidebar)
// live in the "More" dropdown so private management stays consistent with
// the workspace-public Agent section.
const Private = memo<PrivateProps>(({ itemKey }) => {
  const { t } = useTranslation('common');

  const { openConfigGroupModal } = useAgentModal();

  const { createAgentMenuItem, createGroupChatMenuItem, createSessionGroupMenuItem, isLoading } =
    useCreateMenuItems();

  const addMenuItems = useMemo(
    () => [
      createAgentMenuItem({ visibility: 'private' }),
      createGroupChatMenuItem({ visibility: 'private' }),
      { type: 'divider' as const },
      createSessionGroupMenuItem({ visibility: 'private' }),
    ],
    [createAgentMenuItem, createGroupChatMenuItem, createSessionGroupMenuItem],
  );

  const handleOpenConfigGroupModal = useCallback(() => {
    openConfigGroupModal('private');
  }, [openConfigGroupModal]);

  const dropdownMenu = usePrivateActionsDropdownMenu({
    openConfigGroupModal: handleOpenConfigGroupModal,
  });

  return (
    <AccordionItem
      itemKey={itemKey}
      paddingBlock={4}
      paddingInline={'8px 4px'}
      action={
        <Actions addMenuItems={addMenuItems} dropdownMenu={dropdownMenu} isLoading={isLoading} />
      }
      headerWrapper={(header) => (
        <ContextMenuTrigger items={dropdownMenu}>{header}</ContextMenuTrigger>
      )}
      title={
        <Flexbox horizontal align="center" gap={4}>
          <Icon icon={LockIcon} size={12} style={{ opacity: 0.5 }} />
          <Text ellipsis fontSize={12} type={'secondary'} weight={500}>
            {t('navPanel.privateAgents', { defaultValue: 'Private' })}
          </Text>
        </Flexbox>
      }
    >
      <Suspense fallback={<SkeletonList rows={3} />}>
        <PrivateList />
      </Suspense>
    </AccordionItem>
  );
});

Private.displayName = 'Private';

export default Private;
