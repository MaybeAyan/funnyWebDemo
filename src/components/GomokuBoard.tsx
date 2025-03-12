import { CellState, Player } from '../types/gomoku';
import { useState } from 'react';

interface BoardProps {
  board: CellState[][] & { lastMove?: { row: number, col: number } };
  onCellClick: (row: number, col: number) => void;
  currentPlayer: Player;
  disabled?: boolean;
}

export const Board = ({ board, onCellClick, currentPlayer, disabled }: BoardProps) => {
  const [hoverPosition, setHoverPosition] = useState<{row: number, col: number} | null>(null);

  // 增加棋盘尺寸
  const cellSize = 32; // 增大单元格尺寸
  const boardSize = cellSize * 14; // 14格间隙

  return (
    <div className="relative transition-all duration-300 hover:scale-102 hover:-translate-y-1">
      <div className="bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 p-6 rounded-lg shadow-xl border border-amber-300 transition-all duration-300">
        {/* 绘制棋盘背景 - 调整为肤色系 */}
        <div className="relative" style={{ width: `${boardSize}px`, height: `${boardSize}px` }}>
          {/* 横线 */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={`h-${i}`} 
              className="absolute h-[1px] bg-amber-800/60 left-0 right-0"
              style={{ top: `${i * cellSize}px` }}
            />
          ))}
          
          {/* 竖线 */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={`v-${i}`} 
              className="absolute w-[1px] bg-amber-800/60 top-0 bottom-0"
              style={{ left: `${i * cellSize}px` }}
            />
          ))}
          
          {/* 星位标记 */}
          {[
            [3, 3], [3, 11], 
            [7, 7], 
            [11, 3], [11, 11]
          ].map(([row, col]) => (
            <div 
              key={`star-${row}-${col}`}
              className="absolute w-2 h-2 bg-amber-800 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${col * cellSize}px`, 
                top: `${row * cellSize}px` 
              }}
            />
          ))}
          
          {/* 点击区域和棋子 */}
          {board.map((row, i) =>
            row.map((cell, j) => {
              // 高亮最后一步落子
              const isLastMove = board.lastMove && i === board.lastMove.row && j === board.lastMove.col;
              const isHovering = hoverPosition && hoverPosition.row === i && hoverPosition.col === j;
              
              return (
                <div
                  key={`${i}-${j}`}
                  className={`
                    absolute w-7 h-7 transform -translate-x-1/2 -translate-y-1/2
                    cursor-pointer z-10
                    ${isLastMove ? 'after:absolute after:w-7 after:h-7 after:rounded-full after:bg-amber-400/30 after:-z-10 after:animate-pulse' : ''}
                  `}
                  style={{ 
                    left: `${j * cellSize}px`,
                    top: `${i * cellSize}px`
                  }}
                  onClick={() => !disabled && onCellClick(i, j)}
                  onMouseEnter={() => !cell && !disabled && setHoverPosition({row: i, col: j})}
                  onMouseLeave={() => setHoverPosition(null)}
                >
                  {/* 棋子 - 略微增大 */}
                  {cell ? (
                    <div
                      className={`
                        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                        w-[28px] h-[28px] rounded-full
                        ${isLastMove ? 'ring-2 ring-amber-500' : ''}
                        ${cell === 'black' 
                          ? 'bg-gradient-to-br from-gray-700 to-black shadow-[0_3px_5px_rgba(0,0,0,0.5)]' 
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.2)] border-2 border-gray-300'
                        }
                        before:content-[""] before:absolute before:top-1 before:left-2 before:w-3 before:h-1 
                        before:bg-white before:opacity-40 before:rounded-full
                        ${cell === 'white' 
                          ? 'before:rotate-45 before:opacity-75' 
                          : 'before:rotate-30'
                        }
                      `}
                    />
                  ) : (
                    // 悬停预览效果
                    isHovering && !disabled && (
                      <div
                        className={`
                          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                          w-[28px] h-[28px] rounded-full opacity-40 transition-opacity
                          ${currentPlayer === 'black' 
                            ? 'bg-black' 
                            : 'bg-white border-2 border-gray-300'}
                        `}
                      />
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};