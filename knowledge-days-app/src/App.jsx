import React, { useState, useEffect } from "react";
import { ArrowUpCircle, Send, UserCircle, Sparkles, RotateCcw, X, Lock, MessageCircle, Users, Trophy, Star, Zap } from "lucide-react";
import { collection, getDocs, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { questionsData } from "./data/questions";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';

function App() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [author, setAuthor] = useState("");
  const [showInputError, setShowInputError] = useState(false);
  const [recentlyVoted, setRecentlyVoted] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionActive, setSessionActive] = useState(true); // Default to active for simplicity
  const [votedQuestions, setVotedQuestions] = useState(() => {
    const saved = localStorage.getItem('votedQuestions');
    return saved ? JSON.parse(saved) : {};
  });
  const [sessionStats, setSessionStats] = useState(() => {
    const saved = localStorage.getItem('currentSessionStats');
    return saved ? JSON.parse(saved) : {
      participationCount: 0,
      topContributor: null,
      mostVotedQuestion: null,
      startTime: Date.now()
    };
  });
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  // Achievement definitions
  const ACHIEVEMENTS = {
    FIRST_QUESTION: {
      id: 'first_question',
      title: 'Ice Breaker',
      description: 'Posted your first question!',
      icon: '🎯'
    },
    POPULAR_QUESTION: {
      id: 'popular_question',
      title: 'Crowd Favorite',
      description: 'Your question got 5 votes!',
      icon: '⭐'
    },
    ACTIVE_PARTICIPANT: {
      id: 'active_participant',
      title: 'Knowledge Seeker',
      description: 'Posted 3 questions in one session',
      icon: '🎓'
    },
    QUICK_THINKER: {
      id: 'quick_thinker',
      title: 'Quick Thinker',
      description: 'Asked a question within the first minute',
      icon: '⚡'
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#818cf8', '#c084fc', '#f472b6']
    });
  };

  const unlockAchievement = (achievement) => {
    if (!achievements.includes(achievement.id)) {
      setAchievements(prev => [...prev, achievement.id]);
      setCurrentAchievement(achievement);
      setShowAchievement(true);
      
      // More exciting confetti for achievements
      const duration = 2000;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const particleCount = 50;
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      setTimeout(() => {
        clearInterval(interval);
      }, duration);

      setTimeout(() => setShowAchievement(false), 3000);
    }
  };

  // Save voted questions to localStorage
  useEffect(() => {
    localStorage.setItem('votedQuestions', JSON.stringify(votedQuestions));
  }, [votedQuestions]);

  // Save session stats to localStorage
  useEffect(() => {
    localStorage.setItem('currentSessionStats', JSON.stringify(sessionStats));
  }, [sessionStats]);

  useEffect(() => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Check for admin mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get('mode') === 'admin');
  }, []);

  // Fetch questions from Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "questions"), (snapshot) => {
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        hasVoted: votedQuestions[doc.id] || false,
        ...doc.data(),
      }));
      setQuestions(questionsData);
    });

    return () => unsubscribe();
  }, [votedQuestions]);

  // Check for achievements
  useEffect(() => {
    const userQuestions = questions.filter(q => q.author === author);
    
    // First question achievement
    if (userQuestions.length === 1) {
      unlockAchievement(ACHIEVEMENTS.FIRST_QUESTION);
    }

    // Active participant achievement
    if (userQuestions.length === 3) {
      unlockAchievement(ACHIEVEMENTS.ACTIVE_PARTICIPANT);
    }

    // Quick thinker achievement
    const firstQuestionTime = userQuestions[0]?.timestamp;
    const sessionStartTime = Math.min(...questions.map(q => q.timestamp));
    if (firstQuestionTime && (firstQuestionTime - sessionStartTime) < 60000) {
      unlockAchievement(ACHIEVEMENTS.QUICK_THINKER);
    }
  }, [questions, author]);

  // Check for vote achievements
  useEffect(() => {
    questions.forEach(question => {
      if (question.author === author && question.votes >= 5) {
        unlockAchievement(ACHIEVEMENTS.POPULAR_QUESTION);
      }
    });
  }, [questions, author]);

  const resetQuestions = async () => {
    if (window.confirm("Are you sure you want to clear all questions? This will permanently delete them.")) {
      try {
        const querySnapshot = await getDocs(collection(db, "questions"));
        const deletePromises = querySnapshot.docs.map((doc) =>
          deleteDoc(doc(db, "questions", doc.id))
        );
        await Promise.all(deletePromises);

        // Reset voted questions in localStorage
        setVotedQuestions({});
        
        alert("Questions have been cleared!");
      } catch (error) {
        console.error("Error clearing questions:", error);
        alert("Failed to clear questions. Please try again.");
      }
    }
  };

  const toggleSession = () => {
    setSessionActive(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionActive) {
      alert('The session is paused. Please wait for the admin to resume.');
      return;
    }
    if (!newQuestion.trim()) {
      setShowInputError(true);
      const input = document.getElementById("questionInput");
      input.classList.add("shake");
      setTimeout(() => {
        input.classList.remove("shake");
        setShowInputError(false);
      }, 650);
      return;
    }

    const newQuestionObj = {
      text: newQuestion.trim(),
      author: author.trim() || "Anonymous",
      votes: 0,
      timestamp: Date.now(),
    };

    try {
      await addDoc(collection(db, "questions"), newQuestionObj);
      setNewQuestion("");
      setAuthor("");
      
      // Update session stats and check achievements
      setSessionStats(prev => {
        const stats = { ...prev };
        stats.participationCount++;
        return stats;
      });
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const handleVote = async (questionId) => {
    if (!sessionActive) {
      alert('The session is paused. Please wait for the admin to resume.');
      return;
    }
    if (votedQuestions[questionId]) return;

    try {
      const questionRef = doc(db, "questions", questionId);
      const questionToUpdate = questions.find((q) => q.id === questionId);
      
      await updateDoc(questionRef, {
        votes: (questionToUpdate.votes || 0) + 1,
      });

      setVotedQuestions(prev => ({
        ...prev,
        [questionId]: true
      }));

      setRecentlyVoted(questionId);
      setTimeout(() => setRecentlyVoted(null), 1000);
    } catch (error) {
      console.error("Error updating vote:", error);
    }
  };

  const handleDismissQuestion = async (questionId) => {
    if (!isAdmin) return;
    
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteDoc(doc(db, "questions", questionId));
      } catch (error) {
        console.error("Error deleting question:", error);
        alert("Failed to delete question. Please try again.");
      }
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => b.votes - a.votes);
  const totalVotes = questions.reduce((sum, q) => sum + (q.votes || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 py-8 px-4 sm:px-6">
      {/* Session Status Banner (only show when paused) */}
      {!sessionActive && (
        <div className="mb-4 p-3 bg-orange-100 text-orange-700 rounded-lg text-center animate-pulse">
          <p className="font-medium">Session is currently paused</p>
        </div>
      )}

      {/* Achievement Toast */}
      <AnimatePresence>
        {showAchievement && currentAchievement && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="fixed bottom-[200px] sm:bottom-[220px] left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center gap-3 relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-gradient" />
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-5" />
              </div>
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="w-12 h-12 flex items-center justify-center text-2xl bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl relative"
              >
                {currentAchievement.icon}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              </motion.div>
              <div className="relative">
                <motion.h3 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="font-bold text-gray-900 dark:text-white text-lg"
                >
                  {currentAchievement.title}
                </motion.h3>
                <motion.p 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  {currentAchievement.description}
                </motion.p>
              </div>
              <motion.div
                className="absolute inset-0 rounded-xl"
                initial={{ borderWidth: 0, opacity: 0 }}
                animate={{ borderWidth: 4, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  borderStyle: 'solid',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-4 sm:p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-10"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-lg">
                <Sparkles className="text-white w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                  Knowledge Days
                </h1>
                <p className="text-sm sm:text-base text-indigo-200">Share your curiosity, spark discussions</p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={toggleSession}
                  className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg ${
                    sessionActive 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-all duration-300 hover:scale-105`}
                >
                  {sessionActive ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={resetQuestions}
                  className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-indigo-200 mb-1">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Questions</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white">{questions.length}</div>
            </div>

            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-indigo-200 mb-1">
                <ArrowUpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Votes</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white">
                {questions.reduce((sum, q) => sum + (q.votes || 0), 0)}
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-indigo-200 mb-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">People</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white">
                {new Set(questions.map(q => q.author)).size}
              </div>
            </div>
          </div>
        </div>

        {/* Top Questions Section */}
        {questions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transform hover:scale-[1.02] transition-all duration-300">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Questions
            </h2>
            <div className="space-y-3">
              {questions
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                .slice(0, 3)
                .map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/50 dark:to-indigo-900/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-gray-200 mb-2">{question.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <UserCircle className="w-4 h-4" />
                        <span>{question.author}</span>
                        <span>•</span>
                        <span>{question.votes || 0} votes</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2"> Session Stats</h3>
          <p className="text-gray-700">{sessionStats.participationCount} contributions</p>
        </div>
        
        {/* Questions List with bottom padding for fixed input */}
        <div className="space-y-4 pb-[180px] sm:pb-[200px]">
          <AnimatePresence>
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.1
                }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${
                  question.votes >= 5 ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        handleVote(question.id);
                        if (question.votes === 4) { // Will become 5 after the vote
                          setTimeout(() => {
                            triggerConfetti();
                          }, 100);
                        }
                      }}
                      disabled={!sessionActive}
                      className={`flex flex-col items-center gap-1 ${
                        !sessionActive ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          transition: { duration: 0.3 }
                        }}
                      >
                        <ArrowUpCircle className={`w-8 h-8 ${
                          question.votes > 0 ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {question.votes || 0}
                      </span>
                    </motion.button>

                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-gray-200 mb-2">{question.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <UserCircle className="w-4 h-4" />
                        <span>{question.author || 'Anonymous'}</span>
                        {question.votes >= 5 && (
                          <span className="inline-flex items-center gap-1 text-purple-500">
                            <Star className="w-4 h-4" />
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Fixed Question Input at Bottom */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700"
        >
          <div className="max-w-3xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => {
                  setNewQuestion(e.target.value);
                  setShowInputError(false);
                }}
                placeholder="Ask a question..."
                className="w-full px-4 py-3 pr-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:focus:ring-purple-400 transition-shadow text-base md:text-base"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.5',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
                maxLength={280}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!sessionActive}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                  sessionActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } transition-all duration-300`}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Share</span>
              </motion.button>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name (optional)"
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base rounded-xl border-2 border-purple-100 dark:border-purple-900 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-300 bg-white/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 backdrop-blur-sm"
              />
              {/* Fun Messages */}
              <AnimatePresence mode="wait">
                {newQuestion.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs sm:text-sm"
                  >
                    {newQuestion.length < 10 ? (
                      <span className="text-blue-500">Keep going! What's on your mind? 🤔</span>
                    ) : newQuestion.length < 50 ? (
                      <span className="text-indigo-500">That's interesting! Care to elaborate? ✨</span>
                    ) : newQuestion.length < 100 ? (
                      <span className="text-purple-500">Now we're talking! Great question forming... 🌟</span>
                    ) : (
                      <span className="text-pink-500">Wow, that's a thoughtful question! 🎯</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!sessionActive && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs sm:text-sm text-orange-500 dark:text-orange-400"
                >
                  Session is paused. Please wait for the host to resume.
                </motion.div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
