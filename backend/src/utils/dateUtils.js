export const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const getStartOfDay = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfDay = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getStartOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const formatTokenNumber = (num) => String(num).padStart(3, '0');
