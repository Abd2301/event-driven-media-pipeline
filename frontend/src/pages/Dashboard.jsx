import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

// Mock API function - replace with actual API call
const fetchStats = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    totalTasks: 12,
    completedTasks: 5,
    pendingTasks: 7,
    productivityScore: 75,
    tasksThisWeek: 8,
    tasksLastWeek: 6,
  };
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const productivityChange = ((stats.tasksThisWeek - stats.tasksLastWeek) / stats.tasksLastWeek) * 100;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back! Here's an overview of your tasks and productivity.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/tasks"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <ClipboardDocumentListIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            View All Tasks
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Tasks Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Tasks</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Completed Tasks</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.completedTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Tasks Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Pending Tasks</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Productivity Score Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Productivity Score</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stats.productivityScore}%</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                <ArrowTrendingUpIcon className="h-5 w-5 flex-shrink-0 self-center text-green-500" aria-hidden="true" />
                <span className="sr-only">Increased by</span>
                {productivityChange.toFixed(1)}%
              </p>
            </div>
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${stats.productivityScore}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Weekly Progress</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stats.tasksThisWeek}</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                <ArrowTrendingUpIcon className="h-5 w-5 flex-shrink-0 self-center text-green-500" aria-hidden="true" />
                <span className="sr-only">Increased by</span>
                {stats.tasksThisWeek - stats.tasksLastWeek} tasks
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-500">vs {stats.tasksLastWeek} tasks last week</p>
          </div>
        </div>
      </div>
    </div>
  );
} 