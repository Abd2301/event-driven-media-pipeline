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
} from '@mui/material';
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
    formState: { errors },
  } = useForm<CreateTaskRequest>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'pending',
      priority: initialData?.priority || 'medium',
      due_date: initialData?.due_date || '',
    },
  });

  const handleFormSubmit = (data: CreateTaskRequest) => {
    // If we have initial data, this is an update, so we need to handle optional fields
    if (initialData) {
      const updateData: UpdateTaskRequest = {};
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status) updateData.status = data.status;
      if (data.priority) updateData.priority = data.priority;
      if (data.due_date !== undefined) updateData.due_date = data.due_date;
      onSubmit(updateData);
    } else {
      // This is a create operation
      onSubmit(data);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ mt: 2 }}>
      <Stack spacing={2}>
        <Controller
          name="title"
          control={control}
          rules={{ required: 'Title is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Title"
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
              disabled={isLoading}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              fullWidth
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
              disabled={isLoading}
            />
          )}
        />

        <Box display="flex" gap={2}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.status} disabled={isLoading}>
                <InputLabel>Status</InputLabel>
                <Select {...field} label="Status">
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
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
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Box>

        <Controller
          name="due_date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Due Date (YYYY-MM-DD)"
              fullWidth
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              error={!!errors.due_date}
              helperText={errors.due_date?.message}
              disabled={isLoading}
            />
          )}
        />

        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default TaskForm; 