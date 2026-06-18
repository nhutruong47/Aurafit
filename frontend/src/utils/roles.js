export function getUserRoles(user) {
  return user?.role?.split(',').map((role) => role.trim()).filter(Boolean) || [];
}

export function hasUserRole(user, role) {
  return getUserRoles(user).includes(role);
}
