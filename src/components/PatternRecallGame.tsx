import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Star, Circle, Square, Hexagon, Octagon, Cloud, 
  Moon, Sun, Zap, Snowflake, Droplet, Flame, Leaf, Music, 
  Bell, Camera, Umbrella, Heart, Target, Eye, HelpCircle, LayoutGrid
} from 'lucide-react';

const ICONS = [
  Star, Circle, Square, Hexagon, Octagon, Cloud, Moon, Sun, 
  Zap, Snowflake, Droplet, Flame, Leaf, Music, Bell, Camera, 
  Umbrella, Heart, Target, Eye
];

interface PatternRecallGameProps {
  onClose: () => void;
  onGameOver: (score: number, stats: { timeTaken: number, errors: number, correct: number, level: number }) => void;
  t: any;
}

export const PatternRecallGame: React.FC<PatternRecallGameProps> = ({ onClose, onGameOver, t }) => {
  const [gameState, setGameState] = useState<'start' | 'memorize' | 'play' | 'gameover'>('start');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [targetIconIndex, setTargetIconIndex] = useState<number>(0);
  const [grid, setGrid] = useState<number[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(5);
  const [playTimeLeft, setPlayTimeLeft] = useState(15);
  
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [wrongSelection, setWrongSelection] = useState<number | null>(null);

  const startLevel = useCallback((currentLevel: number) => {
    // Determine Target
    const targetIdx = Math.floor(Math.random() * ICONS.length);
    setTargetIconIndex(targetIdx);

    // Determine how many targets to hide (complexity increases with level)
    const numTargets = Math.min(2 + Math.floor(currentLevel / 2), 8);
    
    // Fill grid logic
    const newGrid = Array(25).fill(-1);
    const targetPositions = new Set<number>();
    
    while (targetPositions.size < numTargets) {
      targetPositions.add(Math.floor(Math.random() * 25));
    }
    
    for (let i = 0; i < 25; i++) {
      if (targetPositions.has(i)) {
        newGrid[i] = targetIdx;
      } else {
        // Pick a completely different random icon
        let randomWrongIdx;
        do {
          randomWrongIdx = Math.floor(Math.random() * ICONS.length);
        } while (randomWrongIdx === targetIdx);
        newGrid[i] = randomWrongIdx;
      }
    }

    setGrid(newGrid);
    setSelectedIndices([]);
    setMemorizeTimeLeft(5);
    // Base 15 seconds + slightly tighter restrictions occasionally
    setPlayTimeLeft(Math.max(10, 20 - Math.floor(currentLevel / 3)));
    setGameState('memorize');
  }, []);

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setTotalErrors(0);
    setTotalCorrect(0);
    setTotalTimeTaken(0);
    startLevel(1);
  };

  useEffect(() => {
    let timer: number;
    if (gameState === 'memorize' && memorizeTimeLeft > 0) {
      timer = window.setInterval(() => {
        setMemorizeTimeLeft(prev => prev - 1);
        setTotalTimeTaken(prev => prev + 1);
      }, 1000);
    } else if (gameState === 'memorize' && memorizeTimeLeft === 0) {
      setGameState('play');
    } else if (gameState === 'play' && playTimeLeft > 0) {
      timer = window.setInterval(() => {
        setPlayTimeLeft(prev => prev - 1);
        setTotalTimeTaken(prev => prev + 1);
      }, 1000);
    } else if (gameState === 'play' && playTimeLeft === 0) {
      // Out of time
      setGameState('gameover');
    }
    return () => clearInterval(timer);
  }, [gameState, memorizeTimeLeft, playTimeLeft]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'play' || selectedIndices.includes(index) || wrongSelection !== null) return;

    const clickedIconIdx = grid[index];
    if (clickedIconIdx === targetIconIndex) {
      // Correct!
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);
      setScore(s => s + 10 + level * 2 + playTimeLeft);
      setTotalCorrect(c => c + 1);
      
      const totalTargets = grid.filter(idx => idx === targetIconIndex).length;
      if (newSelected.length === totalTargets) {
        setTimeout(() => {
          setLevel(l => l + 1);
          startLevel(level + 1);
        }, 800);
      }
    } else {
      // Wrong choice - immediate game over
      setTotalErrors(e => e + 1);
      setScore(s => Math.max(0, s - 10));
      setWrongSelection(index);
      
      setTimeout(() => {
        setGameState('gameover');
      }, 600);
    }
  };

  const handleGameOverFinish = () => {
    onGameOver(score, {
      timeTaken: totalTimeTaken,
      errors: totalErrors,
      correct: totalCorrect,
      level
    });
    onClose();
  };

  const TargetIcon = ICONS[targetIconIndex] || HelpCircle;

  return (
    <div className={`relative w-full max-w-2xl mx-auto rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-8 flex flex-col items-center justify-center min-h-[550px] overflow-hidden ${
      'bg-white/90 border-white shadow-xl'
    }`}>
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            <div className={`p-6 rounded-full mb-6 bg-emerald-100 shadow-inner`}>
              <LayoutGrid className={`w-16 h-16 text-emerald-600`} />
            </div>
            <h2 className={`text-3xl font-bold mb-4 text-slate-900`}>{t.patternRecall || 'Pattern Recall'}</h2>
            <p className={`max-w-md mb-8 text-slate-600 leading-relaxed`}>
              {t.patternRecallDesc || 'Memorize the target pattern shown at the top. When the grid appears, find and select everyone matching the target pattern before time runs out! Selecting the wrong pattern ends the game.'}
            </p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/30 flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              {t.startGame}
            </button>
          </motion.div>
        )}

        {(gameState === 'memorize' || gameState === 'play') && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center"
          >
            {/* Top Bar with 3 Boxes */}
            <div className="flex w-full justify-between items-center mb-8 gap-4">
              {/* Timer Box */}
              <div className="flex-1 flex flex-col items-center bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                <span className="text-sm text-slate-500 font-medium mb-1">Time</span>
                <span className={`text-2xl font-bold font-mono ${gameState === 'memorize' ? 'text-blue-500' : playTimeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                  00:{gameState === 'memorize' ? memorizeTimeLeft.toString().padStart(2, '0') : playTimeLeft.toString().padStart(2, '0')}
                </span>
              </div>

              {/* Target Pattern Box */}
              <div className="flex-1 flex flex-col items-center bg-white border-2 border-emerald-100 rounded-2xl p-4 shadow-md transform scale-110 z-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/50"></div>
                <span className="text-sm text-emerald-600 font-bold mb-1 relative z-10">Target</span>
                <div className="h-8 flex items-center justify-center relative z-10">
                  {gameState === 'memorize' ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                    >
                      <TargetIcon className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <HelpCircle className="w-8 h-8 text-slate-300" strokeWidth={2} />
                  )}
                </div>
              </div>

              {/* Level Box */}
              <div className="flex-1 flex flex-col items-center bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                <span className="text-sm text-slate-500 font-medium mb-1">Level</span>
                <span className="text-2xl font-bold text-slate-700">{level}</span>
              </div>
            </div>

            {/* Play Arena (5x5 Grid) */}
            <div className="bg-slate-100/50 p-4 sm:p-6 rounded-3xl border border-white/50 shadow-inner w-full max-w-[400px]">
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {grid.map((iconIdx, i) => {
                  const Icon = ICONS[iconIdx] || HelpCircle;
                  const isSelected = selectedIndices.includes(i);
                  const isWrong = wrongSelection === i;
                  
                  return (
                    <motion.button
                      key={i}
                      whileHover={gameState === 'play' && !isSelected && !wrongSelection ? { scale: 1.05 } : {}}
                      whileTap={gameState === 'play' && !isSelected && !wrongSelection ? { scale: 0.95 } : {}}
                      onClick={() => handleTileClick(i)}
                      disabled={gameState !== 'play' || isSelected || wrongSelection !== null}
                      animate={
                        isWrong ? { x: [-5, 5, -5, 5, 0], backgroundColor: '#fecdd3' } : {}
                      }
                      transition={{ duration: 0.4 }}
                      className={`
                        aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300
                        ${gameState === 'memorize' ? 'bg-slate-200/50 opacity-0 cursor-not-allowed' : 'bg-white cursor-pointer hover:shadow-md border-b-4 border-slate-200 active:border-b-0 active:translate-y-1'}
                        ${isSelected ? 'bg-emerald-100 border-none opacity-50 scale-95 shadow-none' : ''}
                        ${isWrong ? 'border-rose-500 text-rose-600' : 'text-slate-600'}
                      `}
                    >
                      {gameState === 'play' && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: Math.random() * 0.2 }}
                        >
                          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${isSelected ? 'text-emerald-500' : isWrong ? 'text-rose-500' : ''}`} strokeWidth={2} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center w-full max-w-sm mx-auto"
          >
            <div className={`p-6 rounded-full mb-6 bg-rose-100`}>
              <Target className={`w-16 h-16 text-rose-500`} />
            </div>
            <h2 className={`text-3xl font-bold mb-2 text-slate-900`}>{t.gameOver || 'Game Over!'}</h2>
            <p className={`text-slate-500 mb-8`}>{t.greatJob || 'Great effort! Let\'s see how you did.'}</p>
            
            <div className={`w-full p-6 rounded-2xl mb-8 border flex flex-col gap-4 bg-slate-50 border-slate-200`}>
              <div className="flex justify-between items-center">
                <span className={`text-slate-600`}>{t.finalScore || 'Final Score'}:</span>
                <span className={`text-2xl font-bold text-slate-900`}>{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-slate-600`}>{t.levelReached || 'Level Reached'}:</span>
                <span className={`text-xl font-semibold text-slate-700`}>{level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-slate-600`}>{t.accuracy || 'Accuracy'}:</span>
                <span className={`text-lg font-medium text-slate-700`}>
                  {Math.round((totalCorrect / (totalCorrect + totalErrors || 1)) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                onClick={startGame}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-colors bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25`}
              >
                {t.playAgain || 'Play Again'}
              </button>
              <button 
                onClick={handleGameOverFinish}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-colors border-2 border-slate-200 hover:bg-slate-100 text-slate-700`}
              >
                {t.backToDashboard || 'Go Back'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
