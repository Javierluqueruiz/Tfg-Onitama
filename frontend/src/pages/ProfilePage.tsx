import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProfileApi } from '../services/profileApi';
import { RankBadge } from '../components/profile/RankBadge';
import { getRankByElo, type ProfileStats } from '../../../shared';
import { AuthLayout } from './AuthLayout';
import styles from './ProfilePage.module.css';

export const ProfilePage = () => {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        ProfileApi.getStats()
            .then(setStats)
            .catch((err) => setError(err instanceof Error ? err.message : 'Error desconocido'));
    }, [isAuthenticated]);

    if (isAuthLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (error) {
        return (
            <AuthLayout>
                <p className={styles.error}>Error al cargar el perfil: {error}</p>
            </AuthLayout>
        );
    }

    if (!stats) {
        return (
            <AuthLayout>
                <p>Cargando perfil...</p>
            </AuthLayout>
        );
    }
        
    const rank = getRankByElo(stats.elo);

    return (
        <AuthLayout>
            <div className={styles.profile}>
                <div className={styles.header}>
                    <RankBadge tier={rank.tier} size={88} />
                    <div>
                        <h2 className={styles.username}>{stats.username}</h2>
                        <p className={styles.rankName}>{rank.name} · {stats.elo} ELO</p>
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.gamesPlayed}</span>
                        <span className={styles.statLabel}>Partidas</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.wins}</span>
                        <span className={styles.statLabel}>Victorias</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.losses}</span>
                        <span className={styles.statLabel}>Derrotas</span>
                    </div>  
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.draws}</span>
                        <span className={styles.statLabel}>Empates</span>
                    </div>
                </div>

                <h3 className={styles.sectionTitle}>Últimas partidas</h3>
                {stats.lastMatches.length === 0 ? (
                    <p className={styles.emptyState}>Todavía no has jugado ninguna partida.</p>
                ) : (
                    <ul className={styles.matchList}>
                        {stats.lastMatches.map((match, index) => (
                            <li key={index} className={styles.matchRow}>
                                <span className={`${styles.matchResult} ${styles[match.result]}`}>
                                    {match.result === 'win' ? 'Victoria' : match.result === 'loss' ? 'Derrota' : 'Empate'}
                                </span>
                                <span className={styles.matchOpponent}>vs {match.opponentName}</span>
                                <span className={styles.matchEloChange}>{match.eloChange >= 0 ? `+${match.eloChange}` : match.eloChange}</span>
                                <span className={styles.matchDate}>{new Date(match.date).toLocaleDateString()}</span>
                            </li>
                        ))}
                    </ul>
                )}
                
                <Link to="/"className={styles.backLink}>Volver al menú principal</Link>
            </div>
        </AuthLayout>
    );
};