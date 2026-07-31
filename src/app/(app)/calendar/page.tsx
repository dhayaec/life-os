import { CalendarDays } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function CalendarPage() {
  return (
    <ModulePlaceholder
      title="Calendar"
      description="Schedule events and reminders"
      icon={CalendarDays}
    />
  );
}
