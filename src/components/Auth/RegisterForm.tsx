import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
    <Card className="w-full max-w-md space-y-4 p-6">
      <CardHeader className="space-y-2 text-center">
        <CardTitle>Registrieren</CardTitle>
        <CardDescription>Erstellen Sie ein neues Konto</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vollständiger Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Passwort bestätigen</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {password !== confirmPassword && confirmPassword !== '' && (
              <p className="text-sm text-red-600">Passwörter stimmen nicht überein</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email || !password || password !== confirmPassword}
          >
            {loading ? 'Lädt...' : 'Registrieren'}
          </Button>
        </form>
        <p className="text-center text-sm">
          Bereits ein Konto?{' '}
          <button type="button" onClick={onToggleMode} className="underline">
            Anmelden
          </button>
        </p>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;