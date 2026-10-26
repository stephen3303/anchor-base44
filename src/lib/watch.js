import moment from 'moment';

/** One turnover per watch, authored by the watch officer on duty. */
export const currentWatch = (now = moment.utc()) => {
  const hour = now.hour();
  const section =
    hour < 8
      ? { name: 'First watch', window: '0000–0800Z', startHour: 0 }
      : hour < 16
        ? { name: 'Second watch', window: '0800–1600Z', startHour: 8 }
        : { name: 'Third watch', window: '1600–2400Z', startHour: 16 };

  return {
    name: section.name,
    window: section.window,
    label: `${section.name} · ${section.window} · ${now.format('DD MMM YY').toUpperCase()}`,
    started_at: now.clone().startOf('day').add(section.startHour, 'hours').toISOString(),
  };
};

export const DEFAULT_CHECKLIST = [
  { label: 'Relief briefed on outstanding acknowledgements', done: false },
  { label: 'Pending traffic reviewed before handover', done: false },
  { label: 'Open action items carried forward', done: false },
  { label: 'EMCON and connectivity status confirmed', done: false },
];