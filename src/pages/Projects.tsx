import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { setFilter, addProject, updateProject } from '../store/slices/projectsSlice';
import CreateProjectModal from '../components/Projects/CreateProjectModal';
import EditProjectModal from '../components/Projects/EditProjectModal';

const Projects: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading, error, filter, deleteProject, updateProject } = useProjects();
  const searchTerm = useSelector((state: RootState) => state.projects.filter.search);
  
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    console.log('Menu clicked for project:', projectId);
    setAnchorEl(event.currentTarget);
    setSelectedProjectId(projectId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProjectId(null);
  };

  const handleSearchChange = (value: string) => {
    dispatch(setFilter({ search: value }));
  };

  const handleFilterChange = (field: string, value: string) => {
    dispatch(setFilter({ [field]: value }));
  };

  const handleDeleteProject = async () => {
    console.log('Delete clicked, selectedProjectId:', selectedProjectId);
    if (selectedProjectId) {
      try {
        await deleteProject(selectedProjectId);
        console.log('Projekt erfolgreich gelöscht:', selectedProjectId);
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    } else {
      console.log('Keine Projekt ID ausgewählt');
    }
    handleMenuClose();
  };

  const handleEditProject = () => {
    console.log('Edit project:', selectedProjectId);
    if (selectedProjectId) {
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleDuplicateProject = () => {
    console.log('Duplicate project:', selectedProjectId);
    if (selectedProjectId) {
      const projectToDuplicate = projects.find(p => p.id === selectedProjectId);
      if (projectToDuplicate) {
        const duplicatedProject = {
          ...projectToDuplicate,
          id: 'project-' + Date.now(),
          name: projectToDuplicate.name + ' (Kopie)',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dispatch(addProject(duplicatedProject));
        
        // Update localStorage with all projects including the new one
        const updatedProjects = [...projects, duplicatedProject];
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
      }
    }
    handleMenuClose();
  };

  const handleArchiveProject = async () => {
    console.log('Archive project:', selectedProjectId);
    if (selectedProjectId) {
      const projectToArchive = projects.find(p => p.id === selectedProjectId);
      if (projectToArchive && window.confirm(`Projekt "${projectToArchive.name}" archivieren?`)) {
        // Aktualisiere den Status auf "archived"
        await updateProject(selectedProjectId, {
          status: 'archived' as const,
          updatedAt: new Date(),
        });
      }
    }
    handleMenuClose();
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Projekte
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Neues Projekt
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder="Projekte suchen..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterOpen(true)}
        >
          Filter
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            {searchTerm ? 'Keine Projekte gefunden' : 'Noch keine Projekte erstellt'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {!searchTerm && 'Erstellen Sie Ihr erstes Projekt, um loszulegen!'}
          </Typography>
        </Box>
      ) : (

        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  }
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2">
                      {project.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, project.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {project.description || 'Keine Beschreibung'}
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
                    {project.tags && project.tags.slice(0, 2).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {project.tags && project.tags.length > 2 && (
                      <Chip
                        label={`+${project.tags.length - 2}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Tasks: {project.tasks ? project.tasks.length : 0}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      Team: {project.teamMembers ? project.teamMembers.length : 0} Mitglieder
                    </Typography>
                    {project.endDate && (
                      <Typography variant="body2" color="textSecondary">
                        Deadline: {project.endDate.toLocaleDateString('de-DE')}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleEditProject();
          }}
        >
          Bearbeiten
        </MenuItem>
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleDuplicateProject();
          }}
        >
          Duplizieren
        </MenuItem>
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleArchiveProject();
          }}
        >
          Archivieren
        </MenuItem>
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Löschen geklickt, selectedProjectId:', selectedProjectId);
            if (selectedProjectId && window.confirm('Projekt wirklich löschen?')) {
              deleteProject(selectedProjectId);
              console.log('Projekt gelöscht');
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          Löschen
        </MenuItem>
      </Menu>

      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <EditProjectModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={selectedProject}
      />

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Projekte filtern</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="planning">Planung</MenuItem>
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="on-hold">Pausiert</MenuItem>
                <MenuItem value="completed">Abgeschlossen</MenuItem>
                <MenuItem value="archived">Archiviert</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priorität</InputLabel>
              <Select
                value={filter.priority}
                label="Priorität"
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="low">Niedrig</MenuItem>
                <MenuItem value="medium">Mittel</MenuItem>
                <MenuItem value="high">Hoch</MenuItem>
                <MenuItem value="critical">Kritisch</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            dispatch(setFilter({ status: 'all', priority: 'all' }));
            setFilterOpen(false);
          }}>
            Filter zurücksetzen
          </Button>
          <Button onClick={() => setFilterOpen(false)} variant="contained">
            Anwenden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;