import React from 'react';
import type { RankTier } from '../../../../shared';
import styles from './RankBadge.module.css';

interface RankBadgeProps {
    tier: RankTier;
    size?: number;
}

interface TierStyle {
    base: string;
    ring: string;
    emblem: string;
    emblemCenter: string;
}

const TIER_STYLES: Record<RankTier, TierStyle> = {
    bronze:      { base: '#a56a3a', ring: '#7a4a26', emblem: '#5a3418', emblemCenter: '#f0e2c9' },
    silver:      { base: '#b9bfc6', ring: '#8a8f97', emblem: '#5f656d', emblemCenter: '#f2f3f4' },
    gold:        { base: '#d9b54c', ring: '#a8802f', emblem: '#7a5b1f', emblemCenter: '#fbeec4' },
    platinum:    { base: '#cfe3e0', ring: '#7fa8a3', emblem: '#3f6d57', emblemCenter: '#eef7f5' },
    diamond:     { base: '#5fb8c9', ring: '#2f7a89', emblem: '#0f4c58', emblemCenter: '#eafcff' },
    master:      { base: '#7a5aa8', ring: '#4f3878', emblem: '#e7d9ff', emblemCenter: '#4f3878' },
    grandmaster: { base: '#a8503a', ring: '#c79a4b', emblem: '#f0d98a', emblemCenter: '#5a1f14' },
};

function PlumBlossom({ color, centerColor }: { color: string; centerColor: string }) {
    return (
        <g fill={color}>
            <circle cx="0" cy="-9" r="3.6" />
            <circle cx="8" cy="-3" r="3.6" />
            <circle cx="5" cy="7" r="3.6" />
            <circle cx="-5" cy="7" r="3.6" />
            <circle cx="-8" cy="-3" r="3.6" />
            <circle cx="0" cy="0" r="2.6" fill={centerColor} />
        </g>
    );
}

export const RankBadge: React.FC<RankBadgeProps> = ({ tier, size = 72 }) => {
    const style = TIER_STYLES[tier];
    const clipId = `rankBadgeClip-${tier}`;

    return (
        <svg width={size} height={size} viewBox="-40 -40 80 80" className={styles.badge} aria-hidden="true">
            <defs>
                <clipPath id={clipId}><circle r="32" /></clipPath>
            </defs>

            {tier === 'grandmaster' && (
                <g stroke={style.ring} strokeWidth="1.5">
                    <line x1="0" y1="0" x2="0" y2="-46" />
                    <line x1="0" y1="0" x2="32" y2="-32" />
                    <line x1="0" y1="0" x2="46" y2="0" />
                    <line x1="0" y1="0" x2="32" y2="32" />
                    <line x1="0" y1="0" x2="0" y2="46" />
                    <line x1="0" y1="0" x2="-32" y2="32" />
                    <line x1="0" y1="0" x2="-46" y2="0" />
                    <line x1="0" y1="0" x2="-32" y2="-32" />
                </g>
            )}
            <circle r="36" fill="none" stroke={style.ring} strokeWidth="3" />
            <circle r="32" fill={style.base} />

            <g clipPath={`url(#${clipId})`}>
                <circle cx="-10" cy="-12" r="16" fill="#ffffff" opacity={tier === 'grandmaster' ? 0.22 : 0.35} />
                <circle cx="12" cy="14" r="18" fill="#000000" opacity={0.2} />
            </g>

            {tier === 'diamond' && (
                <path d="M22,-24 L25,-17 L32,-14 L25,-11 L22,-4 L19,-11 L12,-14 L19,-17Z" fill="#eafcff" />
            )}

            {tier === 'master' && (
                <g fill="none" stroke="#c79a4b" strokeWidth="2" strokeLinecap="round">
                    <path d="M-30,-6 Q-40,-2 -32,10" />
                    <path d="M30,-6 Q40,-2 32,10" />
                </g>
            )}

            {tier === 'grandmaster' && (
                <g fill="#c79a4b">
                    <path d="M-30,4 Q-38,10 -34,22 Q-26,16 -24,6Z" />
                    <path d="M30,4 Q38,10 34,22 Q26,16 24,6Z" />
                </g>
            )}

            <PlumBlossom color={style.emblem} centerColor={style.emblemCenter} />
        </svg>
    );
};