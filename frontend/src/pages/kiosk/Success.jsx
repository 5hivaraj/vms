import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPermitSettings } from '../../api/visitors';
import { useKiosk } from '../../context/KioskContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { tryPrint } from '../../utils/print';
import PermitPrintSlip from '../../components/kiosk/PermitPrintSlip';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Success() {
  const navigate = useNavigate();
  const { registeredVisitor, photoPreview, resetKiosk } = useKiosk();
  const [printing, setPrinting] = useState(false);
  const [permit, setPermit] = useState(null);
  const [loadingPermit, setLoadingPermit] = useState(true);

  useEffect(() => {
    if (!registeredVisitor) {
      navigate('/');
    }
  }, [registeredVisitor, navigate]);

  useEffect(() => {
    getPermitSettings()
      .then((res) => setPermit(res.data))
      .catch(() => {
        setPermit({
          permitCompanyName: 'Company Name',
          permitLocation: '',
          permitTitle: 'SAFETY PERMIT CONTRACT WORKER',
          permitFooterLines: [],
          permitLogoUrl: '',
        });
      })
      .finally(() => setLoadingPermit(false));
  }, []);

  if (!registeredVisitor) return null;

  const photoSrc =
    photoPreview || resolveMediaUrl(registeredVisitor.photoUrl);

  const handleFinish = () => {
    resetKiosk();
    navigate('/');
  };

  const handlePrintAndFinish = async () => {
    setPrinting(true);
    await tryPrint();
    setPrinting(false);
    handleFinish();
  };

  const slipProps = {
    permit,
    visitor: registeredVisitor,
    photoSrc,
  };

  return (
    <>
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto no-print">
        <p className="text-center text-green-600 dark:text-green-400 font-semibold text-lg sm:text-xl mb-4 sm:mb-6">
          Visitor registered — review your safety permit below
        </p>

        {loadingPermit || !permit ? (
          <div className="py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="permit-slip-preview w-full max-w-md mb-6 sm:mb-8">
            <PermitPrintSlip {...slipProps} />
          </div>
        )}

        <button
          type="button"
          onClick={handlePrintAndFinish}
          disabled={printing || !permit}
          className="btn-kiosk-primary w-full max-w-md disabled:opacity-50"
        >
          {printing ? 'Printing...' : 'Print & Finish'}
        </button>
      </div>

      <div className="print-only hidden">
        <PermitPrintSlip {...slipProps} />
      </div>
    </>
  );
}
