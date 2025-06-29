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
  Stack,
  Card,
  CardContent,
  InputAdornment,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import LoadingSpinner from './LoadingSpinner';
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
    createTaskMutation.mutate(data as CreateTaskRequest, {
      onSuccess: () => {
        setShowCreateForm(false);
        refetch();
      }
    });
  };

  const handleCreateFormSubmit = (data: CreateTaskRequest | UpdateTaskRequest) => {
    handleCreateTask(data as CreateTaskRequest);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading tasks..." />;
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DashboardIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700} color="text.primary">
              Task Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and track your tasks efficiently
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            },
            px: 3,
            py: 1.5,
          }}
        >
          Add Task
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
        gap={3} 
        mb={4}
      >
        <Card sx={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)',
          },
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {tasks.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Tasks
                </Typography>
              </Box>
              <AssignmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)',
          },
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {getStatusCount('pending')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Pending
                </Typography>
              </Box>
              <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)',
          },
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {getStatusCount('completed')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Completed
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)',
          },
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {getStatusCount('cancelled')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cancelled
                </Typography>
              </Box>
              <CancelIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 4, background: 'rgba(255, 255, 255, 0.6)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Filters & Search
            </Typography>
          </Box>
          
          <Box 
            display="grid" 
            gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }}
            gap={3} 
            alignItems="center"
          >
            <TextField
              label="Search tasks"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Search by title or description..."
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Priority Filter</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Priority Filter"
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Active filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {searchTerm && (
                  <Chip 
                    label={`Search: "${searchTerm}"`} 
                    color="primary" 
                    size="small"
                    onDelete={() => setSearchTerm('')}
                  />
                )}
                {statusFilter !== 'all' && (
                  <Chip 
                    label={`Status: ${statusFilter.replace('_', ' ')}`} 
                    color="secondary" 
                    size="small"
                    onDelete={() => setStatusFilter('all')}
                  />
                )}
                {priorityFilter !== 'all' && (
                  <Chip 
                    label={`Priority: ${priorityFilter}`} 
                    color="info" 
                    size="small"
                    onDelete={() => setPriorityFilter('all')}
                  />
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Task List */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            Tasks ({filteredTasks.length})
          </Typography>
          {filteredTasks.length > 0 && (
            <Chip 
              label={`Showing ${filteredTasks.length} of ${tasks.length} tasks`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {filteredTasks.length === 0 ? (
          <Fade in={true}>
            <Card sx={{ 
              textAlign: 'center', 
              py: 8,
              background: 'rgba(255, 255, 255, 0.6)',
            }}>
              <CardContent>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tasks found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your filters to see more tasks'
                    : 'Create your first task to get started with task management'}
                </Typography>
                {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCreateForm(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      },
                    }}
                  >
                    Create First Task
                  </Button>
                )}
              </CardContent>
            </Card>
          </Fade>
        ) : (
          <Box 
            display="grid" 
            gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={3}
          >
            {filteredTasks.map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Box>
        )}
      </Box>

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