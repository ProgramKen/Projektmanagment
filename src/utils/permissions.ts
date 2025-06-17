import { User, Person, SystemRole, JobRole, Project, Task } from '../types';

// Define permissions for different actions
export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',
  
  // Person Management
  PERSON_CREATE = 'person:create',
  PERSON_READ = 'person:read',
  PERSON_UPDATE = 'person:update',
  PERSON_DELETE = 'person:delete',
  
  // Department Management
  DEPARTMENT_CREATE = 'department:create',
  DEPARTMENT_READ = 'department:read',
  DEPARTMENT_UPDATE = 'department:update',
  DEPARTMENT_DELETE = 'department:delete',
  DEPARTMENT_MANAGE_MEMBERS = 'department:manage_members',
  
  // Project Management
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE_TEAM = 'project:manage_team',
  PROJECT_VIEW_ALL = 'project:view_all',
  
  // Task Management
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  TASK_VIEW_ALL = 'task:view_all',
  
  // System Administration
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_BACKUP = 'system:backup',
  
  // Analytics and Reporting
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  REPORTS_GENERATE = 'reports:generate'
}

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  'super_admin': [
    // Super admin has all permissions
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
    Permission.PERSON_CREATE,
    Permission.PERSON_READ,
    Permission.PERSON_UPDATE,
    Permission.PERSON_DELETE,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,
    Permission.DEPARTMENT_MANAGE_MEMBERS,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE_TEAM,
    Permission.PROJECT_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TASK_VIEW_ALL,
    Permission.SYSTEM_ADMIN,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_BACKUP,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.REPORTS_GENERATE
  ],
  
  'admin': [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_MANAGE_ROLES,
    Permission.PERSON_CREATE,
    Permission.PERSON_READ,
    Permission.PERSON_UPDATE,
    Permission.PERSON_DELETE,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_MANAGE_MEMBERS,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE_TEAM,
    Permission.PROJECT_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TASK_VIEW_ALL,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.REPORTS_GENERATE
  ],
  
  'project_manager': [
    Permission.USER_READ,
    Permission.PERSON_CREATE,
    Permission.PERSON_READ,
    Permission.PERSON_UPDATE,
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_MANAGE_MEMBERS,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_MANAGE_TEAM,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.ANALYTICS_VIEW,
    Permission.REPORTS_GENERATE
  ],
  
  'team_lead': [
    Permission.USER_READ,
    Permission.PERSON_READ,
    Permission.DEPARTMENT_READ,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_MANAGE_TEAM,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
    Permission.ANALYTICS_VIEW
  ],
  
  'member': [
    Permission.USER_READ,
    Permission.PERSON_READ,
    Permission.DEPARTMENT_READ,
    Permission.PROJECT_READ,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.ANALYTICS_VIEW
  ],
  
  'viewer': [
    Permission.USER_READ,
    Permission.PERSON_READ,
    Permission.DEPARTMENT_READ,
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.ANALYTICS_VIEW
  ]
};

// Context-specific permissions for resource ownership
export interface PermissionContext {
  user: User;
  resource?: {
    type: 'project' | 'task' | 'user' | 'person' | 'department';
    data: any;
  };
  action: Permission;
}

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (user: User, permission: Permission): boolean => {
  const userPermissions = ROLE_PERMISSIONS[user.systemRole] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if a user has multiple permissions (AND operation)
 */
export const hasAllPermissions = (user: User, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if a user has any of the specified permissions (OR operation)
 */
export const hasAnyPermission = (user: User, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Context-aware permission checking with resource ownership
 */
export const hasContextualPermission = (context: PermissionContext): boolean => {
  const { user, resource, action } = context;
  
  // First check base role permissions
  if (!hasPermission(user, action)) {
    return false;
  }
  
  // If no resource context, base permission is sufficient
  if (!resource) {
    return true;
  }
  
  // Context-specific rules
  switch (resource.type) {
    case 'project':
      return checkProjectPermission(user, resource.data as Project, action);
    
    case 'task':
      return checkTaskPermission(user, resource.data as Task, action);
    
    case 'user':
      return checkUserPermission(user, resource.data as User, action);
    
    case 'person':
      return checkPersonPermission(user, resource.data as Person, action);
    
    case 'department':
      return checkDepartmentPermission(user, resource.data, action);
    
    default:
      return true;
  }
};

/**
 * Check project-specific permissions
 */
export const checkProjectPermission = (
  user: User, 
  project: Project, 
  action: Permission
): boolean => {
  // Project owner has all permissions
  if (project.ownerId === user.id && project.ownerType === 'user') {
    return true;
  }
  
  // Team members have different levels of access
  const teamMember = project.teamMembers?.find(
    member => member.personId === user.id && member.personType === 'user'
  );
  
  if (teamMember) {
    switch (teamMember.role) {
      case 'owner':
        return true;
      
      case 'manager':
        return [
          Permission.PROJECT_READ,
          Permission.PROJECT_UPDATE,
          Permission.PROJECT_MANAGE_TEAM,
          Permission.TASK_CREATE,
          Permission.TASK_READ,
          Permission.TASK_UPDATE,
          Permission.TASK_DELETE,
          Permission.TASK_ASSIGN
        ].includes(action);
      
      case 'lead':
        return [
          Permission.PROJECT_READ,
          Permission.PROJECT_UPDATE,
          Permission.TASK_CREATE,
          Permission.TASK_READ,
          Permission.TASK_UPDATE,
          Permission.TASK_ASSIGN
        ].includes(action);
      
      case 'member':
        return [
          Permission.PROJECT_READ,
          Permission.TASK_READ,
          Permission.TASK_UPDATE
        ].includes(action);
      
      case 'viewer':
        return [
          Permission.PROJECT_READ,
          Permission.TASK_READ
        ].includes(action);
      
      default:
        return false;
    }
  }
  
  // Same department access
  if (user.departmentId && project.departmentId === user.departmentId) {
    return [
      Permission.PROJECT_READ,
      Permission.TASK_READ
    ].includes(action);
  }
  
  return false;
};

/**
 * Check task-specific permissions
 */
export const checkTaskPermission = (
  user: User, 
  task: Task, 
  action: Permission
): boolean => {
  // Task assignee has update permissions
  if (task.assigneeId === user.id && task.assigneeType === 'user') {
    return [
      Permission.TASK_READ,
      Permission.TASK_UPDATE
    ].includes(action);
  }
  
  // Task reporter has management permissions
  if (task.reporterId === user.id && task.reporterType === 'user') {
    return [
      Permission.TASK_READ,
      Permission.TASK_UPDATE,
      Permission.TASK_DELETE
    ].includes(action);
  }
  
  // Watchers have read permissions
  const isWatcher = task.watchers?.some(
    watcher => watcher.id === user.id && watcher.type === 'user'
  );
  
  if (isWatcher) {
    return action === Permission.TASK_READ;
  }
  
  // Same department access
  if (user.departmentId && task.departmentId === user.departmentId) {
    return action === Permission.TASK_READ;
  }
  
  return false;
};

/**
 * Check user management permissions
 */
export const checkUserPermission = (
  currentUser: User, 
  targetUser: User, 
  action: Permission
): boolean => {
  // Users can always read/update their own profile
  if (currentUser.id === targetUser.id) {
    return [
      Permission.USER_READ,
      Permission.USER_UPDATE
    ].includes(action);
  }
  
  // System role hierarchy check
  const currentUserLevel = getSystemRoleLevel(currentUser.systemRole);
  const targetUserLevel = getSystemRoleLevel(targetUser.systemRole);
  
  // Can only manage users with lower system role level
  if (currentUserLevel <= targetUserLevel) {
    return false;
  }
  
  // Same department management
  if (currentUser.departmentId === targetUser.departmentId) {
    if (currentUser.systemRole === 'project_manager') {
      return [
        Permission.USER_READ,
        Permission.USER_UPDATE
      ].includes(action);
    }
  }
  
  return true;
};

/**
 * Check person management permissions
 */
export const checkPersonPermission = (
  user: User, 
  person: Person, 
  action: Permission
): boolean => {
  // Same department access
  if (user.departmentId && person.departmentId === user.departmentId) {
    return true;
  }
  
  return hasPermission(user, action);
};

/**
 * Check department management permissions
 */
export const checkDepartmentPermission = (
  user: User, 
  department: any, 
  action: Permission
): boolean => {
  // Department manager has full access to their department
  if (user.departmentId === department.id && user.systemRole === 'project_manager') {
    return true;
  }
  
  return hasPermission(user, action);
};

/**
 * Get system role level for hierarchy comparison
 */
export const getSystemRoleLevel = (role: SystemRole): number => {
  const roleLevels: Record<SystemRole, number> = {
    'super_admin': 6,
    'admin': 5,
    'project_manager': 4,
    'team_lead': 3,
    'member': 2,
    'viewer': 1
  };
  
  return roleLevels[role] || 0;
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = (user: User): Permission[] => {
  return ROLE_PERMISSIONS[user.systemRole] || [];
};

/**
 * Check if user can manage another user based on role hierarchy
 */
export const canManageUser = (currentUser: User, targetUser: User): boolean => {
  return hasContextualPermission({
    user: currentUser,
    resource: { type: 'user', data: targetUser },
    action: Permission.USER_UPDATE
  });
};

/**
 * Check if user can access a project
 */
export const canAccessProject = (user: User, project: Project): boolean => {
  return hasContextualPermission({
    user,
    resource: { type: 'project', data: project },
    action: Permission.PROJECT_READ
  });
};

/**
 * Check if user can access a task
 */
export const canAccessTask = (user: User, task: Task): boolean => {
  return hasContextualPermission({
    user,
    resource: { type: 'task', data: task },
    action: Permission.TASK_READ
  });
};

/**
 * Filter projects based on user permissions
 */
export const filterProjectsByPermissions = (
  user: User, 
  projects: Project[]
): Project[] => {
  return projects.filter(project => canAccessProject(user, project));
};

/**
 * Filter tasks based on user permissions
 */
export const filterTasksByPermissions = (
  user: User, 
  tasks: Task[]
): Task[] => {
  return tasks.filter(task => canAccessTask(user, task));
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermission = (
  user: User,
  permission: Permission,
  component: React.ComponentType<any>,
  fallback?: React.ComponentType<any>
) => {
  return hasPermission(user, permission) ? component : fallback || null;
};

/**
 * Permission check hook for React components
 */
export const usePermissions = (user: User) => {
  return {
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasContextualPermission: (context: Omit<PermissionContext, 'user'>) => 
      hasContextualPermission({ ...context, user }),
    canManageUser: (targetUser: User) => canManageUser(user, targetUser),
    canAccessProject: (project: Project) => canAccessProject(user, project),
    canAccessTask: (task: Task) => canAccessTask(user, task)
  };
};