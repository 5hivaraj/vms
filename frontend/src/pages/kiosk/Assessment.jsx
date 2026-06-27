import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssessment, submitAssessment } from '../../api/visitors';
import { useKiosk } from '../../context/KioskContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';

export default function Assessment() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { showToast } = useToast();
  const {
    inductionCompleted,
    setInductionCompleted,
    setAssessmentSkipped,
    setAssessmentResult,
  } = useKiosk();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(null);
  const [selections, setSelections] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!inductionCompleted) {
      navigate('/induction', { replace: true });
    }
  }, [inductionCompleted, navigate]);

  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    getAssessment()
      .then((res) => {
        const data = res.data;
        if (!data.enabled) {
          setAssessmentSkipped(true);
          navigate('/selfie', { replace: true });
          return;
        }
        setConfig(data);
      })
      .catch(() => showToast('Failed to load assessment', 'error'))
      .finally(() => setLoading(false));
  }, [navigate, setAssessmentSkipped, showToast]);

  const handleSelect = (questionId, optionId) => {
    setSelections((prev) => ({ ...prev, [questionId]: optionId }));
    setResult(null);
  };

  const allAnswered =
    config?.questions?.length > 0 &&
    config.questions.every((q) => selections[q.id]);

  const handleSubmit = async () => {
    if (!allAnswered) {
      showToast('Please answer all questions', 'error');
      return;
    }

    const answers = config.questions.map((q) => ({
      questionId: q.id,
      optionId: selections[q.id],
    }));

    setSubmitting(true);
    try {
      const { data } = await submitAssessment(answers);
      setResult(data);

      if (data.passed) {
        setAssessmentResult({
          passed: true,
          score: data.score,
          total: data.total,
          answers,
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate('/selfie');
  };

  const handleRetry = () => {
    setSelections({});
    setResult(null);
  };

  const handleReviewVideo = () => {
    setSelections({});
    setResult(null);
    setInductionCompleted(false);
    setAssessmentResult({ passed: false, score: 0, total: 0, answers: [] });
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate('/induction');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Assessment unavailable</h2>
        <p className="text-white/80 mb-8 max-w-md">
          Could not load the assessment. Ask an admin to enable it and add questions in the
          dashboard.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-8 py-4 text-lg font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
        >
          Back to start
        </button>
      </div>
    );
  }

  if (config.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">No assessment questions</h2>
        <p className="text-white/80 mb-8 max-w-md">
          Assessment is enabled but no questions are configured yet.
        </p>
        <button
          type="button"
          onClick={() => {
            setAssessmentSkipped(true);
            navigate('/selfie');
          }}
          className="px-8 py-4 text-lg font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-gray-950 overflow-hidden"
      style={{ width: '100vw', height: '100dvh', minHeight: '100vh' }}
    >
      <div className="shrink-0 bg-gradient-to-b from-black/90 to-transparent px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center">
          {config.title}
        </h2>
        <p className="text-sm sm:text-base text-white/80 text-center mt-2">{config.instructions}</p>
        <p className="text-xs sm:text-sm text-amber-300 text-center mt-2">
          Pass with {config.passingScore} of {config.questions.length} correct
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {config.questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
            >
              <p className="text-lg sm:text-2xl font-semibold text-white mb-4">
                {index + 1}. {question.text}
              </p>
              <div className="space-y-3">
                {question.options.map((option) => {
                  const selected = selections[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(question.id, option.id)}
                      disabled={result?.passed}
                      className={`w-full text-left px-5 py-4 rounded-xl text-base sm:text-xl font-medium transition-all border-2
                        ${
                          selected
                            ? 'border-blue-500 bg-blue-600/30 text-white'
                            : 'border-white/20 bg-white/5 text-white hover:border-blue-400/60'
                        }
                        disabled:opacity-70`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          {result && !result.passed && (
            <p className="text-center text-red-300 font-medium mb-4">
              You scored {result.score} of {result.total}. Review the video and try again.
            </p>
          )}

          {result?.passed && (
            <p className="text-center text-green-300 font-medium mb-4">
              Passed — {result.score} of {result.total} correct
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {result?.passed ? (
              <button type="button" onClick={handleContinue} className="btn-kiosk-primary">
                Continue to Photo
              </button>
            ) : result && !result.passed ? (
              <>
                <button type="button" onClick={handleReviewVideo} className="btn-kiosk-secondary">
                  Review Video
                </button>
                <button type="button" onClick={handleRetry} className="btn-kiosk-primary">
                  Try Again
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="btn-kiosk-primary disabled:opacity-50 w-full sm:w-auto sm:min-w-[280px]"
              >
                {submitting ? 'Submitting...' : 'Submit Answers'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
