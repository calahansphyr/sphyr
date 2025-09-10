import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/lib/api-client';
import React from 'react';

export default function UserNav(): React.JSX.Element {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  return <div>Welcome, {data?.name}</div>;
}
