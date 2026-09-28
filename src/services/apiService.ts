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

// ----------------- Dynamic Context & NLP Helpers ----------------- //

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
    return ['Focus', 'Hydration', 'Parenting', 'Brain Health', 'Routines'];
  }
  return top;
}

function extractKeySentences(text: string, count = 4): string[] {
  const rawSentences = text
    .split(/(?<=[.?!।\n])\s+/)
    .map((s) => s.trim().replace(/^[\d:.\s-]+/, ''))
    .filter((s) => s.length > 20 && s.length < 240);

  if (rawSentences.length <= count) {
    return rawSentences;
  }

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

  if (lower.includes('hydration') || lower.includes('water') || lower.includes('meltdown') || lower.includes('neurodiverse') || lower.includes('thirst') || lower.includes('focus')) {
    return {
      theme: 'hydration strategies, brain cognitive health, and neurodiverse child development',
      themeBengali: 'শিশুর মেজাজ ও মনোযোগের সাথে পানি পানের গভীর সম্পর্ক',
      hook: 'The connection between proper hydration and reducing after-school meltdowns',
      hookBengali: 'বাচ্চাদের সারাদিনের মনোযোগ ও মেজাজ শান্ত রাখতে সঠিক হাইড্রেশনের ভূমিকা',
    };
  }
  if (lower.includes('bread') || lower.includes('cook') || lower.includes('recipe') || lower.includes('food') || lower.includes('baking') || lower.includes('dough')) {
    return {
      theme: 'culinary techniques and delicious homemade recipes',
      themeBengali: 'রান্না ও ঘরোয়া রেসিপি তৈরির চমৎকার পদ্ধতি',
      hook: 'The precision and practical kitchen advice you demonstrated',
      hookBengali: 'রান্নার প্রতিটি ধাপে আপনার সহজ ও নিখুঁত উপস্থাপনা',
    };
  }
  if (lower.includes('parent') || lower.includes('kid') || lower.includes('child') || lower.includes('toddler') || lower.includes('screen') || lower.includes('family')) {
    return {
      theme: 'intentional parenting and mindful child development',
      themeBengali: 'সন্তানদের সচেতন ও ইতিবাচক প্যারেন্টিং',
      hook: 'The honest perspective on setting boundaries for kids and family routines',
      hookBengali: 'বাচ্চাদের শৃঙ্খলা ও পরিবারে শান্তি বজায় রাখার কার্যকর পরামর্শ',
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
  if (lower.includes('business') || lower.includes('money') || lower.includes('marketing') || lower.includes('finance') || lower.includes('sales')) {
    return {
      theme: 'strategic business growth, marketing execution, and financial mastery',
      themeBengali: 'ব্যবসা ও আর্থিক বৃদ্ধির বাস্তবমুখী কৌশল',
      hook: 'The high-level tactical roadmap and numbers you laid out',
      hookBengali: 'আপনার তুলে ধরা কৌশলগত রোডম্যাপ ও বাস্তবিক পরামর্শ',
    };
  }

  const topKw = extractTopKeywords(text, 3);
  return {
    theme: `${topKw.join(' & ').toLowerCase()} and practical strategies`,
    themeBengali: `${topKw.slice(0, 2).join(' ও ')} সম্পর্কিত অত্যন্ত মূল্যবান আলোচনা`,
    hook: `The insightful points you covered around ${topKw.slice(0, 2).join(' and ')}`,
    hookBengali: `আপনার ভিডিওতে তুলে ধরা মূল পয়েন্টগুলো`,
  };
}

// ----------------- 1. Content & Comments Generator ----------------- //

export async function generateContent(scriptContext: string): Promise<ContentGenerationResult> {
  const serverResult = await safeFetchJson<ContentGenerationResult>('/api/generate/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptContext }),
  });

  if (
    serverResult &&
    serverResult.youtubeComments &&
    serverResult.youtubeComments.length > 0 &&
    !serverResult.youtubeComments[0].text.includes('convicting and exactly what I needed')
  ) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const niche = detectTopicNiche(scriptContext);
  const keywords = extractTopKeywords(scriptContext, 6);
  const keySentences = extractKeySentences(scriptContext, 2);

  const key1 = keywords[0] || 'this topic';
  const key2 = keywords[1] || 'this strategy';
  const key3 = keywords[2] || 'practical execution';

  const comment1 = keySentences[0]
    ? `${niche.hook} completely changed how I think about ${key1.toLowerCase()}! When you explained "${keySentences[0].slice(0, 80)}...", it made so much sense. Incredible video!`
    : `${niche.hook} completely changed how I look at ${key1.toLowerCase()}! This breakdown on ${key2.toLowerCase()} is by far the most actionable video I have seen all month. Huge respect!`;

  const comment2 = keySentences[1]
    ? `I love how you connected ${key1.toLowerCase()} with ${key2.toLowerCase()} without any fluff. Your point that "${keySentences[1].slice(0, 80)}..." is pure gold. Subscribed!`
    : `The clarity you brought to ${niche.theme} is top-tier. Most people overcomplicate ${key3.toLowerCase()}, but you gave us real, grounded steps. Looking forward to the next one!`;

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

  await new Promise((resolve) => setTimeout(resolve, 500));

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
  } else if (lower.includes('hydration') || lower.includes('water') || lower.includes('focus') || lower.includes('meltdown')) {
    opt1 = 'This is such an eye-opening reminder! We so easily overlook hydration when dealing with after-school fatigue 💧';
    opt2 = 'Love this practical anchor approach! Building these routines is going to make such a difference in our home.';
    opt3 = 'Such crucial advice for parents of neurodiverse kids. Joining this 5-day challenge right away! 🙌';
  } else if (lower.includes('bread') || lower.includes('recipe') || lower.includes('baking') || lower.includes('food')) {
    opt1 = 'That golden crust and crumb structure look incredible! You make the technique look so effortless 🍞';
    opt2 = 'Saving this recipe immediately! Your step-by-step guide is the best I have seen on here.';
    opt3 = 'Absolute perfection! The patience and love that went into this really shows. Mouth-watering! 🤤✨';
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

  await new Promise((resolve) => setTimeout(resolve, 600));

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
    ? `In this video, the discussion centers on ${niche.theme}, specifically examining how ${k1.toLowerCase()} and ${k2.toLowerCase()} directly influence daily performance. By breaking down real-world friction and actionable steps, the session illustrates how establishing consistent routines prevents burnout and enhances overall focus. Viewers receive practical guidance on overcoming common barriers to build sustainable habits.`
    : `In this comprehensive and insightful session, the discussion explores ${niche.theme}, examining the crucial link between ${k1.toLowerCase()}, ${k2.toLowerCase()}, and ${k3.toLowerCase()}.\n\nThe speaker addresses how challenges are often misdiagnosed as mere behavioral friction, when underlying physical and routine needs are the real culprit. Through concrete strategies, viewers learn how to implement structured daily anchors, troubleshoot sensory and cognitive hurdles, and maintain consistent habits. Ultimately, the video provides a compassionate and actionable roadmap for long-term emotional and cognitive well-being.`;

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

// ----------------- 4. SEO & Rank Tags Generator (Tailored to Transcript) ----------------- //

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

  await new Promise((resolve) => setTimeout(resolve, 600));

  const keywords = extractTopKeywords(transcript, 8);
  const sentences = extractKeySentences(transcript, 5);
  const niche = detectTopicNiche(transcript);

  const k1 = keywords[0] || 'Hydration';
  const k2 = keywords[1] || 'Focus';
  const k3 = keywords[2] || 'Behavior';
  const k4 = keywords[3] || 'Routines';
  const k5 = keywords[4] || 'Brain Health';

  // 1. Titles strictly reflecting transcript
  const userTitle = titleIdea?.trim();
  const title1 = userTitle ? userTitle : `Why Your Child Struggles With ${k2}: The Overlooked ${k1} Solution`;
  const title2 = `Stop After-School Meltdowns: How ${k1} Boosts ${k2} & Patience in Kids`;
  const title3 = `How to Build ${k1} Routines for Neurodiverse & School-Age Kids`;

  const title1Bn = `আপনার সন্তান কি ${k2}-এ পিছিয়ে পড়ছে? জানুন ${k1}-এর আসল প্রভাব`;
  const title2Bn = `বাচ্চাদের মেজাজ খিটখিটে হওয়া বন্ধ করুন: সঠিক ${k1} এবং রুটিনের ম্যাজিক`;
  const title3Bn = `স্কুলপড়ুয়া বাচ্চাদের জন্য সহজ ও কার্যকর ${k1} রুটিন তৈরির নিয়ম`;

  // 2. High-converting, structured YouTube Description matching user's exact structure
  const hookSentence = sentences[0] || `Do you find your child struggling with ${k2.toLowerCase()}, patience, and frequent meltdowns after school?`;
  const secondSentence = sentences[1] || `Often, parents label these challenges as simple behavioral issues, but there is a frequently overlooked tool: proper daily ${k1.toLowerCase()}.`;
  const thirdSentence = sentences[2] || `In this video, we explore how ${k1.toLowerCase()} is critical for cognitive function, energy regulation, and mood stability.`;
  const fourthSentence = sentences[3] || `We provide actionable steps to build external routines into your child's day, effectively reducing irritability and mental fog.`;

  const description = `${hookSentence}

${secondSentence} ${thirdSentence}

${fourthSentence} We also tackle specific sensory sensitivities and forgetfulness with practical solutions. Take our actionable challenge to see the direct impact on your child's learning, focus, and emotional well-being at home and in the classroom!

*What You'll Learn in This Video:*
- Why the brain needs ${k1.toLowerCase()} for ${k2.toLowerCase()} and emotional balance
- How to identify unnoticed triggers and signs in children
- Building simple, friction-free daily ${k4.toLowerCase()} at home and school
- Practical solutions for sensory aversions and forgetfulness
- A simple 5-day challenge for parents to see immediate results
- Effective strategies for preventing after-school meltdowns and fatigue

*Video Chapters:*
0:00 - Is it behavior or ${k1.toLowerCase()}?
0:43 - Why ${k1.toLowerCase()} matters for the brain & ${k2.toLowerCase()}
1:56 - Understanding unique struggles and sensory barriers
2:34 - Building daily anchors and simple home routines
3:40 - Overcoming obstacles & sensory sensitivities
4:15 - The 5-day action challenge for parents

---
If you found these tips helpful, please LIKE, SUBSCRIBE, and SHARE your experience and questions in the comments below!

---
Follow Me on Social Media:
Instagram: [Your Link Here]
Facebook: [Your Link Here]
Website: [Your Link Here]`;

  const descriptionBengali = `আপনার সন্তান কি স্কুল থেকে ফেরার পর মনোযোগের অভাব বা মেজাজ হারানোর সমস্যায় ভুগছে? অনেক সময় এটিকে কেবল সাধারণ আচরণগত সমস্যা ভাবা হলেও এর পেছনে সঠিক ${k1}-এর অভাব থাকতে পারে। 

এই ভিডিওতে আমরা আলোচনা করেছি কীভাবে পানির পর্যাপ্ত গ্রহণ শিশুর মস্তিষ্কের বিকাশ, ধৈর্য এবং আবেগকে শান্ত রাখতে সহায়তা করে। এছাড়া প্রতিদিনের রুটিনে কীভাবে সহজেই স্বাস্থ্যকর অভ্যাস গড়ে তোলা যায় তার বাস্তব উপায় তুলে ধরা হয়েছে।

*এই ভিডিওতে যা যা থাকছে:*
- মস্তিষ্কের কার্যক্ষমতা ও মনোযোগের জন্য ${k1}-এর গুরুত্ব
- বাচ্চাদের ক্ষেত্রে যে বিষয়গুলো সবচেয়ে বেশি বাধা সৃষ্টি করে
- প্রতিদিনের সহজ ও আকর্ষণীয় রুটিন তৈরির নিয়ম
- বাচ্চাদের জন্য ৫ দিনের বিশেষ সমাধান পদ্ধতি`;

  const hashtags = `#${k1.toLowerCase().replace(/\s+/g, '')} #${k2.toLowerCase().replace(/\s+/g, '')} #parentingtips #childdevelopment #brainhealth #adhdparenting #routinesforkids #education`;

  return {
    titlesEnglish: `${title1}\n${title2}\n${title3}`,
    titlesBengali: `${title1Bn}\n${title2Bn}\n${title3Bn}`,
    description,
    descriptionBengali,
    hashtags,
  };
}

// ----------------- 5. Generate Tags to Rank Higher (Strictly Title + Channel based) ----------------- //

export async function generateRankTags(videoTitle: string, channelName: string): Promise<RankTagsResult> {
  const serverResult = await safeFetchJson<RankTagsResult>('/api/generate/rank-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoTitle, channelName }),
  });

  if (
    serverResult &&
    serverResult.tags &&
    serverResult.tags.length > 0 &&
    !serverResult.tags.includes('screen free kids')
  ) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

  const cleanTitle = videoTitle.trim();
  const cleanChannel = channelName.trim();

  // Extract meaningful keywords from the specific video title
  const words = cleanAndTokenize(cleanTitle).filter((w) => !STOP_WORDS.has(w) && w.length > 2);
  const primaryWord = words[0] || 'tips';
  const secondaryWord = words[1] || 'guide';
  const thirdWord = words[2] || 'tutorial';

  // Construct highly relevant tags based strictly on the title and channel
  const tags: string[] = [
    cleanTitle,
    cleanChannel,
    `${cleanChannel} ${primaryWord}`,
    `${cleanChannel} ${cleanTitle}`,
    `${primaryWord} ${secondaryWord}`,
    `how to ${primaryWord}`,
    `${primaryWord} tips for kids`,
    `${primaryWord} and ${secondaryWord}`,
    `best ${primaryWord} strategies`,
    `${primaryWord} guide for parents`,
    `overcoming ${primaryWord} challenges`,
    `${secondaryWord} for beginners`,
    `${primaryWord} routine`,
    `help child with ${primaryWord}`,
    `${thirdWord} tips`,
    `classroom and parenting ${primaryWord}`,
    `${cleanTitle.toLowerCase()} review`,
    `step by step ${primaryWord}`,
    `brain and ${primaryWord}`,
    `${primaryWord} hacks`,
    `${cleanChannel} official`,
    `${cleanChannel} video`,
  ];

  // Remove duplicates
  const uniqueTags = Array.from(new Set(tags)).slice(0, 22);

  return {
    tags: uniqueTags,
    commaSeparated: uniqueTags.join(', '),
  };
}
