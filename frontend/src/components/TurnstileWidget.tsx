import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
            remove: (widgetId: string) => void;
        }
    }
}

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
}

export const TurnstileWidget = ({ onVerify }: TurnstileWidgetProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (!siteKey || !containerRef.current) return;

        let widgetId: string | undefined;
        let cancelled = false;

        const render = () => {
            if (cancelled || !window.turnstile || !containerRef.current) return;
            widgetId = window.turnstile.render(containerRef.current, { sitekey: siteKey, callback: onVerify });
        };

        let interval: ReturnType<typeof setInterval> | null = null;
        if (window.turnstile) {
            render();
        } else {
            interval = setInterval(() => {
                if (window.turnstile) {
                    if (interval) clearInterval(interval);
                    render();
                }
            }, 100);
        }

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
            if (widgetId && window.turnstile) {
                window.turnstile.remove(widgetId);
            }
        };
    }, [onVerify]);

    return <div ref={containerRef}></div>;
};