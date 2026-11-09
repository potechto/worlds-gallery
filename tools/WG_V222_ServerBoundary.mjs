/**
 * Worlds Gallery V2.22 - OFFLINE server-boundary / transaction contract.
 *
 * NOT a deployed Edge Function or a Supabase client. This adapter deliberately
 * cannot publish, stage, issue media URLs, or read private objects. A future
 * server must supply trusted auth.getUser(token), rateLimit(...), and a repo
 * whose transaction() uses real database BEGIN/COMMIT/ROLLBACK, row locks,
 * conditional updates and the partial unique index from the schema preview.
 * Never provide these dependencies from client code or untrusted request JSON.
 *
 * The transaction port is an INTERFACE, not an implementation of PostgreSQL.
 * Offline mock tests cannot prove SQL/RLS/Storage behavior in production.
 */
import {
  WorkflowDenied, planSubmit, planStartReview, planDecision
} from './WG_V221_TrustedWorkflow.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS = Object.freeze({
  submit: new Set(['action', 'storyId', 'attestations']),
  claim: new Set(['action', 'submissionId']),
  decide: new Set(['action', 'submissionId', 'decision', 'feedback'])
});
const PERMITTED_ACTIONS = Object.freeze(Object.keys(FIELDS));

function deny(code) { throw new WorkflowDenied(code); }
function assertUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) deny('INVALID_IDENTIFIER');
  return value;
}
function readBearer(headers) {
  // Standard Fetch Headers only. Never trust body.user, body.token or cookies.
  const value = headers && typeof headers.get === 'function'
    ? headers.get('authorization') : null;
  if (typeof value !== 'string') deny('AUTH_REQUIRED');
  const match = /^Bearer ([^\s]{8,8192})$/i.exec(value);
  if (!match) deny('AUTH_REQUIRED');
  return match[1];
}
function readBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) deny('BODY_INVALID');
  if (!Object.prototype.hasOwnProperty.call(FIELDS, body.action)) deny('ACTION_NOT_AVAILABLE');
  const keys = Object.keys(body);
  if (keys.length > 8 || keys.some(key => !FIELDS[body.action].has(key))) deny('BODY_FIELDS_INVALID');
  // No user identity, internal moderator flag, trusted review evidence, or status
  // can be accepted in this envelope. The implementation receives IDs and
  // explicit user attestations ONLY and loads everything else itself.
  if (JSON.stringify(body).length > 4096) deny('BODY_TOO_LARGE');
  return body;
}
function ensureRequiredDependency(deps) {
  if (!deps || typeof deps !== 'object'
    || typeof deps.auth?.getUser !== 'function'
    || typeof deps.rateLimit !== 'function'
    || typeof deps.repository?.transaction !== 'function'
    || typeof deps.serverNow !== 'function') {
    throw new Error('SERVER_DEPENDENCIES_MISSING');
  }
}
function requireTx(tx, name) {
  if (!tx || typeof tx[name] !== 'function') throw new Error('REPOSITORY_CONTRACT_MISSING:' + name);
  return tx[name].bind(tx);
}

/**
 * Creates a server-only dispatcher. Call from a trusted future Edge Function
 * after parsing JSON and enforcing HTTPS, size/origin controls and monitoring.
 * Outputs ONLY whitelisted status fields. Nothing here touches the live system.
 */
export function createServerBoundary(deps) {
  ensureRequiredDependency(deps);
  return async function dispatch(request) {
    const body = readBody(request?.body);
    const token = readBearer(request?.headers);
    // auth.getUser(token) MUST contact the trusted Supabase Auth service.
    // Inspecting JWT claims without signature/session verification is NOT enough.
    const verified = await deps.auth.getUser(token);
    const user = verified?.data?.user;
    if (verified?.error || !user || typeof user.id !== 'string' || !UUID.test(user.id)) {
      deny('AUTH_REQUIRED');
    }
    const actorId = user.id;
    // Fail closed if rate limiter is unavailable, not configured or not allowing.
    if (await deps.rateLimit({userId: actorId, action: body.action}) !== true) deny('RATE_LIMITED');
    const now = deps.serverNow();
    if (typeof now !== 'string' || !Number.isFinite(Date.parse(now))) {
      throw new Error('SERVER_CLOCK_INVALID');
    }
    const isReview = body.action === 'claim' || body.action === 'decide';
    // The DB transaction port MUST perform FOR UPDATE / CAS checks and commit
    // event+status changes together; do not replace it with independent REST
    // calls, a read-then-write flow, or client-supplied membership assertions.
    return deps.repository.transaction(async (tx) => {
      let moderatorAuthorizedByServer = false;
      if (isReview) {
        const role = await requireTx(tx, 'moderatorAuthorizedForUpdate')(actorId);
        moderatorAuthorizedByServer = role === true;
        if (!moderatorAuthorizedByServer) deny('MODERATOR_REQUIRED');
      }
      const principal = Object.freeze({
        userId: actorId, verifiedByServer: true, moderatorAuthorizedByServer
      });

      if (body.action === 'submit') {
        const storyId = assertUuid(body.storyId);
        const story = await requireTx(tx, 'loadOwnedDraftForUpdate')(storyId, actorId);
        const photos = await requireTx(tx, 'loadOwnedPhotosForUpdate')(storyId, actorId);
        const existingActiveSubmission = await requireTx(tx, 'activeSubmissionExistsForUpdate')(storyId);
        const plan = planSubmit({
          principal, story, photos, attestations: body.attestations,
          existingActiveSubmission, now
        });
        // createSubmission MUST be conditional and use the DB's partial unique
        // active-submission index to close concurrent duplicate submit races.
        const submissionId = assertUuid(await requireTx(tx, 'createSubmission')(plan));
        await requireTx(tx, 'createSubmissionPhotoRefs')(submissionId, plan.photos);
        await requireTx(tx, 'appendAudit')({
          submissionId, actorId, action: 'submitted', at: now
        });
        return Object.freeze({ok:true, action:'submit', submissionId, status:'pending'});
      }

      const submissionId = assertUuid(body.submissionId);
      const submission = await requireTx(tx, 'loadSubmissionForUpdate')(submissionId);
      if (body.action === 'claim') {
        const plan = planStartReview({principal, submission, now});
        // Single-row CAS: pending -> in_review, reviewer_id IS NULL.
        if (await requireTx(tx, 'claimSubmissionCAS')(plan) !== true) deny('REVIEW_CONFLICT');
        await requireTx(tx, 'appendAudit')({
          submissionId, actorId, action: 'review_started', at: now
        });
        return Object.freeze({ok:true, action:'claim', submissionId, status:'in_review'});
      }
      if (body.action === 'decide') {
        if (body.decision !== 'approved' && body.decision !== 'rejected') deny('DECISION_INVALID');
        // Approval evidence MUST originate from the server-owned review
        // process, never from request JSON or a mutable user profile flag.
        const serverReview = body.decision === 'approved'
          ? await requireTx(tx, 'loadSealedReviewEvidenceForUpdate')(submissionId)
          : null;
        const plan = planDecision({
          principal, submission, decision: body.decision,
          serverReview, feedback: body.feedback ?? '', now
        });
        // Single-row CAS: in_review with exactly this assigned reviewer.
        if (await requireTx(tx, 'decideSubmissionCAS')(plan) !== true) deny('REVIEW_CONFLICT');
        await requireTx(tx, 'appendAudit')({
          submissionId, actorId, action: plan.status,
          at: now
        });
        return Object.freeze({ok:true, action:'decide', submissionId, status:plan.status});
      }
      deny('ACTION_NOT_AVAILABLE');
    });
  };
}

export const serverBoundaryActions = PERMITTED_ACTIONS;
