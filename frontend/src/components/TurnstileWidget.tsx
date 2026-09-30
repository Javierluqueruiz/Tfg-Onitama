import { useEffect, useRef, useState } from 'react';

interface TurnstileOptions {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: (errorCode: string) => void;
    'expired-callback'?: () => void;
    retry?: 'auto' | 'never';
    'refresh-expired'?: 'auto' | 'manual' | 'never';
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: TurnstileOptions) => string;
            remove: (widgetId: string) => void;
        }
    }
}

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onExpire?: () => void;
}

export const TurnstileWidget = ({ onVerify, onExpire }: TurnstileWidgetProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);

    // Las funciones de la página pueden cambiar de identidad en cada render. Si el efecto dependiera de
    // ellas, el widget se destruiría y se volvería a crear, reiniciando el desafío cada vez.
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    useEffect(() => {
        onVerifyRef.current = onVerify;
        onExpireRef.current = onExpire;
    });

    useEffect(() => {
        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (!siteKey || !containerRef.current) return;

        let widgetId: string | undefined;
        let cancelled = false;

        const render = () => {
            if (cancelled || !window.turnstile || !containerRef.current) return;
            widgetId = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token) => {
                    setFailed(false);
                    onVerifyRef.current(token);
                },
                // Sin estos dos, un fallo del desafío o un token caducado (duran 5 minutos) dejaban la
                // página con un token inservible y sin ninguna pista de lo ocurrido.
                'error-callback': (errorCode) => {
                    console.error(`Turnstile: error ${errorCode}`);
                    onExpireRef.current?.();
                    setFailed(true);
                },
                'expired-callback': () => onExpireRef.current?.(),
                retry: 'auto',
                'refresh-expired': 'auto',
            });
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
    }, []);

    return (
        <div>
            <div ref={containerRef}></div>
            {failed && (
                <p role="alert">
                    No se ha podido completar la verificación. Recarga la página; si persiste, prueba en una ventana
                    de incógnito o sin extensiones del navegador.
                </p>
            )}
        </div>
    );
};
