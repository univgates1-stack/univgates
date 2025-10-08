import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  
  // In production, always use the custom domain if available
  if (import.meta.env.PROD && import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  
  // In development or if no custom domain is set, use window.location.origin
  return window.location.origin;
};

export const redirectTo = (path: string) => {
  if (typeof window === 'undefined') return;
  
  const targetPath = path.startsWith('/') ? path : `/${path}`;
  
  // If we're on the preview domain, redirect to production
  if (window.location.hostname === 'preview--univgates-connect.lovable.app') {
    window.location.href = `https://univgates.com.tr${targetPath}`;
    return;
  }
  
  // Otherwise, use normal navigation
  window.location.href = targetPath;
};

export const handleAuthRedirect = async (user: User | null) => {
  if (!user) return;

  const rawMetadataRole = user.user_metadata?.role as string | undefined;
  const normalizedMetadataRole = rawMetadataRole?.toLowerCase();
  
  if (normalizedMetadataRole === 'administrator' || normalizedMetadataRole === 'admin') {
    redirectTo('/dashboard');
    return;
  }

  try {
    const { data: adminRecord, error } = await supabase
      .from('administrators')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking administrator role:', error);
    }

    if (adminRecord) {
      redirectTo('/dashboard');
      return;
    }

    redirectTo('/onboarding');
  } catch (roleError) {
    console.error('Failed to determine user role during sign-in:', roleError);
    redirectTo('/onboarding');
  }
};