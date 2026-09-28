import React, { useState } from 'react';
import { Copy, X, Loader2, Instagram } from 'lucide-react';
import { InstagramCommentsResult } from '../types';
import { generateInstagramComments } from '../services/apiService';

interface Props {
  onCopy: (text: string, label: string) => void;
}

export const InstagramCommentGen: React.FC<Props> = ({ onCopy }) => {
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InstagramCommentsResult | null>(null);

  const handleGenerate = async () => {
    if (!caption.trim()) return;
    setLoading(true);
    try {
      const data = await generateInstagramComments(caption);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCaption('');
    setResult(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">
        Instagram Comment Generator
      </h1>

      {/* Input Card */}
      <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
        <label className="block text-sm font-medium text-slate-300">
          Paste Instagram Post Caption:
        </label>

        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Paste the Instagram post caption here..."
            rows={7}
            className="w-full bg-[#0b0917] border border-[#252046] rounded-xl p-4 pr-12 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm resize-y"
          />
          {caption && (
            <button
              onClick={handleClear}
              title="Clear caption"
              className="absolute top-3 right-3 p-1.5 rounded-md bg-[#1b1735] hover:bg-[#28224d] text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !caption.trim()}
          className="w-full py-3.5 px-6 rounded-xl bg-[#671ceb] hover:bg-[#7427f7] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Crafting High-Converting Comments...</span>
            </>
          ) : (
            <>
              <span>Generate Comments</span>
              <Instagram size={17} />
            </>
          )}
        </button>
      </div>

      {/* Results Section: 3-column cards matching screenshot */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {result.options.map((option) => (
            <div
              key={option.id}
              className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <h3 className="text-xl font-bold text-white">{option.title}</h3>

              <div className="relative flex-1">
                <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-200 text-sm leading-relaxed min-h-[110px] flex items-center">
                  <p>{option.text}</p>
                </div>
                <button
                  onClick={() => onCopy(option.text, option.title)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                  title={`Copy ${option.title}`}
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
