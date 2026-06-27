export const DEFAULT_PERMIT_TOKEN = {
  permitLogoUrl: '',
  permitLogoType: 'url',
  permitCompanyName: 'Company Name',
  permitLocation: 'City, State',
  permitTitle: 'SAFETY PERMIT CONTRACT WORKER',
  permitFooterLines: [
    'Your safety is your responsibility.',
    'Always follow the safety procedures.',
    'Always keep company work place clean.',
    'When in doubt, contact our official for instruction, guidance & training.',
  ],
};

export const repairPermitSettings = async (settings) => {
  let changed = false;

  for (const [key, value] of Object.entries(DEFAULT_PERMIT_TOKEN)) {
    if (settings[key] === undefined || settings[key] === null) {
      settings[key] = value;
      changed = true;
    }
  }

  if (!Array.isArray(settings.permitFooterLines) || settings.permitFooterLines.length === 0) {
    settings.permitFooterLines = [...DEFAULT_PERMIT_TOKEN.permitFooterLines];
    changed = true;
  }

  if (changed) {
    await settings.save();
  }

  return settings;
};
