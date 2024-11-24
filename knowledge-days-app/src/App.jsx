import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, Send, UserCircle, Sparkles } from 'lucide-react';

// Initial questions from the group
const INITIAL_QUESTIONS = [
  {
    id: 1,
    text: "How do you start planning your yearly income apart from investments?",
    author: "Surabhi",
    votes: 0,
    hasVoted: false,
    timestamp: Date.now()
  },
  // ... (add all other questions)
];

function App() {
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });
  const [newQuestion, setNewQuestion] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [showInputError, setShowInputError] = useState(false);
  const [recentlyVoted, setRecentlyVoted] = useState(null);

  // Persist questions in localStorage
  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
  }, [questions]);

  const handleVote = (questionId) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId && !q.hasVoted) {
        return { ...q, votes: q.votes + 1, hasVoted: true };
      }
      return q;
    }));
    setRecentlyVoted(questionId);
    setTimeout(() => setRecentlyVoted(null), 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      setShowInputError(true);
      // Shake animation on input
      const input = document.getElementById('questionInput');
      input.classList.add('shake');
      setTimeout(() => {
        input.classList.remove('shake');
        setShowInputError(false);
      }, 650);
      return;
    }

    const newQuestionObj = {
      id: Date.now(),
      text: newQuestion.trim(),
      author: authorName.trim() || 'Anonymous',
      votes: 0,
      hasVoted: false,
      timestamp: Date.now()
    };

    setQuestions(prev => [...prev, newQuestionObj]);
    setNewQuestion('');
    setAuthorName('');

    // Show confetti effect
    createConfetti();
  };

  const createConfetti = () => {
    const confetti = Array.from({ length: 20 }, (_, i) => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.setProperty('--delay', `${Math.random() * 500}ms`);
      confetti.style.setProperty('--x', `${Math.random() * 100 - 50}px`);
      confetti.style.left = `${Math.random() * 100}vw`;
      return confetti;
    });

    const container = document.createElement('div');
    container.className = 'confetti-container';
    confetti.forEach(c => container.appendChild(c));
    document.body.appendChild(container);

    setTimeout(() => container.remove(), 2000);
  };

  const sortedQuestions = [...questions].sort((a, b) => b.votes - a.votes);
  const totalVotes = questions.reduce((sum, q) => sum + q.votes, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        
        <div className="max-w-4xl mx-auto px-4 py-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-white animate-pulse" size={24} />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Knowledge Days with Warikoo
              </h1>
            </div>
            <div className="flex items-center gap-2 text-indigo-200 text-sm md:text-base">
              <span>{totalVotes} votes</span>
              <span className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></span>
              <span>{questions.length} questions</span>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Questions List */}
      <div className="max-w-2xl mx-auto p-4 pb-32">
        <div className="space-y-4">
          {sortedQuestions.map(question => (
            <div
              key={question.id}
              className="bg-white rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-xl hover:scale-102 group"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleVote(question.id)}
                  disabled={question.hasVoted}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    question.hasVoted
                      ? 'text-purple-300 cursor-not-allowed'
                      : 'text-purple-600 hover:text-purple-700 hover:scale-110'
                  } ${recentlyVoted === question.id ? 'vote-pop' : ''}`}
                >
                  <ArrowUpCircle 
                    size={28}
                    className="transform transition-transform group-hover:scale-110"
                  />
                  <span className="font-bold text-lg">{question.votes}</span>
                </button>
                <div className="flex-1">
                  <p className="text-gray-800 text-lg mb-2 font-medium">
                    {question.text}
                  </p>
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
                  showInputError ? 'border-red-300 animate-shake' : 'border-purple-200'
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
          position: fixed;
          width: 10px;
          height: 10px;
          background: var(--color);
          border-radius: 2px;
          animation: confetti-fall 2s ease-in-out var(--delay) forwards;
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

        .confetti:nth-child(4n) { --color: #FF69B4; }
        .confetti:nth-child(4n + 1) { --color: #7B68EE; }
        .confetti:nth-child(4n + 2) { --color: #87CEEB; }
        .confetti:nth-child(4n + 3) { --color: #FFD700; }
      `}</style>
    </div>
  );
}

export default App;