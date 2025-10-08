import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface ProfileCompletionData {
  isComplete: boolean;
  completionPercentage: number;
  shouldShowModal: boolean;
}

export const useProfileCompletion = () => {
  const [profileData, setProfileData] = useState<ProfileCompletionData>({
    isComplete: false,
    completionPercentage: 0,
    shouldShowModal: false
  });
  const [loading, setLoading] = useState(true);
  const { role } = useUserRole();

  useEffect(() => {
    if (role !== 'student') {
      setProfileData({
        isComplete: true,
        completionPercentage: 100,
        shouldShowModal: false,
      });
      setLoading(false);
      return;
    }

    checkProfileCompletion();
  }, [role]);

  const checkProfileCompletion = async () => {
    try {
      if (role !== 'student') {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user has already been reminded this session
      const reminderStatus = localStorage.getItem('profile_completion_reminder');
      
      // Get student profile data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentError && studentError.code !== 'PGRST116') {
        throw studentError;
      }

      // Get user basic data
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw userError;
      }

      // Calculate completion percentage
      let completionScore = 0;
      let totalFields = 0;

      // Basic user info (20% weight)
      const basicFields = ['first_name', 'last_name', 'email'];
      basicFields.forEach(field => {
        totalFields += 1;
        if (userProfile[field]) completionScore += 1;
      });

      if (student) {
        // Student specific fields (80% weight)
        const studentFields = [
          'date_of_birth',
          'country_of_origin',
          'passport_number',
          'current_study_level',
          'graduated_school_name',
          'graduation_date',
          'degree_grade'
        ];
        
        studentFields.forEach(field => {
          totalFields += 1;
          if (student[field]) completionScore += 1;
        });

      // Check profile completion status from database
      const isComplete = student?.profile_completion_status === 'complete';
      const completionPercentage = Math.round((completionScore / totalFields) * 100);
      
      setProfileData({
        isComplete,
        completionPercentage,
        shouldShowModal: !isComplete && reminderStatus !== 'later' && student?.profile_completion_status !== 'complete'
      });
      } else {
        // New user without student profile
        setProfileData({
          isComplete: false,
          completionPercentage: Math.round((completionScore / totalFields) * 100),
          shouldShowModal: reminderStatus !== 'later'
        });
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileData({
        isComplete: false,
        completionPercentage: 0,
        shouldShowModal: false
      });
    } finally {
      setLoading(false);
    }
  };

  const markProfileComplete = async () => {
    try {
      if (role !== 'student') return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update completion status in local state
      setProfileData(prev => ({
        ...prev,
        isComplete: true,
        shouldShowModal: false
      }));
    } catch (error) {
      console.error('Error marking profile complete:', error);
    }
  };

  const refreshProfileStatus = () => {
    if (role === 'student') {
      checkProfileCompletion();
    }
  };

  return {
    ...profileData,
    loading,
    markProfileComplete,
    refreshProfileStatus
  };
};
