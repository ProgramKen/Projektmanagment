import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Project, TeamMember } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';

interface EditProjectModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ open, onClose, project }) => {
  const { user } = useAuth();
  const { updateProject, loading, error } = useProjects();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    priority: 'medium' as Project['priority'],
    startDate: '' as string,
    endDate: '' as string,
    tags: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [formError, setFormError] = useState('');

  // Load project data when modal opens
  useEffect(() => {
    if (project && open) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : '',
        endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
        tags: project.tags,
      });
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Projektname ist erforderlich');
      return;
    }

    if (!project) {
      setFormError('Kein Projekt zum Bearbeiten ausgewählt');
      return;
    }

    try {
      const updatedData: Partial<Project> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        tags: formData.tags,
        updatedAt: new Date(),
      };

      await updateProject(project.id, updatedData);
      onClose();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Fehler beim Aktualisieren des Projekts');
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
      tags: [],
    });
    setTagInput('');
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

  const currentError = formError || error;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Projekt bearbeiten</DialogTitle>
      
      <DialogContent>
        {currentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {currentError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Projektname *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
            autoFocus
          />

          <TextField
            fullWidth
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
                <MenuItem value="archived">Archiviert</MenuItem>
              </Select>
            </FormControl>

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
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Startdatum"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              label="Enddatum"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: formData.startDate }}
            />
          </Box>

          <TextField
            fullWidth
            label="Tags hinzufügen"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            margin="normal"
            helperText="Drücken Sie Enter, um ein Tag hinzuzufügen"
          />

          {formData.tags.length > 0 && (
            <Box sx={{ mt: 1 }}>
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
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Projekt aktualisieren'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProjectModal;