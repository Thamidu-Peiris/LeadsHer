export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages   = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30 font-label text-xs"
      >
        ←
      </button>

      {visible.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && visible[i - 1] !== p - 1 && (
            <span className="px-2 text-on-surface-variant font-label text-xs">…</span>
          )}
          <button
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 border font-label text-xs transition-colors ${
              p === page
                ? 'border-primary bg-primary text-white'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30 font-label text-xs"
      >
        →
      </button>
    </div>
  );
}
