const axios = require('axios');

const ALLOWED_TYPES = [
  'story_count',
  'reading_minutes',
  'streak_activity',
  'category_explorer',
  'assignment_completion'
];

const getFallbackChallenge = (childProfile, progress, dateKey) => {
  const templates = [
    {
      title: 'Story Sprint',
      description: 'Read 2 stories today and keep your momentum going.',
      challengeType: 'story_count',
      targetValue: 2,
      rewardPoints: 30
    },
    {
      title: 'Focus Time',
      description: 'Spend 15 minutes reading today.',
      challengeType: 'reading_minutes',
      targetValue: 15,
      rewardPoints: 35
    },
    {
      title: 'Streak Keeper',
      description: 'Complete at least one reading activity today to protect your streak.',
      challengeType: 'streak_activity',
      targetValue: 1,
      rewardPoints: 25
    }
  ];

  const seed = Number((progress?.stats?.storiesRead || 0) + (childProfile?.age || 0) + dateKey.replace(/-/g, ''));
  const selected = templates[seed % templates.length];

  return {
    ...selected,
    generatedBy: 'fallback',
    metadata: {
      model: 'fallback-v1',
      promptVersion: 'v1'
    }
  };
};

const normalizeChallenge = (candidate, fallback) => {
  const challengeType = ALLOWED_TYPES.includes(candidate?.challengeType)
    ? candidate.challengeType
    : fallback.challengeType;

  const targetValue = Number.isFinite(Number(candidate?.targetValue))
    ? Math.max(1, Number(candidate.targetValue))
    : fallback.targetValue;

  const rewardPoints = Number.isFinite(Number(candidate?.rewardPoints))
    ? Math.max(1, Number(candidate.rewardPoints))
    : fallback.rewardPoints;

  return {
    title: String(candidate?.title || fallback.title).slice(0, 100),
    description: String(candidate?.description || fallback.description).slice(0, 500),
    challengeType,
    targetValue,
    rewardPoints
  };
};

const generateChallengePrompt = (childProfile, progress, dateKey) => {
  const age = childProfile?.age || 'unknown';
  const readingLevel = childProfile?.readingLevel || 'beginner';
  const storiesRead = progress?.stats?.storiesRead || 0;
  const assignmentsCompleted = progress?.stats?.assignmentsCompleted || 0;
  const currentStreak = progress?.currentStreak || 0;

  return [
    'Generate one daily reading challenge for a child in JSON format only.',
    'Output strictly one JSON object and nothing else.',
    'Allowed challengeType values: story_count, reading_minutes, streak_activity, category_explorer, assignment_completion.',
    'JSON schema:',
    '{"title":"string","description":"string","challengeType":"string","targetValue":number,"rewardPoints":number}',
    `Date: ${dateKey}`,
    `Child age: ${age}`,
    `Reading level: ${readingLevel}`,
    `Current storiesRead: ${storiesRead}`,
    `Current assignmentsCompleted: ${assignmentsCompleted}`,
    `Current streak: ${currentStreak}`,
    'Constraints: keep targetValue realistic for one day and rewardPoints between 20 and 60.'
  ].join('\n');
};

const callOpenAIForChallenge = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'You are a learning gamification assistant that always replies with a single valid JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  try {
    return {
      parsed: JSON.parse(content),
      model
    };
  } catch (error) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    return {
      parsed: JSON.parse(jsonMatch[0]),
      model
    };
  }
};

const callGeminiForChallenge = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json'
      }
    },
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 12000
    }
  );

  const content = response.data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text)
    ?.join('\n');

  if (!content) {
    return null;
  }

  try {
    return {
      parsed: JSON.parse(content),
      model
    };
  } catch (error) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    return {
      parsed: JSON.parse(jsonMatch[0]),
      model
    };
  }
};

exports.generateDailyChallenge = async ({ childProfile, progress, dateKey }) => {
  const fallback = getFallbackChallenge(childProfile, progress, dateKey);

  try {
    const prompt = generateChallengePrompt(childProfile, progress, dateKey);
    const geminiResult = await callGeminiForChallenge(prompt);

    if (geminiResult?.parsed) {
      const normalized = normalizeChallenge(geminiResult.parsed, fallback);
      return {
        ...normalized,
        generatedBy: 'gemini',
        metadata: {
          model: geminiResult.model,
          promptVersion: 'v1'
        }
      };
    }

    const openAiResult = await callOpenAIForChallenge(prompt);

    if (!openAiResult?.parsed) {
      return fallback;
    }

    const normalized = normalizeChallenge(openAiResult.parsed, fallback);

    return {
      ...normalized,
      generatedBy: 'openai',
      metadata: {
        model: openAiResult.model,
        promptVersion: 'v1'
      }
    };
  } catch (error) {
    return fallback;
  }
};
