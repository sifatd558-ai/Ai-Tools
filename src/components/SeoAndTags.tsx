import React, { useState } from 'react';
import { Copy, X, Loader2, Sparkles, Tag, CheckCheck } from 'lucide-react';
import { SeoResult, RankTagsResult } from '../types';
import { generateSeo, generateRankTags } from '../services/apiService';

interface Props {
  onCopy: (text: string, label: string) => void;
}

export const SeoAndTags: React.FC<Props> = ({ onCopy }) => {
  // SEO generator states
  const [transcript, setTranscript] = useState('');
  const [titleIdea, setTitleIdea] = useState('');
  const [language, setLanguage] = useState('English');
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null);

  // Rank tag generator states
  const [videoTitle, setVideoTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagResult, setTagResult] = useState<RankTagsResult | null>(null);

  const handleGenerateSeo = async () => {
    if (!transcript.trim()) return;
    setLoadingSeo(true);
    try {
      const data = await generateSeo(transcript, titleIdea, language);
      setSeoResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSeo(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!videoTitle.trim() || !channelName.trim()) return;
    setLoadingTags(true);
    try {
      const data = await generateRankTags(videoTitle, channelName);
      setTagResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTags(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-10">
      {/* ---------------- SECTION 1: YouTube SEO Generator ---------------- */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          YouTube SEO Generator
        </h1>

        <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
          {/* Transcript input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Input Video Transcript (Required):
            </label>
            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste video transcript here..."
                rows={6}
                className="w-full bg-[#0b0917] border border-[#252046] rounded-xl p-4 pr-12 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm resize-y"
              />
              {transcript && (
                <button
                  onClick={() => setTranscript('')}
                  title="Clear transcript"
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-[#1b1735] hover:bg-[#28224d] text-slate-400 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Row: Title idea + Target language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Optional: Input Your Title Idea
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={titleIdea}
                  onChange={(e) => setTitleIdea(e.target.value)}
                  placeholder="e.g. Screen-free parenting guide"
                  className="w-full bg-[#0b0917] border border-[#252046] rounded-xl py-3 px-4 pr-10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
                {titleIdea && (
                  <button
                    onClick={() => setTitleIdea('')}
                    title="Clear"
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Target Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0b0917] border border-[#252046] rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="Arabic">Arabic (العربية)</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateSeo}
            disabled={loadingSeo || !transcript.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-[#671ceb] hover:bg-[#7427f7] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
          >
            {loadingSeo ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generating SEO Titles & Description...</span>
              </>
            ) : (
              <span>Generate SEO Content</span>
            )}
          </button>
        </div>

        {/* SEO Results */}
        {seoResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Titles Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Titles */}
              <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-3">
                <h3 className="text-lg font-bold text-white">Generated Titles (English)</h3>
                <div className="relative">
                  <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-200 text-sm whitespace-pre-line leading-relaxed min-h-[90px]">
                    {seoResult.titlesEnglish}
                  </div>
                  <button
                    onClick={() => onCopy(seoResult.titlesEnglish, 'English Titles')}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                    title="Copy English Titles"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>

              {/* Bengali Titles */}
              <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-3">
                <h3 className="text-lg font-bold text-white">Generated Titles (Bengali)</h3>
                <div className="relative">
                  <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-200 text-sm whitespace-pre-line leading-relaxed min-h-[90px]">
                    {seoResult.titlesBengali}
                  </div>
                  <button
                    onClick={() => onCopy(seoResult.titlesBengali, 'Bengali Titles')}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                    title="Copy Bengali Titles"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Description Cards */}
            <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-lg font-bold text-white">Video Description</h3>
              <div className="relative">
                <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-200 text-sm whitespace-pre-line leading-relaxed min-h-[140px]">
                  {seoResult.description}
                </div>
                <button
                  onClick={() => onCopy(seoResult.description, 'Video Description')}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                  title="Copy Video Description"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            {seoResult.descriptionBengali && (
              <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-3">
                <h3 className="text-lg font-bold text-white">Video Description (Bengali) & Hashtags</h3>
                <div className="relative">
                  <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-200 text-sm whitespace-pre-line leading-relaxed min-h-[100px]">
                    {seoResult.descriptionBengali}
                    {seoResult.hashtags && (
                      <div className="mt-4 pt-3 border-t border-[#211b3e] text-purple-400 font-medium">
                        {seoResult.hashtags}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onCopy(`${seoResult.descriptionBengali}\n\n${seoResult.hashtags}`, 'Bengali Description & Hashtags')}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                    title="Copy"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------- SECTION 2: Rank Tag Generator ---------------- */}
      <div className="space-y-6 pt-4 border-t border-[#231e42]">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Rank Tag Generator
        </h2>

        <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-lg font-semibold text-slate-200">
            Generate Tags to Rank Higher
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Final Video Title (Required):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. How We Went Screen-Free: Why It's Worth the Struggle"
                  className="w-full bg-[#0b0917] border border-[#252046] rounded-xl py-3 px-4 pr-10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
                {videoTitle && (
                  <button
                    onClick={() => setVideoTitle('')}
                    title="Clear"
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Your Channel Name (Required):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Mindful Family Living"
                  className="w-full bg-[#0b0917] border border-[#252046] rounded-xl py-3 px-4 pr-10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
                {channelName && (
                  <button
                    onClick={() => setChannelName('')}
                    title="Clear"
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateTags}
            disabled={loadingTags || !videoTitle.trim() || !channelName.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-[#671ceb] hover:bg-[#7427f7] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
          >
            {loadingTags ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Optimizing High-Ranking Tags...</span>
              </>
            ) : (
              <span>Generate Rank Tags</span>
            )}
          </button>
        </div>

        {/* Tags Result */}
        {tagResult && (
          <div className="bg-[#120f24] border border-[#231e42] rounded-2xl p-6 shadow-xl space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Tag size={20} className="text-purple-400" />
                  <span>High-Ranking Tags ({tagResult.tags.length} Tags)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ready to copy and paste directly into your YouTube Studio tags box.
                </p>
              </div>

              <button
                onClick={() => onCopy(tagResult.commaSeparated, 'All Rank Tags')}
                className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
              >
                <CheckCheck size={16} />
                <span>Copy All Tags</span>
              </button>
            </div>

            {/* Tag Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {tagResult.tags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => onCopy(tag, `Tag: ${tag}`)}
                  className="px-3 py-1.5 rounded-lg bg-[#0c0a18] hover:bg-[#201944] border border-[#231c47] hover:border-purple-500 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5 group"
                  title="Click to copy this tag"
                >
                  <span>{tag}</span>
                  <Copy size={11} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
                </button>
              ))}
            </div>

            {/* Comma-separated text area */}
            <div className="relative mt-4">
              <div className="bg-[#0c0a18] border border-[#211b3e] rounded-xl p-4 pr-12 text-slate-300 text-sm leading-relaxed max-h-32 overflow-y-auto">
                {tagResult.commaSeparated}
              </div>
              <button
                onClick={() => onCopy(tagResult.commaSeparated, 'All Rank Tags')}
                className="absolute top-3 right-3 p-2 rounded-lg bg-[#1a1636] hover:bg-[#28224f] text-slate-400 hover:text-white transition-colors"
                title="Copy comma-separated tags"
              >
                <Copy size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
