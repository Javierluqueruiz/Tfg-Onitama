import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRanking } from '../components/ranking/useRanking';
import { RankingTable } from '../components/ranking/RankingTable';
import { FormHeader } from '../components/shared/ui/FormHeader';
import { TrophyIcon } from '../components/lobby/ui/ModeIcons';
import formStyles from '../components/shared/ui/FormKit.module.css';
import { AuthLayout } from './AuthLayout';
import styles from './RankingPage.module.css'

export const RankingPage = () => {
    const { state, reload } = useRanking();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    return (
        <AuthLayout>
            <div className={styles.page}>
                <FormHeader
                    icon={<TrophyIcon />}
                    title="Clasificación"
                    hint="Ordenada por ELO. Solo puntúan las partidas entre cuentas registradas."
                />

                {state.status === 'loading' && (
                    <p className={formStyles.message} role="status">Cargando la clasificación...</p>
                )}

                {state.status === 'error' && (
                    <>
                        <p className={formStyles.error} role="alert">{state.message}</p>
                        <div className={formStyles.actions}>
                            <button type="button" className={formStyles.primary} onClick={reload}>Reintentar</button>
                        </div>
                    </>
                )}

                {state.status === 'ready' && (
                    <>
                        {state.ranking.entries.length === 0 ? (
                            <p className={formStyles.message}>Todavía nadie ha jugado lo suficiente para aparecer en la clasificación.</p>
                        ) : (
                            <RankingTable entries={state.ranking.entries} me={state.ranking.me} />
                        )}

                        {state.ranking.me === null && !isAuthLoading && (
                            <p className = {styles.note}>
                                {isAuthenticated ? (
                                    <>Aún no apareces: necesitas al menos {state.ranking.minGames} partidas para aparecer en la clasificación.</>
                                ) : (
                                    <>
                                        <Link to="/login" className={formStyles.link}>Inicia sesión</Link> y juega al menos {' '}
                                        {state.ranking.minGames} partidas para aparecer en la clasificación.
                                    </>
                                )}
                            </p>
                        )}              
                   </>
                )}
            </div>
        </AuthLayout>
    );
};