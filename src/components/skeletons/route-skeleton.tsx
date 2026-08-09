import { AuthSkeleton } from './auth-skeleton';
import { CalendarSkeleton } from './calendar-skeleton';
import { DashboardSkeleton } from './dashboard-skeleton';
import { EditorSkeleton } from './editor-skeleton';
import { FinanceSkeleton } from './finance-skeleton';
import { FormSkeleton } from './form-skeleton';
import { GridSkeleton } from './grid-skeleton';
import { HabitsSkeleton } from './habits-skeleton';
import { ListSkeleton } from './list-skeleton';
import { NotesSkeleton } from './notes-skeleton';
import { TasksSkeleton } from './tasks-skeleton';

export function RouteSkeleton({ pathname }: { pathname: string }) {
  switch (pathname) {
    case '/dashboard':
      return <DashboardSkeleton />;
    case '/tasks':
      return <TasksSkeleton />;
    case '/calendar':
      return <CalendarSkeleton />;
    case '/habits':
      return <HabitsSkeleton />;
    case '/finance':
      return <FinanceSkeleton />;
    case '/bookmarks':
      return <GridSkeleton />;
    case '/settings':
      return <FormSkeleton />;
    case '/notes':
    case '/notes/trash':
      return <NotesSkeleton />;
    case '/documents':
    case '/documents/trash':
    case '/journal':
    case '/shopping':
    case '/notifications':
      return <ListSkeleton />;
    default:
      if (pathname.startsWith('/notes/')) return <EditorSkeleton />;
      if (pathname.startsWith('/documents/')) return <ListSkeleton />;
      return <ListSkeleton />;
  }
}

export function AuthRouteSkeleton() {
  return <AuthSkeleton />;
}
