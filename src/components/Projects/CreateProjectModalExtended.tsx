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
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  Grid,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Project, TeamMember, User, Person, Department } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { formatPersonDisplayName, getPersonJobRoleColor, JOB_ROLES } from '../../utils/rolesUtils';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateProjectModalExtended: React.FC<CreateProjectModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { createProject, loading, error } = useProjects();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    priority: 'medium' as Project['priority'],
    startDate: '' as string,
    endDate: '' as string,
    departmentId: '',
    budget: 0,
    currency: 'EUR',
    tags: [] as string[],
    skillsRequired: [] as string[],
    objectives: [] as string[],
    teamMembers: [] as TeamMember[],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedPersons, setSelectedPersons] = useState<(User | Person)[]>([]);
  
  const { users, persons } = useSelector((state: RootState) => state.userManagement);
  const { departments } = useSelector((state: RootState) => state.departments);
  
  const allPersons = [...users, ...persons];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Projektname ist erforderlich');
      return;
    }

    if (!user) {
      setFormError('Benutzer nicht angemeldet');
      return;
    }

    try {
      const ownerMember: TeamMember = {
        personId: user.id,
        personType: 'user',
        role: 'owner',
        responsibility: 'Project Owner',
        workloadPercentage: 100,
        joinedAt: new Date(),
      };

      const teamMembers: TeamMember[] = [ownerMember, ...formData.teamMembers];

      const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        ownerId: user.id,
        ownerType: 'user',
        departmentId: formData.departmentId || undefined,
        budget: formData.budget || undefined,
        currency: formData.currency || 'EUR',
        teamMembers,
        tasks: [],
        links: [],
        files: [],
        tags: formData.tags,
        skillsRequired: formData.skillsRequired,
        objectives: formData.objectives,
        risks: [],
        milestones: [],
      };

      await createProject(projectData);
      onClose();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Fehler beim Erstellen des Projekts');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      startDate: '',
      endDate: '',
      departmentId: '',
      budget: 0,
      currency: 'EUR',
      tags: [],
      skillsRequired: [],
      objectives: [],
      teamMembers: [],
    });
    setTagInput('');
    setSkillInput('');
    setObjectiveInput('');
    setSelectedPersons([]);
    setFormError('');
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

  const handleAddObjective = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && objectiveInput.trim()) {
      e.preventDefault();
      const newObjective = objectiveInput.trim();
      if (!formData.objectives.includes(newObjective)) {
        setFormData(prev => ({
          ...prev,
          objectives: [...prev.objectives, newObjective],
        }));
      }
      setObjectiveInput('');
    }
  };

  const handleRemoveObjective = (objectiveToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter(obj => obj !== objectiveToRemove),
    }));
  };

  const handleAddTeamMember = (person: User | Person, role: TeamMember['role'] = 'member') => {
    const newMember: TeamMember = {
      personId: person.id,
      personType: 'systemRole' in person ? 'user' : 'person',
      role,
      responsibility: '',
      workloadPercentage: 50,
      joinedAt: new Date(),
    };
    
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember],
    }));
    
    setSelectedPersons(prev => [...prev, person]);
  };

  const handleRemoveTeamMember = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(member => member.personId !== personId),
    }));
    
    setSelectedPersons(prev => prev.filter(person => person.id !== personId));
  };

  const availablePersons = allPersons.filter(person => 
    !selectedPersons.some(selected => selected.id === person.id) && 
    person.id !== user?.id
  );

  const currentError = formError || error;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Neues Projekt erstellen</DialogTitle>
      
      <DialogContent>
        {currentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {currentError}
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
                label="Projektname *"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Project['status'] }))}
                >
                  <MenuItem value="planning">Planung</MenuItem>
                  <MenuItem value="active">Aktiv</MenuItem>
                  <MenuItem value="on-hold">Pausiert</MenuItem>
                  <MenuItem value="completed">Abgeschlossen</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorität</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priorität"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Project['priority'] }))}
                >
                  <MenuItem value="low">Niedrig</MenuItem>
                  <MenuItem value="medium">Mittel</MenuItem>
                  <MenuItem value="high">Hoch</MenuItem>
                  <MenuItem value="critical">Kritisch</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Dates and Organization */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Zeitplan & Organisation
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Startdatum"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Enddatum"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formData.startDate }}
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: formData.currency
                }}
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

            {/* Objectives */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Projektziele"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyDown={handleAddObjective}
                helperText="Drücken Sie Enter, um ein Ziel hinzuzufügen"
              />
            </Grid>

            {/* Objectives Display */}
            {formData.objectives.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Projektziele:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {formData.objectives.map((objective, index) => (
                    <Chip
                      key={index}
                      label={objective}
                      onDelete={() => handleRemoveObjective(objective)}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {/* Team Members */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Team-Mitglieder
              </Typography>
            </Grid>

            {/* Team Member Selection */}
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
                    handleAddTeamMember(person);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Team-Mitglied hinzufügen"
                    placeholder="Person auswählen..."
                  />
                )}
              />
            </Grid>

            {/* Team Members List */}
            {formData.teamMembers.length > 0 && (
              <Grid item xs={12}>
                <List>
                  {formData.teamMembers.map((member) => {
                    const person = allPersons.find(p => p.id === member.personId);
                    if (!person) return null;
                    
                    return (
                      <ListItem key={member.personId}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getPersonJobRoleColor(person) }}>
                            {formatPersonDisplayName(person).charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={formatPersonDisplayName(person)}
                          secondary={`${JOB_ROLES[person.jobRole].label} - Role: ${member.role}`}
                        />
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveTeamMember(member.personId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Grid>
            )}

          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Projekt erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectModalExtended;