import { useId } from 'react';

const INDUSTRY_OPTIONS = [
  'FinTech',
  'Healthcare',
  'Enterprise Software',
  'Retail',
  'Education',
  'Non-profit',
  'Consulting',
];
const EXPERIENCE_LEVELS = ['Board Member', 'Executive', 'Founder'];

const defaultFilters = {
  expertise: [],
  industry: '',
  availableOnly: false,
  levels: [],
  minRating: 0,
};

export { defaultFilters, INDUSTRY_OPTIONS, EXPERIENCE_LEVELS };

export default function MentorFilterSidebar({ draft, setDraft, onApply, onClear }) {
  const id = useId();

  const setLevel = (opt, checked) => {
    setDraft((d) => ({
      ...d,
      levels: checked
        ? [...new Set([...d.levels, opt])]
        : d.levels.filter((x) => x !== opt),
    }));
  };

  const setMinRating = (n) => {
    setDraft((d) => ({ ...d, minRating: d.minRating === n ? 0 : n }));
  };

  const inputLike =
    'w-full rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 outline-none transition-shadow placeholder:text-neutral-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-200/70 dark:border-outline-variant/25 dark:bg-surface-container dark:text-on-surface dark:placeholder:text-outline dark:focus:border-rose-400/50 dark:focus:ring-rose-900/35';

  return (
    <aside className="h-fit w-full shrink-0 rounded-2xl border border-pink-100 bg-pink-50 p-5 shadow-[0_6px_24px_rgba(219,39,119,0.07)] dark:border-outline-variant/25 dark:bg-surface-container-lowest dark:shadow-none sm:p-6 lg:w-[270px] lg:sticky lg:top-28">
      <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-900 dark:text-on-surface">
        Filter Mentors
      </h2>

      <div className="space-y-5">
        {/* Industry — same field styling as main search input */}
        <div>
          <label
            htmlFor={`${id}-industry`}
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-rose-800 dark:text-rose-300"
          >
            Industry
          </label>
          <div className="relative">
            <select
              id={`${id}-industry`}
              value={draft.industry}
              onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))}
              className={`${inputLike} cursor-pointer appearance-none py-2.5 pl-3 pr-10 text-xs`}
            >
              <option value="">Select Industries</option>
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-rose-600 dark:text-rose-400"
              aria-hidden
            >
              <span className="material-symbols-outlined text-[20px] leading-none">expand_more</span>
            </span>
          </div>
        </div>

        {/* Available now */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-800 leading-tight dark:text-rose-300">
            Available now
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={draft.availableOnly}
            onClick={() => setDraft((d) => ({ ...d, availableOnly: !d.availableOnly }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              draft.availableOnly ? 'bg-rose-500 dark:bg-rose-500' : 'bg-neutral-200 dark:bg-surface-container-high'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                draft.availableOnly ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Experience level */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-800 dark:text-rose-300">
            Experience level
          </p>
          <ul className="space-y-2">
            {EXPERIENCE_LEVELS.map((opt) => {
              const cid = `${id}-lv-${opt}`;
              const checked = draft.levels.includes(opt);
              return (
                <li key={opt}>
                  <label htmlFor={cid} className="flex items-center gap-2.5 cursor-pointer group">
                    <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded border border-neutral-200 bg-white shadow-sm transition-colors group-hover:border-neutral-300 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-200/80 dark:border-outline-variant/40 dark:bg-surface-container dark:focus-within:ring-outline-variant/30">
                      <input
                        id={cid}
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setLevel(opt, e.target.checked)}
                        className="peer sr-only"
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-sm ${
                          checked ? 'bg-rose-600' : 'bg-transparent'
                        }`}
                      />
                    </span>
                    <span className="text-xs leading-snug text-neutral-900 dark:text-on-surface">{opt}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Minimum rating */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-800 mb-2">
            Minimum rating
          </p>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMinRating(n)}
                className={`p-0.5 text-xl leading-none transition-colors ${
                  n <= draft.minRating ? 'text-rose-500 dark:text-rose-400' : 'text-neutral-300 dark:text-outline/40'
                }`}
                aria-label={`Minimum ${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-2.5">
        <button
          type="button"
          onClick={onApply}
          className="w-full rounded-lg bg-rose-600 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-md shadow-rose-600/30 transition-colors hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={onClear}
          className="w-full text-center text-xs text-rose-900/50 underline underline-offset-2 transition-colors hover:text-rose-900 dark:text-rose-300/70 dark:hover:text-rose-200"
        >
          Clear all
        </button>
      </div>
    </aside>
  );
}
