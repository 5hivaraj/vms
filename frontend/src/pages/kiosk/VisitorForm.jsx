import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerVisitor } from '../../api/visitors';
import { useKiosk } from '../../context/KioskContext';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function VisitorForm() {
  const navigate = useNavigate();
  const { photoBlob, inductionCompleted, setVisitorDetails, setRegisteredVisitor } = useKiosk();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    company: '',
    purpose: '',
  });

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!form.company.trim()) newErrors.company = 'Company name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!photoBlob) {
      showToast('Please capture a photo first', 'error');
      navigate('/selfie');
      return;
    }

    setLoading(true);
    setVisitorDetails(form);

    const formData = new FormData();
    formData.append('photo', photoBlob, 'selfie.jpg');
    formData.append('name', form.name.trim());
    formData.append('mobile', form.mobile.trim());
    formData.append('company', form.company.trim());
    formData.append('purpose', form.purpose.trim());
    formData.append('inductionCompleted', String(inductionCompleted));

    try {
      const { data } = await registerVisitor(formData);
      setRegisteredVisitor(data.visitor);
      navigate('/success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <LoadingSpinner size="xl" />
        <p className="text-2xl font-medium text-gray-600 dark:text-gray-400">
          Generating your token...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
      <h2 className="text-kiosk font-bold text-center mb-2">Your Details</h2>
      <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-8">
        Please fill in your information
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto w-full space-y-6">
        <div>
          <label htmlFor="name" className="block text-xl font-medium mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className={`input-kiosk ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Enter your full name"
            autoComplete="name"
          />
          {errors.name && <p className="mt-2 text-red-500 text-lg">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="mobile" className="block text-xl font-medium mb-2">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            value={form.mobile}
            onChange={handleChange}
            className={`input-kiosk ${errors.mobile ? 'border-red-500' : ''}`}
            placeholder="Enter your mobile number"
            autoComplete="tel"
          />
          {errors.mobile && <p className="mt-2 text-red-500 text-lg">{errors.mobile}</p>}
        </div>

        <div>
          <label htmlFor="company" className="block text-xl font-medium mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={form.company}
            onChange={handleChange}
            className={`input-kiosk ${errors.company ? 'border-red-500' : ''}`}
            placeholder="Enter your company name"
            autoComplete="organization"
          />
          {errors.company && <p className="mt-2 text-red-500 text-lg">{errors.company}</p>}
        </div>

        <div>
          <label htmlFor="purpose" className="block text-xl font-medium mb-2">
            Purpose of Visit
          </label>
          <input
            id="purpose"
            name="purpose"
            type="text"
            value={form.purpose}
            onChange={handleChange}
            className="input-kiosk"
            placeholder="Optional"
          />
        </div>

        <button type="submit" className="btn-kiosk-primary w-full mt-8">
          Generate Token
        </button>
      </form>
    </div>
  );
}
