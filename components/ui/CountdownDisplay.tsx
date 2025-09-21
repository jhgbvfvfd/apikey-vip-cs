import React from 'react';
import useCountdown from '../../utils/useCountdown';

interface CountdownDisplayProps {
    target?: string | null;
    className?: string;
    title?: string;
    expiredLabel?: string;
    accentLabel?: string;
}

const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleString('th-TH', {
        dateStyle: 'full',
        timeStyle: 'short',
    });
};

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
    target,
    className = '',
    title = 'หมดอายุใน',
    expiredLabel = 'หมดอายุแล้ว',
    accentLabel = 'กำหนดหมดอายุ',
}) => {
    if (!target) {
        return null;
    }

    const countdown = useCountdown(target);
    const formattedDate = formatDateTime(target);

    if (!formattedDate) {
        return null;
    }

    return (
        <div className={`relative overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-900/80 p-4 shadow-xl backdrop-blur-sm ${className}`}>
            <div className="absolute -inset-8 bg-gradient-to-r from-sky-500/20 via-blue-600/10 to-cyan-500/20 opacity-70 blur-3xl" aria-hidden />
            <div className="relative z-10 space-y-3 text-sky-50">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200/80">{title}</p>
                        <p className="text-sm font-medium text-sky-100/90">{formattedDate}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                        {accentLabel}
                    </span>
                </div>
                {countdown.expired ? (
                    <div className="rounded-xl border border-red-400/60 bg-red-500/20 px-4 py-3 text-center text-sm font-semibold text-red-100 shadow-inner">
                        {expiredLabel}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'วัน', value: countdown.formatted.days },
                            { label: 'ชั่วโมง', value: countdown.formatted.hours },
                            { label: 'นาที', value: countdown.formatted.minutes },
                            { label: 'วินาที', value: countdown.formatted.seconds },
                        ].map((segment) => (
                            <div
                                key={segment.label}
                                className="rounded-xl border border-sky-400/50 bg-sky-500/20 px-3 py-2 text-center shadow-inner shadow-sky-900/40"
                            >
                                <div className="text-2xl font-bold leading-none text-white sm:text-3xl">{segment.value}</div>
                                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-sky-100/80">{segment.label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountdownDisplay;
