import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Task } from '../../types';

interface TaskListProps {
  tasks: Task[];
  onTaskCreate: () => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskToggle,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTaskId(taskId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTaskId(null);
  };

  const handleEdit = () => {
    const task = tasks.find(t => t.id === selectedTaskId);
    if (task) {
      onTaskEdit(task);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedTaskId && window.confirm('Task wirklich löschen?')) {
      onTaskDelete(selectedTaskId);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'success';
      case 'in-progress': return 'warning';
      case 'review': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'Zu erledigen';
      case 'in-progress': return 'In Bearbeitung';
      case 'review': return 'Review';
      case 'done': return 'Erledigt';
      default: return status;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Tasks ({tasks.length})
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={onTaskCreate}
          >
            Neue Task
          </Button>
        </Box>

        {tasks.length === 0 ? (
          <Typography color="textSecondary" textAlign="center" py={2}>
            Noch keine Tasks erstellt
          </Typography>
        ) : (
          <List dense>
            {tasks.map((task) => (
              <ListItem key={task.id} divider>
                <Checkbox
                  checked={task.status === 'done'}
                  onChange={(e) => onTaskToggle(task.id, e.target.checked)}
                  size="small"
                />
                <ListItemText
                  primary={task.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {task.description}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip
                          label={getStatusLabel(task.status)}
                          color={getStatusColor(task.status) as any}
                          size="small"
                        />
                        <Chip
                          label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          color={getPriorityColor(task.priority) as any}
                          size="small"
                          variant="outlined"
                        />
                        {task.dueDate && (
                          <Chip
                            label={`Deadline: ${task.dueDate.toLocaleDateString('de-DE')}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, task.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Bearbeiten
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Löschen
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default TaskList;