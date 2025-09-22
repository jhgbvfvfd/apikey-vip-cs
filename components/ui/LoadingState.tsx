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
                'relative isolate flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 px-8 py-10 text-center shadow-xl shadow-blue-500/10 backdrop-blur-sm transition-colors dark:border-slate-700/60 dark:bg-slate-900/60',
                compact && 'rounded-xl px-5 py-6 shadow-lg',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/15 via-transparent to-cyan-500/10" />
            <div className="pointer-events-none absolute -top-12 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-0 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative flex items-center justify-center">
                <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-blue-500/20 via-cyan-400/20 to-indigo-500/20 blur-3xl" />
                <div className="relative flex items-center justify-center">
                    <span
                        className={cx(
                            'block rounded-full border border-transparent border-t-blue-500 border-r-blue-400 border-b-blue-300/70 border-l-blue-200/50 shadow-[0_0_25px_rgba(59,130,246,0.35)] animate-spin',
                            spinnerSize,
                        )}
                    />
                    <span
                        className={cx(
                            'absolute rounded-full bg-white/90 shadow-inner shadow-blue-500/20 dark:bg-slate-950/80',
                            innerSize,
                        )}
                    />
                    <span className="absolute -bottom-1 h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.65)]" />
                </div>
            </div>
            <div className="space-y-1">
                <p className={cx('font-semibold tracking-wide text-blue-600 dark:text-blue-300', labelSize)}>{label}</p>
                {helperText ? (
                    <p className={cx('text-slate-500 dark:text-slate-400', helperSize)}>{helperText}</p>
                ) : null}
            </div>
            <div className="pointer-events-none absolute inset-x-6 top-3 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
            <div className="pointer-events-none absolute inset-x-8 bottom-4 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        </div>
    );
};

export default LoadingState;
