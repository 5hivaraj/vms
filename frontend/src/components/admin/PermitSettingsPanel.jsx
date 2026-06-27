import { useCallback, useEffect, useState } from 'react';
import { getPermitSettings, updatePermitSettings, uploadPermitLogo } from '../../api/permit';
import { useToast } from '../../hooks/useToast';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const emptyForm = () => ({
  permitLogoUrl: '',
  permitLogoType: 'url',
  permitCompanyName: '',
  permitLocation: '',
  permitTitle: '',
  permitFooterLines: ['', '', '', ''],
});

export default function PermitSettingsPanel() {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [logoMode, setLogoMode] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await getPermitSettings();
      setForm({
        permitLogoUrl: data.permitLogoUrl || '',
        permitLogoType: data.permitLogoType || 'url',
        permitCompanyName: data.permitCompanyName || '',
        permitLocation: data.permitLocation || '',
        permitTitle: data.permitTitle || '',
        permitFooterLines:
          data.permitFooterLines?.length > 0
            ? data.permitFooterLines
            : ['', '', '', ''],
      });
      setLogoMode(data.permitLogoType === 'file' ? 'file' : 'url');
    } catch {
      showToast('Failed to load permit settings', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateFooterLine = (index, value) => {
    setForm((prev) => {
      const lines = [...prev.permitFooterLines];
      lines[index] = value;
      return { ...prev, permitFooterLines: lines };
    });
  };

  const addFooterLine = () => {
    setForm((prev) => ({
      ...prev,
      permitFooterLines: [...prev.permitFooterLines, ''],
    }));
  };

  const removeFooterLine = (index) => {
    setForm((prev) => ({
      ...prev,
      permitFooterLines: prev.permitFooterLines.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updatePermitSettings({
        ...form,
        permitLogoType: logoMode === 'file' ? form.permitLogoType : 'url',
      });
      setForm({
        ...data,
        permitFooterLines: data.permitFooterLines?.length ? data.permitFooterLines : [''],
      });
      showToast('Permit layout saved', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save permit settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) {
      showToast('Please choose a logo image', 'error');
      return;
    }
    setUploading(true);
    try {
      const { data } = await uploadPermitLogo(selectedFile);
      setForm((prev) => ({
        ...prev,
        permitLogoUrl: data.permitLogoUrl,
        permitLogoType: data.permitLogoType,
      }));
      setLogoMode('file');
      setSelectedFile(null);
      showToast('Logo uploaded', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const logoPreview = form.permitLogoUrl ? resolveMediaUrl(form.permitLogoUrl) : '';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-1">Printed Permit / Token</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Configure the header, title bar, and footer shown when visitors print their safety permit.
      </p>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Header</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Company name</span>
              <input
                type="text"
                value={form.permitCompanyName}
                onChange={(e) => updateField('permitCompanyName', e.target.value)}
                className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                placeholder="Givaudan (India) Pvt Ltd"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Location</span>
              <input
                type="text"
                value={form.permitLocation}
                onChange={(e) => updateField('permitLocation', e.target.value)}
                className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                placeholder="Bangalore, Karnataka"
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Logo</p>
            <div className="flex gap-2 mb-3">
              <ModeButton active={logoMode === 'url'} onClick={() => setLogoMode('url')}>
                Logo URL
              </ModeButton>
              <ModeButton active={logoMode === 'file'} onClick={() => setLogoMode('file')}>
                Upload image
              </ModeButton>
            </div>
            {logoMode === 'url' ? (
              <input
                type="url"
                value={form.permitLogoUrl}
                onChange={(e) => updateField('permitLogoUrl', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                placeholder="https://example.com/logo.png"
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload logo'}
                </button>
              </div>
            )}
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="mt-3 h-14 w-auto object-contain border border-gray-200 dark:border-gray-700 rounded p-1 bg-white"
              />
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Title bar
          </h3>
          <input
            type="text"
            value={form.permitTitle}
            onChange={(e) => updateField('permitTitle', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-semibold"
            placeholder="SAFETY PERMIT CONTRACT WORKER"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Footer (safety instructions)
            </h3>
            <button
              type="button"
              onClick={addFooterLine}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add line
            </button>
          </div>
          <div className="space-y-2">
            {form.permitFooterLines.map((line, index) => (
              <div key={index} className="flex gap-2">
                <span className="pt-2 text-sm text-gray-400 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => updateFooterLine(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                {form.permitFooterLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFooterLine(index)}
                    className="px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    aria-label="Remove line"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save permit layout'}
        </button>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
      }`}
    >
      {children}
    </button>
  );
}
