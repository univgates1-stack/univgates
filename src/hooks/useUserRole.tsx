import { useRoleContext } from '@/context/RoleContext';

export { RoleProvider } from '@/context/RoleContext';
export type { UserRole } from '@/context/RoleContext';

export const useUserRole = () => {
  return useRoleContext();
};
