import { useCallback, useEffect, useState } from 'react';
import { Board } from './components/GomokuBoard';
import { GameControls } from './components/GomokuGameControls';
import { MoveHistory } from './components/GomokuHistory';
import { Board as BoardType, GameStatus, Move, Player } from './types/gomoku';
import confetti from 'canvas-confetti';
import { findBestMove } from './utils/gomokuAi';

const BOARD_SIZE = 15;
const WIN_COUNT = 5;

export const App = () => {
  const [board, setBoard] = useState<BoardType & { lastMove?: { row: number, col: number } }>(
    Object.assign(
      Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
      { lastMove: undefined }
    )
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const [difficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('extreme');

  const checkWin = (row: number, col: number, player: Player, board: BoardType) => {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1]
    ];
    
    return directions.some(([dx, dy]) => {
      let count = 1;
      // 正向检查
      for (let i = 1; i < WIN_COUNT; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (
          newRow < 0 || newRow >= BOARD_SIZE ||
          newCol < 0 || newCol >= BOARD_SIZE ||
          board[newRow][newCol] !== player
        ) break;
        count++;
      }
      // 反向检查
      for (let i = 1; i < WIN_COUNT; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (
          newRow < 0 || newRow >= BOARD_SIZE ||
          newCol < 0 || newCol >= BOARD_SIZE ||
          board[newRow][newCol] !== player
        ) break;
        count++;
      }
      return count >= WIN_COUNT;
    });
  };

  const makeMove = useCallback((row: number, col: number, player: Player) => {
    if (board[row][col] || gameStatus !== 'playing') return false;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = player;
    
    const now = Date.now();
    const thinkingTime = now - lastMoveTime;
    
    setBoard(Object.assign(newBoard, { lastMove: { row, col } }));
    setMoves(prev => [...prev, { row, col, player, timestamp: now, thinkingTime }]);
    setLastMoveTime(now);
    
    if (checkWin(row, col, player, newBoard)) {
      setGameStatus('finished');
      setWinner(player);
      if (player === 'black') {
        // 玩家获胜时播放庆祝动画
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0']
        });
      }
      return true;
    }
    
    // 检查平局
    const isBoardFull = newBoard.every(row => row.every(cell => cell !== null));
    if (isBoardFull) {
      setGameStatus('finished');
      return true;
    }
    
    setCurrentPlayer(player === 'black' ? 'white' : 'black');
    return true;
  }, [board, gameStatus, lastMoveTime]);

  // AI实现
  const aiMove = useCallback(() => {
    if (currentPlayer !== 'white' || gameStatus !== 'playing') return;

    // 根据难度决定AI的决策行为
    const makeAIDecision = () => {
      // 使用先前创建的智能AI逻辑
      const bestMove = findBestMove(board, 'white');
      
      if (bestMove) {
        const [row, col] = bestMove;
        makeMove(row, col, 'white');
      }
    };

    // 模拟思考时间，难度越高思考时间略长
    const thinkingTime = difficulty === 'easy' ? 500 :
      difficulty === 'medium' ? 1000 :
        difficulty === 'hard' ? 1200 :
          1500;
    setTimeout(makeAIDecision, thinkingTime);
  }, [board, currentPlayer, gameStatus, makeMove, difficulty]);

  useEffect(() => {
    aiMove();
  }, [currentPlayer, aiMove]);

  const startNewGame = (firstPlayer: Player) => {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    setBoard(Object.assign(newBoard, { lastMove: undefined }));
    setCurrentPlayer(firstPlayer);
    setGameStatus('playing');
    setWinner(null);
    setMoves([]);
    setLastMoveTime(Date.now());
  };

 return (
  <div className="min-h-screen bg-white py-2">
    <div className="container mx-auto px-4">
      {/* 小标题，用紫蓝渐变框装饰 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-10 text-center">
        <h1 className="text-2xl font-bold text-white drop-shadow-sm">
          AI 五子棋 | Gomoku
        </h1>
      </div>
      
      <div className="flex flex-wrap gap-8 justify-center items-start max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
          <div className="mb-4 text-center">
            {gameStatus === 'playing' ? (
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 rounded-full shadow-sm border border-blue-100">
                <div className={`w-3 h-3 rounded-full ${
                  currentPlayer === 'black' 
                    ? 'bg-gradient-to-br from-gray-800 to-black' 
                    : 'bg-gradient-to-br from-white to-gray-100 border border-gray-400'
                }`}></div>
                <span className="font-medium text-sm text-blue-800">
                  {currentPlayer === 'black' ? '玩家回合' : 'AI思考中...'}
                </span>
              </div>
            ) : gameStatus === 'finished' && winner ? (
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-green-100 text-green-800 rounded-full shadow-sm border border-green-200">
                <span className="font-medium text-sm">
                  {winner === 'black' ? '玩家获胜!' : 'AI获胜!'}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 text-blue-800 rounded-full shadow-sm border border-blue-100">
                <span className="font-medium text-sm">
                  请选择先手方
                </span>
              </div>
            )}
          </div>
          
          <Board
            board={board}
            currentPlayer={currentPlayer}
            onCellClick={(row, col) => {
              if (currentPlayer === 'black' && gameStatus === 'playing') {
                makeMove(row, col, 'black');
              }
            }}
            disabled={currentPlayer === 'white' || gameStatus !== 'playing'}
          />
          
          {gameStatus === 'finished' && (
            <div className="mt-5 text-center animate-pulse">
              <button 
                onClick={() => startNewGame('black')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md font-medium text-lg"
              >
                开始新游戏
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-6">
          <GameControls
            onNewGame={startNewGame}
            gameStatus={gameStatus}
            currentPlayer={currentPlayer}
            winner={winner}
          />
          
          <MoveHistory moves={moves} />
        </div>
      </div>
    </div>
  </div>
);
};