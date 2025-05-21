import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Mock API function - replace with actual API call later
const fetchStats = async () => {
  // This will be replaced with actual API call
  return {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  };
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center">Loading statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Stats Card */}
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Tasks</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {stats?.totalTasks || 0}
              </dd>
            </div>
            
            {/* Stats Card */}
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Completed Tasks</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {stats?.completedTasks || 0}
              </dd>
            </div>
            
            {/* Stats Card */}
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Pending Tasks</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {stats?.pendingTasks || 0}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 