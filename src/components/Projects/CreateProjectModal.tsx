import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { Project } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { createProject, loading, error } = useProjects();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    priority: 'medium' as Project['priority'],
  });

  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
    });
    setFormError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormError('Projektname ist erforderlich');
      return;
    }

    if (!user) {
      setFormError('Sie müssen angemeldet sein, um ein Projekt zu erstellen');
      return;
    }

    const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      ownerId: user.id,
      ownerType: 'user',
      teamMembers: [],
      tasks: [],
      links: [],
      files: [],
      tags: [],
      skillsRequired: [],
      objectives: [],
      risks: [],
      milestones: [],
    };

    try {
      await createProject(newProject);
      handleClose();
    } catch (err) {
      setFormError('Fehler beim Erstellen des Projekts');
    }
  };

  const currentError = formError || error;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Neues Projekt erstellen</DialogTitle>
      
      <DialogContent>
        {currentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {currentError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Projektname"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
            fullWidth
            margin="normal"
          />

          <TextField
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />

          <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
            Status und Priorität können später bearbeitet werden
          </Typography>
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? <CircularProgress size={20} /> : 'Projekt erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectModal;