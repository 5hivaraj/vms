import { DEFAULT_PERMIT_TOKEN } from '../constants/permitToken.js';
import { toPublicMediaUrl } from '../utils/publicUrl.js';

export const formatPermitForAdmin = (settings) => ({
  permitLogoUrl: settings.permitLogoUrl || '',
  permitLogoType: settings.permitLogoType || 'url',
  permitCompanyName: settings.permitCompanyName || DEFAULT_PERMIT_TOKEN.permitCompanyName,
  permitLocation: settings.permitLocation || DEFAULT_PERMIT_TOKEN.permitLocation,
  permitTitle: settings.permitTitle || DEFAULT_PERMIT_TOKEN.permitTitle,
  permitFooterLines: settings.permitFooterLines?.length
    ? settings.permitFooterLines
    : DEFAULT_PERMIT_TOKEN.permitFooterLines,
});

export const formatPermitForKiosk = (req, settings) => {
  const admin = formatPermitForAdmin(settings);
  return {
    ...admin,
    permitLogoUrl: admin.permitLogoUrl
      ? toPublicMediaUrl(req, admin.permitLogoUrl)
      : '',
  };
};

export const validatePermitConfig = (payload) => {
  const errors = [];
  if (!payload.permitCompanyName?.trim()) {
    errors.push('Company name is required');
  }
  if (!payload.permitTitle?.trim()) {
    errors.push('Permit title is required');
  }
  const lines = (payload.permitFooterLines || []).map((l) => String(l).trim()).filter(Boolean);
  if (lines.length === 0) {
    errors.push('Add at least one footer line');
  }
  return { valid: errors.length === 0, errors, permitFooterLines: lines };
};
