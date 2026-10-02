import { getRankByElo, type RankingEntry } from '../../../../shared';
import { RankBadge } from '../profile/RankBadge';
import { winRate } from './winRate';
import styles from './RankingTable.module.css';

interface RankingTableProps {
    entries: RankingEntry[];
    me: RankingEntry | null;
}

const COLUMNS = 6;

const RankingRow = ({ entry, isMe }: { entry: RankingEntry; isMe: boolean }) => {
    const rank = getRankByElo(entry.elo);

    return (
        <tr className={isMe ? styles.me : undefined} aria-current={isMe ? 'true' : undefined}>
            <td className={styles.position}>{entry.position}</td>
            <td className={styles.rank}>
                <RankBadge tier={rank.tier} size={28} />
                <span className={styles.srOnly}>{rank.name}</span>
            </td>
            <td className={styles.player}>{entry.username}</td>
            <td className={styles.number}>{entry.elo}</td>
            <td className={styles.number}>{entry.gamesPlayed}</td>
            <td className={styles.number}>{winRate(entry)}%</td>
        </tr>
    );
};

export const RankingTable = ({ entries, me }: RankingTableProps) => {
    const outsideRow = me && !entries.some((entry) => entry.username === me.username) ? me : null;

    return (
        <table className={styles.table}>
            <caption className={styles.srOnly}>Clasificación global</caption>
            <colgroup>
                <col className={styles.colPosition} />
                <col className={styles.colRank} />
                <col />
                <col className={styles.colElo} />
                <col className={styles.colGames} />
                <col className={styles.colWinRate} />
            </colgroup>
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col"><span className={styles.srOnly}>Rango</span></th>
                    <th scope="col" className={styles.player}>Jugador</th>
                    <th scope="col">ELO</th>
                    <th scope="col">Partidas</th>
                    <th scope="col">% vict.</th>
                </tr>
            </thead>
            <tbody>
                {entries.map((entry) => (
                    <RankingRow key={entry.username} entry={entry} isMe={me?.username === entry.username} />
                ))}
                {outsideRow && (
                    <>
                        <tr aria-hidden="true" className={styles.gap}>
                            <td colSpan={COLUMNS}>...</td>
                        </tr>
                        <RankingRow entry={outsideRow} isMe={true} />
                    </>
                )}
            </tbody>
        </table>
    );
};