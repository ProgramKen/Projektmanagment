import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Link,
  CircularProgress,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { signUp, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    await signUp({ email, password, displayName });
  };

  return (
    <Card sx={{ maxWidth: 400, width: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Registrieren
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
          Erstellen Sie ein neues Konto
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Vollständiger Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
            fullWidth
            margin="normal"
          />
          <TextField
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            fullWidth
            margin="normal"
          />
          <TextField
            label="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            fullWidth
            margin="normal"
          />
          <TextField
            label="Passwort bestätigen"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            fullWidth
            margin="normal"
            error={password !== confirmPassword && confirmPassword !== ''}
            helperText={password !== confirmPassword && confirmPassword !== '' ? 'Passwörter stimmen nicht überein' : ''}
          />
          <Button
            type="submit"
            disabled={loading || !email || !password || password !== confirmPassword}
            variant="contained"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrieren'}
          </Button>
        </Box>

        <Typography variant="body2" align="center">
          Bereits ein Konto?{' '}
          <Link 
            component="button" 
            onClick={onToggleMode}
            sx={{ cursor: 'pointer' }}
          >
            Anmelden
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;