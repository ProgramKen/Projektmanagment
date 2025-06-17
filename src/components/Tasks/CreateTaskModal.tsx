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
} from '@mui/material';
import { Task } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onTaskCreated: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
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
    dueDate: '',
    estimatedHours: '',
  });

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
        assigneeId: undefined,
        reporterId: user?.id || 'user',
        reporterType: 'user',
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        actualHours: undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        dependencies: [],
        subtasks: [],
        tags: [],
        skillsRequired: [],
        comments: [],
        attachments: [],
        watchers: [],
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
      dueDate: '',
      estimatedHours: '',
    });
    setError('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Neue Task erstellen</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Task-Titel *"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
              >
                <MenuItem value="todo">Zu erledigen</MenuItem>
                <MenuItem value="in-progress">In Bearbeitung</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="done">Erledigt</MenuItem>
              </Select>
            </FormControl>

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
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Deadline"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              label="Geschätzte Stunden"
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Box>
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

export default CreateTaskModal;