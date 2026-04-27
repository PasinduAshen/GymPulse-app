export const decodeJwtPayload = (token) => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getRoleFromToken = (token) => {
  const payload = decodeJwtPayload(token);
  return (payload?.role || 'USER').toUpperCase();
};

export const getUserRole = () => {
  const token = localStorage.getItem('token');
  return getRoleFromToken(token);
};

export const getDefaultRouteByRole = (role) => {
  const normalizedRole = (role || 'USER').toUpperCase();

  if (normalizedRole === 'ADMIN') return '/dashboard';
  if (normalizedRole === 'MANAGER') return '/dashboard';

  // Normal users land on dashboard with read-focused navigation/actions.
  return '/dashboard';
};

export const hasAnyRole = (allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  const role = getUserRole().toUpperCase();
  return allowedRoles.map((item) => item.toUpperCase()).includes(role);
};
