// =====================================================================
// reviewService — fetches and manipulates review data.
// Mutations emit activity events via the shared `recordActivity` helper
// so the Activity page sees them immediately. Review events target the
// underlying task so the timeline aggregates around the task the user
// is most likely to navigate to from a notification.
//
// All status/permission decisions are enforced on the backend in the
// real deployment; this layer mirrors the documented workflow in
// REVIEW_SYSTEM.md.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import {
  mockReviews,
  mockUsers,
  findReviewById,
  findUserById,
  findTaskById,
  findProjectById,
} from '../mock/mockData';
import { ACTIVITY_ACTION, REVIEW_STATUS, TASK_STATUS, ROLE } from '../utils/constants';
import { recordActivity } from './activityHelpers';
import taskService from './taskService';

function nextReviewId() {
  // Mirror the existing seed convention: `r_<n>`. The seed counter lives
  // inside mockData.js and is not exported, so we read the highest numeric
  // suffix from the current mockReviews array. This keeps new IDs in the
  // same numeric range as the seed.
  let max = 70;
  for (const r of mockReviews) {
    if (typeof r.id !== 'string') continue;
    const match = /^r_(\d+)$/.exec(r.id);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `r_${max + 1}`;
}

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

  // Create a new review for a task. Per REVIEW_SYSTEM.md §38, submission
  // moves the task to IN_REVIEW and the review to SUBMITTED. Per §47,
  // only one active review may exist per task at a time. The reviewer
  // cannot be the task assignee (§18 self-approval rule).
  async create(payload, { actor } = {}) {
    const author = resolveActor(actor);
    if (!author.id || author.id === 'u_current') {
      // We require an authenticated actor for create. The placeholder
      // identity is only useful for read-only feedback events.
      return fail('You must be signed in to create a review.', 401);
    }

    const taskId = payload?.taskId;
    if (!taskId) return fail('Task is required.', 400);

    const task = findTaskById(taskId);
    if (!task) return fail('Task not found.', 404);

    // Eligibility: only tasks that are actively in progress can be sent
    // for review. Backlog/TODO have not started; IN_REVIEW / REVISION_REQUIRED
    // already have an active review per §47; COMPLETED / BLOCKED / CANCELLED
    // are not eligible for fresh review.
    const eligibleStatuses = [TASK_STATUS.IN_PROGRESS];
    if (!eligibleStatuses.includes(task.status)) {
      return fail(
        `This task is "${task.status}" and cannot be sent for review. Only In Progress tasks are eligible.`,
        400,
      );
    }

    // Task must be assigned to a developer — the review is on someone's
    // work, so it has to know who they are.
    if (!task.assigneeId) {
      return fail('Assign the task to a developer before creating a review.', 400);
    }

    // Duplicate guard (§47 "one active review per task").
    const activeStatuses = [
      REVIEW_STATUS.SUBMITTED,
      REVIEW_STATUS.IN_REVIEW,
      REVIEW_STATUS.RESUBMITTED,
    ];
    const existing = mockReviews.find(
      (r) => r.taskId === taskId && activeStatuses.includes(r.status),
    );
    if (existing) {
      return fail('This task already has an active review.', 400);
    }

    // Resolve the reviewer. Either an explicit reviewerId or auto-pick
    // the first active ADMIN or TEAM_LEAD who is not the assignee.
    let reviewer = null;
    if (payload.reviewerId) {
      reviewer = findUserById(payload.reviewerId);
      if (!reviewer) return fail('Reviewer not found.', 404);
      if (reviewer.id === task.assigneeId) {
        return fail('Reviewer cannot be the same person as the assignee.', 400);
      }
    } else {
      reviewer = mockUsers.find(
        (u) =>
          (u.role === ROLE.ADMIN || u.role === ROLE.TEAM_LEAD) &&
          u.id !== task.assigneeId &&
          u.status !== 'INACTIVE',
      );
      if (!reviewer) {
        return fail('No eligible reviewer available.', 400);
      }
    }

    const project = findProjectById(task.projectId);
    const assignee = findUserById(task.assigneeId);
    const now = new Date().toISOString();
    const trimmedNote = (payload.note || '').trim();

    const review = {
      id: nextReviewId(),
      taskId: task.id,
      taskTitle: task.title,
      taskCode: task.code,
      projectId: task.projectId,
      projectName: project?.name || task.projectId,
      assigneeId: task.assigneeId,
      assigneeName: assignee?.name || task.assigneeId,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      status: REVIEW_STATUS.SUBMITTED,
      submittedAt: now,
      updatedAt: now,
      attempt: 1,
      feedback: trimmedNote
        ? [
            {
              id: `fb_create_${Date.now().toString(36)}`,
              authorId: author.id,
              authorName: author.name,
              message: trimmedNote,
              createdAt: now,
              kind: 'comment',
              action: 'note',
            },
          ]
        : [],
    };

    mockReviews.unshift(review);

    // Per §38, submission also moves the task to IN_REVIEW. We delegate
    // to taskService.updateStatus so the underlying task dataset is
    // mutated through the same code path the rest of the app uses and
    // the matching TASK_STATUS_CHANGED activity entry is recorded.
    // If the task update fails for any reason, we roll back the review
    // insertion so the two stores stay consistent.
    let taskUpdateFailed = null;
    try {
      const taskRes = await taskService.updateStatus(
        task.id,
        TASK_STATUS.IN_REVIEW,
        { actor },
      );
      if (!taskRes?.success) {
        taskUpdateFailed = taskRes?.message || 'Could not update task status.';
      }
    } catch (err) {
      taskUpdateFailed = err?.message || 'Could not update task status.';
    }

    if (taskUpdateFailed) {
      const idx = mockReviews.findIndex((r) => r.id === review.id);
      if (idx !== -1) mockReviews.splice(idx, 1);
      return fail(taskUpdateFailed, 400);
    }

    // Single review-side activity event for the create. The task status
    // transition above emits its own TASK_STATUS_CHANGED entry — that
    // is the documented pattern for paired events on submission.
    recordActivity({
      action: ACTIVITY_ACTION.TASK_SUBMITTED,
      actor,
      targetType: 'task',
      targetId: task.id,
      targetLabel: task.title,
      projectId: task.projectId,
      summary: `${actor.name} submitted Task ${task.code} for review`,
      metadata: {
        reviewId: review.id,
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
      },
    });

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

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_SUBMITTED,
        actor,
        targetType: 'task',
        targetId: review.taskId,
        targetLabel: review.taskTitle || review.taskId,
        projectId: review.projectId,
        summary: `${actor.name} started review of ${review.taskTitle || review.taskId}`,
        metadata: { reviewId: review.id, from: previousStatus, to: review.status },
      });
    }

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
    const previousStatus = review.status;
    review.status = REVIEW_STATUS.APPROVED;
    review.approvedAt = new Date().toISOString();
    appendFeedback(review, message, actor, { kind: 'decision', action: 'approve' });

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_APPROVED,
        actor,
        targetType: 'task',
        targetId: review.taskId,
        targetLabel: review.taskTitle || review.taskId,
        projectId: review.projectId,
        summary: `${actor.name} approved ${review.taskTitle || review.taskId}`,
        metadata: {
          reviewId: review.id,
          from: previousStatus,
          to: review.status,
          feedback: message,
        },
      });
    }

    return ok(review);
  },

  async requestRevision(id, message, { actor } = {}) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    const trimmed = (message || '').trim();
    if (!trimmed) return fail('A revision reason is required.', 400);

    const previousStatus = review.status;
    review.status = REVIEW_STATUS.REVISION_REQUIRED;
    review.revisionRequestedAt = new Date().toISOString();
    appendFeedback(review, trimmed, actor, { kind: 'decision', action: 'requestRevision' });

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_REVISION_REQUESTED,
        actor,
        targetType: 'task',
        targetId: review.taskId,
        targetLabel: review.taskTitle || review.taskId,
        projectId: review.projectId,
        summary: `${actor.name} requested revision on ${review.taskTitle || review.taskId}`,
        metadata: {
          reviewId: review.id,
          from: previousStatus,
          to: review.status,
          reason: trimmed,
        },
      });
    }

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
    const previousStatus = review.status;
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

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_SUBMITTED,
        actor,
        targetType: 'task',
        targetId: review.taskId,
        targetLabel: review.taskTitle || review.taskId,
        projectId: review.projectId,
        summary: `${actor.name} resubmitted ${review.taskTitle || review.taskId} for review`,
        metadata: {
          reviewId: review.id,
          from: previousStatus,
          to: review.status,
          attempt: review.attempt,
        },
      });
    }

    return ok(review);
  },

  async assign(id, reviewerId, { actor } = {}) {
    const review = findReviewById(id);
    if (!review) return fail('Review not found.', 404);
    if (!reviewerId) return fail('Reviewer is required.', 400);
    const reviewer = findUserById(reviewerId);
    if (!reviewer) return fail('Reviewer not found.', 404);
    const previousReviewerId = review.reviewerId;
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

    if (actor && previousReviewerId !== reviewerId) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_REASSIGNED,
        actor,
        targetType: 'task',
        targetId: review.taskId,
        targetLabel: review.taskTitle || review.taskId,
        projectId: review.projectId,
        summary: `${actor.name} reassigned review of ${review.taskTitle || review.taskId} to ${reviewer.name}`,
        metadata: {
          reviewId: review.id,
          from: previousReviewerId,
          to: reviewerId,
          reviewerName: reviewer.name,
        },
      });
    }

    return ok(review);
  },

  async remove(id, { actor } = {}) {
    const idx = mockReviews.findIndex((r) => r.id === id);
    if (idx === -1) return fail('Review not found.', 404);
    const removed = mockReviews[idx];
    mockReviews.splice(idx, 1);

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_ARCHIVED,
        actor,
        targetType: 'task',
        targetId: removed.taskId,
        targetLabel: removed.taskTitle || removed.taskId,
        projectId: removed.projectId,
        summary: `${actor.name} removed review of ${removed.taskTitle || removed.taskId}`,
        metadata: { reviewId: removed.id },
      });
    }

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