const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3117;
const DATA_FILE = path.join(__dirname, 'questions.json');

app.use(cors());
app.use(express.json());

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDayStartTimestamp(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().length;
}

function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getMonthProgress(data, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const todayStr = getDateString();
  let answeredDays = 0;
  let totalDaysSoFar = 0;
  let metMinWordsDays = 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${prefix}${String(day).padStart(2, '0')}`;
    const entry = data.answers[dateStr];
    if (dateStr <= todayStr) {
      totalDaysSoFar++;
    }
    if (entry && entry.answered) {
      answeredDays++;
      if (countWords(entry.answer) >= (data.goals?.minWords || 0)) {
        metMinWordsDays++;
      }
    }
  }

  return {
    targetDays: data.goals?.targetDays || 0,
    minWords: data.goals?.minWords || 0,
    answeredDays,
    metMinWordsDays,
    totalDaysSoFar,
    daysInMonth,
    progressPercent: data.goals?.targetDays ? Math.min(100, Math.round(metMinWordsDays / data.goals.targetDays * 100)) : 0
  };
}

function ensureGoals(data) {
  if (!data.goals) {
    data.goals = {
      targetDays: 20,
      minWords: 100
    };
    writeData(data);
  }
  return data.goals;
}

function isNewDay(data) {
  const todayStr = getDateString();
  const todayStart = getDayStartTimestamp();
  if (!data.currentQuestion || !data.currentQuestion.date) {
    return true;
  }
  return todayStart > data.currentQuestion.timestamp;
}

function selectQuestionForToday(data) {
  const todayStr = getDateString();
  const todayStart = getDayStartTimestamp();
  const bank = data.questionBank;

  let usedIds = [];
  if (data.answers) {
    usedIds = Object.values(data.answers)
      .filter(a => a && a.questionId)
      .map(a => a.questionId);
  }

  let available = bank.filter(q => !usedIds.includes(q.id));
  if (available.length === 0) {
    available = bank;
  }

  const seed = todayStart;
  const index = Math.abs(seed) % available.length;
  const selected = available[index];

  data.currentQuestion = {
    questionId: selected.id,
    question: selected.question,
    date: todayStr,
    timestamp: todayStart
  };

  if (!data.answers[todayStr]) {
    data.answers[todayStr] = {
      questionId: selected.id,
      question: selected.question,
      answer: '',
      answered: false,
      answeredAt: null
    };
  }

  writeData(data);
  return data.currentQuestion;
}

function ensureTodayQuestion(data) {
  if (isNewDay(data)) {
    return selectQuestionForToday(data);
  }
  const todayStr = getDateString();
  if (!data.answers[todayStr]) {
    data.answers[todayStr] = {
      questionId: data.currentQuestion.questionId,
      question: data.currentQuestion.question,
      answer: '',
      answered: false,
      answeredAt: null
    };
    writeData(data);
  }
  return data.currentQuestion;
}

app.get('/api/today', (req, res) => {
  try {
    const data = readData();
    const question = ensureTodayQuestion(data);
    const goals = ensureGoals(data);
    const todayStr = getDateString();
    const todayAnswer = data.answers[todayStr] || { answer: '', answered: false };
    const wordCount = countWords(todayAnswer.answer);
    const meetsMinWords = wordCount >= goals.minWords;

    const now = new Date();
    const monthProgress = getMonthProgress(data, now.getFullYear(), now.getMonth() + 1);

    res.json({
      success: true,
      data: {
        question: question,
        answer: todayAnswer.answer,
        answered: todayAnswer.answered,
        date: todayStr,
        wordCount,
        meetsMinWords,
        goals,
        monthProgress
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/answer', (req, res) => {
  try {
    const { answer } = req.body;
    if (typeof answer !== 'string') {
      return res.status(400).json({ success: false, message: '回答内容无效' });
    }
    const data = readData();
    ensureTodayQuestion(data);
    const todayStr = getDateString();

    data.answers[todayStr] = {
      questionId: data.currentQuestion.questionId,
      question: data.currentQuestion.question,
      answer: answer,
      answered: answer.trim().length > 0,
      answeredAt: answer.trim().length > 0 ? new Date().toISOString() : null
    };

    writeData(data);
    res.json({
      success: true,
      data: {
        date: todayStr,
        answered: data.answers[todayStr].answered,
        answeredAt: data.answers[todayStr].answeredAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/history', (req, res) => {
  try {
    const data = readData();
    const goals = ensureGoals(data);
    const { year, month } = req.query;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const m = month ? parseInt(month) : new Date().getMonth() + 1;

    const daysInMonth = new Date(y, m, 0).getDate();
    const calendar = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = data.answers[dateStr];
      const wordCount = entry ? countWords(entry.answer) : 0;
      calendar.push({
        date: dateStr,
        day: day,
        hasQuestion: !!entry,
        answered: !!(entry && entry.answered),
        answer: entry ? entry.answer : '',
        question: entry ? entry.question : '',
        wordCount
      });
    }

    let answeredCount = 0;
    let missedCount = 0;
    const allDates = Object.keys(data.answers).sort();
    if (allDates.length > 0) {
      const firstDate = new Date(allDates[0]);
      const today = new Date();
      const todayStr = getDateString(today);
      let cursor = new Date(firstDate);
      while (cursor <= today) {
        const curStr = getDateString(cursor);
        const entry = data.answers[curStr];
        if (curStr !== todayStr) {
          if (entry && entry.answered) {
            answeredCount++;
          } else {
            missedCount++;
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const monthProgress = getMonthProgress(data, y, m);

    res.json({
      success: true,
      data: {
        calendar,
        year: y,
        month: m,
        stats: {
          answeredCount,
          missedCount,
          totalDays: answeredCount + missedCount
        },
        goals,
        monthProgress,
        allAnswers: data.answers
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/question-bank', (req, res) => {
  try {
    const data = readData();
    res.json({
      success: true,
      data: data.questionBank
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/goals', (req, res) => {
  try {
    const data = readData();
    const goals = ensureGoals(data);
    res.json({
      success: true,
      data: goals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/goals', (req, res) => {
  try {
    const { targetDays, minWords } = req.body;
    if (typeof targetDays !== 'number' || targetDays < 0 || targetDays > 31) {
      return res.status(400).json({ success: false, message: '目标天数必须是 0-31 之间的数字' });
    }
    if (typeof minWords !== 'number' || minWords < 0) {
      return res.status(400).json({ success: false, message: '最低字数必须是非负数字' });
    }

    const data = readData();
    data.goals = {
      targetDays,
      minWords
    };
    writeData(data);

    res.json({
      success: true,
      data: data.goals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`每日问答后端服务已启动: http://localhost:${PORT}`);
  const data = readData();
  ensureTodayQuestion(data);
  console.log(`今日问题已准备就绪: ${data.currentQuestion.question}`);
});
