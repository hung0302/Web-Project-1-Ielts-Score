import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  text: string;
}

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/prompts')
      .then((res) => res.json())
      .then((data) => {
        setPrompts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch prompts', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          IELTS Writing Practice
        </h1>
        <p className="mt-4 text-xl text-slate-500">
          Select a prompt below, write your essay, and get instant AI-powered scoring.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
          >
            <div className="p-6 flex-grow">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                  Task 2
                </span>
                <span className="flex items-center text-sm text-slate-500">
                  <Clock className="w-4 h-4 mr-1" />
                  40 mins
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{prompt.title}</h3>
              <p className="text-slate-600 line-clamp-4 text-sm leading-relaxed">
                {prompt.text}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => navigate(`/write/${prompt.id}`)}
                className="w-full flex items-center justify-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors group"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Start Writing
                <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
