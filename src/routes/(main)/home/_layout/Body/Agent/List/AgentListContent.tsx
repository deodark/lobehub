'use client';

import { Flexbox, Icon, Text } from '@lobehub/ui';
import { LockIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { useFetchAgentList } from '@/hooks/useFetchAgentList';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';
import { SessionDefaultGroup } from '@/types/index';

import Group from './Group';
import InboxItem from './InboxItem';
import SessionList from './List';
import { useAgentList } from './useAgentList';

interface AgentListContentProps {
  onMoreClick?: () => void;
}

// Keep this drawer-free so compact switchers can reuse the list without coupling to Home drawer state.
const AgentListContent = memo<AgentListContentProps>(({ onMoreClick }) => {
  const { t } = useTranslation('common');
  const isInit = useHomeStore(homeAgentListSelectors.isAgentListInit);
  const { customList, pinnedList, defaultList, privateGroupList, privateUngroupedList } =
    useAgentList();

  useFetchAgentList();

  // Memoize computed visibility flags to prevent unnecessary recalculations
  const { showPinned, showCustom, showPrivate } = useMemo(() => {
    const hasPinned = Boolean(pinnedList?.length);
    const hasCustom = Boolean(customList?.length);
    const hasPrivate = Boolean(privateGroupList?.length || privateUngroupedList?.length);

    return {
      showCustom: hasCustom,
      showPinned: hasPinned,
      showPrivate: hasPrivate,
    };
  }, [
    pinnedList?.length,
    customList?.length,
    privateGroupList?.length,
    privateUngroupedList?.length,
  ]);

  if (!isInit) return <SkeletonList rows={6} />;

  // Always render the default SessionList so the "+ Create Agent" entry is visible
  // even when the user has only the built-in Lobe AI inbox.
  return (
    <>
      <InboxItem style={{ minHeight: 36 }} />
      {showPinned && <SessionList dataSource={pinnedList!} />}
      {showCustom && <Group dataSource={customList!} />}
      <SessionList
        dataSource={defaultList ?? []}
        groupId={SessionDefaultGroup.Default}
        onMoreClick={onMoreClick}
      />
      {showPrivate && (
        <>
          {/* Private bucket header — only renders when the workspace actually
              has any private content for the current user, so it stays out
              of the way in personal mode and for users who never created a
              private item. */}
          <Flexbox horizontal align="center" gap={4} paddingBlock={6} paddingInline={'10px 4px'}>
            <Icon icon={LockIcon} size={12} style={{ opacity: 0.5 }} />
            <Text ellipsis fontSize={12} type={'secondary'} weight={500}>
              {t('navPanel.privateAgents', { defaultValue: 'Private' })}
            </Text>
          </Flexbox>
          {(privateGroupList?.length ?? 0) > 0 && <Group dataSource={privateGroupList!} />}
          {(privateUngroupedList?.length ?? 0) > 0 && (
            <SessionList dataSource={privateUngroupedList!} />
          )}
        </>
      )}
    </>
  );
});

AgentListContent.displayName = 'AgentListContent';

export default AgentListContent;
