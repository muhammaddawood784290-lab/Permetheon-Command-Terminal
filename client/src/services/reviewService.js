// =====================================================================
// reviewService — fetches and manipulates review data.
// All status/permission decisions are enforced on the backend in the
// real deployment; this layer mirrors the documented workflow in
// REVIEW_SYSTEM.md.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import { mockReviews, findReviewById, findUserById } from '../mock/mockData';
import { REVIEW_STATUS } from '../utils/constants';

function nextFeedbackId(review) {
  return `fb_${review.feedback.length + 1}_${Date.now().toString(36)}`;
}

function resolveActor(actor) {
  if (actor && actor.id && actor.name) return { id: actor.id, name: actor.name };
  // Fall back to a placeholder identity so the mock layer never crashes
  // when a caller forgets to pass a user. Real backend will receive the
  // authenticated session user.
  return { id: 'u_current', name: 'You' };
}

function appendFeedback(review, message, actor, extras = {}) {
  const now = new Date().toISOString();
  const author = resolveActor(actor);
  review.feedback = [
    ...review.feedback,
    {
      id: nextFeedbackId(review),
      authorId: author.id,
      authorName: author.name,
      message,
      createdAt: now,
      ...extras,
    },
  ];
  review.updatedAt = now;
  return review;
}

export const reviewService = {
  async list(params = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      reviewerId,
      assigneeId,
      projectId,
      search: term,
      sort = 'updatedAt',
      order = 'desc',
      onlyMine,
      actorId,
    } = params;

    let list = [...mockReviews];

    // Only-mine scope is honored when callers pass it. This lets the
    // queue page show a developer their own reviews without leaking
    // unrelated items.
    if (onlyMine && actorId) {
      list = list.filter(
        (r) => r.assigneeId === actorId || r.reviewerId === actorId,
      );
    }

    if (status && status !== 'all') list = applyFilters(list, { status });
    if (reviewerId) list = applyFilters(list, { reviewerId });
    if (assigneeId) list = applyFilters(list, { assigneeId });
    if (projectId) list = applyFilters(list, { projectId });

    if (term) {
      list = search(
        list,
        ['taskTitle', 'projectName', 'reviewerName', 'assigneeName', 'feedback.message'],
        term,
      );
    }

    list = sortBy(list, sort, order);
    return ok(paginate(list, { page, limit }));
  },

  async get(id) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    return ok(review);
  },

  async start(id, { actor } = {}) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    if (review.status === REVIEW_STATUS.APPROVED) {
      return fail('This review has already been approved.', 400);
    }
    const now = new Date().toISOString();
    const previousStatus = review.status;
    review.status = REVIEW_STATUS.IN_REVIEW;
    review.startedAt = review.startedAt || now;
    review.updatedAt = now;
    appendFeedback(
      review,
      `Started review (was ${previousStatus}).`,
      actor,
      { kind: 'system', action: 'start' },
    );
    return ok(review);
  },

  async approve(id, feedback = '', { actor } = {}) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);

    // Mirror the backend guard: a developer may not approve their own work.
    const author = resolveActor(actor);
    if (author.id && review.assigneeId === author.id) {
      return fail('You cannot approve your own work.', 403);
    }

    const message = (feedback || '').trim() || 'Approved.';
    review.status = REVIEW_STATUS.APPROVED;
    review.approvedAt = new Date().toISOString();
    appendFeedback(review, message, actor, { kind: 'decision', action: 'approve' });
    return ok(review);
  },

  async requestRevision(id, message, { actor } = {}) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    const trimmed = (message || '').trim();
    if (!trimmed) return fail('A revision reason is required.', 400);

    review.status = REVIEW_STATUS.REVISION_REQUIRED;
    review.revisionRequestedAt = new Date().toISOString();
    appendFeedback(review, trimmed, actor, { kind: 'decision', action: 'requestRevision' });
    return ok(review);
  },

  async resubmit(id, message = '', { actor } = {}) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    if (review.status !== REVIEW_STATUS.REVISION_REQUIRED) {
      return fail('Only reviews awaiting revision can be resubmitted.', 400);
    }
    const author = resolveActor(actor);
    if (author.id && review.assigneeId !== author.id) {
      return fail('Only the original developer can resubmit this review.', 403);
    }
    review.status = REVIEW_STATUS.RESUBMITTED;
    review.attempt = (review.attempt || 1) + 1;
    review.resubmittedAt = new Date().toISOString();
    review.updatedAt = review.resubmittedAt;
    appendFeedback(
      review,
      (message || '').trim() || 'Resubmitted with the requested changes.',
      actor,
      { kind: 'system', action: 'resubmit' },
    );
    return ok(review);
  },

  async assign(id, reviewerId, { actor } = {}) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    if (!reviewerId) return fail('Reviewer is required.', 400);
    const reviewer = findUserById(reviewerId);
    if (!reviewer) return fail('Reviewer not found.', 404);
    review.reviewerId = reviewerId;
    review.reviewerName = reviewer.name;
    review.assignedAt = new Date().toISOString();
    review.updatedAt = review.assignedAt;
    appendFeedback(
      review,
      `Reassigned to ${reviewer.name}.`,
      actor,
      { kind: 'system', action: 'assign' },
    );
    return ok(review);
  },

  async remove(id) {
    const idx = mockReviews.findIndex((r) => r.id === id);
    if (idx === -1) return fail('Review not found.', 404);
    mockReviews.splice(idx, 1);
    return ok({ id });
  },

  async stats() {
    const reviews = mockReviews;
    return ok({
      total: reviews.length,
      submitted: reviews.filter((r) => r.status === REVIEW_STATUS.SUBMITTED).length,
      inReview: reviews.filter((r) => r.status === REVIEW_STATUS.IN_REVIEW).length,
      approved: reviews.filter((r) => r.status === REVIEW_STATUS.APPROVED).length,
      revisionRequired: reviews.filter((r) => r.status === REVIEW_STATUS.REVISION_REQUIRED).length,
      resubmitted: reviews.filter((r) => r.status === REVIEW_STATUS.RESUBMITTED).length,
      pending:
        reviews.filter((r) => r.status === REVIEW_STATUS.SUBMITTED).length +
        reviews.filter((r) => r.status === REVIEW_STATUS.RESUBMITTED).length,
    });
  },
};

export default reviewService;