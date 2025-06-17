import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Person, Organization, PersonRef, SearchFilters, PersonWorkload } from '../../types';

interface UserManagementState {
  users: User[];
  persons: Person[];
  organizations: Organization[];
  selectedUser: User | null;
  selectedPerson: Person | null;
  selectedOrganization: Organization | null;
  workloads: PersonWorkload[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  view: 'users' | 'persons' | 'organizations' | 'all';
}

const initialState: UserManagementState = {
  users: [],
  persons: [],
  organizations: [],
  selectedUser: null,
  selectedPerson: null,
  selectedOrganization: null,
  workloads: [],
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
  view: 'all'
};

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    // Users
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
      state.error = null;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(u => u.id !== action.payload);
      if (state.selectedUser?.id === action.payload) {
        state.selectedUser = null;
      }
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    
    // Persons
    setPersons: (state, action: PayloadAction<Person[]>) => {
      state.persons = action.payload;
      state.error = null;
    },
    addPerson: (state, action: PayloadAction<Person>) => {
      state.persons.push(action.payload);
    },
    updatePerson: (state, action: PayloadAction<Person>) => {
      const index = state.persons.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.persons[index] = action.payload;
      }
    },
    deletePerson: (state, action: PayloadAction<string>) => {
      state.persons = state.persons.filter(p => p.id !== action.payload);
      if (state.selectedPerson?.id === action.payload) {
        state.selectedPerson = null;
      }
    },
    setSelectedPerson: (state, action: PayloadAction<Person | null>) => {
      state.selectedPerson = action.payload;
    },
    
    // Organizations
    setOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = action.payload;
      state.error = null;
    },
    addOrganization: (state, action: PayloadAction<Organization>) => {
      state.organizations.push(action.payload);
    },
    updateOrganization: (state, action: PayloadAction<Organization>) => {
      const index = state.organizations.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.organizations[index] = action.payload;
      }
    },
    deleteOrganization: (state, action: PayloadAction<string>) => {
      state.organizations = state.organizations.filter(o => o.id !== action.payload);
      if (state.selectedOrganization?.id === action.payload) {
        state.selectedOrganization = null;
      }
    },
    setSelectedOrganization: (state, action: PayloadAction<Organization | null>) => {
      state.selectedOrganization = action.payload;
    },
    
    // Workloads
    setWorkloads: (state, action: PayloadAction<PersonWorkload[]>) => {
      state.workloads = action.payload;
    },
    updateWorkload: (state, action: PayloadAction<PersonWorkload>) => {
      const index = state.workloads.findIndex(w => 
        w.personId === action.payload.personId && 
        w.personType === action.payload.personType
      );
      if (index !== -1) {
        state.workloads[index] = action.payload;
      } else {
        state.workloads.push(action.payload);
      }
    },
    
    // General
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
    setView: (state, action: PayloadAction<UserManagementState['view']>) => {
      state.view = action.payload;
    },
    
    // Bulk operations
    bulkUpdateUsers: (state, action: PayloadAction<User[]>) => {
      const updateMap = new Map(action.payload.map(u => [u.id, u]));
      state.users = state.users.map(u => updateMap.get(u.id) || u);
    },
    bulkUpdatePersons: (state, action: PayloadAction<Person[]>) => {
      const updateMap = new Map(action.payload.map(p => [p.id, p]));
      state.persons = state.persons.map(p => updateMap.get(p.id) || p);
    },
    bulkDeleteUsers: (state, action: PayloadAction<string[]>) => {
      const deleteIds = new Set(action.payload);
      state.users = state.users.filter(u => !deleteIds.has(u.id));
      if (state.selectedUser && deleteIds.has(state.selectedUser.id)) {
        state.selectedUser = null;
      }
    },
    bulkDeletePersons: (state, action: PayloadAction<string[]>) => {
      const deleteIds = new Set(action.payload);
      state.persons = state.persons.filter(p => !deleteIds.has(p.id));
      if (state.selectedPerson && deleteIds.has(state.selectedPerson.id)) {
        state.selectedPerson = null;
      }
    },
    
    // Activate/Deactivate operations
    toggleUserStatus: (state, action: PayloadAction<string>) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) {
        user.isActive = !user.isActive;
        user.updatedAt = new Date();
      }
    },
    togglePersonStatus: (state, action: PayloadAction<string>) => {
      const person = state.persons.find(p => p.id === action.payload);
      if (person) {
        person.isActive = !person.isActive;
        person.updatedAt = new Date();
      }
    },
    
    // Skill management
    addSkillToUser: (state, action: PayloadAction<{ userId: string; skill: string }>) => {
      const user = state.users.find(u => u.id === action.payload.userId);
      if (user && !user.skillTags.includes(action.payload.skill)) {
        user.skillTags.push(action.payload.skill);
        user.updatedAt = new Date();
      }
    },
    removeSkillFromUser: (state, action: PayloadAction<{ userId: string; skill: string }>) => {
      const user = state.users.find(u => u.id === action.payload.userId);
      if (user) {
        user.skillTags = user.skillTags.filter(s => s !== action.payload.skill);
        user.updatedAt = new Date();
      }
    },
    addSkillToPerson: (state, action: PayloadAction<{ personId: string; skill: string }>) => {
      const person = state.persons.find(p => p.id === action.payload.personId);
      if (person && !person.skillTags.includes(action.payload.skill)) {
        person.skillTags.push(action.payload.skill);
        person.updatedAt = new Date();
      }
    },
    removeSkillFromPerson: (state, action: PayloadAction<{ personId: string; skill: string }>) => {
      const person = state.persons.find(p => p.id === action.payload.personId);
      if (person) {
        person.skillTags = person.skillTags.filter(s => s !== action.payload.skill);
        person.updatedAt = new Date();
      }
    }
  },
});

export const {
  // Users
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setSelectedUser,
  
  // Persons
  setPersons,
  addPerson,
  updatePerson,
  deletePerson,
  setSelectedPerson,
  
  // Organizations
  setOrganizations,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  setSelectedOrganization,
  
  // Workloads
  setWorkloads,
  updateWorkload,
  
  // General
  setLoading,
  setError,
  setFilters,
  clearFilters,
  setView,
  
  // Bulk operations
  bulkUpdateUsers,
  bulkUpdatePersons,
  bulkDeleteUsers,
  bulkDeletePersons,
  
  // Status operations
  toggleUserStatus,
  togglePersonStatus,
  
  // Skills
  addSkillToUser,
  removeSkillFromUser,
  addSkillToPerson,
  removeSkillFromPerson
} = userManagementSlice.actions;

export default userManagementSlice.reducer;