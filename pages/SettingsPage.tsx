import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import Button from '../components/ui/Button';
import { useSettings } from '../App';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, notify, t } = useSettings();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    notify(t('settingsSaved'));
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('general')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-slate-700 mb-1">
                {t('language')}
              </label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => {
                  const value = e.target.value;
                  updateSettings({ ...settings, language: value as any });
                }}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="th">{t('thai')}</option>
                <option value="en">{t('english')}</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{t('notifications')}</span>
              <ToggleSwitch
                checked={settings.notifications}
                onChange={(checked) => updateSettings({ ...settings, notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{t('darkMode')}</span>
              <ToggleSwitch
                checked={settings.darkMode}
                onChange={(checked) => updateSettings({ ...settings, darkMode: checked })}
              />
            </div>
            <Button type="submit" className="w-full">
              {t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
