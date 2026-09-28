import React, { useState } from 'react';
import { Copy, X, Loader2, Sparkles, Languages } from 'lucide-react';
import { TranscriptSummaryResult } from '../types';
import { generateTranscriptSummary } from '../services/apiService';

interface Props {
  onCopy: (text: string, label: string) => void;
}

export const TranscriptSummarizer: React.FC<Props> = ({ onCopy }) => {
  const [transcript, setTranscript] = useState('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'long'>('short');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranscriptSummaryResult | null>(null);
  const [showBengali, setShowBengali] = useState(false);

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const data = await generateTranscriptSummary(transcript, summaryLength);
      setResult(data);
      setShowBengali(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setResult(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">
        YouTube Transcript Summarizer
      </h1>

      {/* Input Card */}
      <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
        <label className="block text-sm font-medium text-slate-300">
          Paste your YouTube video transcript:
        </label>

        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="0:05 Hello friends..."
            rows={7}
            className="w-full bg-[#0b0917] border border-[#252046] rounded-xl p-4 pr-12 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm resize-y"
          />
          {transcript && (
            <button
              onClick={handleClear}
              title="Clear transcript"
              className="absolute top-3 right-3 p-1.5 rounded-md bg-[#1b1735] hover:bg-[#28224d] text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Radio Option */}
        <div className="flex items-center gap-8 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-300">
            <input
              type="radio"
              name="summaryLength"
              checked={summaryLength === 'short'}
              onChange={() => setSummaryLength('short')}
              className="w-4 h-4 text-purple-600 bg-[#0b0917] border-[#342b5c] focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            Short Summary
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-300">
            <input
              type="radio"
              name="summaryLength"
              checked={summaryLength === 'long'}
              onChange={() => setSummaryLength('long')}
              className="w-4 h-4 text-purple-600 bg-[#0b0917] border-[#342b5c] focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            Long Summary
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !transcript.trim()}
          className="w-full py-3.5 px-6 rounded-xl bg-[#671ceb] hover:bg-[#7427f7] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Analyzing Transcript & Generating Summary...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate Summary</span>
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Card */}
          <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {showBengali ? 'Bengali Summary (বাংলা সারসংক্ষেপ)' : summaryLength === 'short' ? 'Short Summary' : 'Long Summary'}
              </h2>
              <button
                onClick={() => onCopy(showBengali ? result.bengaliSummary : result.summary, showBengali ? 'Bengali Summary' : 'Summary')}
                className="p-2 rounded-lg bg-[#1a1636] hover:bg-[#292352] text-slate-300 hover:text-white transition-colors"
                title="Copy Summary"
              >
                <Copy size={16} />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-line bg-[#0c0a18] p-4 rounded-xl border border-[#211b3e]">
              {showBengali ? result.bengaliSummary : result.summary}
            </p>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowBengali(!showBengali)}
                className="py-2.5 px-6 rounded-xl bg-[#7c26e8] hover:bg-[#8d3cf5] text-white font-medium text-sm transition-all shadow-md shadow-purple-900/30 flex items-center gap-2"
              >
                <Languages size={16} />
                <span>{showBengali ? 'See English Summary' : 'See Bengali Summary'}</span>
              </button>
            </div>
          </div>

          {/* Keywords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Keywords */}
            <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-lg font-bold text-white">General Keywords</h3>
              <div className="relative">
                <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-300 text-sm leading-relaxed min-h-[120px]">
                  {result.generalKeywords}
                </div>
                <button
                  onClick={() => onCopy(result.generalKeywords, 'General Keywords')}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                  title="Copy General Keywords"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            {/* Marketing Keywords */}
            <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-lg font-bold text-white">Marketing Keywords</h3>
              <div className="relative">
                <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-300 text-sm leading-relaxed min-h-[120px]">
                  {result.marketingKeywords}
                </div>
                <button
                  onClick={() => onCopy(result.marketingKeywords, 'Marketing Keywords')}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                  title="Copy Marketing Keywords"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
