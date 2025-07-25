/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import {
  sessionManager,
  type SessionItem,
  type SessionMetaInfo,
} from '@renderer/db/session';
import { chatManager } from '@renderer/db/chat';
import { api } from '@renderer/api';
import { ConversationWithSoM } from '@/main/shared/types';
import { Operator } from '@main/store/types';

interface SessionState {
  loading: boolean;
  error: Error | null;
  currentSessionId: string;
  sessions: SessionItem[];
  chatMessages: ConversationWithSoM[];

  setCurrentSessionId: (id: string) => void;
  setSessions: (sessions: SessionItem[]) => void;
  setChatMessages: (messages: ConversationWithSoM[]) => void;
  setError: (error: Error | null) => void;
  setLoading: (loading: boolean) => void;

  // messages
  createMessage: (
    sessionId: string,
    messages: ConversationWithSoM[],
  ) => Promise<ConversationWithSoM[] | null>;
  getMessages: (sessionId: string) => Promise<ConversationWithSoM[]>;
  updateMessages: (
    sessionId: string,
    messages: ConversationWithSoM[],
  ) => Promise<ConversationWithSoM[] | null>;
  deleteMessages: (sessionId: string) => Promise<boolean>;

  // Sessions
  fetchSessions: () => Promise<void>;
  createSession: (
    name: string,
    meta?: SessionMetaInfo,
  ) => Promise<SessionItem | null>;
  getSession: (id: string) => Promise<SessionItem | null>;
  updateSession: (
    id: string,
    updates: Partial<Pick<SessionItem, 'name' | 'meta'>>,
  ) => Promise<SessionItem | null>;
  deleteSession: (id: string) => Promise<boolean>;
  setActiveSession: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  loading: true,
  error: null,
  currentSessionId: '',
  chatMessages: [],

  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setSessions: (sessions) => set({ sessions }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  fetchSessions: async () => {
    try {
      set({ loading: true });
      const allSessions = await sessionManager.getAllSessions();
      set({ sessions: allSessions.reverse() });
    } catch (err) {
      console.error('fetchSessions', err);

      set({
        error:
          err instanceof Error ? err : new Error('Failed to fetch sessions'),
      });
    } finally {
      set({ loading: false });
    }
  },

  createSession: async (name, meta = { operator: Operator.LocalComputer }) => {
    try {
      await api.clearHistory();

      const newSession = await sessionManager.createSession(name, meta);

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        currentSessionId: newSession.id,
      }));

      await get().createMessage(newSession.id, []);
      return newSession;
    } catch (err) {
      console.error('createSession', err);

      set({
        error:
          err instanceof Error ? err : new Error('Failed to create session'),
      });
      return null;
    }
  },

  getSession: async (id) => {
    const session = await sessionManager.getSession(id);

    if (session) {
      return session;
    }

    return null;
  },

  updateSession: async (id, updates) => {
    try {
      const updatedSession = await sessionManager.updateSession(id, updates);
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === id ? { ...session, ...updates } : session,
        ),
      }));
      return updatedSession;
    } catch (err) {
      console.error('updateSession', err);

      set({
        error:
          err instanceof Error ? err : new Error('Failed to update session'),
      });
      return null;
    }
  },

  deleteSession: async (id) => {
    try {
      const deleted = await sessionManager.deleteSession(id);
      await get().deleteMessages(id);

      if (deleted) {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          currentSessionId:
            state.currentSessionId === id ? '' : state.currentSessionId,
        }));
      }
      return deleted;
    } catch (err) {
      console.error('deleteSession', err);

      set({
        error:
          err instanceof Error ? err : new Error('Failed to delete session'),
      });
      return false;
    }
  },

  createMessage: async (sessionId, messages) => {
    try {
      const updatedMessages = await chatManager.createSessionMessages(
        sessionId,
        messages,
      );
      set(() => ({
        chatMessages: updatedMessages,
      }));
      return updatedMessages;
    } catch (err) {
      console.error('createMessage', err);

      set({
        error: err instanceof Error ? err : new Error('Failed to add messages'),
      });
      return null;
    }
  },

  getMessages: async (sessionId) => {
    try {
      const messages = (await chatManager.getSessionMessages(sessionId)) || [];
      set(() => ({
        chatMessages: messages,
      }));
      return messages;
    } catch (err) {
      console.error('getMessages', err);

      set({
        error: err instanceof Error ? err : new Error('Failed to get messages'),
      });
      return [];
    }
  },

  updateMessages: async (sessionId, messages) => {
    try {
      // Debug: Check messages before saving to chatManager
      // console.log('🔍 RAG DEBUG: updateMessages called with', messages.length, 'messages');
      // messages.forEach((msg, idx) => {
      //   if (msg.ragContext) {
      //     // console.log(`🔍 RAG DEBUG: Input message ${idx} HAS ragContext (${msg.ragContext.length} items)`);
      //   } else {
      //     // console.log(`🔍 RAG DEBUG: Input message ${idx} has NO ragContext`);
      //   }
      // });

      const updatedMessages = await chatManager.updateSessionMessages(
        sessionId,
        messages,
      );

      // Debug: Check messages after chatManager
      // console.log('🔍 RAG DEBUG: updateMessages returned', updatedMessages.length, 'messages');
      // updatedMessages.forEach((msg, idx) => {
      //   if (msg.ragContext) {
      //     console.log(`🔍 RAG DEBUG: Updated message ${idx} HAS ragContext (${msg.ragContext.length} items)`);
      //   } else {
      //     console.log(`🔍 RAG DEBUG: Updated message ${idx} has NO ragContext`);
      //   }
      // });

      set(() => ({
        chatMessages: updatedMessages,
      }));
      return updatedMessages;
    } catch (err) {
      console.error('updateMessages', err);

      set({
        error:
          err instanceof Error ? err : new Error('Failed to update messages'),
      });
      return null;
    }
  },

  deleteMessages: async (sessionId) => {
    try {
      await api.clearHistory();

      const deleted = await chatManager.deleteSessionMessages(sessionId);
      if (deleted && sessionId === get().currentSessionId) {
        set(() => ({
          chatMessages: [],
        }));
      }
      return deleted;
    } catch (err) {
      console.error('deleteMessages', err);

      set({
        error:
          err instanceof Error ? err : new Error('Failed to delete messages'),
      });
      return false;
    }
  },

  setActiveSession: async (sessionId) => {
    try {
      await api.clearHistory();

      set({ currentSessionId: sessionId });
      await get().getMessages(sessionId);
    } catch (err) {
      console.error('setActiveSession', err);

      set({
        error:
          err instanceof Error ? err : new Error('Failed to set ActiveSession'),
      });
    }
  },
}));
