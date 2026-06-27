import { useCallback, useEffect, useState } from 'react';
import { getAssessmentSettings, updateAssessmentSettings } from '../../api/settings';
import { useToast } from '../../hooks/useToast';

const MAX_QUESTIONS = 20;
const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

const newId = () => crypto.randomUUID();

const emptyQuestion = () => ({
  id: newId(),
  text: '',
  options: [
    { id: newId(), text: '', isCorrect: true },
    { id: newId(), text: '', isCorrect: false },
  ],
});

export default function AssessmentSettingsPanel() {
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('Safety Assessment');
  const [instructions, setInstructions] = useState('Answer all questions correctly to continue.');
  const [passingScore, setPassingScore] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await getAssessmentSettings();
      setEnabled(data.assessmentEnabled);
      setTitle(data.assessmentTitle || 'Safety Assessment');
      setInstructions(data.assessmentInstructions || '');
      setPassingScore(data.assessmentPassingScore || 1);
      setQuestions(data.assessmentQuestions?.length ? data.assessmentQuestions : []);
    } catch {
      showToast('Failed to load assessment settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      showToast(`Maximum ${MAX_QUESTIONS} questions allowed`, 'error');
      return;
    }
    if (questions.length === 0) {
      setEnabled(true);
    }
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (questionId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const moveQuestion = (index, direction) => {
    const next = index + direction;
    if (next < 0 || next >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const updateQuestionText = (questionId, text) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, text } : q)));
  };

  const addOption = (questionId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || q.options.length >= MAX_OPTIONS) return q;
        return {
          ...q,
          options: [...q.options, { id: newId(), text: '', isCorrect: false }],
        };
      })
    );
  };

  const removeOption = (questionId, optionId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || q.options.length <= MIN_OPTIONS) return q;
        const options = q.options.filter((o) => o.id !== optionId);
        const hasCorrect = options.some((o) => o.isCorrect);
        if (!hasCorrect && options.length > 0) {
          options[0] = { ...options[0], isCorrect: true };
        }
        return { ...q, options };
      })
    );
  };

  const updateOptionText = (questionId, optionId, text) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
            }
          : q
      )
    );
  };

  const setCorrectOption = (questionId, optionId) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => ({ ...o, isCorrect: o.id === optionId })),
            }
          : q
      )
    );
  };

  const handleSave = async () => {
    if (enabled && questions.length === 0) {
      showToast('Add at least one question or disable the assessment', 'error');
      return;
    }

    if (questions.length > 0 && !enabled) {
      showToast('Enable assessment on kiosk — visitors will not see your questions otherwise', 'error');
      return;
    }

    const effectivePassing = Math.min(
      Math.max(1, passingScore),
      Math.max(questions.length, 1)
    );

    setSaving(true);
    try {
      const { data } = await updateAssessmentSettings({
        assessmentEnabled: enabled,
        assessmentTitle: title.trim() || 'Safety Assessment',
        assessmentInstructions:
          instructions.trim() || 'Answer all questions correctly to continue.',
        assessmentPassingScore: effectivePassing,
        assessmentQuestions: questions,
      });
      setEnabled(data.assessmentEnabled);
      setTitle(data.assessmentTitle);
      setInstructions(data.assessmentInstructions);
      setPassingScore(data.assessmentPassingScore);
      setQuestions(data.assessmentQuestions);
      showToast('Assessment settings saved', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save assessment';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <p className="text-gray-500">Loading assessment settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-1">Assessment Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Configure a quiz shown after the induction video. Visitors must pass before taking their
        photo.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">Enable assessment on kiosk</span>
        </label>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            enabled && questions.length > 0
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
          }`}
        >
          {enabled && questions.length > 0
            ? `Active — ${questions.length} question(s) on kiosk`
            : 'Inactive — visitors skip assessment'}
        </span>
      </div>

      {questions.length > 0 && !enabled && (
        <p className="mb-6 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          You have questions saved but assessment is disabled. Check &quot;Enable assessment on
          kiosk&quot; and save, or visitors will not see them after the induction video.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Assessment title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Safety Assessment"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Passing score (correct answers required)
          </label>
          <input
            type="number"
            min={1}
            max={Math.max(questions.length, 1)}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value) || 1)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {questions.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Out of {questions.length} questions</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Instructions for visitors</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Answer all questions to continue."
        />
      </div>

      <div className="space-y-6 mb-6">
        {questions.map((question, qIndex) => (
          <div
            key={question.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                Question {qIndex + 1}
              </p>
              <div className="flex gap-1 shrink-0">
                <IconButton
                  onClick={() => moveQuestion(qIndex, -1)}
                  disabled={qIndex === 0}
                  label="Move up"
                >
                  ↑
                </IconButton>
                <IconButton
                  onClick={() => moveQuestion(qIndex, 1)}
                  disabled={qIndex === questions.length - 1}
                  label="Move down"
                >
                  ↓
                </IconButton>
                <IconButton onClick={() => removeQuestion(question.id)} label="Remove question">
                  ×
                </IconButton>
              </div>
            </div>

            <input
              type="text"
              value={question.text}
              onChange={(e) => updateQuestionText(question.id, e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter question text"
            />

            <div className="space-y-2">
              {question.options.map((option, oIndex) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={option.isCorrect}
                    onChange={() => setCorrectOption(question.id, option.id)}
                    className="w-4 h-4 text-blue-600"
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder={`Option ${oIndex + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(question.id, option.id)}
                    disabled={question.options.length <= MIN_OPTIONS}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-30"
                    title="Remove option"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addOption(question.id)}
              disabled={question.options.length >= MAX_OPTIONS}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-40"
            >
              + Add option
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Select the radio button next to the correct answer
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addQuestion}
          disabled={questions.length >= MAX_QUESTIONS}
          className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
        >
          + Add question
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>
    </div>
  );
}

function IconButton({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
