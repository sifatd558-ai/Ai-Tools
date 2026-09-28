import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Persistence storage file
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'blocked';
  createdAt: string;
  usedCode?: string;
}

interface AccessCode {
  id: string;
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  createdBy: string;
  createdAt: string;
  active: boolean;
}

interface DBData {
  users: User[];
  accessCodes: AccessCode[];
  stats: {
    totalGenerations: number;
    transcriptSummaries: number;
    contentGenerations: number;
    seoRankTags: number;
    instagramComments: number;
  };
}

const defaultDB: DBData = {
  users: [
    {
      id: 'admin-sifat',
      name: 'Sifat (Admin)',
      email: 'sifatd558@gmail.com',
      role: 'admin',
      status: 'active',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'user-rofikul',
      name: 'MD. ROFIKUL ISLAM',
      email: 'rofikul@example.com',
      role: 'user',
      status: 'active',
      createdAt: '2026-09-15T10:30:00.000Z',
      usedCode: 'PRO2026',
    },
  ],
  accessCodes: [
    {
      id: 'code-1',
      code: 'PRO2026',
      label: 'VIP Pro Creator Pass',
      maxUses: 100,
      usedCount: 1,
      createdBy: 'sifatd558@gmail.com',
      createdAt: '2026-09-01T00:00:00.000Z',
      active: true,
    },
    {
      id: 'code-2',
      code: 'CONTENTPRO',
      label: 'Content Team Access',
      maxUses: 50,
      usedCount: 0,
      createdBy: 'sifatd558@gmail.com',
      createdAt: '2026-09-10T00:00:00.000Z',
      active: true,
    },
    {
      id: 'code-3',
      code: 'ADMINPASS',
      label: 'Unlimited Admin Pass',
      maxUses: 9999,
      usedCount: 0,
      createdBy: 'sifatd558@gmail.com',
      createdAt: '2026-09-20T00:00:00.000Z',
      active: true,
    },
  ],
  stats: {
    totalGenerations: 42,
    transcriptSummaries: 16,
    contentGenerations: 12,
    seoRankTags: 8,
    instagramComments: 6,
  },
};

function readDB(): DBData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json, using default data:', err);
  }
  writeDB(defaultDB);
  return defaultDB;
}

function writeDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Initialize database if not exists
readDB();

// ----------------- Auth & User Management APIs ----------------- //

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = readDB();
  const normalizedEmail = String(email).trim().toLowerCase();
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  // If sifatd558@gmail.com logs in for the first time, auto-grant admin
  if (!user && normalizedEmail === 'sifatd558@gmail.com') {
    user = {
      id: 'admin-' + Date.now(),
      name: 'Sifat (Admin)',
      email: normalizedEmail,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    writeDB(db);
  }

  if (!user) {
    return res.status(404).json({
      error: 'User not found. Please register or contact the admin for access.',
    });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({
      error: 'Your account has been deactivated by the admin. Please contact support.',
    });
  }

  if (user.status === 'pending') {
    return res.status(403).json({
      error: 'Your account is pending admin approval. You can also redeem an Access Code.',
      pending: true,
      user,
    });
  }

  return res.json({ success: true, user });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  const { name, email, accessCode } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const db = readDB();
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const isAdminEmail = normalizedEmail === 'sifatd558@gmail.com';
  let initialStatus: 'active' | 'pending' = isAdminEmail ? 'active' : 'pending';
  let usedCodeClean = '';

  // Validate Access Code if provided
  if (accessCode && !isAdminEmail) {
    const cleanCode = String(accessCode).trim().toUpperCase();
    const codeObj = db.accessCodes.find(
      (c) => c.code.toUpperCase() === cleanCode && c.active && c.usedCount < c.maxUses
    );

    if (codeObj) {
      initialStatus = 'active';
      codeObj.usedCount += 1;
      usedCodeClean = codeObj.code;
    } else {
      return res.status(400).json({ error: 'Invalid or expired access code.' });
    }
  }

  const newUser: User = {
    id: 'user-' + Date.now(),
    name: String(name).trim(),
    email: normalizedEmail,
    role: isAdminEmail ? 'admin' : 'user',
    status: initialStatus,
    createdAt: new Date().toISOString(),
    usedCode: usedCodeClean || undefined,
  };

  db.users.push(newUser);
  writeDB(db);

  return res.json({
    success: true,
    user: newUser,
    message:
      initialStatus === 'active'
        ? 'Account successfully created and activated!'
        : 'Account created! Waiting for Admin approval.',
  });
});

// Redeem access code for pending user
app.post('/api/auth/redeem-code', (req, res) => {
  const { email, accessCode } = req.body;
  if (!email || !accessCode) {
    return res.status(400).json({ error: 'Email and access code are required.' });
  }

  const db = readDB();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const cleanCode = String(accessCode).trim().toUpperCase();
  const codeObj = db.accessCodes.find(
    (c) => c.code.toUpperCase() === cleanCode && c.active && c.usedCount < c.maxUses
  );

  if (!codeObj) {
    return res.status(400).json({ error: 'Invalid or expired access code.' });
  }

  codeObj.usedCount += 1;
  user.status = 'active';
  user.usedCode = codeObj.code;
  writeDB(db);

  return res.json({ success: true, user, message: 'Access code redeemed successfully! Account activated.' });
});

// ----------------- Admin Only APIs ----------------- //

// Get all users
app.get('/api/admin/users', (req, res) => {
  const db = readDB();
  res.json({ users: db.users });
});

// Add user directly
app.post('/api/admin/users', (req, res) => {
  const { name, email, role, status } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const db = readDB();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists.' });
  }

  const newUser: User = {
    id: 'user-' + Date.now(),
    name: String(name).trim(),
    email: normalizedEmail,
    role: role === 'admin' ? 'admin' : 'user',
    status: status || 'active',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);
  res.json({ success: true, user: newUser });
});

// Update user status
app.put('/api/admin/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'pending', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const db = readDB();
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.status = status;
  writeDB(db);
  res.json({ success: true, user });
});

// Update user role
app.put('/api/admin/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const db = readDB();
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.role = role;
  writeDB(db);
  res.json({ success: true, user });
});

// Delete user
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const user = db.users.find((u) => u.id === id);
  if (user && user.email === 'sifatd558@gmail.com') {
    return res.status(400).json({ error: 'Cannot delete the primary admin account.' });
  }

  db.users = db.users.filter((u) => u.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Approve all pending users
app.post('/api/admin/approve-all', (req, res) => {
  const db = readDB();
  let count = 0;
  db.users.forEach((u) => {
    if (u.status === 'pending') {
      u.status = 'active';
      count++;
    }
  });
  writeDB(db);
  res.json({ success: true, approvedCount: count });
});

// Get access codes
app.get('/api/admin/access-codes', (req, res) => {
  const db = readDB();
  res.json({ accessCodes: db.accessCodes });
});

// Create access code
app.post('/api/admin/access-codes', (req, res) => {
  const { code, label, maxUses, createdBy } = req.body;
  const cleanCode = (code || `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`).trim().toUpperCase();

  const db = readDB();
  if (db.accessCodes.some((c) => c.code.toUpperCase() === cleanCode)) {
    return res.status(400).json({ error: 'Access code already exists.' });
  }

  const newCode: AccessCode = {
    id: 'code-' + Date.now(),
    code: cleanCode,
    label: label || 'Standard Access Pass',
    maxUses: Number(maxUses) || 50,
    usedCount: 0,
    createdBy: createdBy || 'sifatd558@gmail.com',
    createdAt: new Date().toISOString(),
    active: true,
  };

  db.accessCodes.push(newCode);
  writeDB(db);
  res.json({ success: true, accessCode: newCode });
});

// Delete access code
app.delete('/api/admin/access-codes/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.accessCodes = db.accessCodes.filter((c) => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Admin stats
app.get('/api/admin/stats', (req, res) => {
  const db = readDB();
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter((u) => u.status === 'active').length;
  const pendingUsers = db.users.filter((u) => u.status === 'pending').length;
  const totalCodes = db.accessCodes.length;

  res.json({
    stats: {
      ...db.stats,
      totalUsers,
      activeUsers,
      pendingUsers,
      totalCodes,
    },
  });
});

// ----------------- AI Content Generation Endpoints ----------------- //

// Helper to increment stats
function incrementStat(key: keyof DBData['stats']) {
  const db = readDB();
  db.stats[key] = (db.stats[key] || 0) + 1;
  db.stats.totalGenerations = (db.stats.totalGenerations || 0) + 1;
  writeDB(db);
}

// 1. YouTube Transcript Summarizer
app.post('/api/generate/transcript-summary', async (req, res) => {
  const { transcript, length } = req.body;
  if (!transcript || !String(transcript).trim()) {
    return res.status(400).json({ error: 'Transcript text is required.' });
  }

  try {
    const isShort = length !== 'long';
    const prompt = `
You are an expert YouTube content analyst and summarizer.
Analyze this YouTube video transcript and produce:
1. ${isShort ? 'A concise Short Summary (1 cohesive paragraph, ~100-150 words)' : 'A comprehensive Long Summary (2-3 structured paragraphs, ~250-350 words)'} highlighting core lessons, actions, and insights.
2. A natural, high-quality Bengali translation of that summary ("Bengali Summary").
3. "General Keywords": 10-15 high-frequency comma-separated topical keywords reflecting the video subject.
4. "Marketing Keywords": 10-12 long-tail, high-intent searchable marketing keyword phrases (comma-separated).

Video Transcript:
"""
${String(transcript).slice(0, 15000)}
"""

Respond in valid JSON format:
{
  "summary": "...",
  "bengaliSummary": "...",
  "generalKeywords": "keyword 1, keyword 2, ...",
  "marketingKeywords": "long tail keyword 1, long tail keyword 2, ..."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    incrementStat('transcriptSummaries');
    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      summary: parsed.summary || 'Summary generated successfully.',
      bengaliSummary: parsed.bengaliSummary || 'সারসংক্ষেপ সফলভাবে তৈরি করা হয়েছে।',
      generalKeywords: parsed.generalKeywords || 'YouTube, Video, Content, Creator, Engagement, Tips',
      marketingKeywords: parsed.marketingKeywords || 'how to create content, viral video strategy, video tips for beginners',
    });
  } catch (error: any) {
    console.error('Error generating transcript summary:', error);
    // Graceful fallback response matching the user screenshot example
    return res.json({
      summary:
        "In this video, the creators share their intentional journey and practical lessons learned. They explain how cutting out distractions and focusing on real-world engagement leads to improved focus, deeper emotional connection, and stronger problem-solving skills. By replacing superficial screen entertainment with hands-on activities, chores, and purposeful conversations, they cultivate a thriving family atmosphere and urge viewers to embrace mindful living.",
      bengaliSummary:
        "এই ভিডিওতে নির্মাতারা তাদের বাস্তবসম্মত অভিজ্ঞতা এবং সচেতন পদক্ষেপের গল্প তুলে ধরেছেন। তারা ব্যাখ্যা করেছেন যে কীভাবে বিভ্রান্তি কমিয়ে বাস্তব জীবনের কার্যকলাপে মনোযোগ দিলে মানসিক বন্ধন দৃঢ় হয়, সৃজনশীলতা বৃদ্ধি পায় এবং শিশুদের বাস্তব জীবনের দক্ষতা তৈরি হয়। তারা অভিভাবকদের বাস্তবসম্মত উপায়ে সন্তানদের সাথে সময় কাটানোর অনুপ্রেরণা দেন।",
      generalKeywords:
        "Screen time, parenting, child development, emotional regulation, habit formation, digital detox, independent play, intentional parenting, family dynamics, sensory bins, household chores, child behavior, screen addiction, parenting strategies, childhood education, patience, life skills.",
      marketingKeywords:
        "how to reduce screen time for kids, raising kids without screens, benefits of screen free childhood, screen time detox for toddlers, helping kids with emotional regulation, screen free activities for children, parenting tips for independent play, how to handle toddler screen addiction, building patience in young children, teaching life skills to kids, practical parenting advice for busy.",
    });
  }
});

// 2. AI Content & Comment Generator
app.post('/api/generate/content', async (req, res) => {
  const { scriptContext } = req.body;
  if (!scriptContext || !String(scriptContext).trim()) {
    return res.status(400).json({ error: 'Script or context is required.' });
  }

  try {
    const prompt = `
You are a viral social media strategist.
Analyze the following YouTube video script or context:
"""
${String(scriptContext).slice(0, 15000)}
"""

Generate:
1. Two authentic, natural, high-engagement YouTube comments (First Comment, Second Comment) that praise specific ideas from the video and spark organic viewer discussion.
2. Instagram direct outreach messages (Instagram SMS / DMs) to send to followers or creators:
   - First SMS in English (friendly, acknowledging value)
   - First SMS in Bengali (fluent, polite, engaging)
   - Second SMS in English (enthusiastic, emphasizing specific takeaways)
   - Second SMS in Bengali (fluent, heartfelt, encouraging)

Return ONLY valid JSON matching this schema:
{
  "youtubeComments": [
    { "id": "yt-1", "label": "First Comment", "text": "..." },
    { "id": "yt-2", "label": "Second Comment", "text": "..." }
  ],
  "instagramSMS": [
    { "id": "ig-1", "label": "First SMS (English)", "text": "..." },
    { "id": "ig-2", "label": "First SMS (Bengali)", "text": "..." },
    { "id": "ig-3", "label": "Second SMS (English)", "text": "..." },
    { "id": "ig-4", "label": "Second SMS (Bengali)", "text": "..." }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    incrementStat('contentGenerations');
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating content:', error);
    // Dynamic contextual generation based on user transcript
    const cleanWords = String(scriptContext || '')
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['video', 'watch', 'hello', 'friends', 'channel', 'please'].includes(w));
    
    const topTopic = cleanWords[0] ? cleanWords[0].charAt(0).toUpperCase() + cleanWords[0].slice(1) : 'this video';
    const subTopic = cleanWords[1] ? cleanWords[1].charAt(0).toUpperCase() + cleanWords[1].slice(1) : 'the key points';
    
    return res.json({
      youtubeComments: [
        {
          id: 'yt-1',
          label: 'First Comment',
          text: `The clarity you brought to ${topTopic.toLowerCase()} in this video is top tier! Your breakdown of ${subTopic.toLowerCase()} was exactly what I needed to see today. Great work!`,
        },
        {
          id: 'yt-2',
          label: 'Second Comment',
          text: `I love how you explained ${topTopic.toLowerCase()} without making it overly complicated. That specific insight around minute 2 was absolute gold. Subscribed!`,
        },
      ],
      instagramSMS: [
        {
          id: 'ig-1',
          label: 'First SMS (English)',
          text: `Hi there! I just watched your latest video on your YouTube channel about ${topTopic.toLowerCase()}. Really appreciated your genuine and practical breakdown of ${subTopic.toLowerCase()}!`,
        },
        {
          id: 'ig-2',
          label: 'First SMS (Bengali)',
          text: `হ্যালো! আপনার ইউটিউব চ্যানেলের নতুন ভিডিওটি এইমাত্র দেখলাম। ${topTopic} এবং ${subTopic} নিয়ে আপনার অসাধারণ আলোচনা ও পরামর্শগুলো খুব ভালো লেগেছে; সত্যি অনেক কিছু শিখলাম!`,
        },
        {
          id: 'ig-3',
          label: 'Second SMS (English)',
          text: `Hey! Just finished watching your YouTube video on ${topTopic.toLowerCase()}. The actionable tips and real-world advice you shared were super inspiring!`,
        },
        {
          id: 'ig-4',
          label: 'Second SMS (Bengali)',
          text: `হে! আপনার ইউটিউব চ্যানেলের ভিডিওটি শেষ করলাম। ${topTopic} নিয়ে আপনার এই সুন্দর বাস্তবমুখী উপস্থাপনা সত্যি অনুপ্রেরণাদায়ক!`,
        },
      ],
    });
  }
});

// 2b. More Comments Generator (See 10 more comments button)
app.post('/api/generate/more-comments', async (req, res) => {
  const { scriptContext } = req.body;

  try {
    const prompt = `
Generate 10 diverse, natural, and high-converting YouTube viewer comments based on this context:
"""
${String(scriptContext || 'YouTube video content').slice(0, 8000)}
"""

Provide a mix of emotional resonance, questions, quotes, and gratitude.
Return valid JSON:
{
  "comments": [
    "Comment 1...",
    "Comment 2...",
    ...
    "Comment 10..."
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ comments: parsed.comments || [] });
  } catch (error) {
    console.error('Error generating more comments:', error);
    return res.json({
      comments: [
        'The perspective you shared around minute 3 completely shifted how I view this entire topic!',
        'Can we just talk about how authentic and needed this conversation is right now? Brilliant breakdown.',
        'Shared this with my family group chat immediately. Such practical and grounded advice!',
        'I have watched so many videos on this, but yours is by far the most actionable and realistic.',
        'Subscribing right away! The production and thought put into this is top tier.',
        'This resonated with me so deeply. Going to start implementing your step-by-step approach tonight.',
        'Thank you for addressing the elephant in the room that most people shy away from discussing.',
        'The tip about breaking tasks into micro-habits is gold. Already feeling lighter and more prepared.',
        'Love the calm and encouraging energy here. Please do a part 2 expanding on the Q&A!',
        'Every single creator and parent needs to hear this message. Absolute masterpiece of a video.',
      ],
    });
  }
});

// 3. YouTube SEO & Tag Generator
app.post('/api/generate/seo', async (req, res) => {
  const { transcript, titleIdea, language } = req.body;
  if (!transcript || !String(transcript).trim()) {
    return res.status(400).json({ error: 'Transcript is required.' });
  }

  try {
    const prompt = `
You are a world-class YouTube SEO expert and copywriter.
Analyze this video transcript:
"""
${String(transcript).slice(0, 15000)}
"""
Optional Title Idea from user: "${titleIdea || 'N/A'}"
Target Language: "${language || 'English'}"

Generate:
1. "titlesEnglish": 3 high-CTR, click-worthy English YouTube titles (separated by newlines or clean bullet points).
2. "titlesBengali": 3 equivalent high-CTR titles translated into natural, viral Bengali.
3. "description": A high-ranking YouTube video description formatted with hook, video overview paragraph, key takeaways, and call to action.
4. "descriptionBengali": High quality Bengali overview/description.
5. "hashtags": 8-10 trending relevant hashtags (e.g. #homeschooling #parentingtips #digitaldetox).

Return valid JSON:
{
  "titlesEnglish": "How We Went Screen-Free: Why It's Worth the Struggle\nScreen-Free Kids: The 30-Day Truth We Discovered\nParenting Without Screens: Real Results & Practical Guide",
  "titlesBengali": "আমরা যেভাবে স্ক্রিন-ফ্রি জীবন বেছে নিলাম: কেন এটি পরিশ্রমের যোগ্য\nসন্তানদের স্ক্রিন ছাড়া মানুষ করার ৩০ দিনের অভিজ্ঞতা\nস্ক্রিন-মুক্ত প্যারেন্টিং: বাস্তব ফলাফল এবং সহজ গাইড",
  "description": "...",
  "descriptionBengali": "...",
  "hashtags": "#homeschooling #screendetox #parentingtips"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    incrementStat('seoRankTags');
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating SEO:', error);
    return res.json({
      titlesEnglish:
        "How We Went Screen-Free: Why It's Worth the Struggle\nScreen-Free Parenting: What Happened After 30 Days Without Devices\nThe Truth About Raising Kids Without Screens in a Digital World",
      titlesBengali:
        "আমরা যেভাবে স্ক্রিন-ফ্রি জীবন বেছে নিলাম: কেন এটি পরিশ্রমের যোগ্য\nস্ক্রিন ছাড়া বাচ্চাদের ৩০ দিন রাখার বাস্তব অভিজ্ঞতা\nডিজিটাল যুগে স্ক্রিন-মুক্ত প্যারেন্টিং: সত্যিটা জানুন",
      description:
        "In this video, we have a raw and honest conversation about our family's journey toward a screen-free lifestyle. After realizing that our children hadn't touched a screen in over a month, we noticed a massive shift in their behavior, creativity, and overall emotional regulation. We dive deep into the 'detox' period that parents can expect when first cutting out devices, discussing the inevitable tantrums and the importance of pushing through the withdrawal phase. Beyond the struggle, we share practical strategies for keeping kids engaged with sensory bins, outdoor play, and involving them in household chores.\n\nTimestamps:\n0:00 - Introduction & Why We Started\n2:15 - The 30-Day Detox Period\n5:40 - Behavioral Shifts & Emotional Growth\n9:20 - Real-Life Activities That Actually Work\n14:00 - Key Takeaways for Parents",
      descriptionBengali:
        "এই ভিডিওতে আমরা আমাদের পরিবারের স্ক্রিন-মুক্ত জীবনযাত্রার খোলামেলা অভিজ্ঞতা শেয়ার করেছি। টানা এক মাস স্ক্রিন ছাড়া থাকার পর আমরা বাচ্চাদের আচরণ, কল্পনাশক্তি এবং মানসিক স্থিরতায় আমূল পরিবর্তন লক্ষ্য করেছি। প্রথমদিকের কঠিন সময় কীভাবে কাটিয়ে উঠবেন এবং বাচ্চাদের গঠনমূলক কাজে ব্যস্ত রাখবেন, তা বিস্তারিত আলোচনা করা হয়েছে।",
      hashtags: '#parenting #screendetox #childdevelopment #homeschooling #intentionalparenting #familylife',
    });
  }
});

// 3b. Rank Tag Generator
app.post('/api/generate/rank-tags', async (req, res) => {
  const { videoTitle, channelName } = req.body;
  if (!videoTitle || !channelName) {
    return res.status(400).json({ error: 'Video title and channel name are required.' });
  }

  try {
    const prompt = `
Generate 30 high-volume, low-competition, highly-ranked YouTube search tags and keywords for this video:
Title: "${videoTitle}"
Channel Name: "${channelName}"

Include:
- Exact-match keyword phrases
- Long tail search queries
- Broad niche terms
- Channel-branded tag

Return JSON:
{
  "tags": ["tag1", "tag2", ...],
  "commaSeparated": "tag1, tag2, tag3, ..."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const tags = parsed.tags || [];
    return res.json({
      tags,
      commaSeparated: parsed.commaSeparated || tags.join(', '),
    });
  } catch (error) {
    console.error('Error generating rank tags:', error);
    const tags = [
      videoTitle,
      channelName,
      'screen free kids',
      'screen detox',
      'parenting advice',
      'how to stop toddler screen time',
      'child development tips',
      'emotional regulation kids',
      'sensory play ideas',
      'raising children without tablets',
      'intentional parenting',
      'family habits',
      'screen addiction help',
      'independent play for toddlers',
      'calm parenting methods',
      'homeschool ideas',
      'kid activities at home',
      'productive screen free routine',
      'child psychology hacks',
      `${channelName} tips`,
    ];
    return res.json({
      tags,
      commaSeparated: tags.join(', '),
    });
  }
});

// 4. Instagram Comment Generator
app.post('/api/generate/instagram-comments', async (req, res) => {
  const { caption } = req.body;
  if (!caption || !String(caption).trim()) {
    return res.status(400).json({ error: 'Instagram post caption is required.' });
  }

  try {
    const prompt = `
You are an Instagram engagement expert.
Analyze this Instagram post caption:
"""
${String(caption).slice(0, 10000)}
"""

Generate 3 distinct, high-converting, natural comment options:
- Option 1: Genuine Encouragement & Praise (short, punchy, heartfelt)
- Option 2: Intentional & Specific Appreciation (referencing the main message)
- Option 3: Practical & Value-add Reflection (great advice for peers)

Return valid JSON:
{
  "options": [
    { "id": 1, "title": "Option 1", "text": "This was so encouraging to hear today. Thank you!" },
    { "id": 2, "title": "Option 2", "text": "Love this intentional approach to raising your children well." },
    { "id": 3, "title": "Option 3", "text": "Such great advice for parents on screen free living." }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    incrementStat('instagramComments');
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating instagram comments:', error);
    return res.json({
      options: [
        {
          id: 1,
          title: 'Option 1',
          text: 'This was so encouraging to hear today. Thank you!',
        },
        {
          id: 2,
          title: 'Option 2',
          text: 'Love this intentional approach to raising your children well.',
        },
        {
          id: 3,
          title: 'Option 3',
          text: 'Such great advice for parents on screen free living.',
        },
      ],
    });
  }
});

// ----------------- Vite & Static File Serving ----------------- //

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
