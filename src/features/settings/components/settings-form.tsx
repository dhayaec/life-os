'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LOCALES, THEMES, TIMEZONES, type ThemeLiteral } from '@/features/settings/validations';
import type { UserSettingsData } from '@/features/settings/services/settings-service';

import { useLocalQuery } from '@/hooks/use-local-query';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import { syncEngine } from '@/lib/sync/engine';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

export function SettingsForm({ initial }: { initial: UserSettingsData }) {
  useRouteLoadedSignal();
  const { setTheme } = useTheme();

  const { rows, hydrated } = useLocalQuery<UserSettingsData>('settings', undefined, []);

  useEffect(() => {
    void syncEngine.hydrateSeed('settings', initial ? [initial] : []);
  }, [initial]);

  const settings = rows?.[0];

  const [name, setName] = useState(settings?.name ?? initial.name);
  const [theme, setThemeValue] = useState<ThemeLiteral>(
    (settings?.theme ?? initial.theme) as ThemeLiteral
  );
  const [timezone, setTimezone] = useState(settings?.timezone ?? initial.timezone);
  const [locale, setLocale] = useState(settings?.locale ?? initial.locale);
  const [emailNotifications, setEmailNotifications] = useState(
    settings?.emailNotifications ?? initial.emailNotifications
  );
  const { enqueue } = useSyncMutation('settings');

  // useState above seeds from the RSC prop. Adopt the store row once it
  // hydrates so an offline edit committed before mount isn't shadowed by the
  // (stale) server prop on the next visit.
  const adopted = useRef(false);
  useEffect(() => {
    if (adopted.current || !settings) return;
    adopted.current = true;
    setName(settings.name);
    setThemeValue(settings.theme as ThemeLiteral);
    setTimezone(settings.timezone);
    setLocale(settings.locale);
    setEmailNotifications(settings.emailNotifications);
  }, [settings]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void enqueue('update', {
      id: settings?.id ?? initial.id,
      name,
      theme,
      timezone,
      locale,
      emailNotifications,
      updatedAt: new Date().toISOString(),
    });
    setTheme(theme);
    toast.success('Settings saved');
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-muted-foreground text-xs">Your name and account email.</p>
        </div>
        <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={settings?.email ?? initial.email} disabled />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="text-muted-foreground text-xs">Choose how LifeOS looks for you.</p>
        </div>
        <div className="max-w-xl">
          <Label htmlFor="settings-theme">Theme</Label>
          <Select value={theme} onValueChange={(value) => setThemeValue(value as ThemeLiteral)}>
            <SelectTrigger id="settings-theme" className="mt-1.5 w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t[0]?.toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Preferences</h2>
          <p className="text-muted-foreground text-xs">
            Timezone and language used across the app.
          </p>
        </div>
        <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="settings-timezone" className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-locale">Locale</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="settings-locale" className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Notifications</h2>
          <p className="text-muted-foreground text-xs">
            Choose how LifeOS reaches you outside the app.
          </p>
        </div>
        <div className="flex max-w-xl items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="settings-email-notifications">Email notifications</Label>
            <p className="text-muted-foreground text-xs">
              Send app notifications to your email too.
            </p>
          </div>
          <Switch
            id="settings-email-notifications"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>
      </section>

      <div className="flex items-center gap-2">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
