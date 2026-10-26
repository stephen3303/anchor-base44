/**
 * Audit chain — one canonical form, hashed with SHA-256, so every row can be
 * recomputed later and the first altered row can be named. Shared by the append
 * function and by the integrity check so both hash exactly the same bytes.
 */
export const AUDIT_GENESIS = 'GENESIS';

export const canonicalPayload = (row) =>
  JSON.stringify([
    row.seq,
    row.actor_email || '',
    row.action,
    row.target_reference || '',
    row.detail || '',
    row.recorded_at,
    row.prev_hash,
  ]);

export const chainHash = async (payload) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};