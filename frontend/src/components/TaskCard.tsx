import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  LinearProgress,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Task, UpdateTaskRequest } from '../services/api';
import { useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import TaskForm from './TaskForm';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteTaskMutation.mutate(task.id);
    setDeleteDialogOpen(false);
  };

  const handleUpdateTask = (data: UpdateTaskRequest) => {
    updateTaskMutation.mutate({ taskId: task.id, taskData: data });
    setEditDialogOpen(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          bgColor: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          textColor: 'white',
        };
      case 'in_progress':
        return {
          color: 'warning',
          icon: <PlayArrowIcon />,
          bgColor: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          textColor: 'white',
        };
      case 'cancelled':
        return {
          color: 'error',
          icon: <CancelIcon />,
          bgColor: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
          textColor: 'white',
        };
      default:
        return {
          color: 'default',
          icon: <PendingIcon />,
          bgColor: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
          textColor: 'white',
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          color: '#ef4444',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
        };
      case 'medium':
        return {
          color: '#f59e0b',
          bgColor: '#fffbeb',
          borderColor: '#fed7aa',
        };
      case 'low':
        return {
          color: '#10b981',
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0',
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f9fafb',
          borderColor: '#d1d5db',
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    try {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);
  const daysUntilDue = task.due_date ? getDaysUntilDue(task.due_date) : null;

  return (
    <>
      <Fade in={true}>
        <Card 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'visible',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            },
          }}
        >
          {/* Status Indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: 16,
              background: statusConfig.bgColor,
              color: statusConfig.textColor,
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              zIndex: 1,
            }}
          >
            {statusConfig.icon}
          </Box>

          <CardContent sx={{ pt: 4, pb: 2, flexGrow: 1 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: 'text.primary',
                  flex: 1,
                  pr: 1,
                }}
              >
                {task.title}
              </Typography>
              <Tooltip title="More options">
                <IconButton 
                  size="small" 
                  onClick={handleMenuOpen}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'primary.main',
                    },
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Description */}
            {task.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </Typography>
            )}
            
            {/* Priority Badge */}
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <FlagIcon sx={{ fontSize: 16, color: priorityConfig.color }} />
              <Chip
                label={task.priority}
                size="small"
                sx={{
                  background: priorityConfig.bgColor,
                  color: priorityConfig.color,
                  border: `1px solid ${priorityConfig.borderColor}`,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
            
            {/* Progress Bar for In Progress Tasks */}
            {task.status === 'in_progress' && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    50%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={50}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}
            
            {/* Dates */}
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  Created: {formatDate(task.created_at)}
                </Typography>
              </Box>
              
              {task.due_date && (
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography 
                    variant="caption" 
                    color={daysUntilDue && daysUntilDue < 0 ? 'error.main' : 'text.secondary'}
                    sx={{ fontWeight: daysUntilDue && daysUntilDue < 0 ? 600 : 400 }}
                  >
                    Due: {formatDate(task.due_date)}
                    {daysUntilDue !== null && (
                      <span style={{ marginLeft: 4 }}>
                        {daysUntilDue < 0 ? ` (${Math.abs(daysUntilDue)} days overdue)` :
                         daysUntilDue === 0 ? ' (Today)' :
                         daysUntilDue === 1 ? ' (Tomorrow)' :
                         ` (in ${daysUntilDue} days)`}
                      </span>
                    )}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
          
          <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
            <Tooltip title="Edit task">
              <IconButton 
                size="small" 
                onClick={handleEditClick}
                sx={{ 
                  color: 'primary.main',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete task">
              <IconButton 
                size="small" 
                onClick={handleDeleteClick} 
                sx={{ 
                  color: 'error.main',
                  '&:hover': {
                    background: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Card>
      </Fade>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
        }}
      >
        <MenuItem onClick={handleEditClick} sx={{ gap: 1 }}>
          <EditIcon sx={{ fontSize: 20 }} />
          Edit Task
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ gap: 1, color: 'error.main' }}>
          <DeleteIcon sx={{ fontSize: 20 }} />
          Delete Task
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Edit Task
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TaskForm
            initialData={task}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditDialogOpen(false)}
            isLoading={updateTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600} color="error.main">
            Delete Task
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "<strong>{task.title}</strong>"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteTaskMutation.isPending}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              },
            }}
          >
            {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskCard; 