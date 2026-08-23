import { Board, PlayerColor } from "../../../shared";

export class VictoryArbitrator {

    //FEAT-09: Determinar si se ha cumplido alguna condición de victoria
    public static checkVictory(board: Board): PlayerColor | null {

        let redMasterAlive = false;
        let blueMasterAlive = false;

        for (let y = 0; y < board.length; y++) {
            for (let x= 0; x< board[y].length; x++) {
                const piece = board[y][x];

                if (piece && piece.type === 'master') {
                    if (piece.color === 'red') {
                        redMasterAlive = true;
                        if (y === 4 && x === 2) {
                            return 'red';
                        }
                    } else if (piece.color === 'blue') {
                        blueMasterAlive = true;
                        if (y === 0 && x === 2) {
                            return 'blue';
                        }
                    }
                }
            }
        }
        
        if (!redMasterAlive) return 'blue';
        if (!blueMasterAlive) return 'red';

        return null; 
    }
}