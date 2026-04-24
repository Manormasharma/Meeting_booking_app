const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export const formatDate = (value) => dateFormatter.format(new Date(value));

export const formatTime = (value) => timeFormatter.format(new Date(value));

export const formatDateTime = (value) => `${formatDate(value)}, ${formatTime(value)}`;

export const formatTimeRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (sameDay) {
    return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
};
