export type Player = 'black' | 'white';
export type CellState = Player | null;

// 基础棋盘类型
export type Board = CellState[][];

// 扩展棋盘类型，带有lastMove属性
export interface ExtendedBoard extends Array<Array<CellState>> {
  lastMove?: { row: number, col: number };
}

export type GameStatus = 'playing' | 'finished' | 'notStarted';

export interface Move {
  row: number;
  col: number;
  player: Player;
  timestamp: number;
  thinkingTime: number; // 思考时间(ms)
}