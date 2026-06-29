import { Flexbox } from '@lobehub/ui';
import { MoreHorizontalIcon } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { taskDetailPath } from '@/features/AgentTasks/shared/taskDetailPath';
import NavItem from '@/features/NavPanel/components/NavItem';
import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import WorkspaceLink from '@/features/Workspace/WorkspaceLink';
import { type RecentItem } from '@/server/routers/lambda/recent';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useHomeStore } from '@/store/home';

import AllRecentsDrawer from './AllRecentsDrawer';
import RecentListItem from './Item';

const EMPTY_RECENTS: RecentItem[] = [];

interface RecentsListProps {
  recents?: RecentItem[];
}

const RecentsList = memo<RecentsListProps>(({ recents }) => {
  const { t } = useTranslation('chat');
  const recentPageSize = useGlobalStore(systemStatusSelectors.recentPageSize);
  const [drawerOpen, openDrawer, closeDrawer] = useHomeStore((s) => [
    s.allRecentsDrawerOpen,
    s.openAllRecentsDrawer,
    s.closeAllRecentsDrawer,
  ]);

  const list = recents ?? EMPTY_RECENTS;
  const displayItems = useMemo(() => list.slice(0, recentPageSize), [list, recentPageSize]);
  const hasMore = list.length > recentPageSize;

  const getRecentRoute = useCallback((item: (typeof displayItems)[number]) => {
    if (item.type !== 'task') return item.routePath;
    const taskId = item.id;
    if (!taskId) return item.routePath;

    return taskDetailPath(taskId, item.agentId ?? undefined);
  }, []);

  if (!recents) {
    return <SkeletonList rows={3} />;
  }

  return (
    <Flexbox gap={1}>
      {displayItems.map((item) => (
        <WorkspaceLink
          key={`${item.type}-${item.id}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
          to={getRecentRoute(item)}
        >
          <RecentListItem {...item} />
        </WorkspaceLink>
      ))}
      {hasMore && (
        <NavItem icon={MoreHorizontalIcon} title={t('input.more')} onClick={openDrawer} />
      )}
      <AllRecentsDrawer open={drawerOpen} onClose={closeDrawer} />
    </Flexbox>
  );
});

export default RecentsList;
