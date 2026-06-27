import { resolveMediaUrl } from '../../utils/mediaUrl';

const formatPermitDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatPermitTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function PermitPrintSlip({ permit, visitor, photoSrc }) {
  if (!permit || !visitor) return null;

  const visitDate = visitor.visitDate || visitor.createdAt;
  const createdAt = visitor.createdAt;
  const logoSrc = permit.permitLogoUrl ? resolveMediaUrl(permit.permitLogoUrl) : '';

  const fields = [
    ['Batch No', visitor.tokenNumber],
    ['Date', formatPermitDate(visitDate)],
    ['Time', formatPermitTime(createdAt)],
    ['Validity', formatPermitDate(visitDate)],
    ['Contractor', visitor.company],
    ['Name', visitor.name],
    ['Mobile', visitor.mobile],
    ...(visitor.purpose ? [['Purpose', visitor.purpose]] : []),
  ];

  return (
    <div className="permit-slip">
      <header className="permit-header">
        {logoSrc ? (
          <img src={logoSrc} alt="" className="permit-logo" />
        ) : (
          <div className="permit-logo-placeholder" />
        )}
        <div className="permit-header-text">
          <p className="permit-company">{permit.permitCompanyName}</p>
          <p className="permit-location">{permit.permitLocation}</p>
        </div>
      </header>

      <div className="permit-title-bar">{permit.permitTitle}</div>

      <div className="permit-body">
        <div className="permit-fields">
          {fields.map(([label, value]) => (
            <p key={label} className="permit-field">
              <span className="permit-label">{label}:</span> {value}
            </p>
          ))}
        </div>
        {photoSrc && (
          <img src={photoSrc} alt={visitor.name} className="permit-photo" />
        )}
      </div>

      <div className="permit-signatures">
        <div className="permit-signature">
          <div className="permit-signature-line" />
          <span>Security Signature</span>
        </div>
        <div className="permit-signature">
          <div className="permit-signature-line" />
          <span>Worker Signature</span>
        </div>
        <div className="permit-signature">
          <div className="permit-signature-line" />
          <span>Officer Signature</span>
        </div>
      </div>

      <footer className="permit-footer">
        <ol className="permit-footer-lines">
          {(permit.permitFooterLines || []).map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ol>
      </footer>
    </div>
  );
}
