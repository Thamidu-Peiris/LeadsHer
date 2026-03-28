import { useCallback, useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import {
  eventStartDate,
  fetchPrimaryCalendarEvents,
  readGoogleCalendarAccessTokenFromStorage,
} from '../../utils/googleCalendarClient';

const TOKEN_KEY = 'leadsher_gcal_token';
const EXP_KEY = 'leadsher_gcal_exp';

function loadStoredToken() {
  return readGoogleCalendarAccessTokenFromStorage();
}

function storeToken(tokenResponse) {
  const exp = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
  try {
    sessionStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
    sessionStorage.setItem(EXP_KEY, String(exp));
  } catch {
    /* ignore */
  }
}

function clearStoredToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXP_KEY);
  } catch {
    /* ignore */
  }
}

function formatWhen(d) {
  if (!d) return '—';
  try {
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function MentorGoogleCalendarSection() {
  const [accessToken, setAccessToken] = useState(() => loadStoredToken());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async (token) => {
    if (!token) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date(timeMin);
      timeMax.setDate(timeMax.getDate() + 42);
      const items = await fetchPrimaryCalendarEvents(token, { timeMin, timeMax });
      const sorted = [...items].sort((a, b) => {
        const da = eventStartDate(a);
        const db = eventStartDate(b);
        if (!da || !db) return 0;
        return da.getTime() - db.getTime();
      });
      setEvents(sorted);
    } catch (e) {
      const msg = e?.message || 'Could not load Google Calendar';
      toast.error(msg);
      setEvents([]);
      if (String(msg).includes('401') || String(msg).includes('Invalid Credentials')) {
        clearStoredToken();
        setAccessToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) loadEvents(accessToken);
  }, [accessToken, loadEvents]);

  const login = useGoogleLogin({
    scope:
      'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
    onSuccess: (tokenResponse) => {
      storeToken(tokenResponse);
      setAccessToken(tokenResponse.access_token);
      toast.success('Google Calendar connected');
    },
    onError: () => toast.error('Google sign-in was cancelled or failed'),
  });

  const disconnect = () => {
    clearStoredToken();
    setAccessToken(null);
    setEvents([]);
    toast.success('Disconnected from Google Calendar');
  };

  return (
    <div className="border border-outline-variant/20 rounded-xl p-6 bg-surface-container-lowest/50">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="font-serif-alt text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent text-[22px]">calendar_month</span>
            Google Calendar
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            See upcoming events from your primary Google calendar next to your logged mentorship sessions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {!accessToken ? (
            <button
              type="button"
              onClick={() => login()}
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-outline-variant/25 bg-white dark:bg-surface-container hover:border-gold-accent/40"
            >
              Connect Google Calendar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => loadEvents(accessToken)}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-outline-variant/25 bg-white dark:bg-surface-container hover:border-gold-accent/40 disabled:opacity-50"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={disconnect}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-outline-variant/25 text-on-surface-variant hover:bg-surface-container"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {accessToken && (
        <div className="space-y-2">
          {loading && events.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No upcoming events in the selected range.</p>
          ) : (
            <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {events.map((ev) => {
                const start = eventStartDate(ev);
                const title = ev.summary || '(No title)';
                return (
                  <li
                    key={ev.id || `${title}-${start?.getTime()}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-outline-variant/15 last:border-0 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-on-surface truncate">{title}</p>
                      <p className="text-xs text-outline">{formatWhen(start)}</p>
                    </div>
                    {ev.htmlLink && (
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:underline shrink-0"
                      >
                        Open in Google
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
