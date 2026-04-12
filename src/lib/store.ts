import { create } from 'zustand';
import type { User, ModuleKey } from './types';

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;

  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  dbInitialized: boolean;
  setDbInitialized: (init: boolean) => void;

  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  currentUser: null,
  login: (user) => set({ isAuthenticated: true, currentUser: user, showWelcome: false }),
  logout: () => set({ isAuthenticated: false, currentUser: null, showWelcome: true }),

  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  dbInitialized: false,
  setDbInitialized: (init) => set({ dbInitialized: init }),

  showWelcome: true,
  setShowWelcome: (show) => set({ showWelcome: show }),
}));
