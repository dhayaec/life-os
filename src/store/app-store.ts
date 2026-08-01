'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AppState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarVisible: boolean;
  toggleSidebarVisible: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      sidebarVisible: true,
      toggleSidebarVisible: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
    }),
    { name: 'lifeos-app' }
  )
);
