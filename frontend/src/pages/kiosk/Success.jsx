import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../../context/KioskContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function Success() {
  const navigate = useNavigate();
  const { registeredVisitor, photoPreview, resetKiosk } = useKiosk();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!registeredVisitor) {
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetKiosk();
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [registeredVisitor, navigate, resetKiosk]);

  if (!registeredVisitor) return null;

  const photoSrc =
    photoPreview ||
    (registeredVisitor.photoUrl?.startsWith('http')
      ? registeredVisitor.photoUrl
      : `${API_BASE}${registeredVisitor.photoUrl}`);

  const visitDate = new Date(registeredVisitor.visitDate || registeredVisitor.createdAt);
  const createdAt = new Date(registeredVisitor.createdAt);

  const handlePrint = () => window.print();

  const handleFinish = () => {
    resetKiosk();
    navigate('/');
  };

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 no-print">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">✅</span>
          <h2 className="text-kiosk font-bold text-green-600 dark:text-green-400 mb-4">
            Visitor Registered Successfully
          </h2>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center border border-gray-200 dark:border-gray-700">
          <img
            src={photoSrc}
            alt="Visitor"
            className="w-40 h-40 rounded-full object-cover mx-auto mb-6 border-4 border-blue-500"
          />

          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">Token Number</p>
          <p className="text-kiosk-xl font-extrabold text-blue-600 dark:text-blue-400 mb-6 tracking-widest">
            {registeredVisitor.tokenNumber}
          </p>

          <div className="space-y-2 text-xl text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">Name:</span> {registeredVisitor.name}
            </p>
            <p>
              <span className="font-medium">Date:</span> {visitDate.toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">Time:</span> {createdAt.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <button type="button" onClick={handlePrint} className="btn-kiosk-secondary min-w-[200px]">
            Print Token
          </button>
          <button type="button" onClick={handleFinish} className="btn-kiosk-primary min-w-[200px]">
            Finish
          </button>
        </div>

        <p className="mt-8 text-lg text-gray-400">
          Returning to welcome screen in {countdown}s...
        </p>
      </div>

      <div className="print-only hidden p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Visitor Token</h1>
        <img src={photoSrc} alt="Visitor" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
        <p className="text-5xl font-bold mb-4">{registeredVisitor.tokenNumber}</p>
        <p className="text-xl">{registeredVisitor.name}</p>
        <p className="text-lg">{registeredVisitor.company}</p>
        <p className="text-lg mt-2">
          {visitDate.toLocaleDateString()} · {createdAt.toLocaleTimeString()}
        </p>
      </div>
    </>
  );
}
