import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Mock API functions - replace with actual API calls
const fetchTasks = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    {
      id: '1',
      title: 'Complete project documentation',
      completed: false,
      createdAt: new Date('2024-02-20T10:00:00'),
      priority: 'high',
    },
    {
      id: '2',
      title: 'Review pull requests',
      completed: true,
      createdAt: new Date('2024-02-19T15:30:00'),
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Update dependencies',
      completed: false,
      createdAt: new Date('2024-02-18T09:15:00'),
      priority: 'low',
    },
  ];
};

const createTask = async (task) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...task, id: Date.now().toString() };
};

const updateTask = async (task) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return task;
};

const deleteTask = async (taskId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return taskId;
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const Tasks = () => {
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
      setPriority('medium');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    createTaskMutation.mutate({
      title: newTask,
      completed: false,
      createdAt: new Date(),
      priority,
    });
  };

  const handleToggleTask = (task) => {
    updateTaskMutation.mutate({
      ...task,
      completed: !task.completed,
    });
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask(task.title);
    setPriority(task.priority);
  };

  const handleUpdateTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    updateTaskMutation.mutate({
      ...editingTask,
      title: newTask,
      priority,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your tasks and track your progress.
          </p>
        </div>
      </div>

      <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <div className="w-40">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {editingTask ? (
              <>
                <PencilIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Update Task
              </>
            ) : (
              <>
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Add Task
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {tasks?.map((task) => (
            <li key={task.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created {format(task.createdAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${priorityColors[task.priority]}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </span>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Tasks; 