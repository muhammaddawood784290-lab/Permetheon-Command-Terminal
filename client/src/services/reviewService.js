// =====================================================================
// reviewService — fetches and manipulates review data.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import { mockReviews, findReviewById } from '../mock/mockData';

export const reviewService = {
  async list(params = {}) {
    const { page = 1, limit = 20, status, reviewerId, assigneeId, search: term } = params;
    let list = [...mockReviews];
    if (status && status !== 'all') list = applyFilters(list, { status });
    if (reviewerId) list = applyFilters(list, { reviewerId });
    if (assigneeId) list = applyFilters(list, { assigneeId });
    if (term) list = search(list, ['taskTitle', 'taskTitle', 'projectName'], term);
    list = sortBy(list, 'updatedAt', 'desc');
    return ok(paginate(list, { page, limit }));
  },

  async get(id) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    return ok(review);
  },

  async approve(id, feedback = '') {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    review.status = 'APPROVED';
    review.feedback = [
      ...review.feedback,
      {
        id: 'fb_' + (review.feedback.length + 1),
        authorId: 'u_current',
        authorName: 'You',
        message: feedback || 'Approved.',
        createdAt: new Date().toISOString(),
      },
    ];
    review.updatedAt = new Date().toISOString();
    return ok(review);
  },

  async requestRevision(id, message) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    if (!message) return fail('Revision message is required.', 400);
    review.status = 'REVISION_REQUIRED';
    review.feedback = [
      ...review.feedback,
      {
        id: 'fb_' + (review.feedback.length + 1),
        authorId: 'u_current',
        authorName: 'You',
        message,
        createdAt: new Date().toISOString(),
      },
    ];
    review.updatedAt = new Date().toISOString();
    return ok(review);
  },

  async stats() {
    return ok({
      pending: mockReviews.filter((r) => r.status === 'IN_REVIEW' || r.status === 'SUBMITTED').length,
      approved: mockReviews.filter((r) => r.status === 'APPROVED').length,
      revisionRequired: mockReviews.filter((r) => r.status === 'REVISION_REQUIRED').length,
    });
  },
};

export default reviewService;
