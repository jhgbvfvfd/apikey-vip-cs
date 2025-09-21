import { useEffect, useMemo, useState } from 'react';

export interface CountdownState {
    expired: boolean;
    totalMilliseconds: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formatted: {
        days: string;
        hours: string;
        minutes: string;
        seconds: string;
    };
}

const zeroState: CountdownState = {
    expired: false,
    totalMilliseconds: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    formatted: {
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
    },
};

const pad = (value: number) => value.toString().padStart(2, '0');

export const useCountdown = (target?: string | null): CountdownState => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!target) {
            return;
        }
        const timer = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => {
            window.clearInterval(timer);
        };
    }, [target]);

    return useMemo(() => {
        if (!target) {
            return zeroState;
        }
        const targetDate = new Date(target);
        const targetTime = targetDate.getTime();
        if (Number.isNaN(targetTime)) {
            return zeroState;
        }

        const diff = targetTime - now;
        const expired = diff <= 0;
        const total = expired ? 0 : diff;

        const days = Math.floor(total / (24 * 60 * 60 * 1000));
        const hours = Math.floor((total % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((total % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((total % (60 * 1000)) / 1000);

        return {
            expired,
            totalMilliseconds: Math.max(0, diff),
            days,
            hours,
            minutes,
            seconds,
            formatted: {
                days: pad(days),
                hours: pad(hours),
                minutes: pad(minutes),
                seconds: pad(seconds),
            },
        };
    }, [target, now]);
};

export default useCountdown;
