import React from 'react';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
  Assignment as TaskIcon,
  Business as DepartmentIcon,
} from '@mui/icons-material';
import { Project, User, Person, Department } from '../../types';
import MiniGraph from '../Graph/MiniGraph';
import { formatPersonDisplayName, getPersonJobRoleColor } from '../../utils/rolesUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ProjectCardProps {
  project: Project;
  users: User[];
  persons: Person[];
  departments: Department[];
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onView?: (projectId: string) => void;
  showMiniGraph?: boolean;
  compact?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
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
  
  // Calculate task progress
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  // Get department
  const department = departments.find(d => d.id === project.departmentId);
  
  // Get team members with data
  const teamMembersWithData = project.teamMembers?.map(member => {
    const person = allPersons.find(p => p.id === member.personId);
    return { ...member, person };
  }) || [];

  // Status colors
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'primary';
      case 'on-hold': return 'warning';
      case 'completed': return 'secondary';
      default: return 'default';
    }
  };

  // Priority colors
  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'secondary';
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

  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle 
            className="text-lg cursor-pointer hover:text-primary transition-colors"
            onClick={() => onView?.(project.id)}
          >
            {project.name}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status.toUpperCase()}
            </Badge>
            <Badge variant="outline">{project.priority}</Badge>
          </div>
        </div>
        {!compact && project.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {project.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Department */}
        {department && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <DepartmentIcon fontSize="small" />
            <span>{department.name}</span>
          </div>
        )}

        {/* Tasks Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-sm">
              <TaskIcon fontSize="small" />
              <span>Tasks: {completedTasks}/{tasks.length}</span>
            </div>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Team Members */}
        {teamMembersWithData.length > 0 && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <GroupIcon fontSize="small" />
            <span>Team: {teamMembersWithData.length}</span>
          </div>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.tags.slice(0, compact ? 2 : 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > (compact ? 2 : 4) && (
              <Badge variant="outline" className="text-xs">
                +{project.tags.length - (compact ? 2 : 4)}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <div className="p-6 pt-0 flex justify-between items-center">
        <Button
          size="sm"
          onClick={() => onView?.(project.id)}
        >
          Details
        </Button>
        
        <div className="flex gap-2">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(project)}
              aria-label="Bearbeiten"
            >
              <EditIcon fontSize="small" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(project.id)}
              aria-label="Löschen"
            >
              <DeleteIcon fontSize="small" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;