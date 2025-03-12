import { Board, CellState } from '../types/gomoku';

// 位置评分，用于评估落子位置的价值
const positionScores = (() => {
  // 创建15x15的棋盘位置评分
  const scores: number[][] = Array(15).fill(0).map(() => Array(15).fill(0));

  // 中心位置优先级最高，向外递减
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      // 中心点加权
      const distToCenter = Math.sqrt(Math.pow(i - 7, 2) + Math.pow(j - 7, 2));
      scores[i][j] = Math.max(0, 10 - distToCenter);

      // 额外优化星位
      if ((i === 3 && j === 3) || (i === 3 && j === 11) ||
        (i === 7 && j === 7) ||
        (i === 11 && j === 3) || (i === 11 && j === 11)) {
        scores[i][j] += 2;
      }
    }
  }

  return scores;
})();

// 各种棋型的评分 - 增强评分对比度，特别是防守所需的棋型
const SCORE = {
  FIVE: 10000000,         // 连五
  OPEN_FOUR: 500000,      // 活四，大幅提高活四评分
  FOUR: 100000,           // 冲四，提高10倍
  DOUBLE_THREE: 50000,    // 双活三，提高评分接近冲四
  OPEN_THREE: 10000,      // 活三，提高评分
  THREE: 1000,            // 眠三
  OPEN_TWO: 500,          // 活二
  TWO: 100,               // 眠二
  ONE: 10,                // 单子
  BLOCKED_ONE: 1          // 被堵单子
};

// 检测特定方向上的棋型 - 增强版
const detectPattern = (line: (CellState)[], player: CellState): string => {
  if (!player) return 'NONE';

  const opponent = player === 'black' ? 'white' : 'black';
  const lineStr = line.map(cell => {
    if (cell === player) return 'O';
    if (cell === opponent) return 'X';
    return '.';
  }).join('');

  // 五连
  if (lineStr.includes('OOOOO')) return 'FIVE';

  // 活四: .OOOO. 和更精确的形式
  if (lineStr.includes('.OOOO.') ||
    lineStr.includes('..OOOO') ||
    lineStr.includes('OOOO..')) return 'OPEN_FOUR';

  // 冲四，如 XOOOO., .OOOOX, OOO.O, OO.OO 等
  if (lineStr.includes('XOOOO.') || lineStr.includes('.OOOOX') ||
    lineStr.includes('OOO.O') || lineStr.includes('OO.OO') ||
    lineStr.includes('O.OOO') || lineStr.includes('.OOOX') ||
    lineStr.includes('XOOO.')) return 'FOUR';

  // 活三，更精确的判断
  if (lineStr.includes('.OOO.') ||
    lineStr.includes('..OOO.') || lineStr.includes('.OOO..') ||
    lineStr.includes('.O.OO.') || lineStr.includes('.OO.O.')) return 'OPEN_THREE';

  // 眠三，全部情况
  if (lineStr.includes('XOOO..') || lineStr.includes('..OOOX') ||
    lineStr.includes('XOO.O.') || lineStr.includes('.O.OOX') ||
    lineStr.includes('XO.OO.') || lineStr.includes('.OO.OX') ||
    lineStr.includes('OO.O') || lineStr.includes('O.OO')) return 'THREE';

  // 活二，更精确的判断
  if (lineStr.includes('.OO.') ||
    lineStr.includes('..OO..') ||
    lineStr.includes('.O.O.')) return 'OPEN_TWO';

  // 眠二
  if (lineStr.includes('XOO..') || lineStr.includes('..OOX') ||
    lineStr.includes('XO.O.') || lineStr.includes('.O.OX') ||
    lineStr.includes('O.O')) return 'TWO';

  // 单子
  if (lineStr.includes('.O.')) return 'ONE';
  if (lineStr.includes('XO.') || lineStr.includes('.OX')) return 'BLOCKED_ONE';

  return 'NONE';
};

// 计算特定方向上的棋型评分 - 优化版本
export const evaluateDirection = (board: Board, row: number, col: number, player: CellState, dx: number, dy: number): number => {
  if (!player) return 0;

  const size = board.length;
  const opponent = player === 'black' ? 'white' : 'black';

  // 提取这个方向上的9个位置（当前位置+两侧各4个）- 增加检测范围
  const line: CellState[] = [];

  for (let i = -4; i <= 4; i++) {
    const newRow = row + i * dx;
    const newCol = col + i * dy;

    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
      // 如果是模拟当前位置
      if (i === 0) {
        line.push(player);
      } else {
        line.push(board[newRow][newCol]);
      }
    } else {
      line.push(opponent); // 超出边界视为对手棋子（阻挡）
    }
  }

  // 根据模式识别评分
  const pattern = detectPattern(line, player);
  switch (pattern) {
    case 'FIVE': return SCORE.FIVE;
    case 'OPEN_FOUR': return SCORE.OPEN_FOUR;
    case 'FOUR': return SCORE.FOUR;
    case 'OPEN_THREE': return SCORE.OPEN_THREE;
    case 'THREE': return SCORE.THREE;
    case 'OPEN_TWO': return SCORE.OPEN_TWO;
    case 'TWO': return SCORE.TWO;
    case 'ONE': return SCORE.ONE;
    case 'BLOCKED_ONE': return SCORE.BLOCKED_ONE;
    default: return 0;
  }
};

// 检测双活三、活四活三组合等高级威胁
const checkAdvancedThreats = (board: Board, row: number, col: number, player: CellState): number => {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];

  let openFourCount = 0;
  let fourCount = 0;
  let openThreeCount = 0;

  // 临时落子来评估
  const tempBoard = board.map(r => [...r]);
  tempBoard[row][col] = player;

  // 统计各种威胁的数量
  for (const [dx, dy] of directions) {
    const value = evaluateDirection(tempBoard, row, col, player, dx, dy);
    if (value >= SCORE.OPEN_FOUR) {
      openFourCount++;
    } else if (value >= SCORE.FOUR) {
      fourCount++;
    } else if (value >= SCORE.OPEN_THREE) {
      openThreeCount++;
    }
  }

  // 评估组合威胁
  if (openFourCount >= 1) {
    return SCORE.OPEN_FOUR; // 有活四必胜
  } else if (fourCount >= 2) {
    return SCORE.FOUR * 1.5; // 双冲四，几乎必胜
  } else if (fourCount >= 1 && openThreeCount >= 1) {
    return SCORE.FOUR * 1.2; // 冲四活三组合，高威胁
  } else if (openThreeCount >= 2) {
    return SCORE.DOUBLE_THREE; // 双活三
  }

  return 0;
};

// 评估棋盘上某个位置的得分 - 增强版
export const evaluatePosition = (board: Board, row: number, col: number, player: CellState): number => {
  if (!player || board[row][col] !== null) return 0;

  const directions = [
    [1, 0],  // 水平
    [0, 1],  // 垂直
    [1, 1],  // 右斜
    [1, -1]  // 左斜
  ];

  // 基础位置分
  let score = positionScores[row][col] * 2; // 增加位置权重

  // 检查高级威胁
  const threatScore = checkAdvancedThreats(board, row, col, player);
  if (threatScore > 0) {
    score += threatScore;
  }

  // 模拟落子来评估各方向威胁
  const tempBoard = board.map(r => [...r]);
  tempBoard[row][col] = player;

  for (const [dx, dy] of directions) {
    const patternScore = evaluateDirection(tempBoard, row, col, player, dx, dy);
    score += patternScore;

    // 形成连五直接返回最大分
    if (patternScore >= SCORE.FIVE) {
      return SCORE.FIVE * 2;
    }
  }

  return score;
};

// 极小化极大算法，用于深度搜索最佳落子 - 优化版
const minimax = (
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  player: CellState,
  originalPlayer: CellState // 添加原始玩家参数来区分敌我
): number => {
  // 达到搜索深度或游戏结束时评估棋盘
  if (depth === 0) {
    return evaluateBoard(board, originalPlayer);
  }

  const opponent = player === 'black' ? 'white' : 'black';
  const currentPlayer = isMaximizing ? originalPlayer : (originalPlayer === 'black' ? 'white' : 'black');

  // 获取所有可能的移动，并按初步评估分数排序
  const movesToConsider = depth > 2 ? 5 : 8; // 深度越深，考虑的位置越少，提高效率
  const moves = getTopMoves(board, currentPlayer, movesToConsider);

  if (moves.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;

    for (const move of moves) {
      const { row, col } = move;
      // 模拟落子
      board[row][col] = currentPlayer;
      // 检查是否形成五连
      if (checkWinningMove(board, row, col, currentPlayer)) {
        board[row][col] = null;
        return SCORE.FIVE;
      }
      const evaluation = minimax(board, depth - 1, false, alpha, beta, opponent, originalPlayer);
      // 撤销落子
      board[row][col] = null;

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Alpha-Beta剪枝
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const move of moves) {
      const { row, col } = move;
      // 模拟落子
      board[row][col] = currentPlayer;
      // 检查是否形成五连
      if (checkWinningMove(board, row, col, currentPlayer)) {
        board[row][col] = null;
        return -SCORE.FIVE; // 敌方胜利，这是最坏结果
      }
      const evaluation = minimax(board, depth - 1, true, alpha, beta, opponent, originalPlayer);
      // 撤销落子
      board[row][col] = null;

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha-Beta剪枝
    }

    return minEval;
  }
};

// 快速检查是否获胜，避免重复计算
const checkWinningMove = (board: Board, row: number, col: number, player: CellState): boolean => {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dx, dy] of directions) {
    let count = 1;

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (
        newRow < 0 || newRow >= board.length ||
        newCol < 0 || newCol >= board.length ||
        board[newRow][newCol] !== player
      ) break;
      count++;
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (
        newRow < 0 || newRow >= board.length ||
        newCol < 0 || newCol >= board.length ||
        board[newRow][newCol] !== player
      ) break;
      count++;
    }

    if (count >= 5) return true;
  }

  return false;
};

// 评估整个棋盘状态 - 强化防守，防守中进攻策略
const evaluateBoard = (board: Board, player: CellState): number => {
  let score = 0;
  const opponent = player === 'black' ? 'white' : 'black';

  // 遍历所有位置
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        // 己方落子评分
        const playerScore = evaluatePosition(board, i, j, player);
        // 对手落子评分（防守价值）
        const opponentScore = evaluatePosition(board, i, j, opponent);

        // 防守中进攻策略：高优先级防守，同时看重进攻机会
        // 当对手有高威胁时，防守权重提高至3.0
        const defenseWeight = opponentScore >= SCORE.FOUR ? 3.0 :
          opponentScore >= SCORE.OPEN_THREE ? 2.5 : 2.0;

        // 综合评分：进攻 + 防守
        score += playerScore + opponentScore * defenseWeight;
      }
    }
  }

  return score;
};

// 获取前N个最佳落子位置 - 优化版
const getTopMoves = (board: Board, player: CellState, n: number): { row: number, col: number, score: number }[] => {
  const moves: { row: number, col: number, score: number }[] = [];
  const opponent = player === 'black' ? 'white' : 'black';

  // 首先检查必胜和必防位置
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        // 1. 检查己方能否形成五连
        const tempBoard1 = board.map(row => [...row]);
        tempBoard1[i][j] = player;
        if (checkWinningMove(tempBoard1, i, j, player)) {
          return [{ row: i, col: j, score: SCORE.FIVE * 10 }];
        }

        // 2. 检查对手能否形成五连（必须防守）
        const tempBoard2 = board.map(row => [...row]);
        tempBoard2[i][j] = opponent;
        if (checkWinningMove(tempBoard2, i, j, opponent)) {
          moves.push({ row: i, col: j, score: SCORE.FIVE * 9 });
          // 不立即返回，可能有多个位置需要防守
        }
      }
    }
  }

  // 如果找到必防位置，直接返回
  if (moves.length > 0) {
    return moves.slice(0, n);
  }

  // 按威胁等级检查关键位置
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        // 3. 检查己方能否形成活四
        const tempBoard3 = board.map(row => [...row]);
        tempBoard3[i][j] = player;
        if (hasOpenFour(tempBoard3, i, j, player)) {
          moves.push({ row: i, col: j, score: SCORE.OPEN_FOUR * 1.5 });
          continue;
        }

        // 4. 检查对手能否形成活四（必须防守）
        const tempBoard4 = board.map(row => [...row]);
        tempBoard4[i][j] = opponent;
        if (hasOpenFour(tempBoard4, i, j, opponent)) {
          moves.push({ row: i, col: j, score: SCORE.OPEN_FOUR * 1.4 });
          continue;
        }
      }
    }
  }

  // 如果找到关键威胁位置，直接返回
  if (moves.length > 0) {
    return moves.sort((a, b) => b.score - a.score).slice(0, n);
  }

  // 标准评估，只考虑有棋子周围的位置
  const considered = new Set<string>();

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] !== null) {
        // 搜索周围3格内的位置
        for (let di = -3; di <= 3; di++) {
          for (let dj = -3; dj <= 3; dj++) {
            // 过滤掉太远的位置
            if (Math.abs(di) + Math.abs(dj) > 4) continue;

            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && ni < board.length && nj >= 0 && nj < board[i].length &&
              board[ni][nj] === null) {
              const key = `${ni},${nj}`;
              if (!considered.has(key)) {
                considered.add(key);

                // 计算该位置的评分
                const selfScore = evaluatePosition(board, ni, nj, player);
                const opponentScore = evaluatePosition(board, ni, nj, opponent);

                // 防守中进攻策略：高威胁防守权重提高
                const defenseWeight = opponentScore >= SCORE.OPEN_THREE ? 2.5 : 2.0;
                const totalScore = selfScore + opponentScore * defenseWeight;

                moves.push({ row: ni, col: nj, score: totalScore });
              }
            }
          }
        }
      }
    }
  }

  // 如果棋盘几乎为空，考虑中心和星位点
  if (moves.length === 0) {
    const center = Math.floor(board.length / 2);
    moves.push({ row: center, col: center, score: 100 });

    const stars = [
      [3, 3], [3, 11], [11, 3], [11, 11]
    ];

    for (const [i, j] of stars) {
      if (board[i][j] === null) {
        moves.push({ row: i, col: j, score: 90 });
      }
    }
  }

  // 按分数降序排序并返回前N个
  return moves.sort((a, b) => b.score - a.score).slice(0, n);
};

// 检查是否有活四
const hasOpenFour = (board: Board, row: number, col: number, player: CellState): boolean => {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dx, dy] of directions) {
    if (evaluateDirection(board, row, col, player, dx, dy) >= SCORE.OPEN_FOUR) {
      return true;
    }
  }

  return false;
};

// 检查是否有冲四
const hasFour = (board: Board, row: number, col: number, player: CellState): boolean => {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dx, dy] of directions) {
    if (evaluateDirection(board, row, col, player, dx, dy) >= SCORE.FOUR) {
      return true;
    }
  }

  return false;
};

// 改进版本的最佳落子查找
export const findBestMove = (board: Board, player: CellState): [number, number] | null => {
  // 首局开始时，优先选择中心位置或附近
  const emptyCells = board.flat().filter(cell => cell === null).length;
  if (emptyCells >= 224) { // 几乎空的棋盘
    // 优先选择中心点，然后是偏向中心的位置
    const centerPositions = [
      [7, 7], // 中心
      [6, 7], [7, 6], [8, 7], [7, 8], // 中心周围
    ];

    for (const [i, j] of centerPositions) {
      if (board[i][j] === null) {
        return [i, j];
      }
    }
  }

  // 检查关键位置
  // 1. 己方能否直接获胜
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[i][j] = player;
        if (checkWinningMove(tempBoard, i, j, player)) {
          return [i, j]; // 找到立即获胜的棋
        }
      }
    }
  }

  // 2. 阻止对手直接获胜
  const opponent = player === 'black' ? 'white' : 'black';
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[i][j] = opponent;
        if (checkWinningMove(tempBoard, i, j, opponent)) {
          return [i, j]; // 找到需要阻止的关键位置
        }
      }
    }
  }

  // 3. 己方能否形成活四（必胜）
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[i][j] = player;
        if (hasOpenFour(tempBoard, i, j, player)) {
          return [i, j]; // 己方可以形成活四
        }
      }
    }
  }

  // 4. 阻止对手形成活四
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[i][j] = opponent;
        if (hasOpenFour(tempBoard, i, j, opponent)) {
          return [i, j]; // 阻止对手形成活四
        }
      }
    }
  }

  // 5. 己方能否形成冲四
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[i][j] = player;
        if (hasFour(tempBoard, i, j, player)) {
          return [i, j]; // 己方可以形成冲四
        }
      }
    }
  }

  // 6. 阻止对手形成冲四
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[i][j] = opponent;
        if (hasFour(tempBoard, i, j, opponent)) {
          return [i, j]; // 阻止对手形成冲四
        }
      }
    }
  }

  // 7. 检查己方能否形成双活三
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        if (checkAdvancedThreats(board, i, j, player) >= SCORE.DOUBLE_THREE) {
          return [i, j]; // 己方可以形成双活三
        }
      }
    }
  }

  // 8. 阻止对手形成双活三
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        if (checkAdvancedThreats(board, i, j, opponent) >= SCORE.DOUBLE_THREE) {
          return [i, j]; // 阻止对手形成双活三
        }
      }
    }
  }

  // 获取所有可能的移动并根据初步评估进行排序
  const topMoves = getTopMoves(board, player, 8);

  if (topMoves.length === 0) return null;

  // 对前几个最佳位置进行深度搜索
  let bestScore = -Infinity;
  let bestMove = topMoves[0];

  const tempBoard = board.map(row => [...row]);

  for (const move of topMoves) {
    const { row, col } = move;
    // 模拟落子
    tempBoard[row][col] = player;
    // 增加搜索深度到3，提高决策质量
    const score = minimax(tempBoard, 3, false, -Infinity, Infinity, opponent, player);
    // 撤销落子
    tempBoard[row][col] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // 移除随机性，始终选择最优解
  return [bestMove.row, bestMove.col];
};