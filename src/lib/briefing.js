import moment from 'moment';
import { PRECEDENCE_ORDER, SAMPLE_MESSAGES, formatDate, formatZulu } from '@/data/anchorSampleData';

/** The two things a briefing has to answer: what is urgent, and what is owed. */
export const priorityTraffic = (messages = SAMPLE_MESSAGES) =>
  messages
    .filter((m) => m.precedence === 'FLASH' || m.precedence === 'IMMEDIATE')
    .sort((a, b) => PRECEDENCE_ORDER.indexOf(a.precedence) - PRECEDENCE_ORDER.indexOf(b.precedence));

export const summaryLine = (messages = SAMPLE_MESSAGES) => {
  const count = (precedence) => messages.filter((m) => m.precedence === precedence).length;
  const actions = messages.filter((m) => m.action_item).length;
  return `${messages.length} records held — ${count('FLASH')} FLASH, ${count('IMMEDIATE')} IMMEDIATE, ${count(
    'PRIORITY',
  )} PRIORITY, ${count('ROUTINE')} ROUTINE. ${actions} carry an open action item.`;
};

export const keyTakeaways = (messages = SAMPLE_MESSAGES, limit = 6) => {
  const lines = [];

  messages
    .filter((m) => m.lifecycle !== 'ACTIVE')
    .slice(0, 3)
    .forEach((m) =>
      lines.push(
        `${m.reference} is ${m.lifecycle}${m.replaced_by ? ` — the current version is ${m.replaced_by}` : ''}.`,
      ),
    );

  messages
    .filter((m) => m.action_item)
    .slice(0, 3)
    .forEach((m) =>
      lines.push(`${m.reference} requires ${m.action_item.text} — suspense ${formatDate(m.action_item.suspense)}.`),
    );

  return lines.slice(0, limit);
};

/** Plain-text rendition, so a briefing can be carried out of the app. */
export const briefingLines = ({ messages = SAMPLE_MESSAGES, user, generatedAt }) => {
  const lines = [
    'ANCHOR BRIEFING — UNCLASSIFIED // PROTOTYPE',
    `Generated ${formatZulu(generatedAt)} by ${user?.full_name || 'Watch Officer'}`,
    '',
    'SITUATION',
    summaryLine(messages),
    '',
    'KEY TAKEAWAYS',
    ...keyTakeaways(messages).map((line, index) => `${index + 1}. ${line}`),
    '',
    'HIGH-PRIORITY TRAFFIC',
  ];

  priorityTraffic(messages).forEach((m) => {
    lines.push(`${m.precedence} · ${m.reference} · ${m.subject} (received ${formatZulu(m.received)})`);
  });

  lines.push('', 'ACTION ITEMS');
  messages
    .filter((m) => m.action_item)
    .sort((a, b) => moment.utc(a.action_item.suspense).valueOf() - moment.utc(b.action_item.suspense).valueOf())
    .forEach((m) => {
      lines.push(`${m.action_item.text} — ${m.action_item.assigned_to} — suspense ${formatDate(m.action_item.suspense)}`);
    });

  return lines.join('\n');
};