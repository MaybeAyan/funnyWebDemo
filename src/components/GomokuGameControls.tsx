import { GameStatus, Player } from '../types/gomoku';

interface GameControlsProps {
  onNewGame: (firstPlayer: Player) => void;
  gameStatus: GameStatus;
  currentPlayer: Player;
  winner: Player | null;
}

export const GameControls = ({ onNewGame, gameStatus, winner }: GameControlsProps) => {
  return (
    <div className="flex flex-col gap-5 p-6 bg-white rounded-lg shadow-xl border border-gray-100 w-96">
      <h3 className="text-xl font-bold text-blue-800 text-center border-b pb-3 border-blue-100">控制面板</h3>
      
      <div className="text-center">
        {gameStatus === 'finished' && winner && (
          <div className="mb-2 text-xl font-bold text-green-600">
            {winner === 'black' ? '黑棋 (玩家)' : '白棋 (电脑)'} 胜利!
          </div>
        )}
        {gameStatus === 'finished' && !winner && (
          <div className="mb-2 text-xl font-bold text-blue-600">
            平局!
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-4 justify-between">
        <button
          onClick={() => onNewGame('black')}
          className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md font-medium"
        >
          重新开始 (玩家先手)
        </button>
        <button
          onClick={() => onNewGame('white')}
          className="w-full py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-md hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-md font-medium border border-gray-300"
        >
          重新开始 (AI先手)
        </button>
      </div>
      
      <div className="mt-2 text-center text-sm text-gray-500">
        落子于线的交叉点，五子连珠获胜
      </div>
    </div>
  );
};