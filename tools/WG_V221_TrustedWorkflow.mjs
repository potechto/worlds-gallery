/**
 * Worlds Gallery V2.21: OFFLINE trusted moderation domain logic.
 *
 * These are pure plans, NOT HTTP handlers, SQL transactions, or deployed Edge
 * Functions. A future server adapter MUST independently authenticate a JWT
 * (Supabase auth.getUser), authorize moderators from server-controlled data,
 * load owned rows from the database, and execute each plan in one atomic
 * conditional transaction. Never pass a client-constructed principal, story,
 * media record, moderator proof, or server evidence to these helpers.
 *
 * No function here talks to a network, database, or Supabase Storage.
 * No function emits a signed URL, publishes a row, or bypasses RLS.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const DECISIONS = new Set(['approved', 'rejected']);
const SUBMISSION_STATUSES = new Set(['pending', 'in_review', 'approved', 'rejected', 'withdrawn']);
const GALLERY_STATUSES = new Set(['staged', 'published', 'withdrawn']);

export class WorkflowDenied extends Error {
  constructor(code) {
    super(code);
    this.name = 'WorkflowDenied';
    this.code = code;
  }
}
function deny(code) { throw new WorkflowDenied(code); }
function uuid(value) { return typeof value === 'string' && UUID.test(value); }
function requiredString(value, min, max, code) {
  if (typeof value !== 'string') deny(code);
  const trimmed = value.trim();
  const length = [...trimmed].length;
  if (length < min || length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(trimmed)) deny(code);
  return trimmed;
}
function actor(principal) {
  // The adapter, NOT an HTTP request body, must construct this identity AFTER
  // authenticating the user via Supabase Auth and checking a fresh session.
  if (!principal || principal.verifiedByServer !== true || !uuid(principal.userId)) deny('AUTH_REQUIRED');
  return principal.userId;
}
function moderator(principal) {
  const id = actor(principal);
  // This boolean MUST come from server-controlled role data (not user_metadata,
  // request JSON or an unrefreshed, self-edited JWT claim).
  if (principal.moderatorAuthorizedByServer !== true) deny('MODERATOR_REQUIRED');
  return id;
}
function owner(principal, expectedOwnerId) {
  const id = actor(principal);
  if (!uuid(expectedOwnerId) || expectedOwnerId !== id) deny('NOT_OWNER');
  return id;
}
function flagSet(flags, names, code) {
  if (!flags || typeof flags !== 'object' || names.some(name => flags[name] !== true)) deny(code);
}
function validPhoto(photo, id, storyId) {
  if (!photo || !uuid(photo.id) || photo.user_id !== id || photo.story_id !== storyId) deny('PHOTO_NOT_OWNED');
  if (!IMAGE_TYPES.has(photo.mime_type)) deny('PHOTO_TYPE_INVALID');
  const path = photo.storage_path;
  if (typeof path !== 'string' || !path.startsWith(`${id}/`) || path.includes('..') || path.includes('\\') || path.includes('//')) deny('PHOTO_PATH_INVALID');
  if (!Number.isInteger(photo.position) || photo.position < 0 || photo.position > 3) deny('PHOTO_POSITION_INVALID');
}
function safeDate(now) {
  if (typeof now !== 'string' || !Number.isFinite(Date.parse(now))) deny('SERVER_CLOCK_REQUIRED');
  return now;
}

/**
 * Plan a PRIVATE submission from server-loaded owner draft and photo records.
 * Only a subsequent trusted database transaction may actually insert it.
 */
export function planSubmit({principal, story, photos, attestations, existingActiveSubmission = false, now}) {
  const id = actor(principal);
  if (!story || !uuid(story.id) || story.user_id !== id || story.status !== 'draft') deny('NOT_OWNED_DRAFT');
  if (existingActiveSubmission) deny('ACTIVE_SUBMISSION_EXISTS');
  const author = requiredString(story.author, 2, 60, 'AUTHOR_INVALID');
  const title = requiredString(story.title, 1, 120, 'TITLE_INVALID');
  const body = requiredString(story.body, 1000, 15000, 'STORY_LENGTH_INVALID');
  const countryCode = requiredString(story.country_code, 2, 2, 'COUNTRY_INVALID').toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) deny('COUNTRY_INVALID');
  const countryName = requiredString(story.country_name, 2, 120, 'COUNTRY_INVALID');
  const theme = requiredString(story.theme, 1, 60, 'THEME_INVALID');
  const layout = requiredString(story.layout, 1, 60, 'LAYOUT_INVALID');
  const languageCode = requiredString(story.language_code || 'en', 2, 20, 'LANGUAGE_INVALID');
  const region = typeof story.region === 'string' ? story.region.trim().slice(0, 120) : '';
  const city = typeof story.city === 'string' ? story.city.trim().slice(0, 120) : '';
  flagSet(attestations, ['rights', 'consent', 'locationPrivacy'], 'AUTHOR_ATTESTATIONS_REQUIRED');
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 4) deny('PHOTO_COUNT_INVALID');
  const ordered = [...photos].sort((a,b) => (a?.position ?? -1) - (b?.position ?? -1));
  const unique = new Set();
  for (const [position, photo] of ordered.entries()) {
    validPhoto(photo, id, story.id);
    if (photo.position !== position || unique.has(photo.id)) deny('PHOTO_SEQUENCE_INVALID');
    unique.add(photo.id);
  }
  const photoRefs = Object.freeze(ordered.map(photo => Object.freeze({source_photo_id: photo.id, position: photo.position})));
  return Object.freeze({
    status: 'pending',
    submitted_at: safeDate(now),
    story_id: story.id,
    owner_id: id,
    author, title, body,
    country_code: countryCode,
    country_name: countryName,
    region, city, theme, layout,
    language_code: languageCode,
    rights_attested: true,
    consent_attested: true,
    privacy_attested: true,
    photos: photoRefs,
    // Content is only snapshotted in DB after an atomic transaction. Original
    // media remains mutable until a separate trusted sealed-media step.
  });
}

/** Plan a reviewer claim (must be CAS: pending -> in_review). */
export function planStartReview({principal, submission, now}) {
  const reviewerId = moderator(principal);
  if (!submission || !uuid(submission.id) || !SUBMISSION_STATUSES.has(submission.status)) deny('SUBMISSION_INVALID');
  if (submission.status !== 'pending') deny('REVIEW_NOT_PENDING');
  if (submission.owner_id === reviewerId) deny('SELF_REVIEW_FORBIDDEN');
  return Object.freeze({submission_id: submission.id, expected_status: 'pending', status: 'in_review', reviewer_id: reviewerId, claimed_at: safeDate(now)});
}

/** Plan a moderation decision without publishing anything. */
export function planDecision({principal, submission, decision, serverReview, feedback = '', now}) {
  const reviewerId = moderator(principal);
  if (!submission || !uuid(submission.id) || submission.status !== 'in_review') deny('REVIEW_NOT_CLAIMED');
  if (submission.owner_id === reviewerId) deny('SELF_REVIEW_FORBIDDEN');
  if (submission.reviewer_id !== reviewerId) deny('REVIEW_CLAIM_REQUIRED');
  if (!DECISIONS.has(decision)) deny('DECISION_INVALID');
  if (decision === 'approved') {
    flagSet(serverReview, [
      'copyrightAndConsentReviewed', 'youthSafetyReviewed',
      'locationPrivacyReviewed', 'storyAndMediaReviewed',
      'mediaSnapshotSealed'
    ], 'MODERATION_INCOMPLETE');
  }
  const safeFeedback = decision === 'rejected' ? requiredString(feedback, 1, 1000, 'REJECTION_REASON_REQUIRED') : '';
  return Object.freeze({
    submission_id: submission.id,
    expected_status: 'in_review',
    status: decision,
    reviewer_id: reviewerId,
    reviewed_at: safeDate(now),
    public_feedback: safeFeedback
  });
}

/** Prepare a non-public gallery snapshot from an already approved submission. */
export function planStage({principal, submission, sealedMediaVerified, now}) {
  moderator(principal);
  if (!submission || !uuid(submission.id) || submission.status !== 'approved') deny('NOT_APPROVED');
  if (sealedMediaVerified !== true) deny('UNSEALED_MEDIA');
  safeDate(now);
  const allowed = [
    'author','title','body','country_code','country_name','region','city',
    'theme','layout','language_code'
  ];
  const snapshot = { submission_id: submission.id, status: 'staged' };
  for (const field of allowed) snapshot[field] = submission[field];
  // No user UUID, original Storage path, EXIF, precise GPS, signed URL or photo IDs.
  return Object.freeze(snapshot);
}

/**
 * No release unless the server has verified ALL preconditions. This function
 * is a domain gate, not a publishing transaction or media broker.
 */
export function planRelease({principal, submission, gallery, serverRelease, now}) {
  const reviewerId = moderator(principal);
  if (!submission || submission.status !== 'approved' || !uuid(submission.id)) deny('NOT_APPROVED');
  if (!gallery || gallery.status !== 'staged' || gallery.submission_id !== submission.id || !uuid(gallery.id)) deny('NOT_STAGED');
  if (submission.owner_id === reviewerId) deny('SELF_REVIEW_FORBIDDEN');
  flagSet(serverRelease, [
    'sealedMediaUnchanged', 'privacyMetadataRemoved',
    'mediaBrokerAccessChecked', 'noTakedownOrOpenSafetyHold',
    'publicationTransactionReady'
  ], 'RELEASE_NOT_READY');
  return Object.freeze({gallery_story_id: gallery.id, expected_status: 'staged', status: 'published', published_at: safeDate(now)});
}

/** A published story can be withdrawn, but existing signed URLs may live until TTL. */
export function planWithdraw({principal, submission, gallery, now}) {
  const requesterId = actor(principal);
  if (!submission || !uuid(submission.id) || !gallery || !uuid(gallery.id) || gallery.submission_id !== submission.id) deny('PUBLICATION_NOT_FOUND');
  if (submission.owner_id !== requesterId && principal.moderatorAuthorizedByServer !== true) deny('WITHDRAW_FORBIDDEN');
  if (!GALLERY_STATUSES.has(gallery.status) || gallery.status === 'withdrawn') deny('NOT_WITHDRAWABLE');
  if (gallery.status === 'published' && submission.status !== 'approved') deny('PUBLICATION_INCONSISTENT');
  return Object.freeze({gallery_story_id: gallery.id, expected_status: gallery.status, status: 'withdrawn', withdrawn_at: safeDate(now)});
}

/** Strict public DTO allowlist; do not return private photo references. */
export function publicGalleryView(gallery) {
  if (!gallery || gallery.status !== 'published' || !uuid(gallery.id) || !gallery.published_at) deny('NOT_PUBLIC');
  const fields = [
    'id','author','title','body','country_code','country_name',
    'region','city','theme','layout','language_code','published_at'
  ];
  const result = {};
  for (const key of fields) result[key] = gallery[key];
  return Object.freeze(result);
}

/**
 * A broker may serve an already verified/public gallery photo position; never
 * return storage paths, raw objects or signed URLs to a caller here.
 */
export function publishedMediaAllowed({gallery, photoPosition, releasedPositions, onSafetyHold = false}) {
  if (!gallery || gallery.status !== 'published' || !gallery.published_at || onSafetyHold) return false;
  if (!Number.isInteger(photoPosition) || photoPosition < 0 || photoPosition > 3) return false;
  return Array.isArray(releasedPositions) && releasedPositions.includes(photoPosition);
}
