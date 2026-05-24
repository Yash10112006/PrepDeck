const StudySession = require('../models/StudySession');
const Document = require('../models/Document');
const QuizAttempt = require('../models/QuizAttempt');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const saveSessionStats = async (req, res) => {
  try {
    const { documentId, startTime, endTime, durationMs, focusedMs, distractedMs } = req.body;

    const session = await StudySession.create({
      user: req.user._id,
      document: documentId,
      startTime,
      endTime,
      durationMs,
      focusedMs,
      distractedMs
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserStats = async (req, res) => {
  try {
    const sessions = await StudySession.find({ user: req.user._id });

    let totalStudyTime = 0;
    let totalFocusedTime = 0;

    sessions.forEach(s => {
      totalStudyTime += s.durationMs || 0;
      totalFocusedTime += s.focusedMs || 0;
    });

    res.json({
      totalSessions: sessions.length,
      totalStudyTime,
      totalFocusedTime,
      focusPercentage: totalStudyTime > 0 ? (totalFocusedTime / totalStudyTime) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateInterviewQuestions = async (req, res) => {
  try {
    const { documentId } = req.body;

    // Check for API key - IF NOT exists, return MOCK DATA!
    if (!process.env.GEMINI_API_KEY) {
      console.log("No API Key detected! Sending Mock Questions instead.");
      return setTimeout(() => res.json({
        isMock: true,
        questions: [
          "What are the main principles outlined in this document?",
          "Can you provide a real-world application of this concept?",
          "How would you explain the fundamental mechanics to a beginner?",
          "What is the most significant challenge discussed here?",
          "Summarize the conclusion in two sentences."
        ]
      }), 1500);
    }

    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Ensure we are reading correct file path. It is stored as /uploads/filename
    const absolutePath = path.join(__dirname, '..', doc.filepath);

    let pdfText = '';
    try {
      const dataBuffer = fs.readFileSync(absolutePath);
      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      pdfText = pdfData.text.substring(0, 15000); // limit to 15k chars to fit context if needed
      await parser.destroy();
    } catch (err) {
      console.warn("Could not parse PDF, using empty string. ", err);
      pdfText = 'No readable text extracted. Please assess general concepts of ' + doc.subject;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Based exclusively on this study material text, generate exactly 10 questions to test the student: 5 conceptual questions (understanding-based), 3 short-answer questions (direct recall), 2 application-based questions (real-world). Return ONLY a raw JSON array of strings containing the questions. Do not use markdown blocks. Material: \n\n${pdfText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textOut = response.text().trim();

    if (textOut.startsWith('\`\`\`json')) textOut = textOut.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    else if (textOut.startsWith('\`\`\`')) textOut = textOut.replace(/\`\`\`/g, '');

    const questions = JSON.parse(textOut);
    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const evaluateInterviewSession = async (req, res) => {
  try {
    const { documentId, studentAnswersArray, totalTime, focusedTime, distractedTime, faceDetectionLog, distractionEvents, tabSwitchCount } = req.body;

    // Check for API key - IF NOT exists, return MOCK DATA!
    if (!process.env.GEMINI_API_KEY) {
      console.log("No API Key detected! Sending Mock Evaluation Report instead.");
      return setTimeout(() => res.json({
        "evaluation": [
          {
            "question": "MOCK: What are the main principles outlined?",
            "student_answer": (studentAnswersArray && studentAnswersArray[0]) ? studentAnswersArray[0].answer : "...",
            "expected_answer": "The main principles focus on core data storage architecture and low latency retrieval.",
            "score": 8,
            "correctness": "Partially Correct",
            "feedback": "You grasped the core concept, but missed some secondary points. Good effort overall."
          }
        ],
        "report": {
          "average_score": 8.0,
          "focus_percentage": totalTime > 0 ? Math.round((focusedTime / totalTime) * 100) : 100,
          "discipline_level": "Highly Focused",
          "summary": "Great study session! You demonstrated solid focus and decent grasp of the basic subject matter. (This is a mock report since no API key was provided)",
          "strengths": ["Understanding core principles", "Focus and attention"],
          "weaknesses": ["Missed deeper applications", "Short answers"],
          "behavior_analysis": "You maintained excellent focus with very few distracted moments.",
          "suggestions": ["Elaborate more on your answers next time.", "Try to connect concepts to real world examples."]
        }
      }), 2000);
    }

    const doc = await Document.findById(documentId);
    const absolutePath = path.join(__dirname, '..', doc.filepath);

    let pdfText = '';
    try {
      const dataBuffer = fs.readFileSync(absolutePath);
      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      pdfText = pdfData.text.substring(0, 15000); // limit text limit
      await parser.destroy();
    } catch (err) {
      pdfText = '';
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an advanced AI Study Evaluator inside a smart learning platform called "PrepDeck".
Your role is to simulate an intelligent viva/interview system that evaluates a student after a study session using their study material, answers, and behavior data.

---
## INPUT DATA:
1. Study Material (Extracted PDF Text):
${pdfText}

2. Student Answers (in order of questions):
${JSON.stringify(studentAnswersArray)}

3. Focus & Behavior Data:
* Total Study Time: ${totalTime} ms
* Focused Time: ${focusedTime} ms
* Distracted Time: ${distractedTime} ms
* Face Detected Consistency: ${faceDetectionLog}
* Looking Away Events: ${distractionEvents}
* Tab Switch Count: ${tabSwitchCount}

---
## TASKS TO PERFORM:
STEP 1: ANALYZE STUDY MATERIAL
STEP 2: [SKIP GENERATION AS QUESTIONS WERE ALREADY ANSWERED]
STEP 3: EVALUATE STUDENT ANSWERS
For each question, compare student answer with expected answer, give Score (0-10), Correctness level (Correct / Partially Correct / Incorrect), and Short feedback (What is correct, What is missing, How to improve).
STEP 4: ANALYZE BEHAVIOR & FOCUS
Calculate focus % = (Focused Time / Total Time) * 100. Analyze distraction frequency and behavior data. Classify discipline level: Highly Focused / Moderately Focused / Distracted.
STEP 5: GENERATE FINAL PERFORMANCE REPORT
Include Overall summary, Average Score, Focus Percentage, Strengths, Weaknesses, Behavior Analysis, Personalized Suggestions.

## OUTPUT FORMAT (STRICT JSON):
{
  "evaluation": [
    {
      "question": "...",
      "student_answer": "...",
      "expected_answer": "...", // The ideal or expected correct answer based on the study material
      "score": 7,
      "correctness": "Partially Correct",
      "feedback": "..."
    }
  ],
  "report": {
    "average_score": 7.5,
    "focus_percentage": 82,
    "discipline_level": "Moderately Focused",
    "summary": "...",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "behavior_analysis": "...",
    "suggestions": ["..."]
  }
}

IMPORTANT RULES:
* Do NOT hallucinate beyond the given study material
* Keep feedback concise but meaningful
* Maintain academic tone
* Ensure JSON is clean and valid (no extra text outside JSON, no markdown backticks like \`\`\`json)
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawOutput = response.text().trim();

    if (rawOutput.startsWith('\`\`\`json')) rawOutput = rawOutput.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    else if (rawOutput.startsWith('\`\`\`')) rawOutput = rawOutput.replace(/\`\`\`/g, '');

    const finalJson = JSON.parse(rawOutput);

    res.json(finalJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const generateQuiz = async (req, res) => {
  try {
    const { documentId, difficultyLevel } = req.body;
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (!process.env.GEMINI_API_KEY) {
      console.log("No API Key detected! Sending Mock Quiz instead.");
      return setTimeout(() => res.json({
        isMock: true,
        questions: [
          {
            questionText: "What is the primary function of this concept?",
            questionType: "MCQ",
            options: ["To store data", "To compute data", "To transfer data", "To delete data"],
            correctAnswer: "To store data",
            explanation: "As stated on page 1, the primary function is data storage."
          },
          {
            questionText: "The system is entirely stateless.",
            questionType: "TF",
            options: ["True", "False"],
            correctAnswer: "False",
            explanation: "The document mentions a state machine is used."
          },
          {
            questionText: "Explain the main benefit of this approach.",
            questionType: "ShortAnswer",
            options: [],
            correctAnswer: "It reduces latency.",
            explanation: "Latency reduction is the core benefit described."
          }
        ]
      }), 1500);
    }

    const absolutePath = path.join(__dirname, '..', doc.filepath);
    let pdfText = '';
    try {
      const dataBuffer = fs.readFileSync(absolutePath);
      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      pdfText = pdfData.text.substring(0, 15000);
      await parser.destroy();
    } catch (err) {
      console.warn("Could not parse PDF, using empty string. ", err);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Based exclusively on this study material text, generate a quiz with 3 MCQs, 2 True/False, and 2 Short Answer questions. The difficulty should be ${difficultyLevel || 'medium'}. 
Return ONLY a raw JSON array. For each question, use this exact structure:
{
  "questionText": "...",
  "questionType": "MCQ" | "TF" | "ShortAnswer",
  "options": ["...", "..."], // For MCQ/TF. Empty array for ShortAnswer.
  "correctAnswer": "...",
  "explanation": "..." // Short explanation of why the answer is correct
}
Material: \n\n${pdfText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textOut = response.text().trim();

    if (textOut.startsWith('\`\`\`json')) textOut = textOut.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    else if (textOut.startsWith('\`\`\`')) textOut = textOut.replace(/\`\`\`/g, '');

    const questions = JSON.parse(textOut);
    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const evaluateQuiz = async (req, res) => {
  try {
    const { documentId, difficultyLevel, questionsAndAnswers } = req.body;
    
    let score = 0;
    const evaluatedQuestions = [];

    // Check if mock
    if (!process.env.GEMINI_API_KEY) {
      console.log("No API Key detected! Mock Evaluation");
      // Calculate basic mock score
      for (const q of questionsAndAnswers) {
        let isCorrect = false;
        if (q.questionType === 'ShortAnswer') {
          // Mock simple check
          isCorrect = q.studentAnswer && q.studentAnswer.length > 5;
        } else {
          isCorrect = q.studentAnswer === q.correctAnswer;
        }
        if (isCorrect) score++;
        evaluatedQuestions.push({
          ...q,
          isCorrect
        });
      }
      
      const attempt = await QuizAttempt.create({
        user: req.user._id,
        document: documentId,
        difficultyLevel,
        score,
        totalQuestions: questionsAndAnswers.length,
        questions: evaluatedQuestions,
        performanceSummary: "Good effort on this mock quiz!"
      });
      return res.status(201).json(attempt);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // We will ask Gemini to evaluate the Short Answers and provide a summary.
    const prompt = `Evaluate the following quiz attempt. For MCQs and TF, I have the correct answers. For Short Answer, evaluate if the student's answer captures the meaning of the correct answer (leniently).
Provide a "performanceSummary" of the student's understanding based on the results.

Input Data:
${JSON.stringify(questionsAndAnswers, null, 2)}

Return ONLY a JSON object with this exact structure:
{
  "evaluatedQuestions": [
    {
      "questionText": "...",
      "questionType": "...",
      "options": [],
      "correctAnswer": "...",
      "studentAnswer": "...",
      "isCorrect": true/false,
      "explanation": "..."
    }
  ],
  "performanceSummary": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawOutput = response.text().trim();

    if (rawOutput.startsWith('\`\`\`json')) rawOutput = rawOutput.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    else if (rawOutput.startsWith('\`\`\`')) rawOutput = rawOutput.replace(/\`\`\`/g, '');

    const evaluation = JSON.parse(rawOutput);
    
    score = evaluation.evaluatedQuestions.filter(q => q.isCorrect).length;

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      document: documentId,
      difficultyLevel,
      score,
      totalQuestions: evaluation.evaluatedQuestions.length,
      questions: evaluation.evaluatedQuestions,
      performanceSummary: evaluation.performanceSummary
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getQuizHistory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const history = await QuizAttempt.find({ user: req.user._id, document: documentId }).sort({ attemptedAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveSessionStats, getUserStats, generateInterviewQuestions, evaluateInterviewSession, generateQuiz, evaluateQuiz, getQuizHistory };
