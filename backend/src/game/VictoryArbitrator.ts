import { Board, PlayerColor } from "../../../shared";

const RED_MASTER_POSITION = { x: 2, y: 0 };
const BLUE_MASTER_POSITION = { x: 2, y: 4 };

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
                        if (y === BLUE_MASTER_POSITION.y && x === BLUE_MASTER_POSITION.x) {
                            return 'red';
                        }
                    } else if (piece.color === 'blue') {
                        blueMasterAlive = true;
                        if (y === RED_MASTER_POSITION.y && x === RED_MASTER_POSITION.x) {
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