import { produce } from 'immer';
import { type StateCreator } from 'zustand';

import { type State } from '../../initialState';

export interface MessageEditingAction {
  /**
   * Enter multi-select mode. When `initialId` is provided that message starts
   * selected, so "select" from a single message's menu feels immediate.
   */
  enterSelectionMode: (initialId?: string) => void;
  /**
   * Leave multi-select mode and drop every selected id.
   */
  exitSelectionMode: () => void;
  /**
   * Toggle message editing state
   */
  toggleMessageEditing: (id: string, editing: boolean) => void;
  /**
   * Toggle whether a message is checked in multi-select mode.
   */
  toggleMessageSelected: (id: string, selected?: boolean) => void;
}

/**
 * Helper function to toggle an item in a boolean list
 */
const toggleBooleanList = (ids: string[], id: string, value: boolean) => {
  return produce(ids, (draft) => {
    if (value) {
      if (!draft.includes(id)) draft.push(id);
    } else {
      const index = draft.indexOf(id);
      if (index >= 0) draft.splice(index, 1);
    }
  });
};

export const messageEditingSlice: StateCreator<
  State,
  [['zustand/devtools', never]],
  [],
  MessageEditingAction
> = (set, get) => ({
  enterSelectionMode: (initialId) => {
    set(
      { selectedMessageIds: initialId ? [initialId] : [], selectionMode: true },
      false,
      'enterSelectionMode',
    );
  },
  exitSelectionMode: () => {
    set({ selectedMessageIds: [], selectionMode: false }, false, 'exitSelectionMode');
  },
  toggleMessageEditing: (id, editing) => {
    set(
      { messageEditingIds: toggleBooleanList(get().messageEditingIds, id, editing) },
      false,
      'toggleMessageEditing',
    );
  },
  toggleMessageSelected: (id, selected) => {
    const current = get().selectedMessageIds;
    const next = selected ?? !current.includes(id);
    set(
      { selectedMessageIds: toggleBooleanList(current, id, next) },
      false,
      'toggleMessageSelected',
    );
  },
});
