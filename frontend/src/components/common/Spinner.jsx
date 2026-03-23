export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <div className={`animate-spin rounded-full border-2 border-outline-variant border-t-primary ${s} ${className}`} />
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Spinner size="lg" />
    </div>
  );
}
