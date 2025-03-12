import { Move } from '../types/gomoku';

interface MoveHistoryProps {
  moves: Move[];
}

export const MoveHistory = ({ moves }: MoveHistoryProps) => {
  // 创建倒序排列的记录，最新的显示在顶部
  const reversedMoves = [...moves].reverse();
  
  return (
    <div className="flex flex-col gap-2 p-6 bg-white rounded-lg shadow-xl border border-gray-100 w-96">
      <h3 className="text-xl font-bold text-blue-800 text-center border-b pb-3 border-blue-100">对局记录</h3>
      
      <div className="flex flex-col h-[300px]"> {/* 固定高度容器 */}
        {moves.length === 0 ? (
          <div className="flex-grow text-gray-500 text-sm p-4 bg-gray-50 rounded-md text-center flex items-center justify-center">
            暂无落子记录
          </div>
        ) : (
          <>
            {/* 记录列表，固定高度，可滚动 */}
            <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b">
                    <th className="text-center py-2 px-1 text-gray-600">#</th>
                    <th className="text-center py-2 px-1 text-gray-600">棋手</th>
                    <th className="text-center py-2 px-1 text-gray-600">位置</th>
                    <th className="text-right py-2 px-1 text-gray-600">思考时间</th>
                  </tr>
                </thead>
                <tbody>
                  {reversedMoves.map((move, index) => {
                    // 实际落子编号
                    const actualMoveNumber = moves.length - index;
                    
                    return (
                      <tr key={index} className={`border-b border-gray-100 hover:bg-blue-50 ${index === 0 ? 'bg-blue-50' : ''}`}>
                        <td className="py-2 px-1 text-center">{actualMoveNumber}</td>
                        <td className="py-2 px-1 text-center">
                          <span className={`inline-block w-4 h-4 rounded-full mr-1 align-middle ${move.player === 'black' ? 'bg-black' : 'bg-white border border-gray-300'}`}></span>
                          {move.player === 'black' ? '黑' : '白'}
                        </td>
                        <td className="py-2 px-1 text-center">{`(${move.row},${move.col})`}</td>
                        <td className="text-right py-2 px-1 font-mono">{`${(move.thinkingTime / 1000).toFixed(1)}s`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* 固定在底部的统计信息 */}
            <div className="mt-3 pt-3 text-xs text-gray-500 text-center border-t border-gray-100 bg-white">
              总计: {moves.length} 步 | 
              黑棋: {moves.filter(m => m.player === 'black').length} 步 | 
              白棋: {moves.filter(m => m.player === 'white').length} 步
            </div>
          </>
        )}
      </div>
    </div>
  );
};