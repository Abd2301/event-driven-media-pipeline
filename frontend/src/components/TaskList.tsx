import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../services/api';

const TaskList: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: tasks = [], isLoading, error, refetch } = useTasks();
  const createTaskMutation = useCreateTask();

  const filteredTasks = tasks.filter((task: Task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusCount = (status: string) => {
    return tasks.filter((task: Task) => task.status === status).length;
  };

  const handleCreateTask = (data: CreateTaskRequest | UpdateTaskRequest) => {
    // For create operations, we know it's a CreateTaskRequest
    createTaskMutation.mutate(data as CreateTaskRequest, {
      onSuccess: () => {
        setShowCreateForm(false);
        refetch();
      }
    });
  };

  const handleCreateFormSubmit = (data: CreateTaskRequest | UpdateTaskRequest) => {
    // Since this is for creating new tasks, we can safely cast to CreateTaskRequest
    handleCreateTask(data as CreateTaskRequest);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load tasks. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Task Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          Add Task
        </Button>
      </Box>

      {/* Stats */}
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        <Chip label={`Total: ${tasks.length}`} color="primary" />
        <Chip label={`Pending: ${getStatusCount('pending')}`} color="default" />
        <Chip label={`In Progress: ${getStatusCount('in_progress')}`} color="warning" />
        <Chip label={`Completed: ${getStatusCount('completed')}`} color="success" />
        <Chip label={`Cancelled: ${getStatusCount('cancelled')}`} color="error" />
      </Box>

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search tasks"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            label="Priority"
          >
            <MenuItem value="all">All Priority</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredTasks.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Stack>
      )}

      {/* Create Task Dialog */}
      {showCreateForm && (
        <TaskForm
          onSubmit={handleCreateFormSubmit}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createTaskMutation.isPending}
        />
      )}
    </Box>
  );
};

export default TaskList; 