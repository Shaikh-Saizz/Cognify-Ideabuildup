import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, LayoutDashboard, Gamepad2, Settings, LogOut, User, Calendar, UserCircle, MapPin, Phone, Menu, X, Mic, Square, BookOpen, Play, Pause, FileText, AudioLines, AlertTriangle, Info, BrainCircuit, Sparkles, Puzzle, ChevronLeft, ChevronRight, Hash, Star, UploadCloud, Stethoscope, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { translations, Language } from './translations';
import { MemoryMatchGame } from './components/MemoryMatchGame';
import { NumberRecallGame } from './components/NumberRecallGame';
import { WordRecallGame } from './components/WordRecallGame';
import { PatternRecallGame } from './components/PatternRecallGame';
import { TimeSpentCalendar } from './components/TimeSpentCalendar';
import { AudioPlayer } from './components/AudioPlayer';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

const progressData = [
  { day: 'Day 1', memoryMatch: 40, patternRecall: 50 },
  { day: 'Day 2', memoryMatch: 55, patternRecall: 60 },
  { day: 'Day 3', memoryMatch: 45, patternRecall: 55 },
  { day: 'Day 4', memoryMatch: 70, patternRecall: 75 },
  { day: 'Day 5', memoryMatch: 65, patternRecall: 80 },
  { day: 'Day 6', memoryMatch: 85, patternRecall: 90 },
  { day: 'Day 7', memoryMatch: 90, patternRecall: 95 },
];

const quotaData = [
  { name: 'Completed', value: 75 },
  { name: 'Remaining', value: 25 },
];
const PIE_COLORS = ['#d946ef', '#06b6d4']; // fuchsia-500, cyan-500

interface DashboardProps {
  email: string;
  age: string;
  onLogout: () => void;
  lang: Language;
}

interface Memory {
  id: string;
  date: string;
  type: 'text' | 'audio';
  content: string; // text content or base64 audio
}

const yogaPoses = [
  {
    id: 'vrishasana',
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="20" r="7" fill="currentColor" />
        {/* Torso */}
        <line x1="50" y1="27" x2="50" y2="55" />
        {/* Leg Straight */}
        <line x1="50" y1="55" x2="50" y2="90" />
        {/* Leg Bent */}
        <polyline points="50,55 75,60 50,75" />
        {/* Arms in Prayer */}
        <polyline points="50,27 30,35 50,45" />
        <polyline points="50,27 70,35 50,45" />
      </svg>
    )
  },
  {
    id: 'sidhasana',
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="30" r="7" fill="currentColor" />
        {/* Torso */}
        <line x1="50" y1="37" x2="50" y2="70" />
        {/* Crossed Legs */}
        <path d="M 50 70 Q 20 75 50 85 Q 80 75 50 70" />
        {/* Arms resting on knees */}
        <polyline points="50,40 30,55 20,75" />
        <polyline points="50,40 70,55 80,75" />
      </svg>
    )
  },
  {
    id: 'paschimottanasana',
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="68" cy="62" r="7" fill="currentColor" />
        {/* Torso leaning forward */}
        <path d="M 30 80 Q 40 50 63 67" />
        {/* Legs stretched out */}
        <line x1="30" y1="80" x2="90" y2="80" />
        {/* Arms reaching for toes */}
        <line x1="55" y1="63" x2="90" y2="75" />
      </svg>
    )
  },
  {
    id: 'bhujangasana',
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="28" cy="32" r="7" fill="currentColor" />
        {/* Arching body to ground */}
        <path d="M 28 39 Q 35 60 55 80 L 90 80" />
        {/* Arms supporting */}
        <polyline points="28,45 35,65 25,80" />
      </svg>
    )
  },
  {
    id: 'balasana',
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="23" cy="80" r="7" fill="currentColor" />
        {/* Curved spine */}
        <path d="M 70 75 Q 60 55 32 75" />
        {/* Legs folded underneath */}
        <line x1="70" y1="75" x2="40" y2="85" />
        <line x1="40" y1="85" x2="80" y2="85" />
        {/* Arms stretched ahead */}
        <line x1="32" y1="75" x2="10" y2="85" />
      </svg>
    )
  }
];

export default function Dashboard({ email, age, onLogout, lang }: DashboardProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games' | 'memories' | 'premium' | 'settings'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'contact'>('profile');
  const [premiumSubTab, setPremiumSubTab] = useState<'consult' | 'report' | 'mri'>('consult');
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [consultAddress, setConsultAddress] = useState('');
  const t = translations[lang];
  
  const getCardClass = () => {
    return 'bg-white/90 border-white shadow-xl backdrop-blur-xl';
  };

  const getSidebarClass = () => {
    return 'bg-white/90 border-white shadow-xl backdrop-blur-xl';
  };

  const primaryText = 'text-teal-600';
  const primaryBg = 'bg-teal-100';
  const primaryHover = 'hover:bg-teal-200';
  const primaryGradient = 'from-teal-500 to-teal-700';
  const primaryRing = 'focus:ring-teal-500/50';
  const primaryTextGradient = 'from-teal-500 to-teal-700';

  // Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
  const initialUserName = email.split('@')[0].split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  
  // Game State
  const [activeGame, setActiveGame] = useState<'none' | 'memoryMatch' | 'numberRecall' | 'wordRecall' | 'patternRecall'>('none');
  const [gameScores, setGameScores] = useState<{ date: string; score: number; game?: string; stats?: { timeTaken: number, errors: number, correct: number, level: number } }[]>([]);
  const [chartMonth, setChartMonth] = useState(new Date());

  const capitalizeName = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  useEffect(() => {
    const savedScores = localStorage.getItem(`cognify_scores_${email}`);
    if (savedScores) {
      try {
        setGameScores(JSON.parse(savedScores));
      } catch (e) {}
    }

    // Sync offline scores when online
    const syncOfflineScores = async () => {
      if (navigator.onLine && auth.currentUser) {
        const offlineScores = JSON.parse(localStorage.getItem(`cognify_offline_scores_${email}`) || '[]');
        if (offlineScores.length > 0) {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const currentScores = userSnap.data().gameScores || [];
              const mergedScores = [...currentScores, ...offlineScores];
              await updateDoc(userRef, { gameScores: mergedScores });
              setGameScores(mergedScores);
              localStorage.setItem(`cognify_scores_${email}`, JSON.stringify(mergedScores));
              localStorage.removeItem(`cognify_offline_scores_${email}`);
            }
          } catch (error) {
            console.error("Error syncing offline scores", error);
          }
        }
      }
    };

    window.addEventListener('online', syncOfflineScores);
    // Attempt sync on mount if online
    if (navigator.onLine) {
      syncOfflineScores();
    }

    return () => window.removeEventListener('online', syncOfflineScores);
  }, [email]);

  const handleGameOver = async (score: number, game: string = 'Memory Match', stats?: { timeTaken: number, errors: number, correct: number, level: number }) => {
    const newScore = { date: new Date().toISOString(), score, game, stats };
    const updatedScores = [...gameScores, newScore];
    setGameScores(updatedScores);
    localStorage.setItem(`cognify_scores_${email}`, JSON.stringify(updatedScores));
    
    if (navigator.onLine && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          gameScores: updatedScores
        });
      } catch (error) {
        console.error("Error saving game score:", error);
      }
    } else {
      // Save offline
      const offlineScores = JSON.parse(localStorage.getItem(`cognify_offline_scores_${email}`) || '[]');
      offlineScores.push(newScore);
      localStorage.setItem(`cognify_offline_scores_${email}`, JSON.stringify(offlineScores));
    }
  };

  // Process data for charts
  const getChartData = () => {
    // Get number of days in the selected month
    const daysInMonth = new Date(chartMonth.getFullYear(), chartMonth.getMonth() + 1, 0).getDate();
    
    const monthDays = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(chartMonth.getFullYear(), chartMonth.getMonth(), i + 1);
      return d.toISOString().split('T')[0];
    });

    return monthDays.map((dateStr, index) => {
      const dayScores = gameScores.filter(s => s.date.startsWith(dateStr));
      
      const memoryMatchScores = dayScores.filter(s => s.game === 'Memory Match' || !s.game || typeof s.game === 'object');
      const numberRecallScores = dayScores.filter(s => s.game === 'Number Recall');
      const wordRecallScores = dayScores.filter(s => s.game === 'Word Recall');
      const patternRecallScores = dayScores.filter(s => s.game === 'Pattern Recall');

      const maxMemoryMatchScore = memoryMatchScores.length > 0 ? Math.max(...memoryMatchScores.map(s => s.score)) : 0;
      const maxNumberRecallScore = numberRecallScores.length > 0 ? Math.max(...numberRecallScores.map(s => s.score)) : 0;
      const maxWordRecallScore = wordRecallScores.length > 0 ? Math.max(...wordRecallScores.map(s => s.score)) : 0;
      const maxPatternRecallScore = patternRecallScores.length > 0 ? Math.max(...patternRecallScores.map(s => s.score)) : 0;

      return {
        day: `${index + 1}`,
        memoryMatch: maxMemoryMatchScore,
        numberRecall: maxNumberRecallScore,
        wordRecall: maxWordRecallScore,
        patternRecall: maxPatternRecallScore
      };
    });
  };

  const getQuotaData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const gamesPlayedToday = gameScores.filter(s => s.date.startsWith(todayStr));
    
    const uniqueGames = new Set(gamesPlayedToday.map(s => s.game || 'Memory Match'));
    const target = 3;
    const completed = Math.min(uniqueGames.size, target);
    const remaining = Math.max(0, target - completed);
    
    return [
      { name: 'Completed', value: completed },
      { name: 'Remaining', value: remaining },
    ];
  };

  const calculateRiskLevel = (scores: any[]) => {
    // 1. Sort games by date ascending
    const gamesWithStats = scores.filter(s => s.stats).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // We need at least 5 games for a longitudinal baseline
    if (gamesWithStats.length < 5) return "Not enough data (Play at least 5 games)";

    // 2. Domain Weights based on clinical relevance
    const weights: Record<string, number> = {
      'Word Recall': 0.40,
      'Pattern Recall': 0.35,
      'Memory Match': 0.15,
      'Number Recall': 0.10
    };

    const grouped: Record<string, any[]> = {
      'Word Recall': [],
      'Pattern Recall': [],
      'Memory Match': [],
      'Number Recall': []
    };

    gamesWithStats.forEach(s => {
      const gameName = s.game || 'Memory Match';
      if (grouped[gameName]) {
        grouped[gameName].push(s);
      }
    });

    let totalWeightUsed = 0;
    let weightedSlope = 0;
    let weightedAverage = 0;

    // 3. Calculate Performance, Linear Regression (Slope), and Weighted Composite 
    Object.keys(grouped).forEach(gameType => {
      const sessions = grouped[gameType];
      if (sessions.length > 0) {
        const weight = weights[gameType] || 0;
        totalWeightUsed += weight;

        const performances = sessions.map(s => {
          const accuracy = s.stats.correct / (s.stats.correct + s.stats.errors || 1);
          const timePerLevel = s.stats.timeTaken / Math.max(1, s.stats.level);
          const speedScore = Math.max(0, 1 - (timePerLevel / 30)); // 30s max acceptable per level
          return (accuracy * 0.7 + speedScore * 0.3) * 100;
        });

        const avgPerf = performances.reduce((a, b) => a + b, 0) / performances.length;
        weightedAverage += avgPerf * weight;

        let slope = 0;
        if (performances.length >= 2) {
          let xSum = 0, ySum = 0, xxSum = 0, xySum = 0;
          const n = performances.length;
          for (let i = 0; i < n; i++) {
            xSum += i;
            ySum += performances[i];
            xxSum += i * i;
            xySum += i * performances[i];
          }
          slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
        }
        weightedSlope += slope * weight;
      }
    });

    if (totalWeightUsed > 0) {
      weightedSlope = weightedSlope / totalWeightUsed;
      weightedAverage = weightedAverage / totalWeightUsed;
    }

    // 4. Reaction Time Variability (RTV) Approximation
    const allPerformances = gamesWithStats.map(s => {
      const accuracy = s.stats.correct / (s.stats.correct + s.stats.errors || 1);
      const timePerLevel = s.stats.timeTaken / Math.max(1, s.stats.level);
      const speedScore = Math.max(0, 1 - (timePerLevel / 30));
      return (accuracy * 0.7 + speedScore * 0.3) * 100;
    });
    
    const overallAvg = allPerformances.reduce((a, b) => a + b, 0) / allPerformances.length;
    const variance = allPerformances.reduce((a, b) => a + Math.pow(b - overallAvg, 2), 0) / allPerformances.length;
    const standardDeviation = Math.sqrt(variance);

    // 5. Advanced Risk Calculation Logic
    if (weightedSlope < -5 || (weightedSlope < -2 && standardDeviation > 20) || weightedAverage < 40) {
      return "High Chance";
    } else if (weightedSlope < -1 || standardDeviation > 15 || weightedAverage < 65) {
      return "Moderate Chance";
    } else {
      return "Lowest Chance";
    }
  };

  const checkDecliningTrend = (scores: any[]) => {
    const scoresByDay = new Map<string, number[]>();
    scores.forEach(s => {
      const day = s.date.split('T')[0];
      if (!scoresByDay.has(day)) scoresByDay.set(day, []);
      scoresByDay.get(day)!.push(s.score);
    });

    const days = Array.from(scoresByDay.keys()).sort();
    if (days.length < 10) return false;

    const recentDays = days.slice(-12);
    const dailyAvgs = recentDays.map(day => {
      const dayScores = scoresByDay.get(day)!;
      return dayScores.reduce((a,b)=>a+b,0) / dayScores.length;
    });

    let trendScore = 0;
    for (let i = 1; i < dailyAvgs.length; i++) {
      if (dailyAvgs[i] < dailyAvgs[i-1]) trendScore++;
    }

    return trendScore >= dailyAvgs.length * 0.6;
  };

  const dynamicProgressData = getChartData();
  const dynamicQuotaData = getQuotaData();

  // Profile State
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem(`cognify_profile_name_${email}`) || initialUserName;
  });
  const [profileAddress, setProfileAddress] = useState(() => {
    return localStorage.getItem(`cognify_profile_address_${email}`) || "123 Memory Lane, Wellness City";
  });
  const [profileContact, setProfileContact] = useState(() => {
    return localStorage.getItem(`cognify_profile_contact_${email}`) || "+1 (555) 019-8273 (Sarah)";
  });
  const [profilePhotoName, setProfilePhotoName] = useState<string | null>(null);
  const [profileAge, setProfileAge] = useState(age);
  const [isDisclaimerGlowing, setIsDisclaimerGlowing] = useState(false);

  const handleInfoClick = () => {
    setIsDisclaimerGlowing(true);
    setTimeout(() => {
      setIsDisclaimerGlowing(false);
    }, 3000);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.name) setProfileName(data.name);
            if (data.address) setProfileAddress(data.address);
            if (data.contact) setProfileContact(data.contact);
            if (data.photoFileName) setProfilePhotoName(data.photoFileName);
            if (data.age) setProfileAge(data.age);
            if (data.isPremium) setIsPremium(data.isPremium);
            
            // Merge game scores
            const localScoresStr = localStorage.getItem(`cognify_scores_${email}`);
            let localScores: any[] = [];
            if (localScoresStr) {
              try { localScores = JSON.parse(localScoresStr); } catch (e) {}
            }
            const firestoreScores = data.gameScores || [];
            
            const allScores = [...firestoreScores, ...localScores];
            const uniqueScoresMap = new Map();
            allScores.forEach(score => {
              uniqueScoresMap.set(score.date, score);
            });
            const mergedScores = Array.from(uniqueScoresMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            setGameScores(mergedScores);
            localStorage.setItem(`cognify_scores_${email}`, JSON.stringify(mergedScores));

            // Merge memories
            const localMemoriesStr = localStorage.getItem(`cognify_memories_${email}`);
            let localMemories: any[] = [];
            if (localMemoriesStr) {
              try { localMemories = JSON.parse(localMemoriesStr); } catch (e) {}
            }
            const firestoreMemories = data.memories || [];
            
            const allMemories = [...firestoreMemories, ...localMemories];
            const uniqueMemoriesMap = new Map();
            allMemories.forEach(memory => {
              uniqueMemoriesMap.set(memory.id, memory);
            });
            const mergedMemories = Array.from(uniqueMemoriesMap.values()).sort((a, b) => parseInt(b.id) - parseInt(a.id));
            
            setMemories(mergedMemories);
            localStorage.setItem(`cognify_memories_${email}`, JSON.stringify(mergedMemories));

            if (localScores.length > 0 || localMemories.length > 0) {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                gameScores: mergedScores,
                memories: mergedMemories
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, []);

  // Settings Form State
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [contactError, setContactError] = useState("");

  // Review Form State
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");

  // Memories State
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryText, setMemoryText] = useState("");
  const [memorySearchDate, setMemorySearchDate] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const savedMemories = localStorage.getItem(`cognify_memories_${email}`);
    if (savedMemories) {
      try {
        setMemories(JSON.parse(savedMemories));
      } catch (e) {}
    }
  }, [email]);

  const saveMemory = async (newMemory: Memory) => {
    const updatedMemories = [newMemory, ...memories];
    setMemories(updatedMemories);
    localStorage.setItem(`cognify_memories_${email}`, JSON.stringify(updatedMemories));
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          memories: updatedMemories
        });
      } catch (error) {
        console.error("Error saving memory:", error);
      }
    }
  };

  const getFilteredMemories = () => {
    if (!memorySearchDate) return memories;
    const [year, month, day] = memorySearchDate.split('-');
    const localDateStr = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
    
    return memories.filter(memory => {
      return memory.date === localDateStr || memory.date.includes(memorySearchDate);
    });
  };

  const handleSaveTextMemory = () => {
    if (!memoryText.trim()) return;
    const newMemory: Memory = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      type: 'text',
      content: memoryText.trim()
    };
    saveMemory(newMemory);
    setMemoryText("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const newMemory: Memory = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString(),
            type: 'audio',
            content: base64Audio
          };
          saveMemory(newMemory);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePurchasePremium = async (method: string) => {
    // In a real app this would trigger Stripe or Razorpay. Here we simulate success.
    console.log(`Processing with ${method}...`);
    setIsPremium(true);
    setShowPaymentModal(false);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          isPremium: true
        });
      } catch (e) {
        console.error("Error setting premium status:", e);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (editContact) {
      const digitsOnly = editContact.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 13) {
        setContactError("Phone number must be between 10 and 13 digits.");
        return;
      }
    }

    const updates: any = {};
    if (editName.trim()) {
      setProfileName(editName.trim());
      localStorage.setItem(`cognify_profile_name_${email}`, editName.trim());
      updates.name = editName.trim();
    }
    if (editAddress.trim()) {
      setProfileAddress(editAddress.trim());
      localStorage.setItem(`cognify_profile_address_${email}`, editAddress.trim());
      updates.address = editAddress.trim();
    }
    if (editContact.trim()) {
      setProfileContact(editContact.trim());
      localStorage.setItem(`cognify_profile_contact_${email}`, editContact.trim());
      updates.contact = editContact.trim();
    }

    if (auth.currentUser && Object.keys(updates).length > 0) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }

    setEditName("");
    setEditAddress("");
    setEditContact("");
    setContactError("");
    setActiveTab('dashboard');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      if (auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'users', auth.currentUser.uid));
          await deleteUser(auth.currentUser);
          onLogout();
        } catch (error) {
          console.error("Error deleting account:", error);
          alert("Failed to delete account. Please try logging in again and retrying.");
        }
      }
    }
  };

  const handleSubmitReview = () => {
    setReviewName("");
    setReviewText("");
    setActiveTab('dashboard');
  };

  const quotaData = [
    { name: t.completed, value: 75 },
    { name: t.remaining, value: 25 },
  ];

  // Daily Yoga Logic
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const currentPose = yogaPoses[dayOfYear % yogaPoses.length];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-10 flex p-4 md:p-6 gap-6 overflow-hidden"
    >
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col rounded-r-3xl md:rounded-3xl border backdrop-blur-2xl shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${getSidebarClass()}`}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className={`absolute top-6 right-4 p-2 rounded-full md:hidden text-slate-600 hover:bg-black/5`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar Glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-fuchsia-500/10 blur-2xl pointer-events-none"></div>
        
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-fuchsia-500 blur-md opacity-50 rounded-full"></div>
            <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-colors duration-500 border-white/60 bg-white`}>
              <img src="https://images.unsplash.com/photo-1674027444485-cec3da58eef4?q=80&w=200&auto=format&fit=crop" alt="AI Brain Generated Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight">Cognify</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            activeTab === 'dashboard'
              ? 'bg-white/60 text-slate-900 shadow-sm'
              : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
          }`}>
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-fuchsia-400' : 'transition-colors group-hover:text-fuchsia-400'}`} />
            <span className="font-medium">{t.dashboard}</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('games'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
            activeTab === 'games'
              ? 'bg-white/60 text-slate-900 shadow-sm'
              : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
          }`}>
            <Gamepad2 className={`w-5 h-5 ${activeTab === 'games' ? 'text-fuchsia-400' : 'transition-colors group-hover:text-fuchsia-400'}`} />
            <span className="font-medium">{t.games}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('memories'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
            activeTab === 'memories'
              ? 'bg-white/60 text-slate-900 shadow-sm'
              : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
          }`}>
            <BookOpen className={`w-5 h-5 ${activeTab === 'memories' ? 'text-fuchsia-400' : 'transition-colors group-hover:text-fuchsia-400'}`} />
            <span className="font-medium">{t.memoriesLane}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('premium'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
            activeTab === 'premium'
              ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-200'
              : 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
          }`}>
            <Sparkles className={`w-5 h-5 ${activeTab === 'premium' ? 'text-amber-500' : 'text-amber-500'}`} />
            <span className="font-medium">{(t as any).premium || 'Premium'}</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
            activeTab === 'settings'
              ? 'bg-white/60 text-slate-900 shadow-sm'
              : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
          }`}>
            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-fuchsia-400' : 'transition-colors group-hover:text-fuchsia-400'}`} />
            <span className="font-medium">{t.settings}</span>
          </button>
          
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              'text-slate-600 hover:bg-rose-500/10 hover:text-rose-500'
            }`}
          >
            <LogOut className="w-5 h-5 transition-colors group-hover:text-rose-500" />
            <span className="font-medium">{t.logOut}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Header */}
        <header className="pt-2 md:pt-6 pb-6 md:pb-8 flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 rounded-xl md:hidden bg-white/40 text-slate-900`}
          >
            <Menu className="w-6 h-6" />
          </button>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight mb-1 md:mb-2">
              {t.welcomeBackUser}<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{capitalizeName(profileName)}</span>
            </h1>
            <p className={`text-sm md:text-lg transition-colors duration-500 text-slate-600`}>
              {t.overviewText}
            </p>
          </motion.div>
        </header>

        {/* Dashboard Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar flex flex-col">
          
          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className={`p-4 rounded-xl border transition-all duration-500 ${
                isDisclaimerGlowing 
                  ? 'bg-fuchsia-500/20 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.5)] text-fuchsia-200 scale-[1.02]' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <p className="text-sm font-medium">
                  {t.disclaimer}
                </p>
              </div>
              {checkDecliningTrend(gameScores) && (
                <div className="p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {t.immediateRiskWarning}
                  </p>
                </div>
              )}

              {/* User Info Box */}
              <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box ${getCardClass()}`}>
                {/* Glow Effect */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <h2 className={`text-xl font-semibold mb-4 text-slate-900`}>{t.patientProfile}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/40`}>
                        <User className={`w-5 h-5 text-fuchsia-600`} />
                      </div>
                      <div>
                        <p className={`text-xs text-slate-500`}>{t.fullName}</p>
                        <p className={`font-medium text-slate-800`}>{capitalizeName(profileName)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/40`}>
                        <Calendar className={`w-5 h-5 text-cyan-600`} />
                      </div>
                      <div>
                        <p className={`text-xs text-slate-500`}>{t.age}</p>
                        <p className={`font-medium text-slate-800`}>{profileAge} {t.years}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/40`}>
                        <Brain className={`w-5 h-5 text-rose-600`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs text-slate-500`}>{t.aiPredictedRisk}</p>
                          <button 
                            onClick={handleInfoClick}
                            className={`p-0.5 rounded-full transition-colors hover:bg-black/5 text-slate-500 hover:text-slate-900`}
                            title="Click for more info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className={`font-medium text-slate-800`}>{calculateRiskLevel(gameScores)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/40`}>
                        <UserCircle className={`w-5 h-5 text-violet-600`} />
                      </div>
                      <div>
                        <p className={`text-xs text-slate-500`}>{t.gender}</p>
                        <p className={`font-medium text-slate-800`}>{t.male}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/40`}>
                        <MapPin className={`w-5 h-5 text-emerald-600`} />
                      </div>
                      <div>
                        <p className={`text-xs text-slate-500`}>{t.address}</p>
                        <p className={`font-medium text-slate-800`}>{profileAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/40`}>
                        <Phone className={`w-5 h-5 text-amber-600`} />
                      </div>
                      <div>
                        <p className={`text-xs text-slate-500`}>{t.closeMemberContact}</p>
                        <p className={`font-medium text-slate-800`}>{profileContact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Yoga Box */}
              <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box ${getCardClass()}`}>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h2 className={`text-xl font-semibold mb-2 text-slate-900`}>
                      {t.dailyYoga || "Daily Yoga"}
                    </h2>
                    <p className={`text-lg font-medium mb-4 text-emerald-600`}>
                      {t[currentPose.id as keyof typeof t]}
                    </p>
                    <p className={`text-sm text-slate-600`}>
                      {t.practicePose}
                    </p>
                  </div>
                  <div className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl flex items-center justify-center p-1 border overflow-hidden shadow-inner ${
                    'bg-white/50 border-white/60'
                  }`}>
                    {currentPose.icon}
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Line Graph: Progress */}
                <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box lg:col-span-2 ${getCardClass()}`}>
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-lg font-semibold text-slate-900`}>{t.gameProgressOverview}</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setChartMonth(new Date(chartMonth.getFullYear(), chartMonth.getMonth() - 1, 1))}
                          className="p-1 rounded-full hover:bg-black/5 text-slate-600 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium text-slate-700">
                          {chartMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
                        </span>
                        <button 
                          onClick={() => setChartMonth(new Date(chartMonth.getFullYear(), chartMonth.getMonth() + 1, 1))}
                          className="p-1 rounded-full hover:bg-black/5 text-slate-600 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      {dynamicProgressData.length === 0 ? (
                        <div className={`w-full h-full flex items-center justify-center text-slate-400`}>
                          {t.noDataAvailable}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dynamicProgressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={'rgba(0,0,0,0.1)'} vertical={false} />
                            <XAxis dataKey="day" stroke={'rgba(0,0,0,0.5)'} tick={{ fill: '#64748b' }} />
                            <YAxis stroke={'rgba(0,0,0,0.5)'} tick={{ fill: '#64748b' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255,255,255,0.9)', 
                                borderColor: 'rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                color: '#000'
                              }} 
                            />
                            <Legend />
                            <Line type="monotone" dataKey="memoryMatch" name={t.memoryMatch} stroke="#d946ef" strokeWidth={3} dot={{ r: 4, fill: '#d946ef', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="numberRecall" name={t.numberRecall || 'Number Recall'} stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="wordRecall" name={t.wordRecall || 'Word Recall'} stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="patternRecall" name={t.patternRecall || 'Pattern Recall'} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calendar: Time Spent */}
                <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box ${getCardClass()}`}>
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500 to-purple-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                  <div className="relative z-10 h-full flex flex-col">
                    <h3 className={`text-lg font-semibold mb-6 text-slate-900`}>{t.dailyTimeSpent}</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                      <TimeSpentCalendar email={email} t={t} />
                    </div>
                  </div>
                </div>

                {/* Pie Graph: Quota */}
                <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box ${getCardClass()}`}>
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <h3 className={`text-lg font-semibold mb-2 text-slate-900`}>{t.dailyQuotaCompletion}</h3>
                    <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dynamicQuotaData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {dynamicQuotaData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255,255,255,0.9)', 
                              borderColor: 'rgba(0,0,0,0.1)',
                              borderRadius: '12px',
                              color: '#000'
                            }} 
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'games' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {activeGame === 'none' ? (
                <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 flex flex-col min-h-[400px] ${getCardClass()}`}>
                  <h2 className={`text-2xl font-semibold mb-6 text-slate-900`}>{t.games}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Memory Match Game Card */}
                    <div 
                      onClick={() => setActiveGame('memoryMatch')}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                        'bg-white/50 border-white/60 hover:bg-white/80 hover:border-fuchsia-500/50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 text-slate-900`}>{t.memoryMatch}</h3>
                      <p className={`text-sm text-slate-500`}>
                        {t.memoryMatchDesc}
                      </p>
                    </div>

                    {/* Number Recall Game Card */}
                    <div 
                      onClick={() => setActiveGame('numberRecall')}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                        'bg-white/50 border-white/60 hover:bg-white/80 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Hash className="w-8 h-8 text-white" />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 text-slate-900`}>{t.numberRecall || 'Number Recall'}</h3>
                      <p className={`text-sm text-slate-500`}>
                        {t.numberRecallDesc || 'Arrange scrambled numbers in ascending order.'}
                      </p>
                    </div>

                    {/* Word Recall Game Card */}
                    <div 
                      onClick={() => setActiveGame('wordRecall')}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                        'bg-white/50 border-white/60 hover:bg-white/80 hover:border-rose-500/50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 text-slate-900`}>{t.wordRecall || 'Word Recall'}</h3>
                      <p className={`text-sm text-slate-500`}>
                        {t.wordRecallDesc || 'Memorize a sentence and recall specific words from it.'}
                      </p>
                    </div>

                    {/* Pattern Recall Game Card */}
                    <div 
                      onClick={() => setActiveGame('patternRecall')}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                        'bg-white/50 border-white/60 hover:bg-white/80 hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Puzzle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 text-slate-900`}>{t.patternRecall || 'Pattern Recall'}</h3>
                      <p className={`text-sm text-slate-500`}>
                        {t.patternRecallDesc || 'Memorize a shape, then find all matching shapes in a crowded grid!'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeGame === 'memoryMatch' ? (
                <MemoryMatchGame 
                  onClose={() => setActiveGame('none')} 
                  onGameOver={(score, stats) => handleGameOver(score, 'Memory Match', stats)}
                  t={t}
                />
              ) : activeGame === 'numberRecall' ? (
                <NumberRecallGame 
                  onClose={() => setActiveGame('none')} 
                  onGameOver={(score, stats) => handleGameOver(score, 'Number Recall', stats)}
                  t={t}
                />
              ) : activeGame === 'wordRecall' ? (
                <WordRecallGame 
                  onClose={() => setActiveGame('none')} 
                  onGameOver={(score, stats) => handleGameOver(score, 'Word Recall', stats)}
                  t={t}
                />
              ) : activeGame === 'patternRecall' ? (
                <PatternRecallGame 
                  onClose={() => setActiveGame('none')} 
                  onGameOver={(score, stats) => handleGameOver(score, 'Pattern Recall', stats)}
                  t={t}
                />
              ) : null}
            </motion.div>
          )}

          {activeTab === 'memories' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box ${getCardClass()}`}>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <h2 className={`text-2xl font-semibold mb-6 text-slate-900`}>{t.memoriesLane}</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Record Audio Section */}
                    <div className={`p-6 rounded-2xl border bg-white/50 border-white/60`}>
                      <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 text-slate-800`}>
                        <Mic className="w-5 h-5 text-fuchsia-500" />
                        {t.recordAudio}
                      </h3>
                      <div className="flex flex-col items-center justify-center py-8">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isRecording 
                              ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.3)]' 
                              : 'bg-fuchsia-500/20 text-fuchsia-500 hover:bg-fuchsia-500/30'
                          }`}
                        >
                          {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                        </button>
                        <p className={`mt-4 text-sm font-medium ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                          {isRecording ? t.stopRecording : t.recordAudio}
                        </p>
                      </div>
                    </div>

                    {/* Write Experience Section */}
                    <div className={`p-6 rounded-2xl border bg-white/50 border-white/60`}>
                      <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 text-slate-800`}>
                        <FileText className="w-5 h-5 text-cyan-500" />
                        {t.writeExperience}
                      </h3>
                      <textarea 
                        value={memoryText}
                        onChange={(e) => setMemoryText(e.target.value)}
                        rows={4}
                        placeholder={t.writeHere}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none mb-4 ${
                          'bg-white/80 border-white/60 text-slate-900 placeholder:text-slate-400'
                        }`} 
                      />
                      <button 
                        onClick={handleSaveTextMemory}
                        disabled={!memoryText.trim()}
                        className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
                      >
                        {t.saveMemory}
                      </button>
                    </div>
                  </div>

                  {/* Saved Memories List */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                      <h3 className={`text-xl font-semibold text-slate-900`}>{t.yourMemories}</h3>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="date" 
                          value={memorySearchDate}
                          onChange={(e) => setMemorySearchDate(e.target.value)}
                          className={`pl-9 pr-4 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all ${
                            'bg-white/80 border-slate-200 text-slate-700'
                          }`}
                        />
                      </div>
                    </div>
                    {getFilteredMemories().length === 0 ? (
                      <div className={`text-center py-12 rounded-2xl border border-dashed border-slate-300 text-slate-500`}>
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{memories.length > 0 ? "No memories found for this date." : t.noMemoriesYet}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredMemories().map((memory) => (
                          <div key={memory.id} className={`p-4 rounded-2xl border flex flex-col gap-3 bg-white/60 border-white/40`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {memory.type === 'audio' ? (
                                  <AudioLines className="w-4 h-4 text-fuchsia-500" />
                                ) : (
                                  <FileText className="w-4 h-4 text-cyan-500" />
                                )}
                                <span className={`text-sm font-medium text-slate-700`}>
                                  {memory.type === 'audio' ? t.audioRecording : t.textMemory}
                                </span>
                              </div>
                              <span className={`text-xs text-slate-400`}>{memory.date}</span>
                            </div>
                            
                            {memory.type === 'text' ? (
                              <p className={`text-sm text-slate-600 break-words whitespace-pre-wrap`}>{memory.content}</p>
                            ) : (
                              <AudioPlayer src={memory.content} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col md:flex-row gap-6"
            >
              {/* Settings Sidebar */}
              <div className={`w-full md:w-64 rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-4 flex flex-col gap-2 ${getCardClass()}`}>
                <button 
                  onClick={() => setSettingsTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    settingsTab === 'profile'
                      ? 'bg-fuchsia-100 text-fuchsia-700'
                      : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                  }`}
                >
                  {t.profileSettings}
                </button>
                <button 
                  onClick={() => setSettingsTab('contact')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    settingsTab === 'contact'
                      ? 'bg-fuchsia-100 text-fuchsia-700'
                      : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                  }`}
                >
                  {t.contactDeveloper}
                </button>
              </div>

              {/* Settings Content */}
              <div className={`flex-1 relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box ${getCardClass()}`}>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                
                <div className="relative z-10">
                  {settingsTab === 'profile' ? (
                    <div className="space-y-6">
                      <h2 className={`text-xl font-semibold mb-6 text-slate-900`}>{t.profileSettings}</h2>
                      
                      {profilePhotoName && (
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                            <User className="w-8 h-8 text-fuchsia-400" />
                          </div>
                          <div>
                            <p className={`text-sm font-medium text-slate-700`}>{t.profilePhoto}</p>
                            <p className={`text-xs text-slate-500`}>{profilePhotoName}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium text-slate-700`}>{t.changeName}</label>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder={t.yourName} 
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                              'bg-white/50 border-white/60 text-slate-900 placeholder:text-slate-400'
                            }`} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-sm font-medium text-slate-700`}>{t.changeAddress}</label>
                          <input 
                            type="text" 
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder={profileAddress} 
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                              'bg-white/50 border-white/60 text-slate-900 placeholder:text-slate-400'
                            }`} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-sm font-medium text-slate-700`}>{t.changeContact}</label>
                          <input 
                            type="text" 
                            value={editContact}
                            onChange={(e) => {
                              setEditContact(e.target.value);
                              if (contactError) setContactError("");
                            }}
                            placeholder={profileContact} 
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                              contactError ? 'border-rose-500/50 focus:ring-rose-500/50' : 'border-white/60'
                            } ${
                              'bg-white/50 text-slate-900 placeholder:text-slate-400'
                            }`} 
                          />
                          {contactError && <p className="text-xs text-rose-500 mt-1">{contactError}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className={`text-sm font-medium text-slate-700`}>{t.changePassword}</label>
                          <input type="password" placeholder="••••••••" className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                            'bg-white/50 border-white/60 text-slate-900 placeholder:text-slate-400'
                          }`} />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-sm font-medium text-slate-700`}>{t.changePasskey}</label>
                          <input type="text" placeholder="123456" className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                            'bg-white/50 border-white/60 text-slate-900 placeholder:text-slate-400'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="pt-4 flex items-center gap-4">
                        <button 
                          onClick={handleSaveProfile}
                          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/25"
                        >
                          {t.saveChanges}
                        </button>
                        <button 
                          onClick={handleDeleteAccount}
                          className="px-6 py-3 bg-rose-500/10 text-rose-500 font-medium rounded-xl hover:bg-rose-500/20 transition-colors"
                        >
                          {t.deleteAccount}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h2 className={`text-xl font-semibold mb-6 text-slate-900`}>{t.contactDeveloper}</h2>
                      
                      <div className="space-y-2">
                        <label className={`text-sm font-medium text-slate-700`}>{t.fullName}</label>
                        <input 
                          type="text" 
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder={t.yourName} 
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                            'bg-white/50 border-white/60 text-slate-900 placeholder:text-slate-400'
                          }`} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`text-sm font-medium text-slate-700`}>{t.writeReview}</label>
                        <textarea 
                          rows={6}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder={t.tellUsWhatYouThink} 
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-fuchsia-500/50 resize-none ${
                            'bg-white/50 border-white/60 text-slate-900 placeholder:text-slate-400'
                          }`} 
                        />
                      </div>
                      
                      <div className="pt-4">
                        <button 
                          onClick={handleSubmitReview}
                          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/25"
                        >
                          {t.submitReview}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Premium Tab */}
          {activeTab === 'premium' && (
            <motion.div
              key="premium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`relative rounded-3xl border backdrop-blur-xl transition-colors duration-500 p-6 group/box ${getCardClass()}`}>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur-md opacity-20 group-hover/box:opacity-40 transition duration-500 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className={`text-2xl font-semibold text-slate-900`}>{(t as any).premium || 'Premium'}</h2>
                      <p className="text-amber-600 mt-1">{(t as any).premiumBenefits || 'Unlock exclusive health insights and medical consultations.'}</p>
                    </div>
                    {isPremium ? (
                      <div className="px-5 py-2.5 rounded-xl border border-amber-500/20 bg-amber-50 text-amber-600 font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {(t as any).premiumActive || 'Premium Active'}
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/25 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        {(t as any).unlockPremium || 'Unlock Premium'}
                      </button>
                    )}
                  </div>

                  {/* Premium Sub-navigation */}
                  <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-none border-b border-black/5 dark:border-white/10">
                    <button
                      onClick={() => setPremiumSubTab('consult')}
                      className={`px-4 py-2.5 rounded-t-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap ${
                        premiumSubTab === 'consult' ? 'bg-black/5 text-amber-600 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Stethoscope className="w-4 h-4" />
                      {(t as any).consultDoctor || 'Consult Doctor'}
                    </button>
                    <button
                      onClick={() => setPremiumSubTab('report')}
                      className={`px-4 py-2.5 rounded-t-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap ${
                        premiumSubTab === 'report' ? 'bg-black/5 text-amber-600 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      {(t as any).uploadReport || 'Upload Previous Report'}
                    </button>
                    <button
                      onClick={() => setPremiumSubTab('mri')}
                      className={`px-4 py-2.5 rounded-t-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap ${
                        premiumSubTab === 'mri' ? 'bg-black/5 text-amber-600 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      {(t as any).uploadMRI || 'Upload MRI Scan'}
                    </button>
                  </div>

                  {/* Feature Lock Overlay */}
                  {!isPremium && (
                    <div className="w-full h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-300">
                      <Lock className="w-12 h-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Premium Feature</h3>
                      <p className="text-slate-500 mb-6 max-w-sm">You need an active Premium subscription to access this feature.</p>
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    </div>
                  )}

                  {/* Consult Content */}
                  {isPremium && premiumSubTab === 'consult' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="mb-6 space-y-2">
                        <label className="text-sm font-medium text-slate-700">{(t as any).selectAddress || 'Select your address'}</label>
                        <select
                          value={consultAddress}
                          onChange={(e) => setConsultAddress(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/50"
                        >
                          <option value="">-- Choose Address --</option>
                          <option value="current">Current Location ({profileAddress || 'Not set'})</option>
                          <option value="other">Enter New Address</option>
                        </select>
                      </div>
                      
                      {consultAddress && (
                        <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50">
                          <h3 className="text-lg font-semibold text-amber-900 mb-4">{(t as any).availableDoctors || 'Available Doctors'}</h3>
                          <div className="space-y-4">
                            <div className="p-4 bg-white rounded-xl border shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold">Dr.</div>
                                <div>
                                  <p className="font-semibold text-slate-900">Dr. Sarah Jenkins</p>
                                  <p className="text-sm text-slate-500">Neurologist • 2.4 miles away</p>
                                </div>
                              </div>
                              <button className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">Book</button>
                            </div>
                            <div className="p-4 bg-white rounded-xl border shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold">Dr.</div>
                                <div>
                                  <p className="font-semibold text-slate-900">Dr. Rajesh Kumar</p>
                                  <p className="text-sm text-slate-500">Geriatric Specialist • 3.8 miles away</p>
                                </div>
                              </div>
                              <button className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">Book</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Report Content */}
                  {isPremium && premiumSubTab === 'report' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white/30 hover:bg-white/50 transition-colors cursor-pointer group">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FileText className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-1">Upload Medical Report</h3>
                        <p className="text-sm text-slate-500 mb-4">PDF, JPG, or PNG up to 10MB</p>
                        <button className="px-6 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">Browse Files</button>
                      </div>
                    </div>
                  )}

                  {/* Upload MRI Content */}
                  {isPremium && premiumSubTab === 'mri' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white/30 hover:bg-white/50 transition-colors cursor-pointer group">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-1">Upload MRI Scan</h3>
                        <p className="text-sm text-slate-500 mb-4">DICOM, JPG, or PDF up to 50MB</p>
                        <button className="px-6 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">Select Scan</button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}
          
          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-slate-200 dark:border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className={`text-sm text-slate-500`}>
                © 2026 Cognify. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 relative overflow-hidden"
          >
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            
            <div className="text-center mt-4 mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{(t as any).paymentGateway || 'Payment Gateway'}</h2>
              <p className="text-slate-500">Upgrade to Cognify Premium</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handlePurchasePremium('Credit/Debit Card')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-amber-500 bg-white hover:bg-amber-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <CreditCard className="w-5 h-5 text-slate-600 group-hover:text-amber-600" />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-amber-700">{(t as any).payWithCard || 'Pay with Credit/Debit Card'}</span>
              </button>
              
              <button 
                onClick={() => handlePurchasePremium('PhonePe')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-violet-500 bg-white hover:bg-violet-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <span className="font-bold text-slate-600 group-hover:text-violet-600 font-sans">P</span>
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-violet-700">{(t as any).payWithPhonePe || 'Pay with PhonePe'}</span>
              </button>
              
              <button 
                onClick={() => handlePurchasePremium('Google Pay')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-blue-500 bg-white hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <span className="font-bold text-slate-600 group-hover:text-blue-600 font-sans">G</span>
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-blue-700">{(t as any).payWithGooglePay || 'Pay with Google Pay'}</span>
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-6 font-medium tracking-wide uppercase">Secured by Stripe</p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
