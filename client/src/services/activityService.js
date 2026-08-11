// =====================================================================
// activityService — fetches the system activity log.
// =====================================================================

import { ok, paginate, applyFilters, sortBy } from './api';
import { mockActivity } from '../mock/mockData';

export const activityService = {
  async list(params = {}) {
    const { page = 1, limit = 50, action, actorId, targetType, targetId } = params;
    let list = [...mockActivity];
    if (action) list = applyFilters(list, { action });
    if (actorId) list = applyFilters(list, { actorId });
    if (targetType) list = applyFilters(list, { targetType });
    if (targetId) list = applyFilters(list, { targetId });
    list = sortBy(list, 'createdAt', 'desc');
    return ok(paginate(list, { page, limit }));
  },
};

export default activityService;
