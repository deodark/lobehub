'use client';

import { AGENT_CHAT_URL } from '@lobechat/const';
import { Button } from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles } from 'antd-style';
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
}));

/**
 * Generate a market identifier (8-character lowercase alphanumeric string)
 */
const generateMarketIdentifier = () => {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const generate = customAlphabet(alphabet, 8);
  return generate();
};

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

  const handleForkAndChat = async () => {
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
      // `x-lobe-owner-account-id` (403). The local agent still lands in the
      // user's Private bucket via `visibility: 'private'` below; "Publish to
      // Workspace" promotes it later.
      //
      // When the workspace has no Community profile yet we abort and prompt
      // the user instead of falling through to a doomed personal-fork
      // attempt (the trust token can't shed its workspaceId from the
      // client). Owners get a deep-link CTA; everyone else is asked to
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

      // Step 4: Add to local agent list. In workspace mode the fork lands in
      // the user's Private bucket so a freshly-grabbed community agent isn't
      // pushed to every teammate before the user has decided to share it.
      const result = await createAgent({
        ...agentData,
        ...(activeWorkspaceId ? { visibility: 'private' as const } : {}),
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

  return (
    <Button
      block
      className={styles.buttonGroup}
      disabled={!canCreate}
      loading={isLoading}
      size={'large'}
      type={'primary'}
      onClick={handleForkAndChat}
    >
      {t('fork.forkAndChat')}
    </Button>
  );
});

export default ForkAndChat;
