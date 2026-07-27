export const USER_ROLE = {
  user: 'user',
  admin: 'admin',
  super_admin: 'super_admin',
} as const;

export const USER_STATUS = {
  active: 'active',
  blocked: 'blocked',
} as const;

export const isSuperAdminRole = (role?: string) => {
  return role === USER_ROLE.super_admin;
};

export const isAdminRole = (role?: string) => {
  return role === USER_ROLE.admin || isSuperAdminRole(role);
};
