import { User, UserRole } from '../types';

export interface RolePermissions {
  canAccessPOS: boolean;
  canViewSalesHistory: boolean;
  canManageProducts: boolean;
  canStockInOut: boolean;
  canViewProfitAndCost: boolean;
  canViewReports: boolean;
  canManageCustomers: boolean;
  canManageSuppliers: boolean;
  canAccessSettings: boolean;
  canDeleteRecords: boolean;
  canSwitchRoles: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    canAccessPOS: true,
    canViewSalesHistory: true,
    canManageProducts: true,
    canStockInOut: true,
    canViewProfitAndCost: true,
    canViewReports: true,
    canManageCustomers: true,
    canManageSuppliers: true,
    canAccessSettings: true,
    canDeleteRecords: true,
    canSwitchRoles: true,
  },
  Manager: {
    canAccessPOS: true,
    canViewSalesHistory: true,
    canManageProducts: true,
    canStockInOut: true,
    canViewProfitAndCost: true,
    canViewReports: true,
    canManageCustomers: true,
    canManageSuppliers: true,
    canAccessSettings: false,
    canDeleteRecords: false,
    canSwitchRoles: false,
  },
  Cashier: {
    canAccessPOS: true,
    canViewSalesHistory: true,
    canManageProducts: false,
    canStockInOut: false,
    canViewProfitAndCost: false,
    canViewReports: false,
    canManageCustomers: true,
    canManageSuppliers: false,
    canAccessSettings: false,
    canDeleteRecords: false,
    canSwitchRoles: false,
  },
};

export function normalizeUserRole(role: any): UserRole {
  if (!role || typeof role !== 'string') return 'Admin';
  const r = role.toLowerCase().trim();
  if (r.includes('cashier')) return 'Cashier';
  if (r.includes('manager')) return 'Manager';
  return 'Admin';
}

export function hasPermission(user: User | null, permission: keyof RolePermissions): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  const roleConfig = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Cashier;
  return roleConfig[permission];
}

export function getRoleColor(role?: any): { bg: string; text: string; border: string } {
  const normalized = normalizeUserRole(role);
  switch (normalized) {
    case 'Admin':
      return {
        bg: 'bg-purple-100 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-300 dark:border-purple-800',
      };
    case 'Manager':
      return {
        bg: 'bg-blue-100 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-800',
      };
    case 'Cashier':
    default:
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-300 dark:border-emerald-800',
      };
  }
}
