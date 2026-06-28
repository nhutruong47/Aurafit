export function getUserRoles(user) {
  return user?.role?.split(',').map((role) => role.trim()).filter(Boolean) || [];
}

export function hasUserRole(user, role) {
  const roles = getUserRoles(user);
  const adminInheritedRoles = ['SELLER', 'STAFF', 'CUSTOMER'];
  return roles.includes(role) || (roles.includes('ADMIN') && adminInheritedRoles.includes(role));
}
