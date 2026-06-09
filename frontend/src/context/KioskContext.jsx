import { createContext, useContext, useState } from 'react';

const KioskContext = createContext();

const initialState = {
  inductionCompleted: false,
  photoBlob: null,
  photoPreview: null,
  visitor: null,
  registeredVisitor: null,
};

export const KioskProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  const setInductionCompleted = (value) =>
    setState((prev) => ({ ...prev, inductionCompleted: value }));

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
