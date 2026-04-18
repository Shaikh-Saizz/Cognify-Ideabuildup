import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, Timer, Trophy, Play, RotateCcw, X } from 'lucide-react';

interface NumberRecallGameProps {
  onClose: () => void;
  onGameOver: (score: number, stats?: { timeTaken: number, errors: number, correct: number, level: number }) => void;
  t: any;
}

export const NumberRecallGame: React.FC<NumberRecallGameProps> = ({ onClose, onGameOver, t }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover'>('intro');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [wrongNumber, setWrongNumber] = useState<number | null>(null);

  const generateNumbers = useCallback((lvl: number) => {
    const count = Math.min(3 + Math.floor(lvl / 2), 12);
    const step = Math.floor(Math.random() * 3) + 1 + Math.floor(lvl / 4);
    const start = Math.floor(Math.random() * 50) + 1;
    const seq = Array.from({ length: count }, (_, i) => start + i * step);
    return seq.sort(() => Math.random() - 0.5);
  }, []);

  const startGame = () => {
    setGameState('playing');
    setLevel(1);
    setScore(0);
    setTimeLeft(60);
    setTotalErrors(0);
    setTotalCorrect(0);
    setNumbers(generateNumbers(1));
    setSelectedNumbers([]);
  };

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      setGameState('gameover');
      onGameOver(score, {
        timeTaken: 60,
        errors: totalErrors,
        correct: totalCorrect,
        level
      });
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, score, totalErrors, totalCorrect, level, onGameOver]);

  const handleNumberClick = (num: number) => {
    if (selectedNumbers.includes(num)) return;

    const sorted = [...numbers].sort((a, b) => a - b);
    const expected = sorted[selectedNumbers.length];

    if (num === expected) {
      const newSelected = [...selectedNumbers, num];
      setSelectedNumbers(newSelected);
      setScore(s => s + 10 + level * 2);
      setTotalCorrect(c => c + 1);

      if (newSelected.length === numbers.length) {
        setTimeout(() => {
          setLevel(l => l + 1);
          setNumbers(generateNumbers(level + 1));
          setSelectedNumbers([]);
          setTimeLeft(t => Math.min(t + 5, 60)); // Bonus time
        }, 300);
      }
    } else {
      setTotalErrors(e => e + 1);
      setScore(s => Math.max(0, s - 5));
      setWrongNumber(num);
      
      // End game immediately on wrong answer
      setTimeout(() => {
        setGameState('gameover');
        onGameOver(score, {
          timeTaken: 60 - timeLeft,
          errors: totalErrors + 1,
          correct: totalCorrect,
          level
        });
      }, 500);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-8 flex flex-col items-center justify-center min-h-[500px] overflow-hidden bg-white/90 border-white shadow-xl">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <AnimatePresence mode="wait">
        {gameState === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center"
          >
            <div className="p-6 rounded-full mb-6 bg-amber-100">
              <Hash className="w-16 h-16 text-amber-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900">{t.numberRecall || 'Number Recall'}</h2>
            <p className="max-w-md mb-8 text-slate-600">
              {t.numberRecallInstructions || 'Click the numbers in ascending (lowest to highest) order. The game gets harder with more numbers and larger gaps. Be quick and accurate!'}
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30"
            >
              <Play className="w-5 h-5" />
              {t.startGame || 'Start Game'}
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-8 px-4">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-slate-700">{score}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                <div className="font-bold text-slate-700">Lvl {level}</div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                <Timer className="w-5 h-5" />
                <span className="font-bold">{timeLeft}s</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-w-lg">
              {numbers.map((num, i) => {
                const isSelected = selectedNumbers.includes(num);
                const isWrong = wrongNumber === num;
                
                return (
                  <motion.button
                    key={`${num}-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: isWrong ? [-10, 10, -10, 10, 0] : 0
                    }}
                    transition={{ 
                      duration: isWrong ? 0.4 : 0.2,
                      delay: isWrong ? 0 : i * 0.05
                    }}
                    onClick={() => handleNumberClick(num)}
                    disabled={isSelected}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-2xl sm:text-3xl font-bold flex items-center justify-center shadow-md transition-all ${
                      isSelected 
                        ? 'bg-amber-500 text-white scale-95 opacity-50' 
                        : isWrong
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-slate-800 hover:bg-amber-50 hover:text-amber-600 hover:-translate-y-1 hover:shadow-lg border-2 border-slate-100'
                    }`}
                  >
                    {num}
                  </motion.button>
                );
              })}
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
            <div className="p-6 rounded-full mb-6 bg-amber-100">
              <Trophy className="w-16 h-16 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-slate-900">{t.timeUp || 'Time\'s Up!'}</h2>
            <p className="text-slate-500 mb-8">{t.greatJob || 'Great job training your brain today.'}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">{t.finalScore || 'Final Score'}</div>
                <div className="text-2xl font-bold text-amber-600">{score}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">{t.levelReached || 'Level Reached'}</div>
                <div className="text-2xl font-bold text-slate-700">{level}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">{t.accuracy || 'Accuracy'}</div>
                <div className="text-xl font-bold text-slate-700">
                  {totalCorrect + totalErrors > 0 
                    ? Math.round((totalCorrect / (totalCorrect + totalErrors)) * 100) 
                    : 0}%
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">{t.errors || 'Errors'}</div>
                <div className="text-xl font-bold text-red-500">{totalErrors}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t.backToDashboard || 'Back to Dashboard'}
              </button>
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30"
              >
                <RotateCcw className="w-5 h-5" />
                {t.playAgain || 'Play Again'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
