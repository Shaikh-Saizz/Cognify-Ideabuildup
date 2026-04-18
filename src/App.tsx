import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, ArrowRight, Loader2, Brain, Sun, Moon, Globe, Upload, BrainCircuit } from 'lucide-react';
import { translations, Language } from './translations';
import Dashboard from './Dashboard';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setEmail(user.email);
        const savedUser = localStorage.getItem('cognify_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setAge(parsed.age || '72');
          } catch (e) {}
        }
        setStatus('success');
      }
    });
    return () => unsubscribe();
  }, []);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccessMsg('');

    if (view === 'forgot-password') {
      if (!email) {
        setErrorMsg('Please enter your email address');
        return;
      }
      setStatus('loading');
      try {
        await sendPasswordResetEmail(auth, email);
        setStatus('idle');
        setResetSuccessMsg(`We sent you a Password Change link to ${email}`);
      } catch (error: any) {
        setStatus('idle');
        setErrorMsg(error.message);
      }
      return;
    }

    if (view === 'signup') {
      if (!name || !email || !password || !confirmPassword || !age) {
        setErrorMsg(t.fillAllFields);
        return;
      }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setErrorMsg(t.passwordRequirements);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t.passwordMismatch);
        return;
      }
      
      setStatus('loading');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          age,
          photoFileName: profilePhoto ? profilePhoto.name : null,
          createdAt: new Date().toISOString()
        });
        setStatus('success');
        localStorage.setItem('cognify_user', JSON.stringify({ email, age }));
      } catch (error: any) {
        setStatus('idle');
        if (error.code === 'auth/email-already-in-use') {
          setErrorMsg('User already exists.Sign in?');
        } else {
          setErrorMsg(t.signupError || error.message);
        }
      }
    } else {
      if (!email || !password) {
        setErrorMsg(t.enterEmailPassword);
        return;
      }
      
      setStatus('loading');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            name: email.split('@')[0],
            email,
            photoFileName: null,
            createdAt: new Date().toISOString()
          });
        }
        setStatus('success');
        const userAge = localStorage.getItem('cognify_user') ? JSON.parse(localStorage.getItem('cognify_user')!).age : '72';
        setAge(userAge);
        localStorage.setItem('cognify_user', JSON.stringify({ email, age: userAge }));
      } catch (error: any) {
        setStatus('idle');
        setErrorMsg('Password or Email Incorrect');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('cognify_user');
    resetForm();
  };

  const resetForm = () => {
    setStatus('idle');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAge('');
    setProfilePhoto(null);
    setErrorMsg('');
    setResetSuccessMsg('');
  };

  const toggleView = () => {
    setView(view === 'login' ? 'signup' : 'login');
    setErrorMsg('');
    setResetSuccessMsg('');
    setStatus('idle');
  };

  const getBgClass = () => {
    return 'bg-[#0abab5] text-teal-950';
  };

  const getGlowClass = () => {
    return 'bg-gradient-to-tr from-teal-300/40 via-cyan-200/40 to-white/40';
  };

  const getAuthCardClass = () => {
    return 'bg-white border-slate-200 shadow-xl';
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-y-auto font-sans transition-colors duration-500 custom-scrollbar ${getBgClass()}`}>
      <div className="flex-1 flex items-center justify-center p-4 w-full">
        <div className="fixed top-4 right-4 flex items-center gap-3 z-50">
        {/* Language Selector */}
        <div className={`relative flex items-center rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 px-3 py-1.5 bg-white/40 border-white/60 shadow-sm`}>
          <Globe className={`w-3.5 h-3.5 mr-2 text-slate-600`} />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className={`bg-transparent text-xs font-medium focus:outline-none appearance-none cursor-pointer pr-4 text-slate-700`}
          >
            <option value="en" className={'bg-white'}>English</option>
            <option value="hi" className={'bg-white'}>हिंदी</option>
            <option value="or" className={'bg-white'}>ଓଡ଼ିଆ</option>
            <option value="bn" className={'bg-white'}>বাংলা</option>
          </select>
          {/* Custom dropdown arrow */}
          <div className={`absolute right-2 pointer-events-none text-slate-500`}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Ambient Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] rounded-full pointer-events-none transition-colors duration-500 ${getGlowClass()}`} />

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <Dashboard email={email} age={age} onLogout={handleLogout} lang={lang} />
        ) : (
          <motion.div 
            key="auth-container"
            className="relative w-full max-w-md z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {status === 'idle' || status === 'loading' ? (
                <motion.div
                  key={`form-${view}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
              {/* Glowing Border Wrapper */}
              <div className="relative group">
                <div className="absolute -inset-[1px] bg-teal-400 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition duration-500"></div>
                <div className="absolute -inset-[1px] bg-teal-400 rounded-2xl opacity-50"></div>
                
                {/* Glassmorphism Card */}
                <div className={`relative backdrop-blur-2xl p-8 rounded-2xl border shadow-2xl transition-colors duration-500 ${getAuthCardClass()}`}>
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-teal-500 blur-lg opacity-50 rounded-full"></div>
                      <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-colors duration-500 border-white/60 bg-white`}>
                        <img src="https://images.unsplash.com/photo-1674027444485-cec3da58eef4?q=80&w=200&auto=format&fit=crop" alt="AI Brain Generated Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight mb-2">
                      {view === 'login' ? (
                        <>{t.welcomeTo}<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700">Cognify</span></>
                      ) : view === 'signup' ? (
                        <>{t.createAn}<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700">{t.account}</span></>
                      ) : (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700">{t.resetPassword}</span>
                      )}
                    </h1>
                    <p className={`text-sm transition-colors duration-500 text-slate-700`}>
                      {view === 'login' ? t.enterLoginDetails : view === 'signup' ? t.joinToday : t.enterEmailToReset}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm text-center">
                        {errorMsg}
                      </div>
                    )}
                    {resetSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm text-center">
                        {resetSuccessMsg}
                      </div>
                    )}

                    {view === 'signup' && (
                      <>
                        <div className="space-y-1.5">
                          <label className={`text-xs font-medium ml-1 transition-colors duration-500 text-slate-700`}>{t.profilePhoto}</label>
                          <label className={`w-full rounded-xl px-4 py-3 text-sm border border-dashed transition-all flex items-center justify-center gap-2 cursor-pointer bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100`}>
                            <Upload className="w-4 h-4" />
                            <span>{profilePhoto ? profilePhoto.name : t.profilePhoto}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                              className="hidden" 
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label htmlFor="name" className={`text-xs font-medium ml-1 transition-colors duration-500 text-slate-700`}>{t.fullName}</label>
                            <input
                              id="name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              disabled={status === 'loading'}
                              placeholder="Kartik kumar sahu"
                              className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all disabled:opacity-50 shadow-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white`}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="age" className={`text-xs font-medium ml-1 transition-colors duration-500 text-slate-700`}>{t.age}</label>
                            <input
                              id="age"
                              type="number"
                              min="1"
                              max="120"
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              disabled={status === 'loading'}
                              placeholder="25"
                              className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all disabled:opacity-50 shadow-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white`}
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="space-y-1.5">
                      <label htmlFor="email" className={`text-xs font-medium ml-1 transition-colors duration-500 text-slate-700`}>{t.emailAddress}</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === 'loading'}
                        placeholder="kartik@example.com"
                        className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(217,70,239,0.3)] bg-white/40 backdrop-blur-md border border-white/60 text-slate-900 placeholder:text-slate-600 focus:bg-white/50`}
                      />
                    </div>

                    {(view === 'signup' || view === 'login') && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                          <label htmlFor="password" className={`text-xs font-medium transition-colors duration-500 text-slate-700`}>{t.password}</label>
                          {view === 'login' && (
                            <button
                              type="button"
                              onClick={() => { setView('forgot-password'); setErrorMsg(''); setResetSuccessMsg(''); }}
                              className={`text-xs font-medium transition-colors duration-500 text-fuchsia-600 hover:text-fuchsia-700`}
                            >
                              {t.forgotPassword}
                            </button>
                          )}
                        </div>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={status === 'loading'}
                          placeholder="••••••••"
                          className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(217,70,239,0.3)] bg-white/40 backdrop-blur-md border border-white/60 text-slate-900 placeholder:text-slate-600 focus:bg-white/50`}
                        />
                        {view === 'signup' && (
                          <p className={`text-[10px] ml-1 transition-colors duration-500 text-slate-600`}>
                            {t.passwordRequirements}
                          </p>
                        )}
                      </div>
                    )}

                    {view === 'signup' && (
                      <div className="space-y-1.5">
                        <label htmlFor="confirmPassword" className={`text-xs font-medium ml-1 transition-colors duration-500 text-slate-700`}>{t.confirmPassword}</label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={status === 'loading'}
                          placeholder="••••••••"
                          className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(217,70,239,0.3)] bg-white/40 backdrop-blur-md border border-white/60 text-slate-900 placeholder:text-slate-600 focus:bg-white/50`}
                        />
                      </div>
                    )}

                    <div className="pt-4 space-y-4">
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="relative w-full group/btn"
                      >
                        {/* Button Glow */}
                        <div className="absolute -inset-0.5 bg-teal-500 rounded-xl blur opacity-40 group-hover/btn:opacity-80 transition duration-300"></div>
                        
                        {/* Button Content */}
                        <div className={`relative w-full px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 overflow-hidden border transition-colors duration-500 bg-teal-600 border-teal-500 text-white hover:bg-teal-700`}>
                          {/* Subtle inner gradient hover effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-teal-600/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          
                          {status === 'loading' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <span className="font-medium text-sm">{view === 'login' ? t.logIn : view === 'signup' ? t.createAccountBtn : t.getResetLink}</span>
                              <ArrowRight className={`w-4 h-4 group-hover/btn:translate-x-1 transition-all text-teal-100 group-hover/btn:text-white`} />
                            </>
                          )}
                        </div>
                      </button>

                      <div className="text-center">
                        {view === 'forgot-password' ? (
                          <button
                            type="button"
                            onClick={() => { setView('login'); setErrorMsg(''); setResetSuccessMsg(''); }}
                            disabled={status === 'loading'}
                            className={`text-sm transition-colors duration-500 text-slate-700 hover:text-slate-900`}
                          >
                            {t.returnToLogin}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={toggleView}
                            disabled={status === 'loading'}
                            className={`text-sm transition-colors duration-500 text-slate-700 hover:text-slate-900`}
                          >
                            {view === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-md opacity-40"></div>
              <div className={`relative backdrop-blur-2xl p-10 rounded-2xl border shadow-2xl text-center transition-colors duration-500 ${getAuthCardClass()}`}>
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  {view === 'login' ? t.welcomeBack : t.accountCreated}
                </h2>
                <p className={`text-sm mb-8 transition-colors duration-500 text-slate-700`}>
                  {view === 'login' ? t.loggedInAs : t.createdAccountFor}
                  <span className={'text-slate-900 font-medium'}>
                    {view === 'login' ? email : (name || email)}
                  </span>.
                </p>
                <button
                  onClick={resetForm}
                  className={`text-sm transition-colors duration-500 text-slate-600 hover:text-slate-900`}
                >
                  {view === 'login' ? t.returnToLogin : t.returnToSignUp}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-rose-500 to-red-500 rounded-2xl blur-md opacity-40"></div>
              <div className={`relative backdrop-blur-2xl p-10 rounded-2xl border shadow-2xl text-center transition-colors duration-500 ${getAuthCardClass()}`}>
                <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                  <XCircle className="w-8 h-8 text-rose-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">{t.oops}</h2>
                <p className={`text-sm mb-8 transition-colors duration-500 text-slate-700`}>
                  {view === 'login' ? t.loginError : t.signupError}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="relative group/btn inline-block w-full"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-red-500 rounded-xl blur opacity-40 group-hover/btn:opacity-80 transition duration-300"></div>
                  <div className={`relative w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 border transition-colors duration-500 bg-white border-slate-200 text-slate-900 hover:bg-slate-50`}>
                    <span className="font-medium text-sm">{t.tryAgain}</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
