export const MAX_QUESTIONS = 20;
export const MAX_OPTIONS = 6;
export const MIN_OPTIONS = 2;

export const DEFAULT_ASSESSMENT = {
  assessmentEnabled: false,
  assessmentTitle: 'Safety Assessment',
  assessmentInstructions: 'Answer all questions correctly to continue.',
  assessmentPassingScore: 1,
  assessmentQuestions: [],
};

export const validateAssessmentConfig = (config) => {
  const errors = [];

  if (!config.assessmentEnabled) {
    return { valid: true, errors };
  }

  const questions = config.assessmentQuestions || [];

  if (questions.length === 0) {
    errors.push('At least one question is required when assessment is enabled');
  }
  if (questions.length > MAX_QUESTIONS) {
    errors.push(`Maximum ${MAX_QUESTIONS} questions allowed`);
  }

  questions.forEach((q, i) => {
    if (!q.text?.trim()) {
      errors.push(`Question ${i + 1} text is required`);
    }

    const options = q.options || [];
    if (options.length < MIN_OPTIONS) {
      errors.push(`Question ${i + 1} needs at least ${MIN_OPTIONS} options`);
    }
    if (options.length > MAX_OPTIONS) {
      errors.push(`Question ${i + 1} has too many options (max ${MAX_OPTIONS})`);
    }

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      errors.push(`Question ${i + 1} must have exactly one correct answer`);
    }

    options.forEach((o, j) => {
      if (!o.text?.trim()) {
        errors.push(`Question ${i + 1}, option ${j + 1} text is required`);
      }
    });
  });

  const passingScore = config.assessmentPassingScore ?? 1;
  if (questions.length > 0 && (passingScore < 1 || passingScore > questions.length)) {
    errors.push(`Passing score must be between 1 and ${questions.length}`);
  }

  return { valid: errors.length === 0, errors };
};

export const formatAssessmentForAdmin = (settings) => ({
  assessmentEnabled: settings.assessmentEnabled ?? false,
  assessmentTitle: settings.assessmentTitle ?? DEFAULT_ASSESSMENT.assessmentTitle,
  assessmentInstructions:
    settings.assessmentInstructions ?? DEFAULT_ASSESSMENT.assessmentInstructions,
  assessmentPassingScore: settings.assessmentPassingScore ?? 1,
  assessmentQuestions: settings.assessmentQuestions ?? [],
});

export const normalizeAssessmentQuestions = (settings) =>
  (settings.assessmentQuestions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text })),
  }));

export const isAssessmentActive = (settings) => {
  const questions = settings.assessmentQuestions ?? [];
  return Boolean(settings.assessmentEnabled) && questions.length > 0;
};

export const repairAssessmentSettings = async (settings) => {
  const questionCount = settings.assessmentQuestions?.length ?? 0;
  if (questionCount > 0 && !settings.assessmentEnabled) {
    settings.assessmentEnabled = true;
    await settings.save();
    console.log('Assessment auto-enabled because questions are configured');
  }
  return settings;
};

export const formatAssessmentForKiosk = (settings) => {
  const questions = normalizeAssessmentQuestions(settings);
  return {
    enabled: isAssessmentActive(settings),
    title: settings.assessmentTitle ?? DEFAULT_ASSESSMENT.assessmentTitle,
    instructions:
      settings.assessmentInstructions ?? DEFAULT_ASSESSMENT.assessmentInstructions,
    passingScore: settings.assessmentPassingScore ?? 1,
    questions,
  };
};

export const scoreAssessment = (settings, submittedAnswers) => {
  const questions = settings.assessmentQuestions ?? [];
  const answerMap = new Map(
    (submittedAnswers ?? []).map((a) => [
      a.questionId,
      a.optionId ?? a.selectedOptionId ?? null,
    ])
  );

  const answers = questions.map((q) => {
    const selectedOptionId = answerMap.get(q.id) ?? null;
    const correctOption = (q.options ?? []).find((o) => o.isCorrect);
    const correct = Boolean(correctOption && correctOption.id === selectedOptionId);
    return { questionId: q.id, selectedOptionId, correct };
  });

  const score = answers.filter((a) => a.correct).length;
  const total = questions.length;
  const passed = score >= (settings.assessmentPassingScore ?? 1);

  return { passed, score, total, answers };
};

export const allQuestionsAnswered = (settings, submittedAnswers) => {
  const questionIds = (settings.assessmentQuestions ?? []).map((q) => q.id);
  const answeredIds = new Set((submittedAnswers ?? []).map((a) => a.questionId));
  return questionIds.every((id) => answeredIds.has(id));
};
