// =====================================================================
// PermissionRoute — gates a route behind a permission key.
// Renders 403 page when the user lacks the permission.
// =====================================================================

import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import ForbiddenPage from '../../pages/errors/ForbiddenPage';

export default function PermissionRoute({ permission, children }) {
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
    return <ForbiddenPage requiredPermission={permission} />;
  }

  return children;
}
