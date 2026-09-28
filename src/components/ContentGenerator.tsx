import React, { useState } from 'react';
import { Copy, X, Loader2, PenTool, Youtube, Instagram, Plus } from 'lucide-react';
import { ContentGenerationResult } from '../types';

interface Props {
  onCopy: (text: string, label: string) => void;
}

export const ContentGenerator: React.FC<Props> = ({ onCopy }) => {
  const [scriptContext, setScriptContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [result, setResult] = useState<ContentGenerationResult | null>(null);
  const [moreComments, setMoreComments] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!scriptContext.trim()) return;
    setLoading(true);
    setMoreComments([]);
    try {
      const res = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptContext }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch('/api/generate/more-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptContext }),
      });
      const data = await res.json();
      if (data.comments) {
        setMoreComments((prev) => [...prev, ...data.comments]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClear = () => {
    setScriptContext('');
    setResult(null);
    setMoreComments([]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">
        AI Content & Comment Generator
      </h1>

      {/* Input Card */}
      <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
        <label className="block text-sm font-medium text-slate-300">
          Input Your YouTube Video Script/Context:
        </label>

        <div className="relative">
          <textarea
            value={scriptContext}
            onChange={(e) => setScriptContext(e.target.value)}
            placeholder="Paste script or key topics here..."
            rows={7}
            className="w-full bg-[#0b0917] border border-[#252046] rounded-xl p-4 pr-12 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm resize-y"
          />
          {scriptContext && (
            <button
              onClick={handleClear}
              title="Clear context"
              className="absolute top-3 right-3 p-1.5 rounded-md bg-[#1b1735] hover:bg-[#28224d] text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !scriptContext.trim()}
          className="w-full py-3.5 px-6 rounded-xl bg-[#671ceb] hover:bg-[#7427f7] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating Content & Comments...</span>
            </>
          ) : (
            <>
              <span>Generate Content</span>
              <PenTool size={16} />
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: YouTube Comments */}
            <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 text-white border-b border-[#231e42] pb-4">
                <Youtube className="text-red-500 fill-red-500/20" size={22} />
                <h2 className="text-xl font-bold">YouTube Comments</h2>
              </div>

              <div className="space-y-4">
                {result.youtubeComments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {comment.label}
                    </span>
                    <div className="relative group">
                      <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-200 text-sm leading-relaxed min-h-[90px]">
                        {comment.text}
                      </div>
                      <button
                        onClick={() => onCopy(comment.text, comment.label)}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                        title={`Copy ${comment.label}`}
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Instagram SMS */}
            <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 text-white border-b border-[#231e42] pb-4">
                <Instagram className="text-pink-500" size={22} />
                <h2 className="text-xl font-bold">Instagram SMS</h2>
              </div>

              <div className="space-y-4">
                {result.instagramSMS.map((sms) => (
                  <div key={sms.id} className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {sms.label}
                    </span>
                    <div className="relative group">
                      <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-200 text-sm leading-relaxed min-h-[85px]">
                        {sms.text}
                      </div>
                      <button
                        onClick={() => onCopy(sms.text, sms.label)}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                        title={`Copy ${sms.label}`}
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* More Comments Card if generated */}
          {moreComments.length > 0 && (
            <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>অতিরিক্ত কমেন্টসমূহ ({moreComments.length} টি)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moreComments.map((cmt, idx) => (
                  <div
                    key={idx}
                    className="relative bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-300 text-sm leading-relaxed"
                  >
                    <p>{cmt}</p>
                    <button
                      onClick={() => onCopy(cmt, `Comment #${idx + 1}`)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                      title="Copy Comment"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Button: আরো দশটি কমেন্ট দেখুন + */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleGenerateMore}
              disabled={loadingMore}
              className="py-3 px-8 rounded-xl bg-[#671ceb] hover:bg-[#7728fd] text-white font-medium text-sm transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>কমেন্ট তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>আরো দশটি কমেন্ট দেখুন</span>
                  <Plus size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
