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

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn({ email, password });
  };

  return (
    <Card sx={{ maxWidth: 400, width: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Anmelden
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
          Melden Sie sich in Ihrem Project Manager an
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            fullWidth
            margin="normal"
          />
          <TextField
            label="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            disabled={loading || !email || !password}
            variant="contained"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Anmelden'}
          </Button>
        </Box>

        <Typography variant="body2" align="center">
          Noch kein Konto?{' '}
          <Link 
            component="button" 
            onClick={onToggleMode}
            sx={{ cursor: 'pointer' }}
          >
            Jetzt registrieren
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default LoginForm;