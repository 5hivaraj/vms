import { createContext, useContext, useState } from 'react';

const KioskContext = createContext();

const initialState = {
  inductionCompleted: false,
  assessmentSkipped: false,
  assessmentPassed: false,
  assessmentScore: 0,
  assessmentTotal: 0,
  assessmentAnswers: [],
  photoBlob: null,
  photoPreview: null,
  visitor: null,
  registeredVisitor: null,
};

export const KioskProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  const setInductionCompleted = (value) =>
    setState((prev) => ({ ...prev, inductionCompleted: value }));

  const setAssessmentSkipped = (value) =>
    setState((prev) => ({ ...prev, assessmentSkipped: value }));

  const setAssessmentResult = ({ passed, score, total, answers }) =>
    setState((prev) => ({
      ...prev,
      assessmentPassed: passed,
      assessmentScore: score,
      assessmentTotal: total,
      assessmentAnswers: answers || [],
    }));

  const setPhoto = (blob, preview) =>
    setState((prev) => ({ ...prev, photoBlob: blob, photoPreview: preview }));

  const setVisitorDetails = (visitor) =>
    setState((prev) => ({ ...prev, visitor }));

  const setRegisteredVisitor = (data) =>
    setState((prev) => ({ ...prev, registeredVisitor: data }));

  const resetKiosk = () => setState(initialState);

  return (
    <KioskContext.Provider
      value={{
        ...state,
        setInductionCompleted,
        setAssessmentSkipped,
        setAssessmentResult,
        setPhoto,
        setVisitorDetails,
        setRegisteredVisitor,
        resetKiosk,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => useContext(KioskContext);
