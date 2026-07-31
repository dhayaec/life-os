'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AppState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'lifeos-app' }
  )
);
