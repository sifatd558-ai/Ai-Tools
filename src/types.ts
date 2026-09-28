export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'blocked';
  createdAt: string;
  usedCode?: string;
}

export interface AccessCode {
  id: string;
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  createdBy: string;
  createdAt: string;
  active: boolean;
}

export interface TranscriptSummaryResult {
  summary: string;
  bengaliSummary: string;
  generalKeywords: string;
  marketingKeywords: string;
}

export interface CommentItem {
  id: string;
  label: string;
  text: string;
}

export interface ContentGenerationResult {
  youtubeComments: CommentItem[];
  instagramSMS: CommentItem[];
}

export interface SeoResult {
  titlesEnglish: string;
  titlesBengali: string;
  description: string;
  descriptionBengali?: string;
  hashtags: string;
}

export interface RankTagsResult {
  tags: string[];
  commaSeparated: string;
}

export interface InstagramCommentOption {
  id: number;
  title: string;
  text: string;
}

export interface InstagramCommentsResult {
  options: InstagramCommentOption[];
}
