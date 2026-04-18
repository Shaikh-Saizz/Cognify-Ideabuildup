import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Play, RotateCcw, Trophy, Sparkles } from 'lucide-react';

interface MemoryMatchGameProps {
  onClose: () => void;
  onGameOver: (score: number, stats?: { timeTaken: number, errors: number, correct: number, level: number }) => void;
  t: any;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onClose, onGameOver, t }) => {
    const [gameState, setGameState] = useState<'start' | 'showing' | 'playing' | 'gameover'>('start');
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(3);
  const [activeTiles, setActiveTiles] = useState<number[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  
  // Stats tracking
  const [levelStartTime, setLevelStartTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [currentLevelErrors, setCurrentLevelErrors] = useState(0);

  const getAccentColor = () => {
    return 'bg-teal-600';
  };

  const getHoverColor = () => {
    return 'hover:bg-teal-600/80';
  };

  const startLevel = useCallback((currentLevel: number) => {
    // Increase grid size every 3 levels, max 6x6
    const newGridSize = Math.min(3 + Math.floor((currentLevel - 1) / 3), 6);
    setGridSize(newGridSize);
    
    // Number of tiles to remember increases with level
    const numTiles = 2 + currentLevel;
    const totalTiles = newGridSize * newGridSize;
    
    const newActiveTiles: number[] = [];
    while (newActiveTiles.length < numTiles) {
      const randomTile = Math.floor(Math.random() * totalTiles);
      if (!newActiveTiles.includes(randomTile)) {
        newActiveTiles.push(randomTile);
      }
    }
    
    setActiveTiles(newActiveTiles);
    setSelectedTiles([]);
    setCurrentLevelErrors(0);
    setGameState('showing');
    
    // Show tiles for a duration that gets slightly shorter as levels progress
    const showDuration = Math.max(800, 2500 - currentLevel * 100);
    setTimeout(() => {
      setGameState('playing');
      setLevelStartTime(Date.now());
    }, showDuration);
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTotalTime(0);
    setTotalErrors(0);
    setTotalCorrect(0);
    startLevel(1);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;
    if (selectedTiles.includes(index)) return; // Already clicked
    
    if (activeTiles.includes(index)) {
      // Correct click
      const newSelected = [...selectedTiles, index];
      setSelectedTiles(newSelected);
      
      if (newSelected.length === activeTiles.length) {
        // Level complete
        const timeTaken = (Date.now() - levelStartTime) / 1000;
        setTotalTime(t => t + timeTaken);
        setTotalCorrect(c => c + activeTiles.length);
        
        const newScore = score + level * 10;
        setScore(newScore);
        setGameState('showing'); // Temporary state to prevent clicks
        setTimeout(() => {
          setLevel(l => l + 1);
          startLevel(level + 1);
        }, 1000);
      }
    } else {
      // Wrong click! Game Over
      const timeTaken = (Date.now() - levelStartTime) / 1000;
      setGameState('gameover');
      onGameOver(score, {
        timeTaken: totalTime + timeTaken,
        errors: totalErrors + 1,
        correct: totalCorrect + selectedTiles.length,
        level
      });
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-8 flex flex-col items-center justify-center min-h-[500px] overflow-hidden ${
      'bg-white/80 border-white/60 shadow-xl'
    }`}>
      {/* Close Button */}
      <button 
        onClick={onClose}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
          'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
        }`}
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
            <div className={`p-6 rounded-full mb-6 bg-slate-100`}>
              <Sparkles className={`w-16 h-16 text-teal-600`} />
            </div>
            <h2 className={`text-3xl font-bold mb-4 text-slate-900`}>{t.memoryMatch}</h2>
            <p className={`max-w-md mb-8 text-slate-600`}>
              {t.memoryMatchInstructions}
            </p>
            <button 
              onClick={startGame}
              className={`flex items-center px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all shadow-lg ${getAccentColor()} ${getHoverColor()}`}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              {t.startGame}
            </button>
          </motion.div>
        )}

        {(gameState === 'showing' || gameState === 'playing') && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full"
          >
            <div className="flex justify-between w-full mb-8 px-4">
              <div className={`text-lg font-semibold text-slate-700`}>
                {t.level}: <span className={'text-slate-900'}>{level}</span>
              </div>
              <div className={`text-lg font-semibold text-slate-700`}>
                {t.score}: <span className={'text-slate-900'}>{score}</span>
              </div>
            </div>

            <div 
              className="grid gap-2 sm:gap-3"
              style={{ 
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: '100%',
                maxWidth: '400px',
                aspectRatio: '1/1'
              }}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                const isActive = activeTiles.includes(i);
                const isSelected = selectedTiles.includes(i);
                const showActive = gameState === 'showing' && isActive;
                
                return (
                  <motion.button
                    key={i}
                    whileHover={gameState === 'playing' && !isSelected ? { scale: 0.95 } : {}}
                    whileTap={gameState === 'playing' && !isSelected ? { scale: 0.9 } : {}}
                    onClick={() => handleTileClick(i)}
                    className={`rounded-xl transition-all duration-300 ${
                      showActive || isSelected
                        ? getAccentColor() + ' shadow-lg scale-105'
                        : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                    }`}
                  />
                );
              })}
            </div>
            
            <div className="mt-8 h-6">
              {gameState === 'showing' ? (
                <p className={`font-medium animate-pulse text-slate-500`}>{t.memorizePattern}</p>
              ) : (
                <p className={`font-medium text-slate-900`}>{t.recallPattern}</p>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="p-6 rounded-full mb-6 bg-rose-500/20 text-rose-500">
              <Trophy className="w-16 h-16" />
            </div>
            <h2 className={`text-3xl font-bold mb-2 text-slate-900`}>{t.gameOver}</h2>
            <p className={`text-xl mb-6 text-slate-700`}>
              {t.finalScore}: <span className="font-bold">{score}</span>
            </p>
            <p className={`max-w-md mb-8 text-lg font-medium text-slate-600`}>
              "you did good today better luck next time"
            </p>
            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className={`flex items-center px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg ${getAccentColor()} ${getHoverColor()}`}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {t.playAgain}
              </button>
              <button 
                onClick={onClose}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
