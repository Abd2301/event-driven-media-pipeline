import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../services/api';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CreateTaskRequest>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'pending',
      priority: initialData?.priority || 'medium',
      due_date: initialData?.due_date || '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  const handleFormSubmit = (data: CreateTaskRequest) => {
    if (initialData) {
      const updateData: UpdateTaskRequest = {};
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status) updateData.status = data.status;
      if (data.priority) updateData.priority = data.priority;
      if (data.due_date !== undefined) updateData.due_date = data.due_date;
      onSubmit(updateData);
    } else {
      onSubmit(data);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
            {initialData ? 'Edit Task' : 'Create New Task'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {initialData 
              ? 'Update the task details below' 
              : 'Fill in the details to create a new task'
            }
          </Typography>
        </Box>

        <Divider />

        {/* Title Field */}
        <Controller
          name="title"
          control={control}
          rules={{ 
            required: 'Title is required',
            minLength: { value: 3, message: 'Title must be at least 3 characters' }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Task Title"
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
              disabled={isLoading}
              placeholder="Enter a descriptive title for your task"
              InputProps={{
                sx: {
                  fontSize: '1rem',
                  fontWeight: 500,
                },
              }}
            />
          )}
        />

        {/* Description Field */}
        <Controller
          name="description"
          control={control}
          rules={{ 
            maxLength: { value: 500, message: 'Description must be less than 500 characters' }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description (Optional)"
              fullWidth
              multiline
              rows={4}
              error={!!errors.description}
              helperText={
                errors.description?.message || 
                `${field.value?.length || 0}/500 characters`
              }
              disabled={isLoading}
              placeholder="Provide additional details about the task..."
              InputProps={{
                sx: {
                  fontSize: '0.875rem',
                },
              }}
            />
          )}
        />

        {/* Status and Priority Row */}
        <Box display="flex" gap={2}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.status} disabled={isLoading}>
                <InputLabel>Status</InputLabel>
                <Select {...field} label="Status">
                  <MenuItem value="pending">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor('pending'),
                        }}
                      />
                      Pending
                    </Box>
                  </MenuItem>
                  <MenuItem value="in_progress">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor('in_progress'),
                        }}
                      />
                      In Progress
                    </Box>
                  </MenuItem>
                  <MenuItem value="completed">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor('completed'),
                        }}
                      />
                      Completed
                    </Box>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor('cancelled'),
                        }}
                      />
                      Cancelled
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.priority} disabled={isLoading}>
                <InputLabel>Priority</InputLabel>
                <Select {...field} label="Priority">
                  <MenuItem value="low">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor('low'),
                        }}
                      />
                      Low
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor('medium'),
                        }}
                      />
                      Medium
                    </Box>
                  </MenuItem>
                  <MenuItem value="high">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor('high'),
                        }}
                      />
                      High
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Box>

        {/* Due Date Field */}
        <Controller
          name="due_date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Due Date (Optional)"
              fullWidth
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              error={!!errors.due_date}
              helperText={errors.due_date?.message || 'Set a deadline for this task'}
              disabled={isLoading}
              InputProps={{
                sx: {
                  fontSize: '0.875rem',
                },
              }}
            />
          )}
        />

        {/* Preview Section */}
        {watchedValues.title && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
              Preview
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                background: 'rgba(99, 102, 241, 0.02)',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {watchedValues.title}
              </Typography>
              {watchedValues.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {watchedValues.description}
                </Typography>
              )}
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={watchedValues.status?.replace('_', ' ')}
                  size="small"
                  sx={{
                    background: `linear-gradient(135deg, ${getStatusColor(watchedValues.status || 'pending')}20 0%, ${getStatusColor(watchedValues.status || 'pending')}10 100%)`,
                    color: getStatusColor(watchedValues.status || 'pending'),
                    border: `1px solid ${getStatusColor(watchedValues.status || 'pending')}30`,
                  }}
                />
                <Chip
                  label={watchedValues.priority}
                  size="small"
                  sx={{
                    background: `linear-gradient(135deg, ${getPriorityColor(watchedValues.priority || 'medium')}20 0%, ${getPriorityColor(watchedValues.priority || 'medium')}10 100%)`,
                    color: getPriorityColor(watchedValues.priority || 'medium'),
                    border: `1px solid ${getPriorityColor(watchedValues.priority || 'medium')}30`,
                  }}
                />
                {watchedValues.due_date && (
                  <Chip
                    label={`Due: ${new Date(watchedValues.due_date).toLocaleDateString()}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        )}

        <Divider />

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !isValid}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : initialData ? (
                <SaveIcon />
              ) : (
                <AddIcon />
              )
            }
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: initialData 
                ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              '&:hover': {
                background: initialData
                  ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {isLoading 
              ? 'Saving...' 
              : initialData 
                ? 'Update Task' 
                : 'Create Task'
            }
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default TaskForm; 