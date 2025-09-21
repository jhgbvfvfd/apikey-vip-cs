import React, { useEffect, useMemo, useState } from 'react';
import { useMaintenance, useSettings } from '../App';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

const parseIps = (input: string): string[] =>
  input
    .split(/\r?\n|,|;/)
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

const toDateTimeLocalValue = (iso?: string): string => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
};

const fromDateTimeLocalValue = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

const formatDisplayDateTime = (iso?: string, locale: string = 'th-TH'): string | null => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const MaintenancePage: React.FC = () => {
  const { config, loading, update } = useMaintenance();
  const { notify, t, settings } = useSettings();
  const [enabled, setEnabled] = useState<boolean>(config.enabled);
  const [message, setMessage] = useState<string>(config.message ?? '');
  const [allowedIpsInput, setAllowedIpsInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [scheduledStartInput, setScheduledStartInput] = useState<string>(
    toDateTimeLocalValue(config.scheduledStart)
  );
  const [scheduledEndInput, setScheduledEndInput] = useState<string>(
    toDateTimeLocalValue(config.scheduledEnd)
  );
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(config.enabled);
    setMessage(config.message ?? '');
    setAllowedIpsInput((config.allowedAdminIps ?? []).join('\n'));
    setScheduledStartInput(toDateTimeLocalValue(config.scheduledStart));
    setScheduledEndInput(toDateTimeLocalValue(config.scheduledEnd));
    setScheduleError(null);
  }, [config.enabled, config.message, config.allowedAdminIps, config.scheduledStart, config.scheduledEnd]);

  const parsedIps = useMemo(() => parseIps(allowedIpsInput), [allowedIpsInput]);
  const locale = useMemo(() => (settings.language === 'th' ? 'th-TH' : 'en-US'), [settings.language]);
  const scheduleStartDisplay = useMemo(
    () => formatDisplayDateTime(config.scheduledStart, locale),
    [config.scheduledStart, locale]
  );
  const scheduleEndDisplay = useMemo(
    () => formatDisplayDateTime(config.scheduledEnd, locale),
    [config.scheduledEnd, locale]
  );

  const validateSchedule = (targetEnabled: boolean, startIso?: string, endIso?: string): string | null => {
    if (startIso && endIso) {
      const startTime = new Date(startIso).getTime();
      const endTime = new Date(endIso).getTime();
      if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime <= startTime) {
        return t('maintenanceScheduleInvalidRange');
      }
    }

    if (targetEnabled && endIso) {
      const endTime = new Date(endIso).getTime();
      if (!Number.isNaN(endTime) && endTime <= Date.now()) {
        return t('maintenanceSchedulePastEnd');
      }
    }

    return null;
  };

  const persistConfig = async (nextEnabled: boolean, nextMessage: string, ips: string[]) => {
    setSaving(true);
    try {
      let startIso = fromDateTimeLocalValue(scheduledStartInput);
      const endIso = fromDateTimeLocalValue(scheduledEndInput);

      if (nextEnabled && !startIso) {
        const nowIso = new Date().toISOString();
        startIso = nowIso;
        setScheduledStartInput(toDateTimeLocalValue(nowIso));
      }

      const validationMessage = validateSchedule(nextEnabled, startIso, endIso);
      if (validationMessage) {
        setScheduleError(validationMessage);
        setSaving(false);
        return;
      }

      await update({
        ...config,
        enabled: nextEnabled,
        message: nextMessage,
        allowedAdminIps: ips,
        scheduledStart: startIso,
        scheduledEnd: endIso,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      });
      setScheduleError(null);
      setEnabled(nextEnabled);
      notify(
        nextEnabled ? t('maintenanceEnabledToast') : t('maintenanceDisabledToast')
      );
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      notify(t('maintenanceUpdateError'), 'error');
      setEnabled(config.enabled);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setScheduleError(null);
    await persistConfig(!enabled, message, parsedIps);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const startIso = fromDateTimeLocalValue(scheduledStartInput);
      const endIso = fromDateTimeLocalValue(scheduledEndInput);
      const validationMessage = validateSchedule(enabled, startIso, endIso);
      if (validationMessage) {
        setScheduleError(validationMessage);
        setSaving(false);
        return;
      }

      await update({
        ...config,
        enabled,
        message,
        allowedAdminIps: parsedIps,
        scheduledStart: startIso,
        scheduledEnd: endIso,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      });
      setScheduleError(null);
      notify(t('maintenanceUpdateSuccess'));
    } catch (error) {
      console.error('Failed to save maintenance config:', error);
      notify(t('maintenanceUpdateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const lastUpdated = config.updatedAt ? new Date(config.updatedAt).toLocaleString(locale) : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t('maintenancePageTitle')}</CardTitle>
          <p className="text-sm text-slate-500">{t('maintenancePageDescription')}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12 text-slate-500">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              <p className="text-sm">{t('maintenanceChecking')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                      {t('maintenanceStatusLabel')}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {enabled ? t('maintenanceStatusOn') : t('maintenanceStatusOff')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {lastUpdated ? `${t('maintenanceLastUpdated')} ${lastUpdated}` : t('maintenanceNoUpdateInfo')}
                    </p>
                  </div>
                <div className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold ${
                    enabled
                      ? 'border border-amber-400/50 bg-amber-400/10 text-amber-500'
                      : 'border border-emerald-400/50 bg-emerald-400/10 text-emerald-500'
                }`}>
                  {enabled ? t('maintenanceStatusOn') : t('maintenanceStatusOff')}
                </div>
              </div>
              {(scheduleStartDisplay || scheduleEndDisplay) && (
                <div className="mt-4 grid gap-4 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                  {scheduleStartDisplay && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                        {t('maintenanceScheduleStartLabel')}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {scheduleStartDisplay}
                      </p>
                    </div>
                  )}
                  {scheduleEndDisplay && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                        {t('maintenanceScheduleEndLabel')}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {scheduleEndDisplay}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {enabled && scheduleEndDisplay && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {t('maintenanceScheduleAutoResume')} {scheduleEndDisplay}
                </p>
              )}
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                {t('maintenanceAdminOnly')}
              </p>
                <Button
                  onClick={handleToggle}
                  disabled={saving || loading}
                  className="mt-6 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_18px_35px_-15px_rgba(56,189,248,0.6)] hover:from-sky-400 hover:via-blue-500 hover:to-indigo-600"
                >
                  {enabled ? t('maintenanceToggleOff') : t('maintenanceToggleOn')}
                </Button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t('maintenanceMessageLabel')}
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-sky-500/40"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('maintenanceMessagePlaceholder')}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t('maintenanceScheduleSection')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                        {t('maintenanceScheduleStartLabel')}
                      </label>
                      <input
                        type="datetime-local"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-sky-500/40"
                        value={scheduledStartInput}
                        onChange={(e) => {
                          setScheduledStartInput(e.target.value);
                          setScheduleError(null);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                        {t('maintenanceScheduleEndLabel')}
                      </label>
                      <input
                        type="datetime-local"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-sky-500/40"
                        value={scheduledEndInput}
                        onChange={(e) => {
                          setScheduledEndInput(e.target.value);
                          setScheduleError(null);
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {t('maintenanceScheduleHint')}
                  </p>
                  {scheduleError && (
                    <p className="mt-2 text-xs font-medium text-rose-500 dark:text-rose-400">{scheduleError}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t('maintenanceAllowedIpsLabel')}
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-sky-500/40"
                    value={allowedIpsInput}
                    onChange={(e) => setAllowedIpsInput(e.target.value)}
                    placeholder="123.123.123.123"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {t('maintenanceAllowedIpsHint')}
                  </p>
                  {parsedIps.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parsedIps.map((ip) => (
                        <span
                          key={ip}
                          className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                        >
                          {ip}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{t('maintenanceNoAllowedIps')}</p>
                  )}
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="w-full sm:w-auto"
                >
                  {saving ? t('maintenanceSaving') : t('maintenanceSaveChanges')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenancePage;
