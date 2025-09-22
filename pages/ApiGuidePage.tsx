import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useSettings } from '../App';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const baseUrl = 'https://apikey-vip.netlify.app/api';

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'bash' }) => {
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
      <pre className="bg-slate-900 text-white rounded-lg p-4 my-2 text-sm overflow-x-auto border border-slate-200 shadow-inner">
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

const HttpBadge: React.FC<{ method: string }> = ({ method }) => (
  <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-blue-100 text-blue-600 border border-blue-200">
    {method}
  </span>
);

const Callout: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
    <InformationCircleIcon className="w-6 h-6 text-blue-500 mt-0.5" />
    <div className="space-y-1">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

interface EndpointCardProps {
  step: number;
  title: string;
  method: string;
  path: string;
  description: string;
  requestExample: string;
  requestBody?: string;
  successExample: string;
  errorExample: string;
  note?: string;
  labels: {
    requestExample: string;
    requestBody: string;
    successResponse: string;
    errorResponse: string;
    notes: string;
  };
}

const EndpointCard: React.FC<EndpointCardProps> = ({
  step,
  title,
  method,
  path,
  description,
  requestExample,
  requestBody,
  successExample,
  errorExample,
  note,
  labels,
}) => (
  <Card className="shadow-sm border border-slate-200">
    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-slate-50/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-200/60">
          {step}
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="mt-1 flex items-center gap-2 text-xs font-medium tracking-wide text-slate-500">
            <HttpBadge method={method} />
            <span className="font-mono text-sm text-slate-600">{`${baseUrl}${path}`}</span>
          </p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 text-sm leading-relaxed">
      <p className="text-slate-600">{description}</p>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{labels.requestExample}</p>
        <CodeBlock>{requestExample}</CodeBlock>
      </div>

      {requestBody && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{labels.requestBody}</p>
          <CodeBlock language="json">{requestBody}</CodeBlock>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">{labels.successResponse}</p>
          <CodeBlock language="json">{successExample}</CodeBlock>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">{labels.errorResponse}</p>
          <CodeBlock language="json">{errorExample}</CodeBlock>
        </div>
      </div>

      {note && (
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">{labels.notes}:</span> {note}
        </div>
      )}
    </CardContent>
  </Card>
);

const ApiGuidePage: React.FC = () => {
  const { t } = useSettings();

  const endpoints = [
    {
      step: 1,
      title: t('apiGuideEndpointCreditTitle'),
      method: 'GET',
      path: '/PLATFORM_ID/credit',
      description: t('apiGuideEndpointCreditDesc'),
      requestExample: `curl -X GET "${baseUrl}/PLATFORM_ID/credit?key=YOUR_KEY"`,
      successExample: `{
  "ok": true,
  "usageMode": "token",
  "tokens_remaining": 998,
  "status": "active"
}`,
      errorExample: `{
  "ok": false,
  "error": "KEY_NOT_FOUND",
  "message": "The provided key does not exist."
}`,
      note: t('apiGuideEndpointCreditNote'),
    },
    {
      step: 2,
      title: t('apiGuideEndpointUseTitle'),
      method: 'POST',
      path: '/PLATFORM_ID/use',
      description: t('apiGuideEndpointUseDesc'),
      requestExample: `curl -X POST "${baseUrl}/PLATFORM_ID/use" \\\n  -H "Content-Type: application/json" \\\n  -d '{
    "key": "YOUR_KEY",
    "tokens": 1
  }'`,
      requestBody: `{
  "key": "YOUR_KEY",
  "tokens": 1
}`,
      successExample: `{
  "ok": true,
  "tokens_remaining": 997
}`,
      errorExample: `{
  "ok": false,
  "error": "INSUFFICIENT_TOKENS",
  "message": "Not enough tokens remaining."
}`,
      note: t('apiGuideEndpointUseNote'),
    },
    {
      step: 3,
      title: t('apiGuideEndpointCreateAgentTitle'),
      method: 'POST',
      path: '/agents',
      description: t('apiGuideEndpointCreateAgentDesc'),
      requestExample: `curl -X POST "${baseUrl}/agents" \
  -u "admin:YOUR_ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newagent",
    "password": "StrongPassword123",
    "credits": 500
  }'`,
      requestBody: `{
  "username": "newagent",
  "password": "StrongPassword123",
  "credits": 500
}`,
      successExample: `{
  "ok": true,
  "agent": {
    "id": "agent_x1y2z3",
    "username": "newagent",
    "credits": 500,
    "createdAt": "2024-01-30T15:04:05.000Z"
  }
}`,
      errorExample: `{
  "ok": false,
  "error": "UNAUTHORIZED",
  "message": "ต้องเข้าสู่ระบบผู้ดูแลระบบก่อน"
}`,
      note: t('apiGuideEndpointCreateAgentNote'),
    },
  ];

  const labels = {
    requestExample: t('apiGuideRequestExample'),
    requestBody: t('apiGuideRequestBody'),
    successResponse: t('apiGuideSuccessResponse'),
    errorResponse: t('apiGuideErrorResponse'),
    notes: t('apiGuideNotes'),
  };

  const renderDurationExample = () => (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-sm font-semibold text-slate-700">{t('apiGuideCreditDurationHeading')}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{t('apiGuideCreditDurationDesc')}</p>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('apiGuideCreditDurationExampleLabel')}</p>
        <CodeBlock language="json">{`{
  "ok": true,
  "usageMode": "duration",
  "status": "active",
  "expiresAt": "2024-05-01T00:00:00.000Z",
  "days_remaining": 12,
  "durationDays": 30,
  "tokens_remaining": 998
}`}</CodeBlock>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <Card className="overflow-hidden border-blue-100 shadow-lg shadow-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
          <CardTitle className="text-2xl font-bold text-white">
            {t('apiGuideIntroTitle')}
          </CardTitle>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            {t('apiGuideIntroBody')}
          </p>
        </CardHeader>
        <CardContent className="space-y-5 bg-gradient-to-br from-white via-white to-blue-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('apiGuideBaseUrlHeading')}
              </p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {t('apiGuideBaseUrlDesc')}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(baseUrl, '_blank', 'noopener,noreferrer')}
              className="self-start"
            >
              {t('apiGuideOpenBaseUrl')}
            </Button>
          </div>
          <CodeBlock>{baseUrl}</CodeBlock>
          <p className="text-xs text-slate-500">{t('apiGuideBaseUrlNote')}</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">{t('apiGuideAuthHeading')}</CardTitle>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{t('apiGuideAuthDesc')}</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('apiGuideAuthItem1')}</li>
            <li>{t('apiGuideAuthItem2')}</li>
            <li>{t('apiGuideAuthItem3')}</li>
          </ul>
          <Callout title={t('apiGuideAuthCalloutTitle')} description={t('apiGuideAuthCalloutBody')} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        {endpoints.map((endpoint) => (
          <React.Fragment key={endpoint.step}>
            <EndpointCard {...endpoint} labels={labels} />
            {endpoint.step === 1 && renderDurationExample()}
          </React.Fragment>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">{t('apiGuideErrorsHeading')}</CardTitle>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{t('apiGuideErrorsDesc')}</p>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('apiGuideErrorKeyNotFound')}</li>
            <li>{t('apiGuideErrorInsufficientTokens')}</li>
            <li>{t('apiGuideErrorIpBanned')}</li>
            <li>{t('apiGuideErrorPlatformDisabled')}</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">{t('apiGuideSupportHeading')}</CardTitle>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{t('apiGuideSupportDesc')}</p>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <Callout title={t('apiGuideSupportCalloutTitle')} description={t('apiGuideSupportNote')} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiGuidePage;
