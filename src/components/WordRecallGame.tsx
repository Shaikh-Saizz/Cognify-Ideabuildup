import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Timer, Trophy, Play, RotateCcw, X, Brain } from 'lucide-react';

interface WordRecallGameProps {
  onClose: () => void;
  onGameOver: (score: number, stats?: { timeTaken: number, errors: number, correct: number, level: number }) => void;
  t: any;
}

const wordBanks = {
  1: {
    adj: ['swift', 'clever', 'silent', 'gentle', 'fierce', 'bright', 'dark', 'heavy', 'light', 'solid'],
    noun: ['river', 'forest', 'eagle', 'storm', 'ocean', 'desert', 'mountain', 'valley', 'shadow', 'flame'],
    verb: ['rushes', 'whispers', 'soars', 'strikes', 'crashes', 'drifts', 'rises', 'falls', 'fades', 'burns'],
    adv: ['quickly', 'softly', 'high', 'hard', 'deeply', 'slowly', 'steadily', 'freely', 'quietly', 'brightly']
  },
  2: {
    adj: ['ancient', 'hidden', 'sacred', 'mystic', 'hollow', 'bitter', 'golden', 'silver', 'crimson', 'azure'],
    noun: ['temple', 'cavern', 'relic', 'spirit', 'echo', 'truth', 'crown', 'sword', 'shield', 'throne'],
    verb: ['slumbers', 'awakens', 'glows', 'shatters', 'endures', 'reveals', 'conceals', 'binds', 'breaks', 'weeps'],
    adv: ['silently', 'suddenly', 'faintly', 'fiercely', 'forever', 'never', 'always', 'rarely', 'often', 'seldom']
  },
  3: {
    adj: ['enigmatic', 'ephemeral', 'luminous', 'obscure', 'radiant', 'somber', 'tranquil', 'vibrant', 'zealous', 'astute'],
    noun: ['paradox', 'illusion', 'mirage', 'enigma', 'spectacle', 'solitude', 'harmony', 'chaos', 'zealot', 'scholar'],
    verb: ['manifests', 'dissipates', 'illuminates', 'obscures', 'resonates', 'lingers', 'harmonizes', 'disrupts', 'inspires', 'ponders'],
    adv: ['mysteriously', 'fleetingly', 'brilliantly', 'dimly', 'powerfully', 'faintly', 'peacefully', 'wildly', 'passionately', 'wisely']
  },
  4: {
    adj: ['ineffable', 'mellifluous', 'serendipitous', 'ubiquitous', 'vicarious', 'whimsical', 'zealous', 'arcane', 'bucolic', 'cacophonous'],
    noun: ['epiphany', 'cacophony', 'serendipity', 'ubiquity', 'vicissitude', 'whimsy', 'zealotry', 'arcanum', 'bucolia', 'euphony'],
    verb: ['transcends', 'reverberates', 'materializes', 'permeates', 'fluctuates', 'captivates', 'galvanizes', 'mystifies', 'soothes', 'deafens'],
    adv: ['ineffably', 'mellifluously', 'serendipitously', 'ubiquitously', 'vicariously', 'whimsically', 'zealously', 'arcanely', 'bucolically', 'cacophonously']
  },
  5: {
    adj: ['perspicacious', 'recalcitrant', 'sycophantic', 'trepidatious', 'ubiquitous', 'vociferous', 'winsome', 'xenophobic', 'yielding', 'zealous'],
    noun: ['perspicacity', 'recalcitrance', 'sycophancy', 'trepidation', 'ubiquity', 'vociferation', 'winsomeness', 'xenophobia', 'yield', 'zeal'],
    verb: ['elucidates', 'obfuscates', 'placates', 'exacerbates', 'mitigates', 'vindicates', 'repudiates', 'corroborates', 'equivocates', 'postulates'],
    adv: ['perspicaciously', 'recalcitrantly', 'sycophantically', 'trepidatiously', 'ubiquitously', 'vociferously', 'winsomely', 'xenophobically', 'yieldingly', 'zealously']
  }
};

export const WordRecallGame: React.FC<WordRecallGameProps> = ({ onClose, onGameOver, t }) => {
  const [gameState, setGameState] = useState<'intro' | 'memorize' | 'recall' | 'gameover'>('intro');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(10);
  const [recallTimeLeft, setRecallTimeLeft] = useState(30);
  const [currentSentence, setCurrentSentence] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);

  const getLevelWords = useCallback((lvl: number) => {
    const difficulty = Math.min(Math.ceil(lvl / 2), 5);
    return wordBanks[difficulty as keyof typeof wordBanks];
  }, []);

  const startLevel = useCallback((lvl: number) => {
    const words = getLevelWords(lvl);
    const adj = () => words.adj[Math.floor(Math.random() * words.adj.length)];
    const noun = () => words.noun[Math.floor(Math.random() * words.noun.length)];
    const verb = () => words.verb[Math.floor(Math.random() * words.verb.length)];
    const adv = () => words.adv[Math.floor(Math.random() * words.adv.length)];

    let sentence = "";
    let targetWords: string[] = [];

    if (lvl === 1) {
      const a = adj(), n = noun(), v = verb();
      sentence = `The ${a} ${n} ${v}.`;
      targetWords = [a, n, v];
    } else if (lvl === 2) {
      const a = adj(), n = noun(), v = verb(), ad = adv();
      sentence = `The ${a} ${n} ${v} ${ad}.`;
      targetWords = [a, n, v, ad];
    } else if (lvl === 3) {
      const a1 = adj(), n1 = noun(), v = verb(), a2 = adj(), n2 = noun();
      sentence = `The ${a1} ${n1} ${v} the ${a2} ${n2}.`;
      targetWords = [a1, n1, v, a2, n2];
    } else if (lvl === 4) {
      const a1 = adj(), n1 = noun(), v1 = verb(), ad = adv(), a2 = adj(), n2 = noun();
      sentence = `The ${a1} ${n1} ${v1} ${ad} near the ${a2} ${n2}.`;
      targetWords = [a1, n1, v1, ad, a2, n2];
    } else {
      const a1 = adj(), n1 = noun(), v1 = verb(), ad1 = adv(), a2 = adj(), n2 = noun(), v2 = verb();
      sentence = `While the ${a1} ${n1} ${v1} ${ad1}, the ${a2} ${n2} ${v2}.`;
      targetWords = [a1, n1, v1, ad1, a2, n2, v2];
    }

    const numCorrect = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    const shuffledTargets = [...new Set(targetWords)].sort(() => Math.random() - 0.5);
    const correctOpts = shuffledTargets.slice(0, numCorrect);

    const wrongOpts: string[] = [];
    const allWords = [...words.adj, ...words.noun, ...words.verb, ...words.adv];
    while (wrongOpts.length < 6 - numCorrect) {
      const w = allWords[Math.floor(Math.random() * allWords.length)];
      if (!targetWords.includes(w) && !wrongOpts.includes(w)) {
        wrongOpts.push(w);
      }
    }

    const opts = [...correctOpts, ...wrongOpts].sort(() => Math.random() - 0.5);

    setCurrentSentence(sentence);
    setCorrectOptions(correctOpts);
    setOptions(opts);
    setSelectedOptions([]);
    setMemorizeTimeLeft(10);
    setRecallTimeLeft(30);
    setGameState('memorize');
  }, [getLevelWords]);

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
      setGameState('recall');
    } else if (gameState === 'recall' && recallTimeLeft > 0) {
      timer = window.setInterval(() => {
        setRecallTimeLeft(prev => prev - 1);
        setTotalTimeTaken(prev => prev + 1);
      }, 1000);
    } else if (gameState === 'recall' && recallTimeLeft === 0) {
      setGameState('gameover');
      onGameOver(score, {
        timeTaken: totalTimeTaken,
        errors: totalErrors,
        correct: totalCorrect,
        level
      });
    }
    return () => clearInterval(timer);
  }, [gameState, memorizeTimeLeft, recallTimeLeft, score, totalErrors, totalCorrect, level, totalTimeTaken, onGameOver]);

  const handleOptionClick = (option: string) => {
    if (selectedOptions.includes(option)) return;

    const newSelected = [...selectedOptions, option];
    setSelectedOptions(newSelected);

    if (correctOptions.includes(option)) {
      setScore(s => s + 15 + level * 5 + recallTimeLeft); // Bonus for speed
      setTotalCorrect(c => c + 1);
      
      const correctSelected = newSelected.filter(o => correctOptions.includes(o));
      if (correctSelected.length === correctOptions.length) {
        setTimeout(() => {
          setLevel(l => l + 1);
          startLevel(level + 1);
        }, 1000);
      }
    } else {
      setTotalErrors(e => e + 1);
      setScore(s => Math.max(0, s - 10));
      
      // End game immediately on wrong answer
      setTimeout(() => {
        setGameState('gameover');
        onGameOver(score, {
          timeTaken: totalTimeTaken,
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
            <div className="p-6 rounded-full mb-6 bg-rose-100">
              <BookOpen className="w-16 h-16 text-rose-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900">{t.wordRecall || 'Word Recall'}</h2>
            <p className="max-w-md mb-8 text-slate-600">
              {t.wordRecallInstructions || 'Memorize the sentence. After 10 seconds, it will flip. Select the words that were in the sentence from the options provided. Be fast and accurate!'}
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30"
            >
              <Play className="w-5 h-5" />
              {t.startGame || 'Start Game'}
            </button>
          </motion.div>
        )}

        {gameState === 'memorize' && (
          <motion.div
            key="memorize"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-8 px-4">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                <Trophy className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-slate-700">{score}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                <div className="font-bold text-slate-700">Lvl {level}</div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${memorizeTimeLeft <= 3 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                <Timer className="w-5 h-5" />
                <span className="font-bold">{memorizeTimeLeft}s</span>
              </div>
            </div>

            <div className="w-full max-w-lg bg-slate-50 border-2 border-slate-200 rounded-3xl p-8 text-center shadow-inner min-h-[200px] flex items-center justify-center">
              <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed capitalize">
                {currentSentence}
              </p>
            </div>
            <p className="mt-6 text-slate-500 font-medium animate-pulse">Memorize this sentence...</p>
          </motion.div>
        )}

        {gameState === 'recall' && (
          <motion.div
            key="recall"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-8 px-4">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                <Trophy className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-slate-700">{score}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                <div className="font-bold text-slate-700">Lvl {level}</div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${recallTimeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                <Timer className="w-5 h-5" />
                <span className="font-bold">{recallTimeLeft}s</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">
              Select {correctOptions.length} word{correctOptions.length > 1 ? 's' : ''} from the sentence:
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-lg">
              {options.map((option, i) => {
                const isSelected = selectedOptions.includes(option);
                const isCorrect = correctOptions.includes(option);
                
                let btnClass = "bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:-translate-y-1 hover:shadow-lg border-2 border-slate-200";
                
                if (isSelected) {
                  if (isCorrect) {
                    btnClass = "bg-emerald-500 text-white border-emerald-600 scale-95";
                  } else {
                    btnClass = "bg-red-500 text-white border-red-600 scale-95 opacity-50";
                  }
                }

                return (
                  <motion.button
                    key={`${option}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleOptionClick(option)}
                    disabled={isSelected}
                    className={`px-4 py-4 rounded-2xl text-lg font-semibold transition-all shadow-sm ${btnClass}`}
                  >
                    {option}
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
            <div className="p-6 rounded-full mb-6 bg-rose-100">
              <Trophy className="w-16 h-16 text-rose-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-slate-900">{t.timeUp || 'Time\'s Up!'}</h2>
            <p className="text-slate-500 mb-8">{t.greatJob || 'Great job training your brain today.'}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">{t.finalScore || 'Final Score'}</div>
                <div className="text-2xl font-bold text-rose-600">{score}</div>
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
                className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30"
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
