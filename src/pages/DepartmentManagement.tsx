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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  AvatarGroup,
  Tooltip,
  LinearProgress,
  Divider,
  Fab,
} from '@mui/material';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  Analytics as AnalyticsIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  setDepartments, 
  addDepartment, 
  updateDepartment, 
  deleteDepartment,
  setSelectedDepartment,
  setLoading,
  setError 
} from '../store/slices/departmentSlice';
import { Department, DepartmentHierarchy, User, Person } from '../types';
import { 
  buildDepartmentHierarchy, 
  getDepartmentBreadcrumb,
  calculateDepartmentWorkload,
  DEPARTMENT_TEMPLATES,
  getRandomDepartmentColor 
} from '../utils/departmentUtils';
import { formatPersonDisplayName, getPersonJobRoleColor, JOB_ROLES } from '../utils/rolesUtils';

const DepartmentManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { departments, selectedDepartment, loading, error } = useSelector((state: RootState) => state.departments);
  const { users } = useSelector((state: RootState) => state.userManagement);
  const { projects } = useSelector((state: RootState) => state.projects);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuDepartmentId, setMenuDepartmentId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    description: '',
    parentDepartmentId: '',
    color: getRandomDepartmentColor(),
    budget: 0,
    location: '',
    tags: []
  });

  // Mock data for demonstration - in real app this would come from API
  useEffect(() => {
    if (departments.length === 0) {
      const mockDepartments: Department[] = [
        {
          id: 'dept-1',
          name: 'Engineering',
          description: 'Software development and technical teams',
          color: '#3b82f6',
          tags: ['development', 'technical'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dept-2',
          name: 'Frontend Team',
          description: 'User interface development',
          parentDepartmentId: 'dept-1',
          color: '#ec4899',
          tags: ['frontend', 'ui'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dept-3',
          name: 'Backend Team',
          description: 'Server-side development',
          parentDepartmentId: 'dept-1',
          color: '#10b981',
          tags: ['backend', 'api'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dept-4',
          name: 'Design',
          description: 'User experience and visual design',
          color: '#8b5cf6',
          tags: ['design', 'ux'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      dispatch(setDepartments(mockDepartments));
    }
  }, [departments.length, dispatch]);

  const hierarchy = buildDepartmentHierarchy(departments, users, [], projects);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, departmentId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuDepartmentId(departmentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuDepartmentId(null);
  };

  const handleCreateDepartment = () => {
    setFormData({
      name: '',
      description: '',
      parentDepartmentId: selectedDepartment?.id || '',
      color: getRandomDepartmentColor(),
      budget: 0,
      location: '',
      tags: []
    });
    setCreateModalOpen(true);
    handleMenuClose();
  };

  const handleEditDepartment = () => {
    if (menuDepartmentId) {
      const dept = departments.find(d => d.id === menuDepartmentId);
      if (dept) {
        setFormData(dept);
        setEditModalOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleDeleteDepartment = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDeleteDepartment = () => {
    if (menuDepartmentId) {
      dispatch(deleteDepartment(menuDepartmentId));
    }
    setDeleteDialogOpen(false);
    setMenuDepartmentId(null);
  };

  const handleSaveDepartment = () => {
    if (!formData.name) return;

    const newDepartment: Department = {
      id: editModalOpen ? (formData.id || '') : `dept-${Date.now()}`,
      name: formData.name,
      description: formData.description || '',
      parentDepartmentId: formData.parentDepartmentId || undefined,
      managerId: formData.managerId,
      color: formData.color || getRandomDepartmentColor(),
      budget: formData.budget,
      location: formData.location,
      tags: formData.tags || [],
      isActive: true,
      createdAt: formData.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editModalOpen) {
      dispatch(updateDepartment(newDepartment));
    } else {
      dispatch(addDepartment(newDepartment));
    }

    setCreateModalOpen(false);
    setEditModalOpen(false);
    setFormData({});
  };

  const renderDepartmentTree = (departments: DepartmentHierarchy[]) => {
    return departments.map((dept) => {
      const workload = calculateDepartmentWorkload(dept.id, users, [], []);
      
      return (
        <TreeItem
          key={dept.id}
          nodeId={dept.id}
          label={
            <Box display="flex" alignItems="center" py={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: dept.color,
                  mr: 1
                }}
              />
              <Box flex={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {dept.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${dept.memberCount} Members`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<BusinessIcon />}
                    label={`${dept.projectCount} Projects`}
                    size="small"
                    variant="outlined"
                  />
                  {dept.description && (
                    <Typography variant="body2" color="textSecondary">
                      {dept.description}
                    </Typography>
                  )}
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick(e, dept.id);
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          }
          onClick={() => dispatch(setSelectedDepartment(dept))}
        >
          {dept.children.length > 0 && renderDepartmentTree(dept.children)}
        </TreeItem>
      );
    });
  };

  const renderDepartmentDetails = () => {
    if (!selectedDepartment) {
      return (
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary" textAlign="center">
              Select a department to view details
            </Typography>
          </CardContent>
        </Card>
      );
    }

    const workload = calculateDepartmentWorkload(selectedDepartment.id, users, [], []);
    const departmentMembers = users.filter(u => u.departmentId === selectedDepartment.id);

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: selectedDepartment.color
                }}
              />
              <Box>
                <Typography variant="h5">{selectedDepartment.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {getDepartmentBreadcrumb(selectedDepartment.id, departments)}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                setFormData(selectedDepartment);
                setEditModalOpen(true);
              }}
            >
              Edit
            </Button>
          </Box>

          {selectedDepartment.description && (
            <Typography variant="body1" mb={3}>
              {selectedDepartment.description}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Statistics */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {workload.totalMembers}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Team Members
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {workload.completedTasks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Completed Tasks
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {workload.activeTasks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Tasks
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {workload.utilizationRate}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Utilization
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Team Members */}
          <Box mb={3}>
            <Typography variant="h6" mb={2}>Team Members</Typography>
            {departmentMembers.length > 0 ? (
              <Grid container spacing={2}>
                {departmentMembers.map((member) => (
                  <Grid item xs={12} md={6} key={member.id}>
                    <Box display="flex" alignItems="center" gap={2} p={1}>
                      <Avatar sx={{ bgcolor: getPersonJobRoleColor(member) }}>
                        {formatPersonDisplayName(member).charAt(0)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle2">
                          {formatPersonDisplayName(member)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {JOB_ROLES[member.jobRole].label}
                        </Typography>
                      </Box>
                      <Chip
                        label={member.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={member.isActive ? 'success' : 'default'}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No team members assigned to this department yet.
              </Typography>
            )}
          </Box>

          {/* Tags */}
          {selectedDepartment.tags.length > 0 && (
            <Box>
              <Typography variant="h6" mb={1}>Tags</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {selectedDepartment.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

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
            Department Management
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Manage organizational structure and team assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleCreateDepartment()}
          sx={{
            background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
        >
          Create Department
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Department Tree */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AccountTreeIcon color="primary" />
                <Typography variant="h6">Department Hierarchy</Typography>
              </Box>
              <TreeView
                sx={{ flexGrow: 1, overflowY: 'auto' }}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
              >
                {renderDepartmentTree(hierarchy)}
              </TreeView>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Details */}
        <Grid item xs={12} md={6}>
          {renderDepartmentDetails()}
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCreateDepartment}>
          <AddIcon sx={{ mr: 1 }} />
          Add Subdepartment
        </MenuItem>
        <MenuItem onClick={handleEditDepartment}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Department
        </MenuItem>
        <MenuItem onClick={handleDeleteDepartment} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Department
        </MenuItem>
      </Menu>

      {/* Create/Edit Department Dialog */}
      <Dialog 
        open={createModalOpen || editModalOpen} 
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editModalOpen ? 'Edit Department' : 'Create Department'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Department</InputLabel>
                <Select
                  value={formData.parentDepartmentId || ''}
                  label="Parent Department"
                  onChange={(e) => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                >
                  <MenuItem value="">None (Root Level)</MenuItem>
                  {departments
                    .filter(d => d.id !== formData.id) // Don't allow self as parent
                    .map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {getDepartmentBreadcrumb(dept.id, departments)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                helperText="Enter tags separated by commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCreateModalOpen(false);
              setEditModalOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveDepartment}
            variant="contained"
            disabled={!formData.name}
          >
            {editModalOpen ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this department? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDeleteDepartment}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentManagement;