import { ListTodo } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function TasksPage() {
  return (
    <ModulePlaceholder title="Tasks" description="Manage to-dos and projects" icon={ListTodo} />
  );
}
