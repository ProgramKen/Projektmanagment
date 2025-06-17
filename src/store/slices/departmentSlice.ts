import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Department, DepartmentHierarchy, SearchFilters } from '../../types';

interface DepartmentState {
  departments: Department[];
  hierarchy: DepartmentHierarchy[];
  selectedDepartment: Department | null;
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
}

const initialState: DepartmentState = {
  departments: [],
  hierarchy: [],
  selectedDepartment: null,
  loading: false,
  error: null,
  filters: {
    query: '',
    departments: [],
    roles: [],
    skills: [],
    isActive: true,
    isExternal: undefined
  },
};

const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    setDepartments: (state, action: PayloadAction<Department[]>) => {
      state.departments = action.payload;
      state.error = null;
    },
    setDepartmentHierarchy: (state, action: PayloadAction<DepartmentHierarchy[]>) => {
      state.hierarchy = action.payload;
    },
    addDepartment: (state, action: PayloadAction<Department>) => {
      state.departments.push(action.payload);
    },
    updateDepartment: (state, action: PayloadAction<Department>) => {
      const index = state.departments.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.departments[index] = action.payload;
      }
    },
    deleteDepartment: (state, action: PayloadAction<string>) => {
      state.departments = state.departments.filter(d => d.id !== action.payload);
      if (state.selectedDepartment?.id === action.payload) {
        state.selectedDepartment = null;
      }
    },
    setSelectedDepartment: (state, action: PayloadAction<Department | null>) => {
      state.selectedDepartment = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    // Bulk operations
    bulkUpdateDepartments: (state, action: PayloadAction<Department[]>) => {
      const updateMap = new Map(action.payload.map(d => [d.id, d]));
      state.departments = state.departments.map(d => updateMap.get(d.id) || d);
    },
    bulkDeleteDepartments: (state, action: PayloadAction<string[]>) => {
      const deleteIds = new Set(action.payload);
      state.departments = state.departments.filter(d => !deleteIds.has(d.id));
      if (state.selectedDepartment && deleteIds.has(state.selectedDepartment.id)) {
        state.selectedDepartment = null;
      }
    }
  },
});

export const {
  setDepartments,
  setDepartmentHierarchy,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  setSelectedDepartment,
  setLoading,
  setError,
  setFilters,
  clearFilters,
  bulkUpdateDepartments,
  bulkDeleteDepartments
} = departmentSlice.actions;

export default departmentSlice.reducer;