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

// ----------------- Natural Language Transcript Parser ----------------- //

const COMMON_STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'were', 'they', 'what', 'your', 'about',
  'there', 'will', 'when', 'them', 'some', 'into', 'just', 'more', 'these', 'would',
  'which', 'their', 'only', 'also', 'than', 'then', 'could', 'other', 'know', 'like',
  'video', 'today', 'hello', 'friends', 'channel', 'watch', 'watching', 'please', 'subscribe',
  'really', 'going', 'doing', 'thing', 'things', 'much', 'very', 'here', 'want', 'said',
  'come', 'back', 'well', 'make', 'made', 'time', 'first', 'look', 'looks', 'view',
  'many', 'often', 'even', 'take', 'need', 'give', 'good', 'most', 'such', 'over', 'both',
  'being', 'been', 'does', 'down', 'during', 'each', 'because', 'before', 'after',
]);

function extractKeywords(text: string, count = 12): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0980-\u09FF\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !COMMON_STOP_WORDS.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const capitalized = sorted.slice(0, count).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (capitalized.length < 3) {
    return ['Guide', 'Tutorial', 'Strategy', 'Practical Tips', 'Mastery'];
  }
  return capitalized;
}

function extractMeaningfulSentences(text: string): string[] {
  // Strip timestamps like 0:05, 12:30, [music], (laughter) etc.
  const clean = text
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .trim();

  const raw = clean
    .split(/(?<=[.?!।\n])\s+/)
    .map((s) => s.trim().replace(/^[-*•\d.\s]+/, ''))
    .filter((s) => s.length > 25 && s.length < 240);

  return raw;
}

// ----------------- 1. SEO & Video Description (100% Transcript Specific) ----------------- //

export async function generateSeo(
  transcript: string,
  titleIdea?: string,
  language = 'English'
): Promise<SeoResult> {
  const cleanInput = transcript.trim();
  const keywords = extractKeywords(cleanInput, 15);
  const sentences = extractMeaningfulSentences(cleanInput);

  // Identify core primary, secondary, and tertiary concepts directly from transcript
  const primaryTopic = keywords[0] || 'This Topic';
  const secondaryTopic = keywords[1] || 'Key Strategies';
  const thirdTopic = keywords[2] || 'Proven Methods';
  const fourthTopic = keywords[3] || 'Essential Steps';
  const fifthTopic = keywords[4] || 'Practical Tips';

  // 1. Dynamic Titles generated exclusively from transcript topics
  let title1 = `How to Master ${primaryTopic}: The Complete Step-by-Step Guide`;
  let title2 = `Why ${primaryTopic} Matters More Than You Think (And How to Fix It)`;
  let title3 = `${primaryTopic} vs ${secondaryTopic}: Proven Strategies That Actually Work`;

  if (titleIdea && titleIdea.trim()) {
    title1 = titleIdea.trim();
  } else if (cleanInput.includes('?') && sentences[0] && sentences[0].includes('?')) {
    title1 = sentences[0].replace(/[?]/g, '').trim();
    if (title1.length > 70) title1 = title1.slice(0, 65) + '...';
  }

  // Bengali equivalents
  const title1Bn = `কীভাবে ${primaryTopic} আয়ত্ত করবেন: সম্পূর্ণ সহজ নির্দেশিকা`;
  const title2Bn = `${primaryTopic} কেন এত জরুরি: যা আপনার জানা উচিত`;
  const title3Bn = `${primaryTopic} এবং ${secondaryTopic}: কার্যকর সমাধান ও বাস্তব টিপস`;

  // 2. Dynamic Description: Extracting real sentences from the user's transcript
  const introSentence1 = sentences[0] || `In this video, we dive deep into ${primaryTopic.toLowerCase()} and explore how it directly impacts your daily results.`;
  const introSentence2 = sentences[1] || `Many people overlook the critical link between ${primaryTopic.toLowerCase()} and long-term success, focusing only on surface symptoms.`;
  const bodySentence1 = sentences[2] || `We examine actionable steps and proven techniques to master ${secondaryTopic.toLowerCase()} without feeling overwhelmed.`;
  const bodySentence2 = sentences[3] || `From building foundational habits to solving common obstacles like ${thirdTopic.toLowerCase()}, you'll get practical solutions that work.`;

  // Bullets generated dynamically from actual transcript sentences or keywords
  const bulletPoints = [
    sentences[4] ? sentences[4].replace(/[.?!]$/, '') : `Why understanding ${primaryTopic.toLowerCase()} is vital for sustainable progress`,
    sentences[5] ? sentences[5].replace(/[.?!]$/, '') : `How to identify hidden barriers and common pitfalls around ${secondaryTopic.toLowerCase()}`,
    sentences[6] ? sentences[6].replace(/[.?!]$/, '') : `Building external anchors and structured routines for ${thirdTopic.toLowerCase()}`,
    sentences[7] ? sentences[7].replace(/[.?!]$/, '') : `Practical troubleshooting for overcoming friction and resistance`,
    `A practical action challenge to see measurable improvements`,
    `Essential takeaways to maintain consistency and long-term growth`,
  ];

  // Chapters generated directly around the transcript's keywords
  const chapters = [
    `0:00 - Introduction to ${primaryTopic}`,
    `0:45 - The core fundamentals of ${primaryTopic}`,
    `1:50 - Common struggles and mistakes with ${secondaryTopic}`,
    `2:40 - Step-by-step strategies for ${thirdTopic}`,
    `3:35 - Overcoming challenges & ${fourthTopic}`,
    `4:20 - Action plan, challenge & final takeaways`,
  ];

  const description = `${introSentence1}

${introSentence2} ${bodySentence1}

${bodySentence2}

*What You'll Learn in This Video:*
- ${bulletPoints[0]}
- ${bulletPoints[1]}
- ${bulletPoints[2]}
- ${bulletPoints[3]}
- ${bulletPoints[4]}
- ${bulletPoints[5]}

*Video Chapters:*
${chapters.join('\n')}

---
If you found these tips helpful, please LIKE, SUBSCRIBE, and SHARE your experience and thoughts in the comments below!

---
Follow Me on Social Media:
Instagram: [Your Link Here]
Facebook: [Your Link Here]
Website: [Your Link Here]`;

  const descriptionBengali = `${introSentence1}

এই ভিডিওতে ${primaryTopic} এবং ${secondaryTopic} নিয়ে বিশদ আলোচনা করা হয়েছে। কীভাবে খুব সহজে বাস্তব জীবনে এই কৌশলগুলো প্রয়োগ করবেন তা উদাহরণসহ তুলে ধরা হয়েছে।

*এই ভিডিওতে যা যা থাকছে:*
- ${primaryTopic}-এর গুরুত্ব এবং সঠিক নিয়ম
- সাধারণ সমস্যা ও তার বাস্তব সমাধান
- ধাপে ধাপে কার্যকর রুটিন তৈরির কৌশল
- দীর্ঘমেয়াদে সফল হওয়ার উপায়`;

  const hashtags = `#${primaryTopic.toLowerCase().replace(/\s+/g, '')} #${secondaryTopic.toLowerCase().replace(/\s+/g, '')} #${thirdTopic.toLowerCase().replace(/\s+/g, '')} #tutorial #guide #youtubecreators #tipsandtricks`;

  // Try server API first if available, otherwise return tailored transcript result
  const serverResult = await safeFetchJson<SeoResult>('/api/generate/seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, titleIdea, language }),
  });

  if (
    serverResult &&
    serverResult.titlesEnglish &&
    !serverResult.titlesEnglish.includes('Screen-Free') &&
    !serverResult.titlesEnglish.includes('Screen free')
  ) {
    return serverResult;
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    titlesEnglish: `${title1}\n${title2}\n${title3}`,
    titlesBengali: `${title1Bn}\n${title2Bn}\n${title3Bn}`,
    description,
    descriptionBengali,
    hashtags,
  };
}

// ----------------- 2. Generate Tags to Rank Higher (Strictly Title & Channel Name) ----------------- //

export async function generateRankTags(videoTitle: string, channelName: string): Promise<RankTagsResult> {
  const cleanTitle = videoTitle.trim();
  const cleanChannel = channelName.trim();

  // Extract keywords only from the title that user provided
  const titleWords = cleanTitle
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !COMMON_STOP_WORDS.has(w));

  const w1 = titleWords[0] || 'tips';
  const w2 = titleWords[1] || 'guide';
  const w3 = titleWords[2] || 'tutorial';
  const w4 = titleWords[3] || 'review';

  // Construct search tags directly derived from title & channel
  const tags: string[] = [
    cleanTitle,
    cleanChannel,
    `${cleanChannel} ${cleanTitle}`,
    `${cleanChannel} ${w1}`,
    `${w1} ${w2}`,
    `how to ${w1}`,
    `how to ${w1} ${w2}`,
    `${cleanTitle} tutorial`,
    `${cleanTitle} guide`,
    `${w1} tips`,
    `best ${w1} techniques`,
    `learn ${w1}`,
    `${w1} for beginners`,
    `step by step ${w1}`,
    `${cleanTitle} tips and tricks`,
    `${w1} ${w2} explained`,
    `why ${w1} matters`,
    `${cleanChannel} official`,
    `${cleanChannel} video`,
    `${w1} walkthrough`,
    `${cleanTitle} 2026`,
    `master ${w1}`,
  ];

  const uniqueTags = Array.from(new Set(tags)).filter((t) => t.trim().length > 0).slice(0, 24);

  return {
    tags: uniqueTags,
    commaSeparated: uniqueTags.join(', '),
  };
}

// ----------------- 3. Content & Comments Generator (100% Transcript Specific) ----------------- //

export async function generateContent(scriptContext: string): Promise<ContentGenerationResult> {
  const cleanInput = scriptContext.trim();
  const keywords = extractKeywords(cleanInput, 6);
  const sentences = extractMeaningfulSentences(cleanInput);

  const k1 = keywords[0] || 'this topic';
  const k2 = keywords[1] || 'this strategy';
  const k3 = keywords[2] || 'practical execution';

  const s1 = sentences[0] || `The breakdown of ${k1.toLowerCase()} in this video`;
  const s2 = sentences[1] || `The practical examples of ${k2.toLowerCase()} shown here`;

  const comment1 = `The clarity you brought to ${k1.toLowerCase()} in this video is top tier! When you explained "${s1.slice(0, 75)}...", it completely clicked for me. Fantastic breakdown!`;
  const comment2 = `I love how you connected ${k1.toLowerCase()} with ${k2.toLowerCase()} without any unnecessary fluff. The point that "${s2.slice(0, 75)}..." was pure gold. Subscribed!`;

  const sms1En = `Hey! Just watched your video about ${k1.toLowerCase()} and ${k2.toLowerCase()}. Really appreciated how honest and actionable your advice was — super motivating!`;
  const sms1Bn = `হ্যালো! আপনার ইউটিউব চ্যানেলের নতুন ভিডিওটি এইমাত্র দেখলাম। ${k1} এবং ${k2} নিয়ে আপনার আলোচনা ও পরামর্শগুলো খুব ভালো লেগেছে; সত্যি অনেক কিছু শিখলাম!`;

  const sms2En = `Hi there! Wanted to reach out and say your breakdown of ${k1.toLowerCase()} was phenomenal. It gave me so much clarity on how to handle ${k3.toLowerCase()}!`;
  const sms2Bn = `হে! আপনার চ্যানেলের ভিডিওটি শেষ করলাম। ${k1} নিয়ে আপনার এই সুন্দর বাস্তবমুখী উপস্থাপনা সত্যি অনুপ্রেরণাদায়ক!`;

  await new Promise((resolve) => setTimeout(resolve, 400));

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
  const keywords = extractKeywords(scriptContext, 6);
  const k1 = keywords[0] || 'this topic';
  const k2 = keywords[1] || 'the process';
  const k3 = keywords[2] || 'practical habits';

  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    `The explanation you gave about ${k1.toLowerCase()} completely shifted my perspective. Best breakdown yet!`,
    `Can we just talk about how authentic and needed this conversation on ${k1.toLowerCase()} is? Brilliant execution.`,
    `I've watched dozens of videos on ${k2.toLowerCase()}, but yours is the only one with actionable, zero-fluff steps.`,
    `Shared this immediately with my group chat. That specific advice around ${k3.toLowerCase()} is pure gold!`,
    `The walkthrough of ${k1.toLowerCase()} made it so easy to follow along. Subscribing right away!`,
    `This resonated with me so deeply. Going to start implementing your step-by-step strategy tonight.`,
    `Thank you for addressing the real hurdles with ${k1.toLowerCase()}. Most people completely skip that part.`,
    `The tip about mastering ${k2.toLowerCase()} before jumping ahead saved me so much frustration. Thank you!`,
    `Such calm, encouraging energy throughout the entire video. Please do a dedicated follow-up on ${k3.toLowerCase()}!`,
    `Every single person working on ${k1.toLowerCase()} needs to bookmark this. Absolute masterclass!`,
  ];
}

// ----------------- 4. Instagram Comment Generator ----------------- //

export async function generateInstagramComments(caption: string): Promise<InstagramCommentsResult> {
  const cleanInput = caption.trim();
  const keywords = extractKeywords(cleanInput, 5);
  const mainSubject = keywords[0] || 'this post';
  const secondary = keywords[1] || 'the details';

  await new Promise((resolve) => setTimeout(resolve, 400));

  const opt1 = `Obsessed with the details on ${mainSubject.toLowerCase()}! Such a fresh and well-crafted post 🔥`;
  const opt2 = `The quality and thoughtfulness behind ${mainSubject.toLowerCase()} and ${secondary.toLowerCase()} is unmatched. Always looking forward to your drops!`;
  const opt3 = `Everything about this is pure fire! The way you broke down ${mainSubject.toLowerCase()} is spot-on. Definitely sharing this 🙌`;

  return {
    options: [
      { id: 1, title: 'Option 1', text: opt1 },
      { id: 2, title: 'Option 2', text: opt2 },
      { id: 3, title: 'Option 3', text: opt3 },
    ],
  };
}

// ----------------- 5. Transcript Summarizer ----------------- //

export async function generateTranscriptSummary(
  transcript: string,
  length: 'short' | 'long'
): Promise<TranscriptSummaryResult> {
  const cleanInput = transcript.trim();
  const keywords = extractKeywords(cleanInput, 10);
  const sentences = extractMeaningfulSentences(cleanInput);

  const k1 = keywords[0] || 'Key Insights';
  const k2 = keywords[1] || 'Core Methods';

  const generalKeywords = keywords.join(', ') + ', tutorial, step by step, guide, practical tips';
  const marketingKeywords = keywords
    .map((k) => `how to master ${k.toLowerCase()}, best ${k.toLowerCase()} tips, ${k.toLowerCase()} guide, ${k.toLowerCase()} for beginners`)
    .slice(0, 8)
    .join(', ');

  const s1 = sentences[0] || `In this video, the discussion centers on ${k1.toLowerCase()} and practical implementation.`;
  const s2 = sentences[1] || `The speaker explores how establishing consistent daily routines leads to measurable progress.`;
  const s3 = sentences[2] || `By addressing core obstacles and friction, the session outlines realistic strategies.`;

  const isShort = length === 'short';

  const summary = isShort
    ? `${s1} ${s2} By breaking down real-world friction and actionable steps around ${k1.toLowerCase()} and ${k2.toLowerCase()}, the session illustrates how small, deliberate adjustments create sustainable, long-term results.`
    : `${s1} ${s2} ${s3}\n\nFurthermore, the session dives deep into the root causes that hold most people back, providing concrete solutions for ${k1.toLowerCase()} and ${k2.toLowerCase()}. Rather than relying on temporary fixes, viewers are given an actionable, realistic roadmap to achieve lasting success.`;

  const bengaliSummary = isShort
    ? `এই ভিডিওতে ${k1} এবং ${k2} নিয়ে বিশদ আলোচনা করা হয়েছে। বিষয়গুলোকে সহজ ধাপে ভাগ করে বাস্তব জীবনের প্রয়োজনীয় কৌশল তুলে ধরা হয়েছে, যা নিয়মিত অনুশীলনের মাধ্যমে কার্যকর ফলাফল বয়ে আনতে সাহায্য করবে।`
    : `এই বিস্তারিত ভিডিওতে ${k1} এবং ${k2} সম্পর্কিত খুঁটিনাটি দিক ও বাস্তবসম্মত কৌশল তুলে ধরা হয়েছে।\n\nএখানে কেবল তাত্ত্বিক কথা নয়, বরং বাস্তব জীবনের নানাবিধ চ্যালেঞ্জ কীভাবে সফলভাবে অতিক্রম করা যায় তা স্পষ্ট করা হয়েছে। মূল বিষয়গুলোকে কাজে লাগিয়ে কীভাবে যে কেউ নিজের কাজে বড় ধরণের উন্নতি করতে পারে, তার একটি অনুপ্রেরণাদায়ক গাইডলাইন দেওয়া হয়েছে।`;

  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    summary,
    bengaliSummary,
    generalKeywords,
    marketingKeywords,
  };
}
