import 'server-only';

import { db } from '@/server/db';

export type UserSettingsData = {
  name: string;
  email: string;
  theme: string;
  timezone: string;
  locale: string;
  emailNotifications: boolean;
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
    emailNotifications: settings.emailNotifications,
  };
}

export async function getLocale(userId: string): Promise<string> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { locale: true },
  });
  return settings?.locale ?? 'en';
}

export async function updateSettings(
  userId: string,
  input: {
    name: string;
    theme: string;
    timezone: string;
    locale: string;
    emailNotifications: boolean;
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
        emailNotifications: input.emailNotifications,
      },
      create: {
        userId,
        theme: input.theme,
        timezone: input.timezone,
        locale: input.locale,
        emailNotifications: input.emailNotifications,
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
    emailNotifications: input.emailNotifications,
  };
}
