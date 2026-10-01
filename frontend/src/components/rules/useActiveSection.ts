import { useEffect, useState } from 'react';

// Devuelve el id de la sección activa para resaltarla en el índice lateral: la
// última cuya parte superior ya ha pasado por la "línea de lectura" (30% de la
// altura de la ventana). Al llegar al final de la página se marca siempre la
// última sección, porque una sección corta nunca llegaría a cruzar esa línea.
export function useActiveSection(ids: string[]): string {
    const [activeId, setActiveId] = useState(ids[0]);

    useEffect(() => {
        const update = () => {
            const isScrolled = window.scrollY > 0;
            const isAtBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
            if (isScrolled && isAtBottom) {
                setActiveId(ids[ids.length - 1]);
                return;
            }

            const readingLine = window.innerHeight * 0.3;
            let current = ids[0];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= readingLine) current = id;
            });
            setActiveId(current);
        };

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [ids]);

    return activeId;
}
