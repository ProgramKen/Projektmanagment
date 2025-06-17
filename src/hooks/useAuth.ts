import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setUser, setLoading, setError } from '../store/slices/authSlice';
import { AuthService, AuthCredentials } from '../services/firebase/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Load user from localStorage or create default user
    dispatch(setLoading(true));
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch(setUser({
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        }));
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        // Create default user if parsing fails
        createDefaultUser();
      }
    } else {
      createDefaultUser();
    }
    
    dispatch(setLoading(false));
  }, [dispatch]);

  const createDefaultUser = () => {
    const defaultUser = {
      id: 'user-' + Date.now(),
      email: 'user@projectmanager.com',
      displayName: 'Project Manager',
      firstName: 'Project',
      lastName: 'Manager',
      systemRole: 'admin' as const,
      jobRole: 'manager' as const,
      isActive: true,
      skillTags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    dispatch(setUser(defaultUser));
  };

  const signUp = async (credentials: AuthCredentials) => {
    dispatch(setLoading(true));
    setTimeout(() => {
      const newUser = {
        id: 'user-' + Date.now(),
        email: credentials.email,
        displayName: credentials.displayName || credentials.email.split('@')[0],
        firstName: credentials.displayName?.split(' ')[0] || credentials.email.split('@')[0],
        lastName: credentials.displayName?.split(' ')[1] || 'User',
        systemRole: 'member' as const,
        jobRole: 'developer' as const,
        isActive: true,
        skillTags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      dispatch(setUser(newUser));
      dispatch(setLoading(false));
    }, 1000);
  };

  const signIn = async (credentials: AuthCredentials) => {
    dispatch(setLoading(true));
    setTimeout(() => {
      const user = {
        id: 'user-' + Date.now(),
        email: credentials.email,
        displayName: credentials.email.split('@')[0],
        firstName: credentials.email.split('@')[0],
        lastName: 'User',
        systemRole: 'admin' as const,
        jobRole: 'manager' as const,
        isActive: true,
        skillTags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      dispatch(setUser(user));
      dispatch(setLoading(false));
    }, 1000);
  };

  const signOut = async () => {
    dispatch(setLoading(true));
    setTimeout(() => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('projects');
      dispatch(setUser(null));
      dispatch(setLoading(false));
    }, 500);
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    signUp,
    signIn,
    signOut,
  };
};