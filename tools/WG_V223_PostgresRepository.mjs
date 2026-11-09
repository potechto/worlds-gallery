/**
 * Worlds Gallery V2.23 - OFFLINE PostgreSQL transaction repository.
 *
 * Connect this ONLY to a trusted server runtime with a privileged, private
 * pg-compatible Pool. The pool MUST NOT be provided by the browser.
 * Use createServerBoundary from V2.22 for verified JWT authentication,
 * rate limiting and action validation. This file does NOT create a pool,
 * read credentials, deploy a migration, serve images, or publish content.
 *
 * SQL is deliberately fixed and parameterized. Every transactional action
 * uses ONE connection for BEGIN, all reads/writes, COMMIT or ROLLBACK.
 * This is not proof of live schema compatibility; actual PostgreSQL and
 * Supabase QA are still required before deployment.
 *
 * Moderators: server-owned auth.users.raw_app_meta_data.wg_moderator === true.
 * Do not use raw_user_meta_data or an HTTP-supplied role. There are NO
 * moderators enabled by installing this offline module.
 *
 * CRITICAL: approval is fail-closed until immutable, sanitized media and a
 * server-sealed review-evidence store are implemented separately.
 */

const SQL = Object.freeze({
  moderator: `SELECT id FROM auth.users
    WHERE id = $1 AND raw_app_meta_data ->> 'wg_moderator' = 'true'
    FOR SHARE`,
  draft: `SELECT id, user_id, status, author, title, body,
           country_code, country_name, region, city, theme, layout, language_code
    FROM public.wg_stories
    WHERE id = $1 AND user_id = $2 AND status = 'draft'
    FOR UPDATE`,
  photos: `SELECT id, story_id, user_id, storage_path, position, mime_type
    FROM public.wg_story_photos
    WHERE story_id = $1 AND user_id = $2
    ORDER BY position ASC FOR UPDATE`,
  active: `SELECT id FROM public.wg_publication_submissions
    WHERE story_id = $1 AND status IN ('pending', 'in_review')
    FOR UPDATE`,
  insertSubmission: `INSERT INTO public.wg_publication_submissions
    (story_id, owner_id, status, author, title, body, country_code,
     country_name, region, city, theme, layout, language_code,
     rights_attested, consent_attested, privacy_attested, submitted_at)
    VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16)
    RETURNING id`,
  insertPhoto: `INSERT INTO public.wg_publication_submission_photos
    (submission_id, source_photo_id, position)
    VALUES ($1, $2, $3)`,
  insertAudit: `INSERT INTO public.wg_moderation_events
    (submission_id, actor_id, action, occurred_at)
    VALUES ($1, $2, $3, $4)`,
  submission: `SELECT id, owner_id, status, reviewer_id
    FROM public.wg_publication_submissions WHERE id = $1 FOR UPDATE`,
  claim: `UPDATE public.wg_publication_submissions
    SET status = 'in_review', reviewer_id = $2, claimed_at = $3
    WHERE id = $1 AND status = 'pending'
      AND reviewer_id IS NULL AND owner_id <> $2
    RETURNING id`,
  decide: `UPDATE public.wg_publication_submissions
    SET status = $3, reviewed_at = $4, public_feedback = $5
    WHERE id = $1 AND status = 'in_review'
      AND reviewer_id = $2 AND owner_id <> $2
    RETURNING id`
});

function contract(message) { throw new Error('WG_PG_CONTRACT:' + message); }
function checkUuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) contract('INVALID_UUID');
  return value;
}
function checkTime(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) contract('INVALID_TIME');
  return value;
}
function checkRows(result) {
  if (!result || !Array.isArray(result.rows)) contract('INVALID_QUERY_RESULT');
  return result.rows;
}
function oneOrNull(rows) {
  if (rows.length > 1) contract('NON_UNIQUE_RESULT');
  return rows[0] ?? null;
}

/**
 * @param {{pool: {connect():Promise<{query(sql:string,args?:any[]):Promise<any>,release():void}>}}} options
 * @returns {{transaction(callback:Function):Promise<any>}}
 */
export function createPostgresRepository({pool} = {}) {
  if (typeof pool?.connect !== 'function') contract('SERVER_POOL_REQUIRED');
  return Object.freeze({
    async transaction(callback) {
      if (typeof callback !== 'function') contract('TRANSACTION_CALLBACK_REQUIRED');
      const connection = await pool.connect();
      if (typeof connection?.query !== 'function' || typeof connection?.release !== 'function') {
        connection?.release?.();
        contract('INVALID_CONNECTION');
      }
      let started = false;
      let closed = false;
      let discardConnection = false;
      const run = async (sql, args = []) => {
        if (closed || !started) contract('TRANSACTION_CLOSED');
        return checkRows(await connection.query(sql, args));
      };
      const tx = Object.freeze({
        async moderatorAuthorizedForUpdate(actorId) {
          const rows = await run(SQL.moderator, [checkUuid(actorId)]);
          return !!oneOrNull(rows);
        },
        async loadOwnedDraftForUpdate(storyId, ownerId) {
          return oneOrNull(await run(SQL.draft, [checkUuid(storyId), checkUuid(ownerId)]));
        },
        async loadOwnedPhotosForUpdate(storyId, ownerId) {
          return run(SQL.photos, [checkUuid(storyId), checkUuid(ownerId)]);
        },
        async activeSubmissionExistsForUpdate(storyId) {
          return (await run(SQL.active, [checkUuid(storyId)])).length > 0;
        },
        async createSubmission(plan) {
          if (plan?.status !== 'pending') contract('SUBMISSION_NOT_PENDING');
          const params = [
            checkUuid(plan.story_id), checkUuid(plan.owner_id), plan.author, plan.title,
            plan.body, plan.country_code, plan.country_name, plan.region,
            plan.city, plan.theme, plan.layout, plan.language_code,
            plan.rights_attested, plan.consent_attested, plan.privacy_attested,
            checkTime(plan.submitted_at)
          ];
          if ([params[12], params[13], params[14]].some(v => v !== true)) contract('ATTESTATIONS_REQUIRED');
          const rows = await run(SQL.insertSubmission, params);
          if (rows.length !== 1) contract('INSERT_RETURNED_WRONG_COUNT');
          return checkUuid(rows[0].id);
        },
        async createSubmissionPhotoRefs(submissionId, refs) {
          checkUuid(submissionId);
          if (!Array.isArray(refs) || refs.length < 1 || refs.length > 4) contract('PHOTO_COUNT_INVALID');
          for (const [index, ref] of refs.entries()) {
            if (ref?.position !== index) contract('PHOTO_ORDER_INVALID');
            await run(SQL.insertPhoto, [submissionId, checkUuid(ref.source_photo_id), index]);
          }
        },
        async appendAudit({submissionId, actorId, action, at} = {}) {
          if (!['submitted', 'review_started', 'approved', 'rejected'].includes(action)) contract('AUDIT_ACTION_INVALID');
          await run(SQL.insertAudit, [checkUuid(submissionId), checkUuid(actorId), action, checkTime(at)]);
        },
        async loadSubmissionForUpdate(submissionId) {
          return oneOrNull(await run(SQL.submission, [checkUuid(submissionId)]));
        },
        async claimSubmissionCAS(plan) {
          if (plan?.status !== 'in_review' || plan?.expected_status !== 'pending') contract('CLAIM_STATUS_INVALID');
          const rows = await run(SQL.claim, [checkUuid(plan.submission_id), checkUuid(plan.reviewer_id), checkTime(plan.claimed_at)]);
          return rows.length === 1;
        },
        async loadSealedReviewEvidenceForUpdate(_submissionId) {
          // No trusted sealed-review-evidence table exists as of V2.23.
          // Hard-stop approval rather than accept invented/unverified evidence.
          contract('SEALED_REVIEW_NOT_IMPLEMENTED');
        },
        async decideSubmissionCAS(plan) {
          if (plan?.expected_status !== 'in_review' || !['approved','rejected'].includes(plan?.status)) contract('DECISION_STATUS_INVALID');
          const rows = await run(SQL.decide, [
            checkUuid(plan.submission_id), checkUuid(plan.reviewer_id), plan.status,
            checkTime(plan.reviewed_at), plan.public_feedback ?? ''
          ]);
          return rows.length === 1;
        }
      });
      try {
        // All SQL operations use this SAME acquired connection.
        await connection.query('BEGIN');
        started = true;
        await connection.query("SET LOCAL statement_timeout = '15s'");
        await connection.query("SET LOCAL lock_timeout = '5s'");
        const result = await callback(tx);
        await connection.query('COMMIT');
        started = false;
        return result;
      } catch (err) {
        if (started) {
          try { await connection.query('ROLLBACK'); }
          catch (rollbackError) {
            discardConnection = true;
            const failure = new Error('WG_PG_ROLLBACK_FAILED');
            failure.cause = {original: err, rollback: rollbackError};
            throw failure;
          }
        }
        throw err;
      } finally {
        closed = true;
        // A failed rollback leaves the connection unsafe for pool reuse.
        connection.release(discardConnection ? new Error('WG_PG_UNSAFE_CONNECTION') : undefined);
      }
    }
  });
}

export const pgRepositoryActions = Object.freeze(['submit', 'claim', 'decide']);
