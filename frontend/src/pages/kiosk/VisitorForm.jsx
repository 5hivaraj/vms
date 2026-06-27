import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerVisitor } from '../../api/visitors';
import { useKiosk } from '../../context/KioskContext';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function VisitorForm() {
  const navigate = useNavigate();
  const {
    photoBlob,
    inductionCompleted,
    assessmentPassed,
    assessmentSkipped,
    assessmentAnswers,
    setVisitorDetails,
    setRegisteredVisitor,
  } = useKiosk();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    company: '',
    purpose: '',
  });

  useEffect(() => {
    if (!photoBlob) {
      navigate('/selfie', { replace: true });
      return;
    }
    if (!inductionCompleted) {
      navigate('/induction', { replace: true });
      return;
    }
    if (!assessmentSkipped && !assessmentPassed) {
      navigate('/assessment', { replace: true });
    }
  }, [
    photoBlob,
    inductionCompleted,
    assessmentPassed,
    assessmentSkipped,
    navigate,
  ]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(form.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (!form.company.trim()) newErrors.company = 'Company name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
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
    if (assessmentPassed && assessmentAnswers.length > 0) {
      formData.append('assessmentPassed', 'true');
      formData.append('assessmentAnswers', JSON.stringify(assessmentAnswers));
    }

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
        <p className="text-lg sm:text-2xl font-medium text-gray-600 dark:text-gray-400">
          Generating your token...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
      <h2 className="heading-kiosk text-center mb-2">Your Details</h2>
      <p className="text-base sm:text-lg md:text-xl text-center text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
        Please fill in your information
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto w-full space-y-5 sm:space-y-6">
        <div>
          <label htmlFor="name" className="block text-base sm:text-lg md:text-xl font-medium mb-2">
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
          {errors.name && <p className="mt-2 text-red-500 text-base sm:text-lg">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="mobile" className="block text-base sm:text-lg md:text-xl font-medium mb-2">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            value={form.mobile}
            onChange={handleChange}
            className={`input-kiosk ${errors.mobile ? 'border-red-500' : ''}`}
            placeholder="10-digit mobile number"
            autoComplete="tel"
          />
          {errors.mobile && <p className="mt-2 text-red-500 text-base sm:text-lg">{errors.mobile}</p>}
        </div>

        <div>
          <label htmlFor="company" className="block text-base sm:text-lg md:text-xl font-medium mb-2">
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
          {errors.company && <p className="mt-2 text-red-500 text-base sm:text-lg">{errors.company}</p>}
        </div>

        <div>
          <label htmlFor="purpose" className="block text-base sm:text-lg md:text-xl font-medium mb-2">
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
