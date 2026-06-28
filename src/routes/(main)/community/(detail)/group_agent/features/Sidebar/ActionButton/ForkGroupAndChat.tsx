'use client';

import { Button } from '@lobehub/ui';
import { SplitButton } from '@lobehub/ui/base-ui';
import { App } from 'antd';
import { createStaticStyles } from 'antd-style';
import { customAlphabet } from 'nanoid/non-secure';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import urlJoin from 'url-join';

import { useActiveWorkspace } from '@/business/client/hooks/useActiveWorkspace';
import { useActiveWorkspaceId } from '@/business/client/hooks/useActiveWorkspaceId';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { usePermission } from '@/hooks/usePermission';
import { useMarketAuth } from '@/layout/AuthProvider/MarketAuth';
import { lambdaClient } from '@/libs/trpc/client';
import { chatGroupService } from '@/services/chatGroup';
import { discoverService } from '@/services/discover';
import { marketApiService } from '@/services/marketApi';
import { useAgentGroupStore } from '@/store/agentGroup';

import {
  isMarketOrgSetupRequiredError,
  promptMarketOrgSetup,
} from '../../../../../utils/marketOrgSetup';
import { useDetailContext } from '../../DetailProvider';

const styles = createStaticStyles(({ css }) => ({
  buttonGroup: css`
    width: 100%;
  `,
}));

/**
 * Generate a market identifier (8-character lowercase alphanumeric string)
 */
const generateMarketIdentifier = () => {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const generate = customAlphabet(alphabet, 8);
  return generate();
};

type ForkTarget = 'private' | 'public';

const ForkGroupAndChat = memo<{ mobile?: boolean }>(() => {
  const {
    avatar,
    backgroundColor,
    description,
    tags,
    title,
    config,
    identifier,
    memberAgents = [],
  } = useDetailContext();
  const [isLoading, setIsLoading] = useState(false);
  const { message } = App.useApp();
  const { t } = useTranslation('discover');
  const navigate = useWorkspaceAwareNavigate();
  const loadGroups = useAgentGroupStore((s) => s.loadGroups);
  const { isAuthenticated, signIn } = useMarketAuth();
  const { allowed: canCreate } = usePermission('create_content');
  const activeWorkspaceId = useActiveWorkspaceId();
  const activeWorkspace = useActiveWorkspace();
  const isWorkspaceOwner = activeWorkspace?.role === 'owner';

  const meta = {
    avatar,
    backgroundColor,
    description,
    tags,
    title,
  };

  const handleForkAndChat = async (target: ForkTarget = 'private') => {
    if (!canCreate) return;
    // Check if user is authenticated
    if (!isAuthenticated) {
      try {
        await signIn();
      } catch {
        return;
      }
    }

    try {
      setIsLoading(true);

      // Step 1: Check if user has already forked this group
      const existingGroupId = await chatGroupService.getGroupByForkedFromIdentifier(identifier!);

      if (existingGroupId) {
        // User has already forked this group, navigate to existing fork
        message.info(t('fork.alreadyForked'));
        navigate(urlJoin('/group', existingGroupId));
        return;
      }

      if (!config) {
        message.error(
          t('groupAgents.noConfig', { defaultValue: 'Group configuration not available' }),
        );
        return;
      }

      // Generate a unique identifier for the forked group
      const newIdentifier = generateMarketIdentifier();

      // Same rationale as ForkAndChat.tsx — workspace forks must carry an
      // org `actAs` so Market accepts the request; the local chat group
      // still lands in the user's Private bucket via `visibility: 'private'`
      // on the groupConfig below. When the workspace has no Community
      // profile yet we prompt the user (role-aware) and abort the fork.
      let actAs: number | undefined;
      if (activeWorkspaceId) {
        try {
          const { marketAccountId } =
            await lambdaClient.workspace.ensureMarketOrganization.mutate();
          actAs = marketAccountId;
        } catch (error) {
          if (isMarketOrgSetupRequiredError(error)) {
            promptMarketOrgSetup({
              isOwner: isWorkspaceOwner,
              onSetup: () => navigate('/community/workspace'),
            });
            return;
          }
          throw error;
        }
      }

      // Step 2: Fork the group via Market API
      const forkResult = await marketApiService.forkAgentGroup(identifier!, {
        actAs,
        identifier: newIdentifier,
        name: title,
        status: 'published',
        visibility: 'public',
      });

      // Step 3: Find supervisor from memberAgents
      const supervisorMember = memberAgents.find((member: any) => {
        const agent = member.agent || member;
        const role = member.role || agent.role;
        return role === 'supervisor';
      });

      // Prepare supervisor config
      let supervisorConfig;
      if (supervisorMember) {
        const member = supervisorMember as any;
        const agent = member.agent || member;
        const currentVersion = member.currentVersion || member;
        const rawConfig = {
          avatar: currentVersion.avatar,
          backgroundColor: currentVersion.backgroundColor,
          chatConfig: currentVersion.config?.chatConfig || currentVersion.chatConfig,
          description: currentVersion.description,
          model: currentVersion.config?.model || currentVersion.model,
          params: currentVersion.config?.params || currentVersion.params,
          plugins: currentVersion.config?.plugins || currentVersion.plugins,
          provider: currentVersion.config?.provider || currentVersion.provider,
          systemRole:
            currentVersion.config?.systemRole ||
            currentVersion.config?.systemPrompt ||
            currentVersion.systemRole ||
            currentVersion.content,
          tags: currentVersion.tags,
          title: currentVersion.name || agent.name || 'Supervisor',
        };
        // Filter out null/undefined values
        supervisorConfig = Object.fromEntries(
          Object.entries(rawConfig).filter(([_, v]) => v != null),
        );
      }

      // Step 4: Prepare group config. `target` decides where the chat
      // group lands in the sidebar: Private (only the creator sees it) or
      // workspace-shared. In personal mode visibility is left unset so the
      // column default (`public`) applies harmlessly.
      const groupConfig = {
        config: {
          ...config,
          forkedFromIdentifier: identifier, // Store the source group identifier
        },
        // Group content is the supervisor's systemRole (for backward compatibility)
        content: config.systemRole || supervisorConfig?.systemRole,
        ...meta,
        // Store marketIdentifier at top-level (same as agents)
        marketIdentifier: forkResult.group.identifier,
        ...(activeWorkspaceId ? { visibility: target } : {}),
      };

      // Step 5: Prepare member agents from market data
      // Filter out supervisor role as it will be created separately using supervisorConfig
      const members = memberAgents
        .filter((member: any) => {
          const agent = member.agent || member;
          const role = member.role || agent.role;
          return role !== 'supervisor';
        })
        .map((member: any) => {
          const agent = member.agent || member;
          const currentVersion = member.currentVersion || member;
          return {
            avatar: currentVersion.avatar,
            backgroundColor: currentVersion.backgroundColor,
            chatConfig: currentVersion.config?.chatConfig || currentVersion.chatConfig,
            description: currentVersion.description,
            model: currentVersion.config?.model || currentVersion.model,
            plugins: currentVersion.config?.plugins || currentVersion.plugins,
            provider: currentVersion.config?.provider || currentVersion.provider,
            systemRole:
              currentVersion.config?.systemRole ||
              currentVersion.config?.systemPrompt ||
              currentVersion.systemRole ||
              currentVersion.content,
            tags: currentVersion.tags,
            title: currentVersion.name || agent.name,
          };
        });

      // Step 6: Create group with all members in one request
      const result = await chatGroupService.createGroupWithMembers(
        groupConfig,
        members,
        supervisorConfig,
      );

      // Refresh group list
      await loadGroups();

      // Step 7: Report fork event (using 'add' event type)
      discoverService.reportAgentEvent({
        event: 'add',
        identifier: forkResult.group.identifier,
        source: location.pathname,
      });

      message.success(t('fork.success'));

      // Step 8: Navigate to chat
      navigate(urlJoin('/group', result.groupId));
    } catch (error: any) {
      console.error('Fork group failed:', error);
      message.error(t('fork.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Personal mode: plain primary button, no Private/Public choice to make.
  if (!activeWorkspaceId) {
    return (
      <Button
        block
        className={styles.buttonGroup}
        disabled={!canCreate}
        loading={isLoading}
        size={'large'}
        type={'primary'}
        onClick={() => handleForkAndChat('private')}
      >
        {t('fork.forkAndChat')}
      </Button>
    );
  }

  // Workspace mode: split button with Private as the default + an explicit
  // "Fork to Workspace" option in the dropdown for users who want to share
  // the chat group with all members immediately.
  const menuItems = [
    {
      key: 'fork-workspace',
      label: t('fork.forkToWorkspaceAndChat'),
      onClick: () => handleForkAndChat('public'),
    },
  ];

  return (
    <SplitButton
      className={styles.buttonGroup}
      disabled={!canCreate}
      loading={isLoading}
      size={'large'}
      type={'primary'}
    >
      <SplitButton.Main style={{ flex: 1 }} onClick={() => handleForkAndChat('private')}>
        {t('fork.forkToPrivateAndChat')}
      </SplitButton.Main>
      <SplitButton.Menu items={menuItems} popupProps={{ style: { minWidth: 240 } }} />
    </SplitButton>
  );
});

export default ForkGroupAndChat;
