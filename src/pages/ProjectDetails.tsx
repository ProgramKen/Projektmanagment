import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import { Project, Task } from '../types';
import TaskList from '../components/Tasks/TaskList';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import EditProjectModal from '../components/Projects/EditProjectModal';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, updateProject } = useProjects();
  
  const [project, setProject] = useState<Project | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      const foundProject = projects.find(p => p.id === projectId);
      setProject(foundProject || null);
    }
  }, [projectId, projects]);

  const handleTaskCreated = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!project) return;

    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedProject = {
      ...project,
      tasks: [...project.tasks, newTask],
      updatedAt: new Date(),
    };

    await updateProject(project.id, { tasks: updatedProject.tasks });
    setProject(updatedProject);
  };

  const handleTaskEdit = (task: Task) => {
    // TODO: Implement task edit modal
    console.log('Edit task:', task);
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!project) return;

    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    await updateProject(project.id, { tasks: updatedTasks });
    
    setProject({
      ...project,
      tasks: updatedTasks,
      updatedAt: new Date(),
    });
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!project) return;

    const updatedTasks = project.tasks.map(task =>
      task.id === taskId
        ? { ...task, status: completed ? 'done' as const : 'todo' as const, updatedAt: new Date() }
        : task
    );

    await updateProject(project.id, { tasks: updatedTasks });
    
    setProject({
      ...project,
      tasks: updatedTasks,
      updatedAt: new Date(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'warning';
      case 'on-hold': return 'error';
      case 'completed': return 'info';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'planning': return 'Planung';
      case 'on-hold': return 'Pausiert';
      case 'completed': return 'Abgeschlossen';
      case 'archived': return 'Archiviert';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Kritisch';
      case 'high': return 'Hoch';
      case 'medium': return 'Mittel';
      case 'low': return 'Niedrig';
      default: return priority;
    }
  };

  if (!project) {
    return (
      <Box>
        <Typography variant="h4">Projekt nicht gefunden</Typography>
        <Button onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Zurück zu Projekten
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button" 
          variant="body1" 
          onClick={() => navigate('/projects')}
          sx={{ textDecoration: 'none' }}
        >
          Projekte
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/projects')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {project.name}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setEditProjectOpen(true)}
        >
          Projekt bearbeiten
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Project Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Projektdetails
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                {project.description || 'Keine Beschreibung verfügbar'}
              </Typography>

              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip
                  label={getStatusLabel(project.status)}
                  color={getStatusColor(project.status) as any}
                  size="small"
                />
                <Chip
                  label={getPriorityLabel(project.priority)}
                  color={getPriorityColor(project.priority) as any}
                  size="small"
                  variant="outlined"
                />
                {project.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Erstellt: {project.createdAt?.toLocaleDateString('de-DE') || 'Unbekannt'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Aktualisiert: {project.updatedAt?.toLocaleDateString('de-DE') || 'Unbekannt'}
                  </Typography>
                </Grid>
                {project.startDate && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Start: {project.startDate.toLocaleDateString('de-DE')}
                    </Typography>
                  </Grid>
                )}
                {project.endDate && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Ende: {project.endDate.toLocaleDateString('de-DE')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Tasks */}
          <TaskList
            tasks={project.tasks}
            onTaskCreate={() => setCreateTaskOpen(true)}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onTaskToggle={handleTaskToggle}
          />
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiken
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Tasks gesamt: {project.tasks.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Erledigt: {project.tasks.filter(t => t.status === 'done').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  In Bearbeitung: {project.tasks.filter(t => t.status === 'in-progress').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Team Mitglieder: {project.teamMembers.length}
                </Typography>
              </Box>

              {project.tasks.length > 0 && (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Fortschritt: {Math.round((project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100)}%
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modals */}
      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={project.id}
        onTaskCreated={handleTaskCreated}
      />

      <EditProjectModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
      />
    </Box>
  );
};

export default ProjectDetails;