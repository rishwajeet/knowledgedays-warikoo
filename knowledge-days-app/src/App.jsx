import React, { useState, useEffect } from "react";
import { ArrowUpCircle, Send, UserCircle, Sparkles, RotateCcw } from "lucide-react";
import { collection, getDocs, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { questionsData } from "./data/questions";

function App() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showInputError, setShowInputError] = useState(false);
  const [recentlyVoted, setRecentlyVoted] = useState(null);
  const [votedQuestions, setVotedQuestions] = useState(() => {
    const saved = localStorage.getItem('votedQuestions');
    return saved ? JSON.parse(saved) : {};
  });

  // Save voted questions to localStorage
  useEffect(() => {
    localStorage.setItem('votedQuestions', JSON.stringify(votedQuestions));
  }, [votedQuestions]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      author: authorName.trim() || "Anonymous",
      votes: 0,
      timestamp: Date.now(),
    };

    try {
      await addDoc(collection(db, "questions"), newQuestionObj);
      setNewQuestion("");
      setAuthorName("");
      createConfetti();
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const handleVote = async (questionId) => {
    if (votedQuestions[questionId]) return;

    try {
      const questionRef = doc(db, "questions", questionId);
      const questionToUpdate = questions.find((q) => q.id === questionId);
      
      // Update vote count
      await updateDoc(questionRef, {
        votes: (questionToUpdate.votes || 0) + 1,
      });

      // Mark question as voted
      setVotedQuestions(prev => ({
        ...prev,
        [questionId]: true
      }));

      // Show vote animation
      setRecentlyVoted(questionId);
      setTimeout(() => setRecentlyVoted(null), 1000);
    } catch (error) {
      console.error("Error updating vote:", error);
    }
  };

  const resetQuestions = async () => {
    if (window.confirm("Are you sure you want to reset all questions? This will restore the original set of questions.")) {
      try {
        const querySnapshot = await getDocs(collection(db, "questions"));
        const deletePromises = querySnapshot.docs.map((question) =>
          deleteDoc(doc(db, "questions", question.id))
        );
        await Promise.all(deletePromises);

        const addPromises = questionsData.map((question) =>
          addDoc(collection(db, "questions"), {
            ...question,
            votes: 0,
            timestamp: Date.now(),
          })
        );
        await Promise.all(addPromises);

        // Reset voted questions in localStorage
        setVotedQuestions({});
        
        // Show success message
        alert("Questions have been reset successfully!");
      } catch (error) {
        console.error("Error resetting questions:", error);
        alert("Failed to reset questions. Please try again.");
      }
    }
  };

  const createConfetti = () => {
    const colors = ['#FF69B4', '#7B68EE', '#87CEEB', '#FFD700'];
    const confettiCount = 100;
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.setProperty('--delay', `${Math.random() * 500}ms`);
      confetti.style.setProperty('--x', `${Math.random() * 100 - 50}px`);
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      container.appendChild(confetti);
    }
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 2500);
  };

  const sortedQuestions = [...questions].sort((a, b) => b.votes - a.votes);
  const totalVotes = questions.reduce((sum, q) => sum + (q.votes || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 py-6 relative">
          <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-white animate-pulse" size={24} />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Knowledge Days with Warikoo
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-indigo-200">
                <span>{totalVotes} votes</span>
                <span className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></span>
                <span>{questions.length} questions</span>
              </div>
              <button
                onClick={resetQuestions}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Questions List */}
      <div className="max-w-2xl mx-auto p-4 pb-32">
        <div className="space-y-4">
          {sortedQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-xl hover:scale-102 group"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleVote(question.id)}
                  disabled={votedQuestions[question.id]}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    votedQuestions[question.id]
                      ? "text-purple-300 cursor-not-allowed"
                      : "text-purple-600 hover:text-purple-700 hover:scale-110"
                  } ${recentlyVoted === question.id ? "vote-pop" : ""}`}
                >
                  <ArrowUpCircle
                    size={28}
                    className="transform transition-transform group-hover:scale-110"
                  />
                  <span className="font-bold text-lg">{question.votes || 0}</span>
                </button>
                <div className="flex-1">
                  <p className="text-gray-800 text-lg mb-2 font-medium">{question.text}</p>
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserCircle size={16} className="text-purple-400" />
                    <span className="text-sm">{question.author}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question Input Form */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-purple-100">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                id="questionInput"
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ask your question..."
                className={`flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 ${
                  showInputError ? "border-red-300 animate-shake" : "border-purple-200"
                }`}
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 relative overflow-hidden group"
              >
                <Send size={20} className="relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10">Ask</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes vote-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .vote-pop {
          animation: vote-pop 0.3s ease-out;
        }

        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: confetti-fall 2.5s ease-out forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) translateX(var(--x));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;