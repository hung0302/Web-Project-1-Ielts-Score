import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ArrowLeft, BarChart3, MessageSquare } from 'lucide-react';

interface ScoreData {
  TA_score: number;
  CC_score: number;
  LR_score: number;
  GRA_score: number;
  Comment: string;
}

interface WritingData {
  writing_content: string;
  writing_time: number;
  prompt_text?: string;
}

export default function Result() {
  const { writingId } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState<ScoreData | null>(null);
  const [writing, setWriting] = useState<WritingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/results/${writingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setScore(data.score);
          setWriting(data.writing);
        } else {
          setError(data.message || 'Failed to load results');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch results', err);
        setError('Network error');
        setLoading(false);
      });
  }, [writingId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 font-medium animate-pulse">Analyzing your essay...</p>
      </div>
    );
  }

  if (error || !score || !writing) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium text-lg">{error || 'Results not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>
      </div>
    );
  }

  const ta = score.TA_score ?? 0;
  const cc = score.CC_score ?? 0;
  const lr = score.LR_score ?? 0;
  const gra = score.GRA_score ?? 0;
  const overallScore = ((ta + cc + lr + gra) / 4).toFixed(1);

  const getScoreColor = (val: number) => {
    if (isNaN(val) || val === 0) return 'text-slate-600 bg-slate-50 border-slate-200';
    if (val >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 6.5) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (val >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreBg = (val: number) => {
    if (isNaN(val) || val === 0) return 'bg-slate-500';
    if (val >= 8) return 'bg-emerald-500';
    if (val >= 6.5) return 'bg-indigo-500';
    if (val >= 5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Evaluation Complete</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Scores */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-slate-500 uppercase tracking-wider mb-2">Overall Band Score</h2>
            <div className={`text-6xl font-black ${getScoreColor(parseFloat(overallScore)).split(' ')[0]} mb-4`}>
              {overallScore}
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getScoreBg(parseFloat(overallScore))}`}
                style={{ width: `${(parseFloat(overallScore) / 9) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-bold text-slate-900">Detailed Criteria</h3>
            </div>
            <div className="space-y-5">
              <ScoreBar label="Task Achievement" score={score.TA_score} getScoreColor={getScoreColor} getScoreBg={getScoreBg} />
              <ScoreBar label="Coherence & Cohesion" score={score.CC_score} getScoreColor={getScoreColor} getScoreBg={getScoreBg} />
              <ScoreBar label="Lexical Resource" score={score.LR_score} getScoreColor={getScoreColor} getScoreBg={getScoreBg} />
              <ScoreBar label="Grammatical Range" score={score.GRA_score} getScoreColor={getScoreColor} getScoreBg={getScoreBg} />
            </div>
          </div>
        </div>

        {/* Right Column: Feedback & Essay */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-6 h-6 text-indigo-500 mr-3" />
              <h3 className="text-2xl font-bold text-slate-900">Examiner Feedback</h3>
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border border-slate-100">
                {score.Comment}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Your Essay</h3>
            {writing.prompt_text && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">Prompt</h4>
                <p className="text-indigo-800 font-medium italic">{writing.prompt_text}</p>
              </div>
            )}
            <div className="prose prose-slate max-w-none font-serif text-lg leading-relaxed text-slate-800 whitespace-pre-wrap">
              {writing.writing_content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, getScoreColor, getScoreBg }: { label: string; score: number | null; getScoreColor: (s: number) => string; getScoreBg: (s: number) => string }) {
  const displayScore = score ?? 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`text-sm font-bold px-2 py-0.5 rounded border ${getScoreColor(displayScore)}`}>
          {score !== null && score !== undefined ? Number(score).toFixed(1) : 'N/A'}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getScoreBg(displayScore)}`}
          style={{ width: `${(displayScore / 9) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
