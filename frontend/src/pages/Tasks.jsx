import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Mock API functions - replace these with actual API calls later
const fetchTasks = async () => {
  // This will be replaced with actual API call
  return [];
};

const createTask = async (task) => {
  // This will be replaced with actual API call
  return { id: Date.now(), ...task };
};

const updateTask = async (task) => {
  // This will be replaced with actual API call
  return task;
};

export default function Tasks() {
  const [newTask, setNewTask] = useState('');
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      createTaskMutation.mutate({
        title: newTask,
        completed: false,
      });
    }
  };

  const toggleTask = (task) => {
    updateTaskMutation.mutate({
      ...task,
      completed: !task.completed,
    });
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="mb-6">
            <div className="flex gap-x-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Add a new task..."
              />
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>

          {/* Task List */}
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <li key={task.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task)}
                          disabled={updateTaskMutation.isPending}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <p className={`ml-3 text-sm font-medium ${
                          task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {tasks.length === 0 && (
                <li className="px-4 py-4 text-center text-sm text-gray-500">
                  No tasks yet. Add one above!
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 