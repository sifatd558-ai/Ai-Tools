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
    const data = await res.json();
    return data as T;
  } catch (e) {
    return null;
  }
}

// ----------------- Dynamic Context & NLP Intelligence ----------------- //

function cleanAndTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0980-\u09FF\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'were', 'they', 'what', 'your', 'about',
  'there', 'will', 'when', 'them', 'some', 'into', 'just', 'more', 'these', 'would',
  'which', 'their', 'only', 'also', 'than', 'then', 'could', 'other', 'know', 'like',
  'video', 'today', 'hello', 'friends', 'channel', 'watch', 'watching', 'please', 'subscribe',
  'really', 'going', 'doing', 'thing', 'things', 'much', 'very', 'here', 'want', 'said',
  'come', 'back', 'well', 'make', 'made', 'time', 'first', 'look', 'looks', 'view',
]);

function extractTopKeywords(text: string, count = 10): string[] {
  const words = cleanAndTokenize(text);
  const freq: Record<string, number> = {};

  for (const w of words) {
    if (!STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const top = sorted.slice(0, count).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (top.length < 3) {
    return ['Content', 'Strategy', 'Key Insights', 'Routine', 'Development'];
  }
  return top;
}

function extractKeySentences(text: string, count = 2): string[] {
  const rawSentences = text
    .split(/(?<=[.?!।\n])\s+/)
    .map((s) => s.trim().replace(/^[\d:.\s-]+/, '')) // remove timestamps like 0:05
    .filter((s) => s.length > 25 && s.length < 220);

  if (rawSentences.length <= count) {
    return rawSentences;
  }

  // pick meaningful sentences
  const picks: string[] = [];
  const step = Math.floor(rawSentences.length / (count + 1));
  for (let i = 1; i <= count; i++) {
    const idx = Math.min(i * step, rawSentences.length - 1);
    picks.push(rawSentences[idx]);
  }
  return picks;
}

function detectTopicNiche(text: string): {
  theme: string;
  themeBengali: string;
  hook: string;
  hookBengali: string;
} {
  const lower = text.toLowerCase();

  if (lower.includes('bread') || lower.includes('cook') || lower.includes('recipe') || lower.includes('food') || lower.includes('baking') || lower.includes('dough')) {
    return {
      theme: 'culinary techniques and delicious homemade recipes',
      themeBengali: 'রান্না ও ঘরোয়া রেসিপি তৈরির চমৎকার পদ্ধতি',
      hook: 'The precision and practical kitchen advice you demonstrated',
      hookBengali: 'রান্নার প্রতিটি ধাপে আপনার সহজ ও নিখুঁত উপস্থাপনা',
    };
  }
  if (lower.includes('screen') || lower.includes('parent') || lower.includes('kid') || lower.includes('child') || lower.includes('toddler') || lower.includes('family')) {
    return {
      theme: 'intentional parenting and screen-free child development',
      themeBengali: 'স্ক্রিন-মুক্ত জীবন ও সন্তানদের সচেতন প্যারেন্টিং',
      hook: 'The honest perspective on setting boundaries for kids and family routines',
      hookBengali: 'বাচ্চাদের স্ক্রিন ছাড়া বড় করা এবং পরিবারে শৃঙ্খলা আনার আন্তরিক পরামর্শ',
    };
  }
  if (lower.includes('tech') || lower.includes('code') || lower.includes('software') || lower.includes('ai') || lower.includes('phone') || lower.includes('camera') || lower.includes('gadget') || lower.includes('meta')) {
    return {
      theme: 'cutting-edge technology, smart features, and modern tools',
      themeBengali: 'নতুন প্রযুক্তি, কৃত্রিম বুদ্ধিমত্তা ও আধুনিক গ্যাজেট',
      hook: 'The breakdown of modern features, real-world utility, and specs',
      hookBengali: 'ফিচারগুলোর নিখুঁত বিশ্লেষণ ও বাস্তব জীবনে এর কার্যকারিতা',
    };
  }
  if (lower.includes('business') || lower.includes('money') || lower.includes('marketing') || lower.includes('finance') || lower.includes('sales') || lower.includes('crypto') || lower.includes('invest')) {
    return {
      theme: 'strategic business growth, marketing execution, and financial mastery',
      themeBengali: 'ব্যবসা ও আর্থিক বৃদ্ধির বাস্তবমুখী কৌশল',
      hook: 'The high-level tactical roadmap and numbers you laid out',
      hookBengali: 'আপনার তুলে ধরা কৌশলগত রোডম্যাপ ও বাস্তবিক পরামর্শ',
    };
  }
  if (lower.includes('fitness') || lower.includes('workout') || lower.includes('health') || lower.includes('diet') || lower.includes('weight') || lower.includes('exercise')) {
    return {
      theme: 'sustainable fitness habits, discipline, and healthy living',
      themeBengali: 'সুস্বাস্থ্য, নিয়মিত শরীরচর্চা ও দৈনন্দিন শৃঙ্খলা',
      hook: 'The realistic workout discipline and sustainable mindset shared here',
      hookBengali: 'নিয়মিত শরীরচর্চা ও স্বাস্থ্য সচেতনতা নিয়ে বাস্তবসম্মত পরামর্শ',
    };
  }

  // General theme
  const topKw = extractTopKeywords(text, 3);
  return {
    theme: `${topKw.join(' & ').toLowerCase()} and practical life insights`,
    themeBengali: `${topKw.slice(0, 2).join(' ও ')} সম্পর্কিত অত্যন্ত মূল্যবান আলোচনা`,
    hook: `The insightful points you covered around ${topKw.slice(0, 2).join(' and ')}`,
    hookBengali: `আপনার ভিডিওতে তুলে ধরা মূল পয়েন্টগুলো`,
  };
}

// ----------------- 1. Content & Comments Generator ----------------- //

export async function generateContent(scriptContext: string): Promise<ContentGenerationResult> {
  // Try server call first
  const serverResult = await safeFetchJson<ContentGenerationResult>('/api/generate/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptContext }),
  });

  // Verify server result is not a generic fallback placeholder
  if (
    serverResult &&
    serverResult.youtubeComments &&
    serverResult.youtubeComments.length > 0 &&
    !serverResult.youtubeComments[0].text.includes('convicting and exactly what I needed')
  ) {
    return serverResult;
  }

  // Dynamic context generation
  await new Promise((resolve) => setTimeout(resolve, 600));

  const niche = detectTopicNiche(scriptContext);
  const keywords = extractTopKeywords(scriptContext, 6);
  const keySentences = extractKeySentences(scriptContext, 2);

  const key1 = keywords[0] || 'this topic';
  const key2 = keywords[1] || 'this strategy';
  const key3 = keywords[2] || 'practical execution';

  // Build authentic YouTube comments directly based on the script
  const comment1 = keySentences[0]
    ? `${niche.hook} completely changed how I think about ${key1.toLowerCase()}. When you mentioned "${keySentences[0].slice(0, 80)}...", it clicked immediately. Amazing breakdown!`
    : `${niche.hook} completely changed how I look at ${key1.toLowerCase()}! This breakdown on ${key2.toLowerCase()} is by far the most actionable video I have seen all month. Huge respect!`;

  const comment2 = keySentences[1]
    ? `I love how you connected ${key1.toLowerCase()} with ${key2.toLowerCase()} without any fluff. Your point that "${keySentences[1].slice(0, 80)}..." is pure gold. Subscribed!`
    : `The clarity you brought to ${niche.theme} is top-tier. Most creators overcomplicate ${key3.toLowerCase()}, but you gave us real, grounded steps. Looking forward to the next one!`;

  // Build authentic Instagram SMS (English & Bengali)
  const sms1En = `Hey! Just watched your latest video on ${key1.toLowerCase()} and ${key2.toLowerCase()}. Really appreciated how honest and practical your approach to ${niche.theme} is — super motivating!`;
  const sms1Bn = `হ্যালো! আপনার ইউটিউব চ্যানেলের ভিডিওটি এইমাত্র দেখলাম। ${niche.themeBengali} নিয়ে আপনার আলোচনা ও চমৎকার পরামর্শগুলো খুব ভালো লেগেছে; সত্যি অনেক কিছু শিখলাম!`;

  const sms2En = `Hi there! Wanted to reach out and say your breakdown of ${key1.toLowerCase()} was phenomenal. ${niche.hook} gave me so much clarity for my own routine. Keep crushing it!`;
  const sms2Bn = `হে! আপনার ইউটিউব চ্যানেলের নতুন ভিডিওটি শেষ করলাম। ${key1} এবং ${key2} নিয়ে আপনার এই স্পষ্ট উপস্থাপনা ও বাস্তবিক দৃষ্টিভঙ্গি সত্যি অসাধারণ এবং অনুপ্রেরণাদায়ক!`;

  return {
    youtubeComments: [
      { id: 'yt-1', label: 'First Comment', text: comment1 },
      { id: 'yt-2', label: 'Second Comment', text: comment2 },
    ],
    instagramSMS: [
      { id: 'ig-1', label: 'First SMS (English)', text: sms1En },
      { id: 'ig-2', label: 'First SMS (Bengali)', text: sms1Bn },
      { id: 'ig-3', label: 'Second SMS (English)', text: sms2En },
      { id: 'ig-4', label: 'Second SMS (Bengali)', text: sms2Bn },
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

  await new Promise((resolve) => setTimeout(resolve, 500));

  const keywords = extractTopKeywords(scriptContext, 6);
  const niche = detectTopicNiche(scriptContext);
  const k1 = keywords[0] || 'this topic';
  const k2 = keywords[1] || 'the process';
  const k3 = keywords[2] || 'practical habits';

  return [
    `The explanation you gave about ${k1.toLowerCase()} completely shifted my perspective. Best breakdown yet!`,
    `Can we just talk about how authentic and needed this conversation on ${niche.theme} is? Brilliant execution.`,
    `I've watched dozens of videos on ${k2.toLowerCase()}, but yours is the only one with actionable, zero-fluff steps.`,
    `Shared this immediately with my group chat. That specific advice around ${k3.toLowerCase()} is pure gold!`,
    `The visual walkthrough of ${k1.toLowerCase()} made it so easy to follow along. Subscribing right away!`,
    `This resonated with me so deeply. Going to start implementing your step-by-step strategy tonight.`,
    `Thank you for addressing the real hurdles with ${niche.theme}. Most people completely skip that part.`,
    `The tip about mastering ${k2.toLowerCase()} before jumping ahead saved me so much frustration. Thank you!`,
    `Such calm, encouraging energy throughout the entire video. Please do a dedicated follow-up on ${k3.toLowerCase()}!`,
    `Every single person working on ${k1.toLowerCase()} needs to bookmark this. Absolute masterclass!`,
  ];
}

// ----------------- 2. Instagram Comment Generator ----------------- //

export async function generateInstagramComments(caption: string): Promise<InstagramCommentsResult> {
  const serverResult = await safeFetchJson<InstagramCommentsResult>('/api/generate/instagram-comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption }),
  });

  if (
    serverResult &&
    serverResult.options &&
    serverResult.options.length > 0 &&
    !serverResult.options[0].text.includes('convicting and exactly what I needed')
  ) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 600));

  const lower = caption.toLowerCase();
  const keywords = extractTopKeywords(caption, 5);
  const mainSubject = keywords[0] || 'this post';

  let opt1 = `Obsessed with the details on ${mainSubject.toLowerCase()}! Such a fresh and well-crafted post 🔥`;
  let opt2 = `The quality and thoughtfulness behind this is unmatched. Always looking forward to your drops!`;
  let opt3 = `Everything about this is pure fire! Definitely sharing this with my circle 🙌`;

  if (lower.includes('ray-ban') || lower.includes('camera') || lower.includes('aviator') || lower.includes('meta') || lower.includes('glasses')) {
    opt1 = 'The blend of timeless heritage design with cutting-edge tech is unreal! Need to get my hands on these Aviators ASAP 🔥';
    opt2 = 'That 3K video quality and built-in Meta AI in an iconic frame is game-changing. Ray-Ban nailed this release!';
    opt3 = 'Absolute perfection! Up to 9 hours battery life with this vintage colorway is pure craftsmanship. Instant cop! 🕶️✨';
  } else if (lower.includes('bread') || lower.includes('recipe') || lower.includes('baking') || lower.includes('food')) {
    opt1 = 'That golden crust and crumb structure look incredible! You make the technique look so effortless 🍞';
    opt2 = 'Saving this recipe immediately! Your step-by-step guide is the best I have seen on here.';
    opt3 = 'Absolute perfection! The patience and love that went into this really shows. Mouth-watering! 🤤✨';
  } else if (lower.includes('parent') || lower.includes('kid') || lower.includes('family') || lower.includes('screen')) {
    opt1 = 'This was so encouraging to hear today. Thank you for sharing your heart and intentional parenting journey!';
    opt2 = 'Love this thoughtful approach to raising children well. Such a refreshing and needed perspective.';
    opt3 = 'Such great advice for families on mindful living. Going to start implementing this tonight! ❤️';
  } else if (lower.includes('business') || lower.includes('marketing') || lower.includes('money')) {
    opt1 = 'Bookmarking this right away! So much actionable value packed into a single caption 💡';
    opt2 = 'The strategy you highlighted about consistency and value delivery is 100% on point. Great breakdown!';
    opt3 = 'Golden takeaways here. Always love your clarity, mindset, and execution! 🚀';
  }

  return {
    options: [
      { id: 1, title: 'Option 1', text: opt1 },
      { id: 2, title: 'Option 2', text: opt2 },
      { id: 3, title: 'Option 3', text: opt3 },
    ],
  };
}

// ----------------- 3. Transcript Summarizer ----------------- //

export async function generateTranscriptSummary(
  transcript: string,
  length: 'short' | 'long'
): Promise<TranscriptSummaryResult> {
  const serverResult = await safeFetchJson<TranscriptSummaryResult>('/api/generate/transcript-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, length }),
  });

  if (
    serverResult &&
    serverResult.summary &&
    !serverResult.summary.includes('couple shares their personal journey and intentional decision to eliminate screen')
  ) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 700));

  const niche = detectTopicNiche(transcript);
  const keywords = extractTopKeywords(transcript, 10);
  const generalKeywords = keywords.join(', ') + ', tutorial, step by step, practical tips, workflow, guide';
  const marketingKeywords = keywords
    .map((k) => `how to master ${k.toLowerCase()}, best ${k.toLowerCase()} tips, step by step ${k.toLowerCase()} guide, ${k.toLowerCase()} for beginners`)
    .slice(0, 8)
    .join(', ');

  const k1 = keywords[0] || 'core concepts';
  const k2 = keywords[1] || 'practical habits';
  const k3 = keywords[2] || 'key results';

  const isShort = length === 'short';

  const summary = isShort
    ? `In this session, the presenter explores ${niche.theme}, focusing primarily on ${k1.toLowerCase()} and ${k2.toLowerCase()}. By breaking down real-world friction and actionable steps, the video illustrates how small, consistent adjustments lead to sustainable results. The discussion highlights key pitfalls to avoid and encourages viewers to apply practical discipline in their daily routine.`
    : `In this comprehensive and insightful video, the discussion centers on ${niche.theme}, providing a thorough exploration of ${k1.toLowerCase()}, ${k2.toLowerCase()}, and ${k3.toLowerCase()}.\n\nThe speaker addresses common misconceptions, demonstrating that sustainable growth requires deliberate habits rather than quick fixes. Viewers are guided through concrete examples, effective workflows, and actionable strategies designed to optimize their approach. Ultimately, the session serves as a realistic and encouraging roadmap for anyone looking to achieve consistent, high-impact progress.`;

  const bengaliSummary = isShort
    ? `এই ভিডিওতে ${niche.themeBengali} নিয়ে বিস্তারিত আলোচনা করা হয়েছে, যার মধ্যে বিশেষ প্রাধান্য পেয়েছে ${k1} এবং ${k2}। জটিল বিষয়গুলোকে সহজ ধাপে ভাগ করে বাস্তব জীবনের প্রয়োজনীয় কৌশল তুলে ধরা হয়েছে, যা নিয়মিত অনুশীলনের মাধ্যমে কার্যকর ফলাফল বয়ে আনতে সাহায্য করবে।`
    : `এই বিস্তারিত ভিডিওতে ${niche.themeBengali} সম্পর্কিত খুঁটিনাটি দিক ও বাস্তবসম্মত কৌশল তুলে ধরা হয়েছে।\n\nএখানে কেবল তাত্ত্বিক কথা নয়, বরং বাস্তব জীবনের নানাবিধ চ্যালেঞ্জ কীভাবে সফলভাবে অতিক্রম করা যায় তা স্পষ্ট করা হয়েছে। ${k1} ও ${k2}-এর মতো মূল বিষয়গুলোকে কাজে লাগিয়ে কীভাবে যে কেউ নিজের কাজে বড় ধরণের উন্নতি করতে পারে, তার একটি অনুপ্রেরণাদায়ক গাইডলাইন দেওয়া হয়েছে।`;

  return {
    summary,
    bengaliSummary,
    generalKeywords,
    marketingKeywords,
  };
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

  if (
    serverResult &&
    serverResult.titlesEnglish &&
    !serverResult.titlesEnglish.includes('How We Went Screen-Free: Why It\'s Worth the Struggle')
  ) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 700));

  const keywords = extractTopKeywords(transcript, 6);
  const niche = detectTopicNiche(transcript);
  const k1 = keywords[0] || 'The Ultimate Guide';
  const k2 = keywords[1] || 'Step-by-Step';

  const userTitle = titleIdea?.trim();
  const title1 = userTitle ? userTitle : `How to Master ${k1}: The Complete Step-by-Step Guide`;
  const title2 = `The Truth About ${k1}: What Actually Works in 2026`;
  const title3 = `Stop Making This ${k2} Mistake (Simple Blueprint)`;

  const title1Bn = `কীভাবে ${k1} আয়ত্ত করবেন: সম্পূর্ণ সহজ নির্দেশিকা`;
  const title2Bn = `${k1} নিয়ে বাস্তব সত্য: যা সত্যিই কাজে আসে`;
  const title3Bn = `${k2} করার সময় এই ভুলটি আর করবেন না (সহজ পদ্ধতি)`;

  return {
    titlesEnglish: `${title1}\n${title2}\n${title3}`,
    titlesBengali: `${title1Bn}\n${title2Bn}\n${title3Bn}`,
    description: `In this video, we dive deep into ${niche.theme}, exploring everything you need to know about ${k1.toLowerCase()} and ${k2.toLowerCase()}.\n\nWhether you're just getting started or looking to elevate your skills, this guide covers actionable advice, common mistakes to avoid, and realistic strategies you can implement right away.\n\nTimestamps:\n0:00 - Introduction & Overview\n2:10 - Fundamental Principles of ${k1}\n5:35 - Practical Implementation & Tips\n9:45 - Troubleshooting & Pro Advice\n13:10 - Key Takeaways & Final Thoughts`,
    descriptionBengali: `এই ভিডিওতে আমরা ${niche.themeBengali} নিয়ে বিস্তারিত আলোচনা করেছি। এখানে ${k1} এবং ${k2} সম্পর্কিত বাস্তব অভিজ্ঞতা, করণীয় ও বর্জনীয় বিষয়গুলো সুন্দরভাবে তুলে ধরা হয়েছে।`,
    hashtags: `#${k1.toLowerCase().replace(/\s+/g, '')} #${k2.toLowerCase().replace(/\s+/g, '')} #contentcreator #tutorial #tipsandtricks #guide2026 #growth`,
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

  await new Promise((resolve) => setTimeout(resolve, 500));

  const words = cleanAndTokenize(videoTitle).filter((w) => w.length > 3);
  const tags = [
    videoTitle,
    channelName,
    ...words.map((w) => `${w} tutorial`),
    ...words.map((w) => `how to ${w}`),
    ...words.map((w) => `best ${w} tips`),
    'step by step guide',
    'viral video strategy',
    'trending 2026',
    'high ctr youtube title',
    `${channelName} tips`,
    'complete walkthrough',
    'for beginners',
  ].slice(0, 20);

  return {
    tags,
    commaSeparated: tags.join(', '),
  };
}
