import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface TimeSpentCalendarProps {
  email: string;
  t: any;
}

export const TimeSpentCalendar: React.FC<TimeSpentCalendarProps> = ({ email, t }) => {
    const [timeData, setTimeData] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      const localData = localStorage.getItem(`cognify_time_${email}`);
      let parsedLocalData: Record<string, number> = {};
      if (localData) {
        try {
          parsedLocalData = JSON.parse(localData);
          setTimeData(parsedLocalData);
        } catch (e) {}
      }

      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const firestoreTimeSpent = data.timeSpent || {};
            const mergedData = { ...firestoreTimeSpent, ...parsedLocalData };
            setTimeData(mergedData);
            
            const today = new Date().toISOString().split('T')[0];
            let needsUpload = false;
            const uploadData: Record<string, number> = { ...firestoreTimeSpent };
            
            for (const [date, time] of Object.entries(parsedLocalData)) {
              if (date !== today && (!firestoreTimeSpent[date] || firestoreTimeSpent[date] < time)) {
                uploadData[date] = time;
                needsUpload = true;
              }
            }

            if (needsUpload) {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                timeSpent: uploadData
              });
            }
          }
        } catch (error) {
          console.error("Error fetching time spent:", error);
        }
      }
    };
    
    loadData();

    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      setTimeData(prev => {
        const newData = { ...prev, [today]: (prev[today] || 0) + 5 };
        localStorage.setItem(`cognify_time_${email}`, JSON.stringify(newData));
        return newData;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [email]);

  const getAccentColor = () => {
    return 'bg-teal-600 text-white';
  };

  const getHoverColor = () => {
    return 'hover:bg-teal-600/20';
  };

  const getTextColor = () => {
    return 'text-teal-700';
  }

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const formatTime = (seconds: number) => {
    if (!seconds) return "0 min";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8 sm:h-10 sm:w-10"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const hasData = timeData[dateStr] && timeData[dateStr] > 0;
      
      days.push(
        <button
          key={i}
          onClick={() => setSelectedDate(dateStr)}
          className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm transition-all duration-200 ${
            isSelected 
              ? getAccentColor() + ' shadow-md scale-110 font-bold' 
              : `text-slate-700 ${getHoverColor()}`
          } ${hasData && !isSelected ? 'ring-2 ring-inset ring-black/10' : ''}`}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className={`p-1 rounded-full transition-colors hover:bg-black/5 text-slate-600`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className={`font-medium text-slate-900`}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <button onClick={nextMonth} className={`p-1 rounded-full transition-colors hover:bg-black/5 text-slate-600`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2 place-items-center">
        {dayNames.map(day => (
          <div key={day} className={`text-xs font-medium text-slate-400`}>
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 place-items-center mb-6">
        {renderDays()}
      </div>

      <div className={`mt-auto p-4 rounded-2xl border flex items-center gap-4 bg-white/50 border-white/60`}>
        <div className={`p-3 rounded-full bg-white`}>
          <Clock className={`w-6 h-6 ${getTextColor()}`} />
        </div>
        <div>
          <p className={`text-sm text-slate-500`}>
            {t.activityFor} {selectedDate}
          </p>
          <p className={`text-xl font-bold text-slate-900`}>
            {t.totalTime} {formatTime(timeData[selectedDate] || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};
