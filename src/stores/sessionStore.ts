import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  MOCK_SESSION_TOKEN,
  type SessionUser,
  type SessionWallet,
  type TossLoginApiResponse,
} from '../api/authApi'

export type SessionMode = 'guest' | 'mock' | 'authenticated'

type SessionStoreState = {
  sessionToken: string | null
  user: SessionUser | null
  wallet: SessionWallet | null
  isLoggedIn: boolean
  sessionMode: SessionMode
  serverSyncEnabled: boolean
  setSession: (session: TossLoginApiResponse) => void
  clearSession: () => void
  expireSession: () => void
  logout: () => void
  setWallet: (wallet: SessionWallet) => void
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set) => ({
      sessionToken: null,
      user: null,
      wallet: null,
      isLoggedIn: false,
      sessionMode: 'guest',
      serverSyncEnabled: false,
      setSession: (session) =>
        set({
          sessionToken: session.sessionToken,
          user: session.user,
          wallet: session.wallet,
          isLoggedIn: true,
          sessionMode:
            session.sessionToken === MOCK_SESSION_TOKEN ? 'mock' : 'authenticated',
          serverSyncEnabled: session.sessionToken !== MOCK_SESSION_TOKEN,
        }),
      clearSession: () =>
        set({
          sessionToken: null,
          user: null,
          wallet: null,
          isLoggedIn: false,
          sessionMode: 'guest',
          serverSyncEnabled: false,
        }),
      expireSession: () => {
        try {
          localStorage.removeItem('maraning-jelly-store')
          localStorage.removeItem('maraning-progress-store')
        } catch {
          // ignore
        }
        set({
          sessionToken: null,
          user: null,
          wallet: null,
          isLoggedIn: false,
          sessionMode: 'guest',
          serverSyncEnabled: false,
        })
      },
      logout: () =>
        set({
          sessionToken: null,
          user: null,
          wallet: null,
          isLoggedIn: false,
          sessionMode: 'guest',
          serverSyncEnabled: false,
        }),
      setWallet: (wallet) => set({ wallet }),
    }),
    {
      name: 'maraning-session-store',
      partialize: (state) => ({
        sessionToken: state.sessionToken,
        user: state.user,
        wallet: state.wallet,
        isLoggedIn: state.isLoggedIn,
        sessionMode: state.sessionMode,
        serverSyncEnabled: state.serverSyncEnabled,
      }),
    },
  ),
)
