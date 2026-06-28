'use client';

import { AGENT_CHAT_URL } from '@lobechat/const';
import { Button, DropdownMenu, Flexbox, Icon } from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles } from 'antd-style';
import { ChevronDownIcon } from 'lucide-react';
import { customAlphabet } from 'nanoid/non-secure';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveWorkspace } from '@/business/client/hooks/useActiveWorkspace';
import { useActiveWorkspaceId } from '@/business/client/hooks/useActiveWorkspaceId';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { usePermission } from '@/hooks/usePermission';
import { useMarketAuth } from '@/layout/AuthProvider/MarketAuth';
import { lambdaClient } from '@/libs/trpc/client';
import { agentService } from '@/services/agent';
import { discoverService } from '@/services/discover';
import { marketApiService } from '@/services/marketApi';
import { useAgentStore } from '@/store/agent';
import { useHomeStore } from '@/store/home';

import {
  isMarketOrgSetupRequiredError,
  promptMarketOrgSetup,
} from '../../../../../utils/marketOrgSetup';
import { useDetailContext } from '../../DetailProvider';

const styles = createStaticStyles(({ css }) => ({
  buttonGroup: css`
    width: 100%;
  `,
  menuButton: css`
    padding-inline: 8px;
    border-start-start-radius: 0 !important;
    border-end-start-radius: 0 !important;
  `,
  primaryButton: css`
    border-start-end-radius: 0 !important;
    border-end-end-radius: 0 !important;
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

const ForkAndChat = memo<{ mobile?: boolean }>(({ mobile }) => {
  const { identifier, title, config, avatar, backgroundColor, description, tags, editorData } =
    useDetailContext();
  const [isLoading, setIsLoading] = useState(false);
  const createAgent = useAgentStore((s) => s.createAgent);
  const refreshAgentList = useHomeStore((s) => s.refreshAgentList);
  const { message } = App.useApp();
  const navigate = useWorkspaceAwareNavigate();
  const { t } = useTranslation('discover');
  const { isAuthenticated, signIn } = useMarketAuth();
  const { allowed: canCreate } = usePermission('create_content');
  const activeWorkspaceId = useActiveWorkspaceId();
  const activeWorkspace = useActiveWorkspace();
  const isWorkspaceOwner = activeWorkspace?.role === 'owner';

  const meta = {
    avatar,
    backgroundColor,
    description,
    marketIdentifier: identifier,
    tags,
    title,
  };

  // `target` only matters in workspace mode. Personal-mode forks ignore it
  // (every row there is implicitly owner-private). Default = Private so
  // newly-grabbed agents don't surface to teammates before the user has
  // had a chance to vet them.
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

      // Step 1: Check if user has already forked this agent
      const existingAgentId = await agentService.getAgentByForkedFromIdentifier(identifier!);

      if (existingAgentId) {
        // User has already forked this agent, navigate to existing fork
        message.info(t('fork.alreadyForked'));
        navigate(AGENT_CHAT_URL(existingAgentId, mobile));
        return;
      }

      // Generate a unique identifier for the forked agent
      const newIdentifier = generateMarketIdentifier();

      // Workspace mode forks must be attributed to the workspace's Market
      // organization mirror — the per-user trust token always carries the
      // workspaceId, so Market rejects the request without
      // `x-lobe-owner-account-id` (403). Whether the local agent ends up
      // private or public is independent of this market-side ownership.
      //
      // When the workspace has no Community profile yet we abort and prompt
      // the user. Owners get a deep-link CTA; everyone else is asked to
      // contact the owner.
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

      // Step 2: Fork the agent via Market API (single-item batch)
      const [forkOutcome] = await marketApiService.forkAgent([
        {
          actAs,
          identifier: newIdentifier,
          name: title,
          sourceIdentifier: identifier!,
          status: 'published',
          visibility: 'public',
        },
      ]);

      if (!forkOutcome.success) {
        throw new Error(forkOutcome.error?.message || 'Forking failed');
      }

      const forkResult = forkOutcome.data;

      // Step 3: Create agent config with forked data
      if (!config) throw new Error('Agent config is missing');

      const agentData = {
        config: {
          ...config,
          editorData,
          ...meta,
          marketIdentifier: forkResult.agent.identifier,
          params: {
            ...config.params,
            forkedFromIdentifier: identifier, // Store the source agent identifier
          },
          title: forkResult.agent.name,
        },
      };

      // Step 4: Add to local agent list. `target` decides where it lands —
      // Private bucket (only the creator sees it) or workspace-shared
      // (visible to every member). In personal mode `visibility` is left
      // unset and the column defaults to `public` (no-op).
      const result = await createAgent({
        ...agentData,
        ...(activeWorkspaceId ? { visibility: target } : {}),
      });
      await refreshAgentList();

      // Step 5: Report fork event (using 'add' event type)
      discoverService.reportAgentEvent({
        event: 'add',
        identifier: forkResult.agent.identifier,
        source: location.pathname,
      });

      message.success(t('fork.success'));

      // Step 6: Navigate to chat
      navigate(AGENT_CHAT_URL(result!.agentId, mobile));
    } catch (error: any) {
      console.error('Fork failed:', error);
      message.error(t('fork.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Personal mode has no Private/Public split — render the plain primary
  // button so users don't see a meaningless dropdown.
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

  // Workspace mode: split button with Private as the default (matches the
  // sidebar's Private bucket) and an explicit "Fork to Workspace" option
  // for users who want to share immediately.
  const menuItems = [
    {
      key: 'fork-workspace',
      label: t('fork.forkToWorkspaceAndChat'),
      onClick: () => handleForkAndChat('public'),
    },
  ];

  return (
    <Flexbox horizontal className={styles.buttonGroup} gap={0}>
      <Button
        block
        className={styles.primaryButton}
        disabled={!canCreate}
        loading={isLoading}
        size={'large'}
        style={{ flex: 1, width: 'unset' }}
        type={'primary'}
        onClick={() => handleForkAndChat('private')}
      >
        {t('fork.forkToPrivateAndChat')}
      </Button>
      <DropdownMenu
        items={menuItems}
        popupProps={{ style: { minWidth: 240 } }}
        triggerProps={{ disabled: isLoading || !canCreate }}
      >
        <Button
          className={styles.menuButton}
          disabled={isLoading || !canCreate}
          icon={<Icon icon={ChevronDownIcon} />}
          size={'large'}
          type={'primary'}
        />
      </DropdownMenu>
    </Flexbox>
  );
});

export default ForkAndChat;
