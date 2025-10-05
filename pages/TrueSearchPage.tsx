import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingState from '../components/ui/LoadingState';
import { useSettings } from '../App';
import {
  DocumentMagnifyingGlassIcon,
  InformationCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

type SearchType = 'phone' | 'id' | 'name';

interface TrueCheckRecord {
  serviceId?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  age?: number;
  idNumber?: string;
  startDate?: string;
  address?: {
    house?: string;
    street?: string;
    khet?: string;
    province?: string;
  };
}

interface TrueSearchResultState {
  queryType: SearchType;
  queryValue: string;
  tokensBefore: number;
  tokensAfter: number;
  records: TrueCheckRecord[];
  raw: string;
  parsed: unknown;
}

const TOKEN_API_BASE = 'https://apikey-vip.netlify.app/api/pmsi';
const SEARCH_API_URL = 'https://api.meaowxecross.xyz/truecheck/';
const SEARCH_COST = 10;
const STORAGE_KEY = 'truecheck:web:key';

const formatAddress = (record: TrueCheckRecord) => {
  if (!record.address) return '';
  const parts: string[] = [];
  if (record.address.house) parts.push(record.address.house);
  if (record.address.street) parts.push(record.address.street);
  if (record.address.khet) parts.push(record.address.khet);
  if (record.address.province) parts.push(record.address.province);
  return parts.join(', ');
};

const TrueSearchPage: React.FC = () => {
  const { t, notify } = useSettings();
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [searchType, setSearchType] = useState<SearchType>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrueSearchResultState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [apiKey]);

  const typeOptions = useMemo(
    () => [
      { value: 'phone' as const, label: t('trueSearchTypePhone') },
      { value: 'id' as const, label: t('trueSearchTypeId') },
      { value: 'name' as const, label: t('trueSearchTypeName') },
    ],
    [t]
  );

  const typeLabelMap = useMemo(
    () => ({
      phone: t('trueSearchTypePhone'),
      id: t('trueSearchTypeId'),
      name: t('trueSearchTypeName'),
    }),
    [t]
  );

  const valuePlaceholder = useMemo(() => {
    switch (searchType) {
      case 'id':
        return t('trueSearchValuePlaceholderId');
      case 'name':
        return t('trueSearchValuePlaceholderName');
      case 'phone':
      default:
        return t('trueSearchValuePlaceholderPhone');
    }
  }, [searchType, t]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalizedKey = apiKey.trim();
      const normalizedValue = searchValue.trim();

      if (!normalizedKey) {
        setError(t('trueSearchErrorMissingKey'));
        return;
      }

      if (!normalizedValue) {
        setError(t('trueSearchErrorMissingValue'));
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const creditResponse = await fetch(
          `${TOKEN_API_BASE}/credit?key=${encodeURIComponent(normalizedKey)}`
        );
        const creditData = await creditResponse.json();
        if (!creditData?.ok) {
          const message = creditData?.error || 'UNKNOWN';
          throw new Error(
            t('trueSearchErrorCredit').replace('%message%', message)
          );
        }

        const tokensBefore = Number(creditData.tokens_remaining || 0);
        if (Number.isNaN(tokensBefore) || tokensBefore < SEARCH_COST) {
          setLoading(false);
          setError(
            t('trueSearchErrorInsufficient')
              .replace('%remaining%', String(tokensBefore))
          );
          return;
        }

        let searchResponse: Response;
        try {
          searchResponse = await fetch(
            `${SEARCH_API_URL}?type=${searchType}&value=${encodeURIComponent(
              normalizedValue
            )}`
          );
        } catch (err) {
          console.error('TrueSearch network error', err);
          throw new Error(t('trueSearchErrorNetwork'));
        }

        if (!searchResponse.ok) {
          throw new Error(t('trueSearchErrorSearch'));
        }

        const raw = await searchResponse.text();
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          parsed = null;
        }

        let records: TrueCheckRecord[] = [];
        if (
          parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as { results?: TrueCheckRecord[] }).results)
        ) {
          records = (parsed as { results: TrueCheckRecord[] }).results;
        }

        const useResponse = await fetch(`${TOKEN_API_BASE}/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: normalizedKey, tokens: SEARCH_COST }),
        });
        const useData = await useResponse.json();
        if (!useData?.ok) {
          const message = useData?.error || 'UNKNOWN';
          throw new Error(
            t('trueSearchErrorDeduct').replace('%message%', message)
          );
        }

        setResult({
          queryType: searchType,
          queryValue: normalizedValue,
          tokensBefore,
          tokensAfter: Number(useData.tokens_remaining || 0),
          records,
          raw,
          parsed,
        });
        notify(t('trueSearchSuccess'));
      } catch (err) {
        console.error('TrueSearch error', err);
        if (err instanceof Error) {
          setError(err.message || t('trueSearchErrorGeneral'));
        } else {
          setError(t('trueSearchErrorGeneral'));
        }
      } finally {
        setLoading(false);
      }
    },
    [apiKey, notify, searchType, searchValue, t]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{t('trueSearchTitle')}</h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          {t('trueSearchDesc')}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200/80">
            <CardTitle className="text-lg flex items-center gap-2">
              <DocumentMagnifyingGlassIcon className="w-6 h-6 text-blue-500" />
              {t('trueSearchFormTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-slate-600">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('trueSearchKeyLabel')}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={t('trueSearchKeyPlaceholder')}
                  leftIcon={<KeyIcon className="w-5 h-5" />}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('trueSearchTypeLabel')}
                  </label>
                  <div className="relative">
                    <select
                      value={searchType}
                      onChange={(event) =>
                        setSearchType(event.target.value as SearchType)
                      }
                      className="block w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Input
                label={t('trueSearchValueLabel')}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={valuePlaceholder}
              />

              <p className="text-xs text-slate-500">
                {t('trueSearchKeyHelper')}
              </p>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">{t('trueSearchCostHint')}</p>
                <Button type="submit" disabled={loading} className="sm:w-auto w-full">
                  {t('trueSearchSubmit')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border border-blue-200/70 bg-blue-50/60 shadow-sm">
            <CardContent className="flex gap-3">
              <ShieldCheckIcon className="mt-0.5 h-6 w-6 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {t('trueSearchCostNoteTitle')}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t('trueSearchCostNoteDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm">
            <CardContent className="flex gap-3">
              <InformationCircleIcon className="mt-0.5 h-6 w-6 text-slate-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {t('trueSearchTipTitle')}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t('trueSearchTipDesc')}
                </p>
                <p className="text-xs text-slate-400">
                  {t('trueSearchKeyStorageNote')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            {t('trueSearchResultsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState
              label={t('trueSearchLoadingLabel')}
              helperText={t('trueSearchLoadingHelper')}
            />
          ) : result ? (
            <div className="space-y-5 text-sm text-slate-600">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {t('trueSearchSummaryType')}
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {typeLabelMap[result.queryType]}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {t('trueSearchSummaryValue')}
                  </p>
                  <p className="text-sm font-medium text-slate-800 break-all">
                    {result.queryValue}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {t('trueSearchSummaryTokensBefore')}
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.tokensBefore}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {t('trueSearchSummaryTokensAfter')}
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.tokensAfter}
                  </p>
                </div>
              </div>

              {result.records.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700">
                    {t('trueSearchResultCount').replace(
                      '%count%',
                      String(result.records.length)
                    )}
                  </p>
                  <div className="space-y-3">
                    {result.records.map((record, index) => {
                      const address = formatAddress(record);
                      return (
                        <div
                          key={`${record.serviceId || record.idNumber || index}-${index}`}
                          className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm"
                        >
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            {t('trueSearchRecordNumber').replace(
                              '%index%',
                              String(index + 1)
                            )}
                          </p>
                          <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                            {record.serviceId && (
                              <p>
                                <span className="font-medium text-slate-700">
                                  {t('trueSearchRecordPhone')}:
                                </span>{' '}
                                {record.serviceId}
                              </p>
                            )}
                            {(record.firstName || record.lastName) && (
                              <p>
                                <span className="font-medium text-slate-700">
                                  {t('trueSearchRecordName')}:
                                </span>{' '}
                                {[record.firstName, record.lastName]
                                  .filter(Boolean)
                                  .join(' ')}
                              </p>
                            )}
                            {record.birthDate && (
                              <p>
                                <span className="font-medium text-slate-700">
                                  {t('trueSearchRecordBirthDate')}:
                                </span>{' '}
                                {record.birthDate}
                                {record.age ? ` (${record.age})` : ''}
                              </p>
                            )}
                            {record.idNumber && (
                              <p>
                                <span className="font-medium text-slate-700">
                                  {t('trueSearchRecordIdNumber')}:
                                </span>{' '}
                                {record.idNumber}
                              </p>
                            )}
                            {record.startDate && (
                              <p>
                                <span className="font-medium text-slate-700">
                                  {t('trueSearchRecordStartDate')}:
                                </span>{' '}
                                {record.startDate}
                              </p>
                            )}
                            {address && (
                              <p>
                                <span className="font-medium text-slate-700">
                                  {t('trueSearchRecordAddress')}:
                                </span>{' '}
                                {address}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {t('trueSearchNoResults')}
                </p>
              )}

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {t('trueSearchRawTitle')}
                </p>
                <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-slate-200/80 bg-slate-900 p-3 text-xs text-slate-100 shadow-inner">
                  {(() => {
                    if (!result.raw) {
                      return t('trueSearchRawEmpty');
                    }
                    try {
                      return JSON.stringify(
                        result.parsed ?? JSON.parse(result.raw),
                        null,
                        2
                      );
                    } catch (err) {
                      return result.raw;
                    }
                  })()}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('trueSearchEmptyState')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrueSearchPage;
