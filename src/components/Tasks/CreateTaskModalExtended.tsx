import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Autocomplete,
  Grid,
  Chip,
  Typography,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Task, User, Person, Department } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { formatPersonDisplayName, getPersonJobRoleColor, JOB_ROLES } from '../../utils/rolesUtils';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onTaskCreated: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CreateTaskModalExtended: React.FC<CreateTaskModalProps> = ({ 
  open, 
  onClose, 
  projectId, 
  onTaskCreated 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    assigneeType: 'user' as 'user' | 'person',
    departmentId: '',
    dueDate: '',
    estimatedHours: '',
    tags: [] as string[],
    skillsRequired: [] as string[],
    dependencies: [] as string[],
    watchers: [] as { id: string; type: 'user' | 'person' }[],
    subtasks: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [dependencyInput, setDependencyInput] = useState('');
  const [selectedWatchers, setSelectedWatchers] = useState<(User | Person)[]>([]);

  const { users, persons } = useSelector((state: RootState) => state.userManagement);
  const { departments } = useSelector((state: RootState) => state.departments);
  const { projects } = useSelector((state: RootState) => state.projects);
  
  const allPersons = [...users, ...persons];
  const currentProject = projects.find(p => p.id === projectId);
  const projectTasks = currentProject?.tasks || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title.trim()) {
      setError('Task-Titel ist erforderlich');
      setLoading(false);
      return;
    }

    try {
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || undefined,
        assigneeType: formData.assigneeType,
        reporterId: user?.id || 'user',
        reporterType: 'user',
        departmentId: formData.departmentId || undefined,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        actualHours: undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        dependencies: formData.dependencies,
        subtasks: formData.subtasks,
        tags: formData.tags,
        skillsRequired: formData.skillsRequired,
        comments: [],
        attachments: [],
        watchers: formData.watchers,
      };

      await onTaskCreated(taskData);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Task');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: '',
      assigneeType: 'user',
      departmentId: '',
      dueDate: '',
      estimatedHours: '',
      tags: [],
      skillsRequired: [],
      dependencies: [],
      watchers: [],
      subtasks: [],
    });
    setTagInput('');
    setSkillInput('');
    setDependencyInput('');
    setSelectedWatchers([]);
    setError('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (!formData.skillsRequired.includes(newSkill)) {
        setFormData(prev => ({
          ...prev,
          skillsRequired: [...prev.skillsRequired, newSkill],
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(skill => skill !== skillToRemove),
    }));
  };

  const handleAddWatcher = (person: User | Person) => {
    const newWatcher = {
      id: person.id,
      type: 'systemRole' in person ? 'user' as const : 'person' as const
    };
    
    setFormData(prev => ({
      ...prev,
      watchers: [...prev.watchers, newWatcher],
    }));
    
    setSelectedWatchers(prev => [...prev, person]);
  };

  const handleRemoveWatcher = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      watchers: prev.watchers.filter(watcher => watcher.id !== personId),
    }));
    
    setSelectedWatchers(prev => prev.filter(person => person.id !== personId));
  };

  const availablePersons = allPersons.filter(person => 
    !selectedWatchers.some(selected => selected.id === person.id)
  );

  const availableAssignees = allPersons.filter(person => person.isActive);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Neue Task erstellen</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basis-Informationen
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task-Titel *"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschreibung"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                >
                  <MenuItem value="todo">Zu erledigen</MenuItem>
                  <MenuItem value="in-progress">In Bearbeitung</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="testing">Testing</MenuItem>
                  <MenuItem value="done">Erledigt</MenuItem>
                  <MenuItem value="blocked">Blockiert</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorität</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priorität"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                >
                  <MenuItem value="low">Niedrig</MenuItem>
                  <MenuItem value="medium">Mittel</MenuItem>
                  <MenuItem value="high">Hoch</MenuItem>
                  <MenuItem value="critical">Kritisch</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Assignment */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Zuweisung & Organisation
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={availableAssignees}
                getOptionLabel={(person) => `${formatPersonDisplayName(person)} (${JOB_ROLES[person.jobRole].label})`}
                renderOption={(props, person) => (
                  <Box component="li" {...props}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getPersonJobRoleColor(person), 
                        mr: 2, 
                        width: 32, 
                        height: 32 
                      }}
                    >
                      {formatPersonDisplayName(person).charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {formatPersonDisplayName(person)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {JOB_ROLES[person.jobRole].label}
                        {'isExternal' in person && person.isExternal && ' (External)'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                onChange={(e, person) => {
                  if (person) {
                    setFormData(prev => ({
                      ...prev,
                      assigneeId: person.id,
                      assigneeType: 'systemRole' in person ? 'user' : 'person'
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      assigneeId: '',
                      assigneeType: 'user'
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Zugewiesen an"
                    placeholder="Person auswählen..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.departmentId}
                  label="Department"
                  onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                >
                  <MenuItem value="">Kein Department</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Timing */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Deadline"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Geschätzte Stunden"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>

            {/* Tags and Skills */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Tags & Skills
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tags hinzufügen"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                helperText="Drücken Sie Enter, um ein Tag hinzuzufügen"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Benötigte Skills"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                helperText="Drücken Sie Enter, um einen Skill hinzuzufügen"
              />
            </Grid>

            {/* Tags Display */}
            {formData.tags.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {/* Skills Display */}
            {formData.skillsRequired.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Benötigte Skills:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.skillsRequired.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      onDelete={() => handleRemoveSkill(skill)}
                      size="small"
                      color="primary"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {/* Watchers */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Beobachter
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={availablePersons}
                getOptionLabel={(person) => `${formatPersonDisplayName(person)} (${JOB_ROLES[person.jobRole].label})`}
                renderOption={(props, person) => (
                  <Box component="li" {...props}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getPersonJobRoleColor(person), 
                        mr: 2, 
                        width: 32, 
                        height: 32 
                      }}
                    >
                      {formatPersonDisplayName(person).charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {formatPersonDisplayName(person)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {JOB_ROLES[person.jobRole].label}
                        {'isExternal' in person && person.isExternal && ' (External)'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                onChange={(e, person) => {
                  if (person) {
                    handleAddWatcher(person);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Beobachter hinzufügen"
                    placeholder="Person auswählen..."
                  />
                )}
              />
            </Grid>

            {/* Watchers List */}
            {selectedWatchers.length > 0 && (
              <Grid item xs={12}>
                <List>
                  {selectedWatchers.map((person) => (
                    <ListItem key={person.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getPersonJobRoleColor(person) }}>
                          {formatPersonDisplayName(person).charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={formatPersonDisplayName(person)}
                        secondary={JOB_ROLES[person.jobRole].label}
                      />
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveWatcher(person.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {/* Dependencies (for future implementation) */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="textSecondary">
                Abhängigkeiten und Sub-Tasks können nach der Erstellung hinzugefügt werden.
              </Typography>
            </Grid>

          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.title.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Task erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskModalExtended;