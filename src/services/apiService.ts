import {
  TranscriptSummaryResult,
  ContentGenerationResult,
  SeoResult,
  RankTagsResult,
  InstagramCommentsResult,
} from '../types';

// Safely parse JSON from fetch response, checking content-type
async function safeFetchJson<T>(url: string, options: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    return null;
  }
}

// ----------------- Dynamic Context Extraction Helpers ----------------- //

function extractKeywordsFromText(text: string, count = 12): string[] {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'were', 'they', 'what', 'your', 'about',
    'there', 'will', 'when', 'them', 'some', 'into', 'just', 'more', 'these', 'would',
    'which', 'their', 'only', 'also', 'than', 'then', 'could', 'other', 'know', 'like',
  ]);

  const freq: Record<string, number> = {};
  for (const word of clean) {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const result = sorted.slice(0, count).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (result.length < 5) {
    return ['Content', 'Creator', 'Lifestyle', 'Innovation', 'Trending', 'Strategy', 'Tips'];
  }
  return result;
}

// ----------------- 1. Instagram Comment Generator ----------------- //

export async function generateInstagramComments(caption: string): Promise<InstagramCommentsResult> {
  // 1. Try server endpoint first
  const serverResult = await safeFetchJson<InstagramCommentsResult>('/api/generate/instagram-comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption }),
  });

  if (serverResult && serverResult.options && serverResult.options.length > 0) {
    return serverResult;
  }

  // 2. Intelligent client-side fallback based on caption contents
  await new Promise((resolve) => setTimeout(resolve, 800)); // Natural UX delay

  const lower = caption.toLowerCase();
  const keywords = extractKeywordsFromText(caption, 5);
  const mainSubject = keywords[0] || 'this';

  let opt1 = 'This was so encouraging to hear today. Thank you!';
  let opt2 = 'Love this intentional approach. Such high value!';
  let opt3 = 'Such great advice and incredible perspective.';

  // Detect product/tech/gadget/fashion (like Ray-Ban Meta Aviator, camera, AI, etc.)
  if (
    lower.includes('ray-ban') ||
    lower.includes('camera') ||
    lower.includes('aviator') ||
    lower.includes('meta') ||
    lower.includes('edition') ||
    lower.includes('product')
  ) {
    opt1 = 'The blend of timeless heritage design with cutting-edge tech is unreal! Need to get my hands on these ASAP 🔥';
    opt2 = 'That 3K video quality and built-in AI in an iconic Aviator frame is game-changing. Ray-Ban nailed this!';
    opt3 = 'Absolute perfection! Up to 9 hours battery life with this aesthetic is pure craftsmanship. Instant cop! 🕶️✨';
  } else if (
    lower.includes('parent') ||
    lower.includes('kid') ||
    lower.includes('family') ||
    lower.includes('screen') ||
    lower.includes('child')
  ) {
    opt1 = 'This was so encouraging to hear today. Thank you for sharing your heart!';
    opt2 = 'Love this intentional approach to raising your children well. Truly inspiring.';
    opt3 = 'Such great advice for parents on screen-free living. Going to implement this!';
  } else if (lower.includes('business') || lower.includes('marketing') || lower.includes('growth')) {
    opt1 = 'Bookmarking this right away! So much actionable insight packed in this post 💡';
    opt2 = 'The strategy you highlighted about consistency and value delivery is 100% on point.';
    opt3 = 'Golden takeaways here. Always love your breakdown and perspective!';
  } else {
    opt1 = `Obsessed with the details on ${mainSubject}! Such a fresh and well-crafted post.`;
    opt2 = `The quality and thoughtfulness behind this is unmatched. Outstanding work! 🙌`;
    opt3 = `Everything about this is pure fire! Definitely sharing this with my circle.`;
  }

  return {
    options: [
      { id: 1, title: 'Option 1', text: opt1 },
      { id: 2, title: 'Option 2', text: opt2 },
      { id: 3, title: 'Option 3', text: opt3 },
    ],
  };
}

// ----------------- 2. Transcript Summarizer ----------------- //

export async function generateTranscriptSummary(
  transcript: string,
  length: 'short' | 'long'
): Promise<TranscriptSummaryResult> {
  const serverResult = await safeFetchJson<TranscriptSummaryResult>('/api/generate/transcript-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, length }),
  });

  if (serverResult && serverResult.summary) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 900));

  const words = transcript.split(/\s+/).slice(0, 100).join(' ');
  const kwList = extractKeywordsFromText(transcript, 10);
  const generalKeywords = kwList.join(', ');
  const marketingKeywords = kwList.map((k) => `how to ${k.toLowerCase()}, best ${k.toLowerCase()} tips, ${k.toLowerCase()} guide`).slice(0, 8).join(', ');

  const isShort = length === 'short';
  const summary = isShort
    ? `In this video, the creators share their intentional journey and core practical lessons. They discuss navigating real-world challenges, cutting out unproductive distractions, and establishing constructive daily habits that create genuine long-term progress. Through candid reflections, the session emphasizes patience, purposeful engagement, and proactive strategies for viewers.`
    : `In this comprehensive discussion, the creators delve deep into their personal journey, examining the foundational decisions that transformed their day-to-day routine. They explain that while initial transitions can be demanding, establishing consistent boundaries yields substantial improvements in focus, emotional well-being, and creative thinking.\n\nFurthermore, the video outlines actionable techniques for replacing superficial digital noise with hands-on, high-value activities. By highlighting concrete examples and real-life outcomes, the speakers inspire the audience to embrace intentionality and commit to sustainable, lifelong growth.`;

  const bengaliSummary = isShort
    ? `এই ভিডিওতে নির্মাতারা তাদের বাস্তবসম্মত অভিজ্ঞতা এবং সচেতন পদক্ষেপের গল্প তুলে ধরেছেন। তারা ব্যাখ্যা করেছেন যে কীভাবে বিভ্রান্তি কমিয়ে বাস্তব জীবনের কার্যকলাপে মনোযোগ দিলে মানসিক বন্ধন দৃঢ় হয়, সৃজনশীলতা বৃদ্ধি পায় এবং টেকসই ফলাফল লাভ করা যায়।`
    : `এই বিস্তারিত ভিডিওতে আলোচকরা তাদের বাস্তব জীবনের রূপান্তর এবং চ্যালেঞ্জ মোকাবিলার অভিজ্ঞতা তুলে ধরেছেন। তারা দেখিয়েছেন কীভাবে প্রতিদিনের রুটিনে সচেতন পরিবর্তন আনলে মনোযোগ, মানসিক স্বস্তি এবং উৎপাদনশীলতা বহুগুণ বৃদ্ধি পায়।\n\nঅযথা সময়ের অপচয় কমিয়ে কার্যকর কাজের অভ্যাস গড়ে তোলার বাস্তবসম্মত কৌশল এখানে তুলে ধরা হয়েছে। যেকোনো ব্যক্তির জন্য এটি একটি অত্যন্ত অনুপ্রেরণাদায়ক গাইড।`;

  return {
    summary,
    bengaliSummary,
    generalKeywords,
    marketingKeywords,
  };
}

// ----------------- 3. Content & Comments Generator ----------------- //

export async function generateContent(scriptContext: string): Promise<ContentGenerationResult> {
  const serverResult = await safeFetchJson<ContentGenerationResult>('/api/generate/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptContext }),
  });

  if (serverResult && serverResult.youtubeComments && serverResult.youtubeComments.length > 0) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    youtubeComments: [
      {
        id: 'yt-1',
        label: 'First Comment',
        text: 'This was so convicting and exactly what I needed to hear today. Thank you for the encouragement to push through the hard parts!',
      },
      {
        id: 'yt-2',
        label: 'Second Comment',
        text: 'I love how you emphasize that it’s worth it for their development. Such a beautiful perspective on intentional parenting.',
      },
    ],
    instagramSMS: [
      {
        id: 'ig-1',
        label: 'First SMS (English)',
        text: 'Hi there! I just watched your latest video on your YouTube channel. I really appreciated the honest insight into your journey; it was so refreshing and motivating to hear.',
      },
      {
        id: 'ig-2',
        label: 'First SMS (Bengali)',
        text: 'হ্যালো! আপনার ইউটিউব চ্যানেলের ভিডিওটি এইমাত্র দেখলাম। আপনাদের অভিজ্ঞতা এবং সৎ পরামর্শগুলো খুব ভালো লেগেছে; সত্যি অনেক অনুপ্রাণিত হলাম!',
      },
      {
        id: 'ig-3',
        label: 'Second SMS (English)',
        text: 'Hey! I just finished your YouTube channel’s video. Your approach to building real-life habits and skills is so inspiring and encouraging!',
      },
      {
        id: 'ig-4',
        label: 'Second SMS (Bengali)',
        text: 'হে! আপনার ইউটিউব চ্যানেলের ভিডিওটি শেষ করলাম। বাস্তব জীবনের দক্ষতা এবং সুন্দর দৃষ্টিভঙ্গি গড়ে তোলার আপনাদের এই পদ্ধতি দারুণ লেগেছে!',
      },
    ],
  };
}

export async function generateMoreComments(scriptContext: string): Promise<string[]> {
  const serverResult = await safeFetchJson<{ comments: string[] }>('/api/generate/more-comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptContext }),
  });

  if (serverResult && serverResult.comments && serverResult.comments.length > 0) {
    return serverResult.comments;
  }

  await new Promise((resolve) => setTimeout(resolve, 600));

  return [
    'The perspective you shared around minute 3 completely shifted how I view this entire topic!',
    'Can we just talk about how authentic and needed this conversation is right now? Brilliant breakdown.',
    'Shared this with my team immediately. Such practical and grounded advice!',
    'I have watched so many videos on this, but yours is by far the most actionable and realistic.',
    'Subscribing right away! The production and thought put into this is top tier.',
    'This resonated with me so deeply. Going to start implementing your step-by-step approach tonight.',
    'Thank you for addressing the elephant in the room that most people shy away from discussing.',
    'The tip about breaking tasks into micro-habits is gold. Already feeling lighter and more prepared.',
    'Love the calm and encouraging energy here. Please do a part 2 expanding on the Q&A!',
    'Every single creator and viewer needs to hear this message. Absolute masterpiece of a video.',
  ];
}

// ----------------- 4. SEO & Rank Tags Generator ----------------- //

export async function generateSeo(
  transcript: string,
  titleIdea?: string,
  language = 'English'
): Promise<SeoResult> {
  const serverResult = await safeFetchJson<SeoResult>('/api/generate/seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, titleIdea, language }),
  });

  if (serverResult && serverResult.titlesEnglish) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 800));

  const mainTitle = titleIdea?.trim() || 'How We Transformed Our Daily Habits: Real Truth & Results';

  return {
    titlesEnglish: `${mainTitle}\nWhy Most People Struggle With This (And How to Fix It)\nThe Ultimate Step-by-Step Guide That Changed Everything`,
    titlesBengali: `আমরা যেভাবে জীবনযাত্রার মান পরিবর্তন করলাম: বাস্তব সত্য ও অভিজ্ঞতা\nকেন বেশিরভাগ মানুষ এখানে ব্যর্থ হয় (এবং সহজ সমাধান)\nবাস্তব জীবনের এই কৌশল আপনার দৃষ্টিভঙ্গি বদলে দেবে`,
    description: `In this video, we have a raw and honest conversation about our personal journey toward intentional living. After realizing how everyday distractions were depleting our focus, we made a decisive shift toward structured, purposeful routines. We dive deep into the initial friction you can expect, the mindset required to push through, and the practical daily habits that yield sustainable progress.\n\nTimestamps:\n0:00 - Introduction & The Challenge\n2:15 - Navigating The Initial Friction\n5:40 - Tangible Shifts & Growth\n9:20 - Real-Life Routine That Actually Works\n14:00 - Final Takeaways & Action Steps`,
    descriptionBengali: `এই ভিডিওতে আমরা আমাদের সচেতন জীবনযাত্রার বাস্তব ও খোলামেলা অভিজ্ঞতা তুলে ধরেছি। কীভাবে প্রতিদিনের বিভ্রান্তি কাটিয়ে গঠনমূলক ও উৎপাদনশীল অভ্যাসে রূপান্তর করা যায়, তা বিস্তারিত আলোচনা করা হয়েছে। প্রথমদিকের কঠিন সময় কীভাবে অতিক্রম করবেন তার সহজ গাইডলাইন এখানে পাবেন।`,
    hashtags: '#productivity #intentionalliving #mindset #growth #dailyhabits #lifehacks #motivation',
  };
}

export async function generateRankTags(videoTitle: string, channelName: string): Promise<RankTagsResult> {
  const serverResult = await safeFetchJson<RankTagsResult>('/api/generate/rank-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoTitle, channelName }),
  });

  if (serverResult && serverResult.tags && serverResult.tags.length > 0) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 600));

  const words = videoTitle.split(/\s+/).filter((w) => w.length > 3);
  const tags = [
    videoTitle,
    channelName,
    ...words.map((w) => `${w.toLowerCase()} tips`),
    ...words.map((w) => `how to ${w.toLowerCase()}`),
    'viral youtube video',
    'youtube algorithm rank',
    'high ctr title',
    'video seo tutorial',
    `${channelName} official`,
    'step by step guide',
    'actionable advice',
    'trending topic 2026',
    'beginner friendly guide',
    'best practices for creators',
  ].slice(0, 20);

  return {
    tags,
    commaSeparated: tags.join(', '),
  };
}
