import {
  Bookmark,
  CalendarDays,
  Flame,
  FolderOpen,
  LayoutDashboard,
  ListTodo,
  NotebookPen,
  Settings,
  ShoppingCart,
  StickyNote,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const mainNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview of your day',
  },
  {
    title: 'Notes',
    href: '/notes',
    icon: StickyNote,
    description: 'Capture and organize thoughts',
  },
  { title: 'Tasks', href: '/tasks', icon: ListTodo, description: 'Manage to-dos and projects' },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: CalendarDays,
    description: 'Schedule events and reminders',
  },
  { title: 'Habits', href: '/habits', icon: Flame, description: 'Track streaks and routines' },
  { title: 'Journal', href: '/journal', icon: NotebookPen, description: 'Daily entries and mood' },
  {
    title: 'Bookmarks',
    href: '/bookmarks',
    icon: Bookmark,
    description: 'Save links and resources',
  },
  { title: 'Finance', href: '/finance', icon: Wallet, description: 'Track expenses and budgets' },
  { title: 'Shopping', href: '/shopping', icon: ShoppingCart, description: 'Lists and checklists' },
  { title: 'Documents', href: '/documents', icon: FolderOpen, description: 'Files and folders' },
];

export const footerNav: NavItem[] = [
  { title: 'Settings', href: '/settings', icon: Settings, description: 'App preferences' },
];

export const allNav = [...mainNav, ...footerNav];

export type NavGroup = { label: string; items: NavItem[] };

export const mainNavGroups: NavGroup[] = [
  { label: 'Overview', items: mainNav.slice(0, 1) },
  { label: 'Content', items: mainNav.slice(1, 6) },
  { label: 'Manage', items: mainNav.slice(6, 10) },
];
