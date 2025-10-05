import React from 'react';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

interface LoadingStateProps {
    label?: string;
    helperText?: string;
    compact?: boolean;
    className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
    label = 'กำลังโหลดข้อมูล...',
    helperText,
    compact = false,
    className,
}) => {
    const spinnerSize = compact ? 'h-12 w-12 border-[3px]' : 'h-16 w-16 border-4';
    const innerSize = compact ? 'h-6 w-6' : 'h-8 w-8';
    const labelSize = compact ? 'text-sm' : 'text-base';
    const helperSize = compact ? 'text-xs' : 'text-sm';

    return (
        <div
            className={cx(
                'relative isolate flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-[rgba(130,160,255,0.3)] bg-[rgba(14,18,42,0.85)] px-8 py-10 text-center shadow-[0_25px_45px_rgba(10,0,50,0.35)] backdrop-blur-xl transition-colors',
                compact && 'rounded-xl px-5 py-6 shadow-[0_18px_35px_rgba(10,0,45,0.4)]',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(126,92,255,0.3),transparent_65%)]" />
            <div className="pointer-events-none absolute -top-12 h-32 w-32 rounded-full bg-[rgba(255,119,205,0.25)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-0 h-36 w-36 rounded-full bg-[rgba(57,194,255,0.22)] blur-3xl" />
            <div className="relative flex items-center justify-center">
                <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-blue-500/20 via-cyan-400/20 to-indigo-500/20 blur-3xl" />
                <div className="relative flex items-center justify-center">
                    <span
                        className={cx(
                            'block rounded-full border border-transparent border-t-[rgba(123,92,255,0.85)] border-r-[rgba(72,205,255,0.8)] border-b-[rgba(255,120,200,0.6)] border-l-[rgba(86,150,255,0.7)] shadow-[0_0_30px_rgba(120,90,255,0.45)] animate-spin',
                            spinnerSize,
                        )}
                    />
                    <span
                        className={cx(
                            'absolute rounded-full bg-[rgba(8,11,28,0.85)] shadow-inner shadow-[0_0_18px_rgba(132,162,255,0.35)]',
                            innerSize,
                        )}
                    />
                    <span className="absolute -bottom-1 h-2 w-2 rounded-full bg-gradient-to-r from-[rgba(252,117,235,0.85)] via-[rgba(123,92,255,0.9)] to-[rgba(46,216,255,0.9)] shadow-[0_0_14px_rgba(123,92,255,0.7)]" />
                </div>
            </div>
            <div className="space-y-1">
                <p className={cx('font-semibold tracking-[0.12em] uppercase text-[rgba(146,182,255,0.95)]', labelSize)}>{label}</p>
                {helperText ? (
                    <p className={cx('text-[rgba(192,210,255,0.75)]', helperSize)}>{helperText}</p>
                ) : null}
            </div>
            <div className="pointer-events-none absolute inset-x-6 top-3 h-px bg-gradient-to-r from-transparent via-[rgba(118,182,255,0.55)] to-transparent" />
            <div className="pointer-events-none absolute inset-x-8 bottom-4 h-px bg-gradient-to-r from-transparent via-[rgba(255,120,205,0.45)] to-transparent" />
        </div>
    );
};

export default LoadingState;
