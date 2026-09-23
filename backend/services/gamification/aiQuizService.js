const { GoogleGenerativeAI } = require("@google/generative-ai");
const Quiz = require("../../models/gamification/Quiz");
const Story = require("../../models/storyLibrary/Story");
const GamificationService = require("./gamificationService");

class AIQuizService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_BOOKS_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log(`[AIQuizService] Initialized with API Key: ${apiKey.substring(0, 6)}...`);
      // Using gemini-2.0-flash-exp (or gemini-1.5-flash as fallback) 
      // as gemini-3 is not a publicly listed identifier yet in the standard SDK
      this.model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    } else {
      console.error("[AIQuizService] No API Key found in GEMINI_API_KEY or GOOGLE_BOOKS_API_KEY");
    }
  }

  async generateQuizForStory(storyId, userId, childId = null) {
    try {
      if (!this.model) throw new Error("Gemini API not configured");

      const story = await Story.findById(storyId);
      if (!story) throw new Error("Story not found");

      const prompt = `
        Generate a child-friendly multiple choice quiz based on the following book details:
        Title: ${story.title}
        Author: ${story.author}
        Description: ${story.description}
        
        Requirements:
        1. 3 questions only.
        2. Simple language for children.
        3. Each question must have 4 options.
        4. Provide the correct answer.
        5. Output ONLY a valid JSON array of objects with the structure:
           [{"question": "string", "options": ["string", "string", "string", "string"], "correctAnswer": "string"}]
        
        The quiz should be about the characters or basic plot points from the description.
      `;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Basic JSON cleanup if Gemini adds markdown markers
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const questions = JSON.parse(cleanJson);

      const quiz = await Quiz.create({
        story: storyId,
        user: userId,
        child: childId,
        questions: questions.slice(0, 3), 
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      });

      return quiz;
    } catch (error) {
      console.error("Quiz Generation Error:", error);
      throw error;
    }
  }

  async completeQuiz(quizId, answers, userId, childId = null) {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new Error("Quiz not found");
      if (quiz.completed) return { alreadyCompleted: true, quiz };

      let correctCount = 0;
      quiz.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });

      // Simple rule: if they got some right, give points
      const xpPerCorrect = 20;
      const totalXP = correctCount * xpPerCorrect;

      if (totalXP > 0) {
        await GamificationService.awardPointsToUser(
          userId,
          totalXP,
          'quiz_completed',
          `Completed quiz for story: ${quizId}`,
          childId,
          { model: 'Quiz', id: quiz._id }
        );
      }

      quiz.completed = true;
      quiz.xpAwarded = totalXP;
      await quiz.save();

      return {
        success: true,
        correctCount,
        totalQuestions: quiz.questions.length,
        xpAwarded: totalXP,
        quiz
      };
    } catch (error) {
      console.error("Quiz Completion Error:", error);
      throw error;
    }
  }

  async getStoredQuiz(storyId, userId, childId = null) {
    return await Quiz.findOne({
      story: storyId,
      user: userId,
      child: childId,
      completed: false
    }).sort({ createdAt: -1 });
  }
}

module.exports = new AIQuizService();
