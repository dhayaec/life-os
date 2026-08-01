import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { TaskView } from '@/features/tasks/components/task-view';
import { getTasks } from '@/features/tasks/services/task-service';
import { taskStatusSchema } from '@/features/tasks/validations';

export const metadata: Metadata = { title: 'Tasks' };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const user = await requireUser();
  const { status, search } = await searchParams;
  const statusResult = status ? taskStatusSchema.safeParse(status) : null;

  const tasks = await getTasks(user.id, {
    ...(statusResult?.success ? { status: statusResult.data } : {}),
    ...(search ? { search } : {}),
  });

  return <TaskView tasks={tasks} initialStatus={status ?? ''} initialSearch={search ?? ''} />;
}
