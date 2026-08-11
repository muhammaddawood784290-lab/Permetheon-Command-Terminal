// =====================================================================
// reportService — fetches operational reports.
// =====================================================================

import { ok } from './api';
import { mockReportData } from '../mock/mockData';

export const reportService = {
  async overview() {
    return ok(mockReportData.overview);
  },

  async taskStatusDistribution() {
    return ok(mockReportData.taskStatusDistribution);
  },

  async workloadByDeveloper() {
    return ok(mockReportData.workloadByDeveloper);
  },

  async completionTrend() {
    return ok(mockReportData.completionTrend);
  },

  async reviewStats() {
    return ok(mockReportData.reviewStats);
  },

  async projectProgress() {
    return ok(mockReportData.projectProgress);
  },
};

export default reportService;
