const styles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
};

export default function Toast({ message, type = 'info' }) {
  return (
    <div
      className={`px-6 py-4 rounded-xl shadow-lg text-lg font-medium animate-slide-in ${styles[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
}
