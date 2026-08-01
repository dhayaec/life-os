import 'server-only';

import { db } from '@/server/db';

export type UserSettingsData = {
  name: string;
  email: string;
  theme: string;
  timezone: string;
  locale: string;
};

export async function getSettings(userId: string): Promise<UserSettingsData> {
  const [user, settings] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    db.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
  ]);

  return {
    name: user.name,
    email: user.email,
    theme: settings.theme,
    timezone: settings.timezone,
    locale: settings.locale,
  };
}

export async function updateSettings(
  userId: string,
  input: {
    name: string;
    theme: string;
    timezone: string;
    locale: string;
  }
): Promise<UserSettingsData> {
  await Promise.all([
    db.user.update({ where: { id: userId }, data: { name: input.name } }),
    db.userSettings.upsert({
      where: { userId },
      update: {
        theme: input.theme,
        timezone: input.timezone,
        locale: input.locale,
      },
      create: {
        userId,
        theme: input.theme,
        timezone: input.timezone,
        locale: input.locale,
      },
    }),
  ]);

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return {
    name: user.name,
    email: user.email,
    theme: input.theme,
    timezone: input.timezone,
    locale: input.locale,
  };
}
