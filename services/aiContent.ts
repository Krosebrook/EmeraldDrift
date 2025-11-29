import AsyncStorage from "@react-native-async-storage/async-storage";

const OPENAI_KEY_STORAGE = "@creator_studio_openai_key";

export interface ContentIdea {
  title: string;
  hook: string;
  angle: string;
}

export interface CaptionSuggestion {
  caption: string;
  hashtags: string[];
  callToAction: string;
}

export interface HashtagSuggestion {
  hashtags: string[];
  categories: {
    trending: string[];
    niche: string[];
    branded: string[];
  };
}

const CONTENT_IDEAS_TEMPLATES: ContentIdea[] = [
  { title: "Behind the Scenes", hook: "Ever wondered what happens behind the camera?", angle: "Show your creative process" },
  { title: "Day in My Life", hook: "Spending 24 hours doing what I love most", angle: "Personal and relatable content" },
  { title: "Before & After", hook: "The transformation you never saw coming", angle: "Visual storytelling" },
  { title: "Tips & Tricks", hook: "5 things I wish I knew when I started", angle: "Educational value" },
  { title: "Q&A Session", hook: "You asked, I'm answering!", angle: "Community engagement" },
  { title: "Challenge Accepted", hook: "Taking on the impossible challenge", angle: "Entertainment and fun" },
  { title: "Honest Review", hook: "My unfiltered thoughts on this product", angle: "Authentic opinions" },
  { title: "Story Time", hook: "Let me tell you about the time when...", angle: "Narrative content" },
  { title: "Tutorial", hook: "Learn how to do this in under 5 minutes", angle: "Step-by-step guidance" },
  { title: "Unpopular Opinion", hook: "Everyone says X, but I think Y", angle: "Thought-provoking" },
];

const HASHTAG_TEMPLATES = {
  general: ["#contentcreator", "#creativity", "#digitalcreator", "#viral", "#trending", "#explorepage"],
  instagram: ["#instadaily", "#instapost", "#instagood", "#reels", "#igreels", "#instagramreels"],
  tiktok: ["#fyp", "#foryou", "#foryoupage", "#tiktok", "#tiktokviral", "#viral"],
  youtube: ["#youtube", "#youtuber", "#subscribe", "#shorts", "#youtubeshorts", "#video"],
  linkedin: ["#linkedin", "#networking", "#professional", "#business", "#career", "#growth"],
  lifestyle: ["#lifestyle", "#life", "#motivation", "#inspiration", "#daily", "#mood"],
  business: ["#entrepreneur", "#startup", "#success", "#hustle", "#mindset", "#growth"],
};

const CALL_TO_ACTIONS = [
  "Double tap if you agree!",
  "Save this for later!",
  "Tag someone who needs to see this!",
  "Drop a comment below!",
  "Share this with your friends!",
  "Follow for more content like this!",
  "What do you think? Let me know!",
  "Hit that follow button!",
  "Turn on post notifications!",
  "Link in bio for more!",
];

export const aiContentService = {
  async getApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(OPENAI_KEY_STORAGE);
    } catch {
      return null;
    }
  },

  async setApiKey(key: string): Promise<void> {
    await AsyncStorage.setItem(OPENAI_KEY_STORAGE, key);
  },

  async removeApiKey(): Promise<void> {
    await AsyncStorage.removeItem(OPENAI_KEY_STORAGE);
  },

  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key && key.length > 0;
  },

  async generateContentIdeas(topic?: string, count: number = 5): Promise<{ ideas: ContentIdea[]; usedAI: boolean }> {
    const apiKey = await this.getApiKey();
    
    if (apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a creative social media content strategist. Generate engaging content ideas with catchy hooks and unique angles. Return ONLY valid JSON with an 'ideas' array containing objects with title, hook, and angle string fields. No prose.",
              },
              {
                role: "user",
                content: `Generate ${count} creative content ideas${topic ? ` about "${topic}"` : " for a content creator"}. Return ONLY JSON: {"ideas": [...]}`,
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const parsed = JSON.parse(data.choices[0].message.content);
            const ideas = Array.isArray(parsed) ? parsed : parsed.ideas || [];
            if (ideas.length > 0) {
              return { ideas, usedAI: true };
            }
          } catch {
            console.log("Failed to parse OpenAI response, using fallback");
          }
        }
      } catch (error) {
        console.log("OpenAI API error, falling back to templates:", error);
      }
    }

    const shuffled = [...CONTENT_IDEAS_TEMPLATES].sort(() => Math.random() - 0.5);
    let ideas: ContentIdea[];
    if (topic) {
      ideas = shuffled.slice(0, count).map((idea) => ({
        ...idea,
        title: `${idea.title}: ${topic}`,
        hook: idea.hook.replace("this", topic.toLowerCase()),
      }));
    } else {
      ideas = shuffled.slice(0, count);
    }
    return { ideas, usedAI: false };
  },

  async generateCaptions(
    title: string,
    context?: string,
    platforms: string[] = ["instagram"],
    count: number = 3
  ): Promise<{ captions: CaptionSuggestion[]; usedAI: boolean }> {
    const apiKey = await this.getApiKey();

    if (apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a social media caption expert. Create engaging captions optimized for ${platforms.join(", ")}. Return ONLY valid JSON with a 'captions' array containing objects with caption (string), hashtags (string array), and callToAction (string) fields. No prose.`,
              },
              {
                role: "user",
                content: `Write ${count} engaging captions for: "${title}"${context ? `. Additional context: ${context}` : ""}. Return ONLY JSON: {"captions": [...]}`,
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const parsed = JSON.parse(data.choices[0].message.content);
            const captions = Array.isArray(parsed) ? parsed : parsed.captions || [];
            if (captions.length > 0) {
              return { captions, usedAI: true };
            }
          } catch {
            console.log("Failed to parse OpenAI response, using fallback");
          }
        }
      } catch (error) {
        console.log("OpenAI API error, falling back to templates:", error);
      }
    }

    return { captions: this.generateLocalCaptions(title, platforms, count), usedAI: false };
  },

  generateLocalCaptions(title: string, platforms: string[], count: number): CaptionSuggestion[] {
    const captions: CaptionSuggestion[] = [];
    const platformHashtags = platforms.flatMap(
      (p) => HASHTAG_TEMPLATES[p as keyof typeof HASHTAG_TEMPLATES] || HASHTAG_TEMPLATES.general
    );
    const uniqueHashtags = [...new Set(platformHashtags)];

    const templates = [
      `${title} - something I've been working on and I'm so excited to share with you all!`,
      `When I started ${title.toLowerCase()}, I never imagined where it would take me. Here's my journey so far.`,
      `Let's talk about ${title.toLowerCase()}. This is a topic that means a lot to me and I wanted to share my perspective.`,
      `${title} has completely changed the way I think about content creation. Here's why you should try it too.`,
      `The secret to ${title.toLowerCase()}? It's simpler than you think. Let me break it down for you.`,
    ];

    for (let i = 0; i < count; i++) {
      const shuffledHashtags = [...uniqueHashtags, ...HASHTAG_TEMPLATES.general]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
      
      captions.push({
        caption: templates[i % templates.length],
        hashtags: shuffledHashtags,
        callToAction: CALL_TO_ACTIONS[Math.floor(Math.random() * CALL_TO_ACTIONS.length)],
      });
    }

    return captions;
  },

  async generateHashtags(
    content: string,
    platforms: string[] = ["instagram"],
    count: number = 20
  ): Promise<{ result: HashtagSuggestion; usedAI: boolean }> {
    const apiKey = await this.getApiKey();

    if (apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a hashtag optimization expert for ${platforms.join(", ")}. Return ONLY valid JSON with 'hashtags' array and 'categories' object containing trending, niche, and branded arrays. No prose.`,
              },
              {
                role: "user",
                content: `Generate ${count} optimized hashtags for: "${content}". Return ONLY JSON: {"hashtags": [...], "categories": {"trending": [...], "niche": [...], "branded": [...]}}`,
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 400,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const parsed = JSON.parse(data.choices[0].message.content);
            if (parsed.hashtags && parsed.hashtags.length > 0) {
              return {
                result: {
                  hashtags: parsed.hashtags || [],
                  categories: parsed.categories || { trending: [], niche: [], branded: [] },
                },
                usedAI: true,
              };
            }
          } catch {
            console.log("Failed to parse OpenAI response, using fallback");
          }
        }
      } catch (error) {
        console.log("OpenAI API error, falling back to templates:", error);
      }
    }

    return { result: this.generateLocalHashtags(content, platforms, count), usedAI: false };
  },

  generateLocalHashtags(content: string, platforms: string[], count: number): HashtagSuggestion {
    const platformTags = platforms.flatMap(
      (p) => HASHTAG_TEMPLATES[p as keyof typeof HASHTAG_TEMPLATES] || []
    );
    const generalTags = [...HASHTAG_TEMPLATES.general, ...HASHTAG_TEMPLATES.lifestyle];
    
    const contentWords = content.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const contentHashtags = contentWords.slice(0, 5).map((w) => `#${w.replace(/[^a-z]/g, "")}`);

    const allTags = [...new Set([...contentHashtags, ...platformTags, ...generalTags])]
      .filter((t) => t.length > 2)
      .slice(0, count);

    return {
      hashtags: allTags,
      categories: {
        trending: platformTags.slice(0, 5),
        niche: contentHashtags.slice(0, 5),
        branded: [],
      },
    };
  },

  async improveCaption(caption: string): Promise<{ improved: string; usedAI: boolean }> {
    const apiKey = await this.getApiKey();

    if (apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a social media copywriting expert. Improve captions to be more engaging, concise, and impactful while preserving the original intent. Return ONLY the improved caption text, no explanations or quotes.",
              },
              {
                role: "user",
                content: `Improve this caption: "${caption}"`,
              },
            ],
            max_tokens: 300,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const improved = data.choices[0].message.content.trim().replace(/^["']|["']$/g, "");
          if (improved && improved.length > 0) {
            return { improved, usedAI: true };
          }
        }
      } catch (error) {
        console.log("OpenAI API error:", error);
      }
    }

    return { improved: caption, usedAI: false };
  },
};
