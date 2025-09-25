import React from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useSettings } from '../App';
import { InformationCircleIcon, ShieldCheckIcon, ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import trueCheckBotCode from '../assets/truecheck/index.js?raw';

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'javascript' }) => {
  const { notify, t } = useSettings();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children.trim());
      notify(t('copySuccess'));
    } catch (err) {
      notify(t('copyFailed'), 'error');
    }
  };

  return (
    <div className="relative">
      <pre className="bg-slate-900 text-white rounded-xl p-4 my-2 text-xs sm:text-sm overflow-x-auto border border-slate-800/40 shadow-inner">
        <code className={`language-${language}`}>{children}</code>
      </pre>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleCopy}
        className="absolute top-2 right-2"
      >
        {t('copy')}
      </Button>
    </div>
  );
};

const HighlightCallout: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/70 p-4">
    <InformationCircleIcon className="w-6 h-6 text-blue-500 mt-0.5" />
    <div className="space-y-1">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

const TrueSearchPage: React.FC = () => {
  const { t } = useSettings();

  const steps = [t('trueSearchStep1'), t('trueSearchStep2'), t('trueSearchStep3')];
  const usageNotes = [t('trueSearchUsageNote1'), t('trueSearchUsageNote2'), t('trueSearchUsageNote3')];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{t('trueSearchTitle')}</h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{t('trueSearchDesc')}</p>
      </div>

      <Card className="border border-slate-200/80 shadow-sm">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200/80">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-blue-500" />
            {t('trueSearchGuardTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>{t('trueSearchGuardDesc')}</p>
          <ul className="list-disc pl-5 space-y-2">
            {steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('trueSearchUsageTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <HighlightCallout
              title={t('trueSearchTokenCalloutTitle')}
              description={t('trueSearchTokenCalloutDesc')}
            />
            <ul className="list-disc pl-5 space-y-2">
              {usageNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownOnSquareIcon className="w-5 h-5 text-slate-500" />
              {t('trueSearchDownloadTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>{t('trueSearchDownloadDesc')}</p>
            <CodeBlock>{trueCheckBotCode}</CodeBlock>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrueSearchPage;
