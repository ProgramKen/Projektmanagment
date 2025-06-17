import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  Autocomplete,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  setUsers,
  setPersons,
  addUser,
  addPerson,
  updateUser,
  updatePerson,
  deleteUser,
  deletePerson,
  setSelectedUser,
  setSelectedPerson,
  setView,
  setFilters,
  toggleUserStatus,
  togglePersonStatus
} from '../store/slices/userManagementSlice';
import { User, Person, Department, SystemRole, JobRole } from '../types';
import { 
  SYSTEM_ROLES,
  JOB_ROLES,
  formatPersonDisplayName,
  getPersonJobRoleColor,
  canUserManageUser,
  getAvailableSystemRoles
} from '../utils/rolesUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const UserManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    users, 
    persons, 
    selectedUser, 
    selectedPerson, 
    loading, 
    error, 
    filters, 
    view 
  } = useSelector((state: RootState) => state.userManagement);
  const { departments } = useSelector((state: RootState) => state.departments);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<{ id: string; type: 'user' | 'person' } | null>(null);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createPersonModalOpen, setCreatePersonModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Form state
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    systemRole: 'member',
    jobRole: 'developer',
    departmentId: '',
    phone: '',
    skillTags: [],
    isActive: true
  });

  const [personFormData, setPersonFormData] = useState<Partial<Person>>({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    jobRole: 'developer',
    departmentId: '',
    phone: '',
    isExternal: false,
    skillTags: [],
    isActive: true
  });

  // Mock data initialization
  useEffect(() => {
    if (users.length === 0) {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          email: 'john.doe@company.com',
          systemRole: 'project_manager',
          jobRole: 'senior_developer',
          departmentId: 'dept-1',
          phone: '+1234567890',
          isActive: true,
          skillTags: ['React', 'TypeScript', 'Node.js'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          email: 'jane.smith@company.com',
          systemRole: 'team_lead',
          jobRole: 'designer',
          departmentId: 'dept-4',
          phone: '+1234567891',
          isActive: true,
          skillTags: ['UI/UX', 'Figma', 'Design Systems'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      dispatch(setUsers(mockUsers));

      const mockPersons: Person[] = [
        {
          id: 'person-1',
          firstName: 'Alice',
          lastName: 'Johnson',
          displayName: 'Alice Johnson',
          email: 'alice@external.com',
          jobRole: 'consultant',
          departmentId: 'dept-1',
          isExternal: true,
          isActive: true,
          skillTags: ['Strategy', 'Business Analysis'],
          organization: 'External Consulting Inc',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      dispatch(setPersons(mockPersons));
    }
  }, [users.length, dispatch]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, id: string, type: 'user' | 'person') => {
    setAnchorEl(event.currentTarget);
    setMenuTarget({ id, type });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTarget(null);
  };

  const handleEditItem = () => {
    if (menuTarget) {
      if (menuTarget.type === 'user') {
        const user = users.find(u => u.id === menuTarget.id);
        if (user) {
          setUserFormData(user);
          dispatch(setSelectedUser(user));
          setEditModalOpen(true);
        }
      } else {
        const person = persons.find(p => p.id === menuTarget.id);
        if (person) {
          setPersonFormData(person);
          dispatch(setSelectedPerson(person));
          setEditModalOpen(true);
        }
      }
    }
    handleMenuClose();
  };

  const handleToggleStatus = () => {
    if (menuTarget) {
      if (menuTarget.type === 'user') {
        dispatch(toggleUserStatus(menuTarget.id));
      } else {
        dispatch(togglePersonStatus(menuTarget.id));
      }
    }
    handleMenuClose();
  };

  const handleDeleteItem = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (menuTarget) {
      if (menuTarget.type === 'user') {
        dispatch(deleteUser(menuTarget.id));
      } else {
        dispatch(deletePerson(menuTarget.id));
      }
    }
    setDeleteDialogOpen(false);
    setMenuTarget(null);
  };

  const handleSaveUser = () => {
    if (!userFormData.firstName || !userFormData.lastName || !userFormData.email) return;

    const newUser: User = {
      id: editModalOpen ? (userFormData.id || '') : `user-${Date.now()}`,
      firstName: userFormData.firstName,
      lastName: userFormData.lastName,
      displayName: userFormData.displayName || `${userFormData.firstName} ${userFormData.lastName}`,
      email: userFormData.email,
      systemRole: userFormData.systemRole || 'member',
      jobRole: userFormData.jobRole || 'developer',
      departmentId: userFormData.departmentId,
      phone: userFormData.phone,
      isActive: userFormData.isActive !== false,
      skillTags: userFormData.skillTags || [],
      createdAt: userFormData.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editModalOpen) {
      dispatch(updateUser(newUser));
    } else {
      dispatch(addUser(newUser));
    }

    setCreateUserModalOpen(false);
    setEditModalOpen(false);
    setUserFormData({});
  };

  const handleSavePerson = () => {
    if (!personFormData.firstName || !personFormData.lastName) return;

    const newPerson: Person = {
      id: editModalOpen ? (personFormData.id || '') : `person-${Date.now()}`,
      firstName: personFormData.firstName,
      lastName: personFormData.lastName,
      displayName: personFormData.displayName || `${personFormData.firstName} ${personFormData.lastName}`,
      email: personFormData.email,
      jobRole: personFormData.jobRole || 'developer',
      departmentId: personFormData.departmentId,
      phone: personFormData.phone,
      isExternal: personFormData.isExternal || false,
      isActive: personFormData.isActive !== false,
      skillTags: personFormData.skillTags || [],
      organization: personFormData.organization,
      notes: personFormData.notes,
      createdAt: personFormData.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editModalOpen) {
      dispatch(updatePerson(newPerson));
    } else {
      dispatch(addPerson(newPerson));
    }

    setCreatePersonModalOpen(false);
    setEditModalOpen(false);
    setPersonFormData({});
  };

  const renderUserCard = (user: User) => (
    <Card key={user.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                user.isActive ? 
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} /> :
                  <BlockIcon sx={{ color: 'error.main', fontSize: 16 }} />
              }
            >
              <Avatar 
                sx={{ 
                  bgcolor: getPersonJobRoleColor(user),
                  width: 56,
                  height: 56
                }}
              >
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="h6">{formatPersonDisplayName(user)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {user.email}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip 
                  label={SYSTEM_ROLES[user.systemRole].label}
                  size="small"
                  color="primary"
                />
                <Chip 
                  label={JOB_ROLES[user.jobRole].label}
                  size="small"
                  variant="outlined"
                  sx={{ bgcolor: JOB_ROLES[user.jobRole].color, color: 'white' }}
                />
                {user.departmentId && (
                  <Chip 
                    label={departments.find(d => d.id === user.departmentId)?.name || 'Unknown Dept'}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              {user.skillTags.length > 0 && (
                <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                  {user.skillTags.slice(0, 3).map(skill => (
                    <Chip key={skill} label={skill} size="small" variant="outlined" />
                  ))}
                  {user.skillTags.length > 3 && (
                    <Chip label={`+${user.skillTags.length - 3}`} size="small" variant="outlined" />
                  )}
                </Box>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={(e) => handleMenuClick(e, user.id, 'user')}
            disabled={!canUserManageUser(currentUser, user)}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  const renderPersonCard = (person: Person) => (
    <Card key={person.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                person.isExternal ? 
                  <BusinessIcon sx={{ color: 'info.main', fontSize: 16 }} /> :
                  person.isActive ? 
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} /> :
                    <BlockIcon sx={{ color: 'error.main', fontSize: 16 }} />
              }
            >
              <Avatar 
                sx={{ 
                  bgcolor: getPersonJobRoleColor(person),
                  width: 56,
                  height: 56
                }}
              >
                {person.firstName.charAt(0)}{person.lastName.charAt(0)}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="h6">{formatPersonDisplayName(person)}</Typography>
              <Typography variant="body2" color="textSecondary">
                {person.email || 'No email'}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip 
                  label={JOB_ROLES[person.jobRole].label}
                  size="small"
                  sx={{ bgcolor: JOB_ROLES[person.jobRole].color, color: 'white' }}
                />
                {person.isExternal && (
                  <Chip 
                    label="External"
                    size="small"
                    color="info"
                  />
                )}
                {person.organization && (
                  <Chip 
                    label={person.organization}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              {person.skillTags.length > 0 && (
                <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                  {person.skillTags.slice(0, 3).map(skill => (
                    <Chip key={skill} label={skill} size="small" variant="outlined" />
                  ))}
                  {person.skillTags.length > 3 && (
                    <Chip label={`+${person.skillTags.length - 3}`} size="small" variant="outlined" />
                  )}
                </Box>
              )}
            </Box>
          </Box>
          <IconButton onClick={(e) => handleMenuClick(e, person.id, 'person')}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ 
            background: 'linear-gradient(45deg, #2563eb, #8b5cf6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            User Management
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Manage platform users and stakeholders
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={() => setCreatePersonModalOpen(true)}
          >
            Add Person
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateUserModalOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`Platform Users (${users.length})`} />
            <Tab label={`Stakeholders (${persons.length})`} />
            <Tab label="Analytics" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box mb={2}>
              <Typography variant="h6" mb={2}>Platform Users</Typography>
              {users.map(user => renderUserCard(user))}
              {users.length === 0 && (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  No platform users found. Add your first user to get started.
                </Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box mb={2}>
              <Typography variant="h6" mb={2}>Stakeholders & External Persons</Typography>
              {persons.map(person => renderPersonCard(person))}
              {persons.length === 0 && (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  No stakeholders found. Add persons who don't need platform access.
                </Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box>
              <Typography variant="h6" mb={3}>User Analytics</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" mb={2}>Role Distribution</Typography>
                    {Object.entries(SYSTEM_ROLES).map(([role, info]) => {
                      const count = users.filter(u => u.systemRole === role).length;
                      const percentage = users.length > 0 ? (count / users.length) * 100 : 0;
                      return (
                        <Box key={role} mb={1}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">{info.label}</Typography>
                            <Typography variant="body2">{count}</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      );
                    })}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" mb={2}>Department Distribution</Typography>
                    {departments.map(dept => {
                      const userCount = users.filter(u => u.departmentId === dept.id).length;
                      const personCount = persons.filter(p => p.departmentId === dept.id).length;
                      const total = userCount + personCount;
                      return (
                        <Box key={dept.id} display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">{dept.name}</Typography>
                          <Typography variant="body2">
                            {total} ({userCount}u + {personCount}p)
                          </Typography>
                        </Box>
                      );
                    })}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditItem}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {menuTarget && (
            menuTarget.type === 'user' 
              ? users.find(u => u.id === menuTarget.id)?.isActive 
              : persons.find(p => p.id === menuTarget.id)?.isActive
          ) ? (
            <>
              <BlockIcon sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDeleteItem} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create User Modal */}
      <Dialog open={createUserModalOpen} onClose={() => setCreateUserModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Platform User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={userFormData.firstName || ''}
                onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={userFormData.lastName || ''}
                onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userFormData.email || ''}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>System Role</InputLabel>
                <Select
                  value={userFormData.systemRole || 'member'}
                  label="System Role"
                  onChange={(e) => setUserFormData({ ...userFormData, systemRole: e.target.value as SystemRole })}
                >
                  {getAvailableSystemRoles(currentUser).map(role => (
                    <MenuItem key={role} value={role}>
                      {SYSTEM_ROLES[role].label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Job Role</InputLabel>
                <Select
                  value={userFormData.jobRole || 'developer'}
                  label="Job Role"
                  onChange={(e) => setUserFormData({ ...userFormData, jobRole: e.target.value as JobRole })}
                >
                  {Object.entries(JOB_ROLES).map(([role, info]) => (
                    <MenuItem key={role} value={role}>
                      {info.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={userFormData.departmentId || ''}
                  label="Department"
                  onChange={(e) => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={userFormData.phone || ''}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={userFormData.skillTags || []}
                onChange={(e, newValue) => setUserFormData({ ...userFormData, skillTags: newValue })}
                renderInput={(params) => (
                  <TextField {...params} label="Skills" placeholder="Add skills..." />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateUserModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      {/* Create Person Modal */}
      <Dialog open={createPersonModalOpen} onClose={() => setCreatePersonModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Stakeholder</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={personFormData.firstName || ''}
                onChange={(e) => setPersonFormData({ ...personFormData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={personFormData.lastName || ''}
                onChange={(e) => setPersonFormData({ ...personFormData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={personFormData.email || ''}
                onChange={(e) => setPersonFormData({ ...personFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Job Role</InputLabel>
                <Select
                  value={personFormData.jobRole || 'developer'}
                  label="Job Role"
                  onChange={(e) => setPersonFormData({ ...personFormData, jobRole: e.target.value as JobRole })}
                >
                  {Object.entries(JOB_ROLES).map(([role, info]) => (
                    <MenuItem key={role} value={role}>
                      {info.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={personFormData.departmentId || ''}
                  label="Department"
                  onChange={(e) => setPersonFormData({ ...personFormData, departmentId: e.target.value })}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={personFormData.isExternal || false}
                    onChange={(e) => setPersonFormData({ ...personFormData, isExternal: e.target.checked })}
                  />
                }
                label="External Person (from another organization)"
              />
            </Grid>
            {personFormData.isExternal && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Organization"
                  value={personFormData.organization || ''}
                  onChange={(e) => setPersonFormData({ ...personFormData, organization: e.target.value })}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={personFormData.phone || ''}
                onChange={(e) => setPersonFormData({ ...personFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={personFormData.skillTags || []}
                onChange={(e, newValue) => setPersonFormData({ ...personFormData, skillTags: newValue })}
                renderInput={(params) => (
                  <TextField {...params} label="Skills" placeholder="Add skills..." />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={personFormData.notes || ''}
                onChange={(e) => setPersonFormData({ ...personFormData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePersonModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePerson} variant="contained">Add Person</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {menuTarget?.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;