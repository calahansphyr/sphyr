import React from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/components/layout';
import { SimplifiedDashboard } from '@/components/dashboard/SimplifiedDashboard';

const Dashboard: React.FC = () => {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/search');
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <MainLayout>
        <SimplifiedDashboard 
          onSearch={handleSearch}
          onNavigate={handleNavigate}
        />
      </MainLayout>
    </>
  );
};

export default Dashboard;
