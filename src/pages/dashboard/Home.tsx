import { useUserRole } from '@/hooks/useUserRole';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import AgentDashboard from '@/components/dashboard/AgentDashboard';
import UniversityDashboard from '@/components/dashboard/UniversityDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

const Home = () => {
  const { role, isLoading } = useUserRole();

  if (isLoading || !role) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Render role-specific dashboard
  switch (role) {
    case 'student':
      return <StudentDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'university_official':
      return <UniversityDashboard />;
    case 'administrator':
      return <AdminDashboard />;
    default:
      return null;
  }
};

export default Home;
