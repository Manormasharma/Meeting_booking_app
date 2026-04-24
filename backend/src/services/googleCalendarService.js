import crypto from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

let cachedToken = null;

const isEnabled = () => {
  return process.env.GOOGLE_CALENDAR_ENABLED === 'true'
    && process.env.GOOGLE_CLIENT_EMAIL
    && process.env.GOOGLE_PRIVATE_KEY
    && process.env.GOOGLE_CALENDAR_ID;
};

const base64Url = (value) => {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const getPrivateKey = () => process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.accessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: process.env.GOOGLE_CLIENT_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedJwt)
    .sign(getPrivateKey(), 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsignedJwt}.${signature}`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google token request failed: ${details}`);
  }

  const token = await response.json();
  cachedToken = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };

  return cachedToken.accessToken;
};

const calendarFetch = async (path, options = {}) => {
  const accessToken = await getAccessToken();
  const response = await fetch(`${CALENDAR_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok && response.status !== 404) {
    const details = await response.text();
    throw new Error(`Google Calendar request failed: ${details}`);
  }

  if (response.status === 204 || response.status === 404) return null;
  return response.json();
};

export const createCalendarEvent = async (booking) => {
  if (!isEnabled()) return null;

  const room = booking.room_id;
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID);
  const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const event = await calendarFetch(`/calendars/${calendarId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      summary: `${room?.name || 'Meeting Room'} booking`,
      location: room?.name,
      description: `Meeting room booking for ${booking.people} people.\n${appUrl}`,
      start: { dateTime: booking.start_time.toISOString() },
      end: { dateTime: booking.end_time.toISOString() },
    }),
  });

  return event ? { eventId: event.id, htmlLink: event.htmlLink } : null;
};

export const updateCalendarEventEnd = async (booking) => {
  if (!isEnabled() || !booking.google_calendar_event_id) return null;

  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID);
  const eventId = encodeURIComponent(booking.google_calendar_event_id);

  return calendarFetch(`/calendars/${calendarId}/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      end: { dateTime: booking.end_time.toISOString() },
      description: `Meeting room booking released early at ${booking.released_at?.toISOString() || new Date().toISOString()}.`,
    }),
  });
};

export const deleteCalendarEvent = async (booking) => {
  if (!isEnabled() || !booking.google_calendar_event_id) return null;

  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID);
  const eventId = encodeURIComponent(booking.google_calendar_event_id);

  return calendarFetch(`/calendars/${calendarId}/events/${eventId}`, {
    method: 'DELETE',
  });
};
