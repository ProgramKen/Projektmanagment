import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from './slices/projectsSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import departmentReducer from './slices/departmentSlice';
import userManagementReducer from './slices/userManagementSlice';

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    auth: authReducer,
    ui: uiReducer,
    departments: departmentReducer,
    userManagement: userManagementReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;