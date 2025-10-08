import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type RoleRecord = Record<string, unknown> | null;

export type UserRole = 'student' | 'agent' | 'university_official' | 'administrator';

interface RoleContextValue {
  role: UserRole | null;
  isLoading: boolean;
  userData: RoleRecord;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const resolveRoleFromTables = async (userId: string) => {
  const [studentCheck, agentCheck, universityCheck, adminCheck] = await Promise.all([
    supabase.from('students').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('agents').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('university_officials').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('administrators').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (universityCheck.data && !universityCheck.error) {
    return { role: 'university_official' as const, data: universityCheck.data };
  }
  if (adminCheck.data && !adminCheck.error) {
    return { role: 'administrator' as const, data: adminCheck.data };
  }
  if (agentCheck.data && !agentCheck.error) {
    return { role: 'agent' as const, data: agentCheck.data };
  }
  if (studentCheck.data && !studentCheck.error) {
    return { role: 'student' as const, data: studentCheck.data };
  }

  return { role: null, data: null };
};

const mapMetadataRole = (value?: string | null): UserRole | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === 'admin' || lower === 'administrator') {
    return 'administrator';
  }
  if (lower === 'agent') return 'agent';
  if (lower === 'student') return 'student';
  if (lower === 'university_official') return 'university_official';
  return null;
};

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<RoleRecord>(null);
  const [isLoading, setIsLoading] = useState(true);

  const determineRole = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error) {
        if (error.name === 'AuthSessionMissingError' || error.message?.toLowerCase().includes('auth session missing')) {
          setRole(null);
          setUserData(null);
          return;
        }
        throw error;
      }

      const user = authData.user;
      if (!user) {
        setRole(null);
        setUserData(null);
        return;
      }

      const metadataRole = mapMetadataRole(user.user_metadata?.role as string | undefined);
      if (metadataRole === 'administrator') {
        setRole('administrator');
        setUserData({ user_id: user.id, source: 'metadata' });
        return;
      }

      const { role: detectedRole, data } = await resolveRoleFromTables(user.id);
      if (detectedRole) {
        setRole(detectedRole);
        setUserData(data);
      } else {
        const normalizedRole = metadataRole;

        if (normalizedRole) {
          setRole(normalizedRole as UserRole);
          setUserData({ user_id: user.id });
        } else {
          setRole(null);
          setUserData(null);
        }
      }
    } catch (fetchError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error determining user role:', fetchError);
      }
      setRole(null);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    determineRole();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        determineRole();
      } else {
        setRole(null);
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [determineRole]);

  const value: RoleContextValue = {
    role,
    isLoading,
    userData,
    refreshRole: determineRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRoleContext = (): RoleContextValue => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRoleContext must be used within a RoleProvider');
  }
  return context;
};
