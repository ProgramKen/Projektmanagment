import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Business as DepartmentIcon,
  Visibility as WatchIcon,
} from '@mui/icons-material';
import { Task, User, Person, Department } from '../../types';
import MiniGraph from '../Graph/MiniGraph';
import { formatPersonDisplayName, getPersonJobRoleColor } from '../../utils/rolesUtils';

interface TaskCardProps {
  task: Task;
  users: User[];
  persons: Person[];
  departments: Department[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onView?: (taskId: string) => void;
  showMiniGraph?: boolean;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  persons,
  departments,
  onEdit,
  onDelete,
  onView,
  showMiniGraph = true,
  compact = false
}) => {
  const allPersons = [...users, ...persons];
  
  // Get assignee
  const assignee = task.assigneeId && task.assigneeType 
    ? allPersons.find(p => p.id === task.assigneeId)
    : null;

  // Get department
  const department = departments.find(d => d.id === task.departmentId);
  
  // Get watchers with data
  const watchersWithData = task.watchers?.map(watcher => {
    const person = allPersons.find(p => p.id === watcher.id);
    return { ...watcher, person };
  }).filter(w => w.person) || [];

  // Status colors
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'success';
      case 'in-progress': return 'info';
      case 'review': return 'warning';
      case 'testing': return 'secondary';
      case 'blocked': return 'error';
      case 'todo': return 'default';
      default: return 'default';
    }
  };

  // Priority colors
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Nicht gesetzt';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Calculate progress based on status
  const getProgress = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 0;
      case 'in-progress': return 30;
      case 'review': return 70;
      case 'testing': return 85;
      case 'done': return 100;
      case 'blocked': return 10;
      default: return 0;
    }
  };

  const progress = getProgress(task.status);

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: compact ? 1 : 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flexGrow={1} mr={2}>
            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                fontSize: compact ? '0.95rem' : '1.1rem',
                lineHeight: 1.3,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
              onClick={() => onView?.(task.id)}
            >
              {task.title}
            </Typography>
            
            {!compact && task.description && (
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1
                }}
              >
                {task.description}
              </Typography>
            )}
          </Box>

          <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
            <Chip 
              label={task.status} 
              size="small" 
              color={getStatusColor(task.status) as any}
              variant="filled"
            />
            <Chip 
              label={task.priority} 
              size="small" 
              color={getPriorityColor(task.priority) as any}
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Assignee */}
        {assignee && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PersonIcon fontSize="small" color="action" />
            <Avatar
              sx={{ 
                bgcolor: getPersonJobRoleColor(assignee),
                width: 20,
                height: 20,
                fontSize: '0.7rem',
                mr: 1
              }}
            >
              {formatPersonDisplayName(assignee).charAt(0)}
            </Avatar>
            <Typography variant="body2" color="textSecondary">
              {formatPersonDisplayName(assignee)}
            </Typography>
          </Box>
        )}

        {/* Department */}
        {department && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <DepartmentIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {department.name}
            </Typography>
          </Box>
        )}

        {/* Due Date */}
        {!compact && task.dueDate && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              Fällig: {formatDate(task.dueDate)}
            </Typography>
          </Box>
        )}

        {/* Progress */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <AssignmentIcon fontSize="small" color="action" />
              <Typography variant="body2" color="textSecondary">
                Fortschritt
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'grey.200'
            }}
          />
        </Box>

        {/* Watchers */}
        {watchersWithData.length > 0 && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <WatchIcon fontSize="small" color="action" />
              <Typography variant="body2" color="textSecondary">
                Beobachter: {watchersWithData.length}
              </Typography>
            </Box>
            <Box display="flex" gap={0.5}>
              {watchersWithData.slice(0, compact ? 2 : 3).map(({ person }) => person && (
                <Avatar
                  key={person.id}
                  sx={{ 
                    bgcolor: getPersonJobRoleColor(person),
                    width: 20,
                    height: 20,
                    fontSize: '0.7rem'
                  }}
                  title={formatPersonDisplayName(person)}
                >
                  {formatPersonDisplayName(person).charAt(0)}
                </Avatar>
              ))}
              {watchersWithData.length > (compact ? 2 : 3) && (
                <Avatar
                  sx={{ 
                    bgcolor: 'grey.400',
                    width: 20,
                    height: 20,
                    fontSize: '0.7rem'
                  }}
                >
                  +{watchersWithData.length - (compact ? 2 : 3)}
                </Avatar>
              )}
            </Box>
          </Box>
        )}

        {/* Estimated/Actual Hours */}
        {!compact && (task.estimatedHours || task.actualHours) && (
          <Box display="flex" justifyContent="space-between" mb={2}>
            {task.estimatedHours && (
              <Typography variant="body2" color="textSecondary">
                Geschätzt: {task.estimatedHours}h
              </Typography>
            )}
            {task.actualHours && (
              <Typography variant="body2" color="textSecondary">
                Tatsächlich: {task.actualHours}h
              </Typography>
            )}
          </Box>
        )}

        {/* Mini Graph */}
        {showMiniGraph && !compact && users.length > 0 && (
          <Box>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" justifyContent="center" mb={1}>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                Task-Übersicht
              </Typography>
            </Box>
            <Box display="flex" justifyContent="center">
              <MiniGraph
                task={task}
                users={users}
                persons={persons}
                departments={departments}
                width={180}
                height={100}
                showLabels={false}
                mode="task"
              />
            </Box>
          </Box>
        )}

        {/* Skills Required */}
        {task.skillsRequired && task.skillsRequired.length > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '0.75rem' }}>
              Erforderliche Skills:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {task.skillsRequired.slice(0, compact ? 2 : 3).map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {task.skillsRequired.length > (compact ? 2 : 3) && (
                <Chip
                  label={`+${task.skillsRequired.length - (compact ? 2 : 3)}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <Box mt={2}>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {task.tags.slice(0, compact ? 2 : 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {task.tags.length > (compact ? 2 : 3) && (
                <Chip
                  label={`+${task.tags.length - (compact ? 2 : 3)}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
        <Button
          size="small"
          onClick={() => onView?.(task.id)}
          variant="outlined"
        >
          Details
        </Button>
        
        <Box>
          {onEdit && (
            <IconButton
              size="small"
              onClick={() => onEdit(task)}
              title="Bearbeiten"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              onClick={() => onDelete(task.id)}
              title="Löschen"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default TaskCard;