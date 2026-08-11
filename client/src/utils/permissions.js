// =====================================================================
// Permissions helper
// Mirrors the role -> permission mapping defined in ROLE_PERMESSIONS.md
// =====================================================================

import { ROLE } from './constants';

const PERMISSIONS = {
  // Projects
  'project.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'project.create': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'project.update': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'project.delete': [ROLE.ADMIN],
  'project.archive': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'project.manageMembers': [ROLE.ADMIN, ROLE.TEAM_LEAD],

  // Tasks
  'task.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'task.create': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'task.update': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'task.delete': [ROLE.ADMIN],
  'task.assign': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'task.changeStatus': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],

  // Reviews
  'review.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'review.submit': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'review.approve': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'review.requestRevision': [ROLE.ADMIN, ROLE.TEAM_LEAD],

  // Files
  'file.upload': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'file.download': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'file.delete': [ROLE.ADMIN, ROLE.TEAM_LEAD],

  // Reports
  'report.view': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'report.export': [ROLE.ADMIN, ROLE.TEAM_LEAD],

  // Activity
  'activity.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],

  // Users / roles
  'user.view': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'user.create': [ROLE.ADMIN],
  'user.update': [ROLE.ADMIN],
  'user.disable': [ROLE.ADMIN],
  'user.changeRole': [ROLE.ADMIN],

  // Settings
  'settings.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'settings.update': [ROLE.ADMIN],
};

export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(user.role);
}

export function hasAnyPermission(user, permissions = []) {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(user, permissions = []) {
  return permissions.every((p) => hasPermission(user, p));
}

export function getUserPermissions(user) {
  if (!user) return [];
  return Object.keys(PERMISSIONS).filter((p) => hasPermission(user, p));
}

export function isAdmin(user) {
  return user?.role === ROLE.ADMIN;
}

export function isTeamLead(user) {
  return user?.role === ROLE.TEAM_LEAD;
}

export function isDeveloper(user) {
  return user?.role === ROLE.DEVELOPER;
}