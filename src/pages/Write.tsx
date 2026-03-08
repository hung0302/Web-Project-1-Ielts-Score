import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Send, AlertCircle } from 'lucide-react';

interface WriteProps {
  user: { user_id: string; username: string };
}

export default function Write({ user }: WriteProps) {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<{ id: string; title: string; text: string } | null>(null);
  const [content, setContent] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(40 * 60); // 40 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch prompt details
    fetch('/api/prompts')
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => p.id === promptId);
        if (found) setPrompt(found);
        else setError('Prompt not found');
      })
      .catch(() => setError('Failed to load prompt'));

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [promptId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const wordCount = content.trim().split(/\s+/).filter((w) => w.length > 0).length;

  const handleSubmit = async () => {
    if (content.trim().length < 50) {
      setError('Your essay is too short. Please write at least 50 words.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          content,
          time: 40 * 60 - timeRemaining,
          prompt_text: prompt?.text,
        }),
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/result/${data.writing_id}`);
      } else {
        setError(data.message || 'Failed to submit essay');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!prompt) {
    return (
      <div className="flex justify-center items-center h-64">
        {error ? <p className="text-red-500">{error}</p> : <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
      {/* Left Column: Prompt */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-y-auto">
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 mb-4">
            IELTS Writing Task 2
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{prompt.title}</h2>
          <div className="prose prose-slate prose-sm">
            <p className="text-lg leading-relaxed text-slate-700 font-medium">
              {prompt.text}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span className="flex items-center font-medium">
              <Clock className="w-4 h-4 mr-2" />
              Time Remaining
            </span>
            <span className={`font-mono text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-slate-900'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${timeRemaining < 300 ? 'bg-red-500' : 'bg-indigo-600'}`}
              style={{ width: `${(timeRemaining / (40 * 60)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Right Column: Editor */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-700">
              Word Count: <span className={`font-bold ${wordCount < 250 ? 'text-amber-600' : 'text-emerald-600'}`}>{wordCount}</span>
            </span>
            {wordCount < 250 && (
              <span className="text-xs text-amber-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Aim for 250+ words
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Essay
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-grow w-full p-6 resize-none focus:outline-none focus:ring-0 text-slate-800 text-lg leading-relaxed font-serif"
          placeholder="Start writing your essay here..."
          spellCheck="false"
        />
      </div>
    </div>
  );
}
