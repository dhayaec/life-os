'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateSettingsAction } from '@/features/settings/actions';
import { LOCALES, THEMES, TIMEZONES, type ThemeLiteral } from '@/features/settings/validations';
import type { UserSettingsData } from '@/features/settings/services/settings-service';

import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

export function SettingsForm({ initial }: { initial: UserSettingsData }) {
  useRouteLoadedSignal();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [name, setName] = useState(initial.name);
  const [theme, setThemeValue] = useState<ThemeLiteral>(initial.theme as ThemeLiteral);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [locale, setLocale] = useState(initial.locale);
  const [emailNotifications, setEmailNotifications] = useState(initial.emailNotifications);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await updateSettingsAction({
      name,
      theme,
      timezone,
      locale,
      emailNotifications,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTheme(theme);
    toast.success('Settings saved');
    router.refresh();
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
            <Input id="settings-email" value={initial.email} disabled />
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
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
