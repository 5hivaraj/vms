import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../../context/KioskContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { resetKiosk } = useKiosk();

  const handleStart = () => {
    resetKiosk();
    navigate('/induction');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="mb-12">
        <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <span className="text-6xl">👋</span>
        </div>
        <h1 className="text-kiosk-xl font-extrabold text-gray-900 dark:text-white mb-4">
          Welcome Visitor
        </h1>
        <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Please complete the safety induction and check in to receive your visitor token.
        </p>
      </div>

      <button type="button" onClick={handleStart} className="btn-kiosk-primary min-w-[280px]">
        Start
      </button>

      <p className="mt-12 text-lg text-gray-400 dark:text-gray-500">
        Takes less than 1 minute
      </p>
    </div>
  );
}
