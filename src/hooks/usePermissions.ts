import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  Permission, 
  hasPermission, 
  hasAllPermissions,
  hasAnyPermission,
  hasContextualPermission,
  PermissionContext,
  canManageUser,
  canAccessProject,
  canAccessTask,
  getUserPermissions
} from '../utils/permissions';
import { User, Project, Task } from '../types';

/**
 * Hook for permission checking in React components
 */
export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  // If no user is logged in, return a permissions object with all false values
  if (!user) {
    return {
      user: null,
      hasPermission: () => false,
      hasAllPermissions: () => false,
      hasAnyPermission: () => false,
      hasContextualPermission: () => false,
      canManageUser: () => false,
      canAccessProject: () => false,
      canAccessTask: () => false,
      getUserPermissions: () => [],
      
      // Specific permission checks
      canCreateProjects: false,
      canManageUsers: false,
      canManageDepartments: false,
      canViewAnalytics: false,
      canExportData: false,
      isAdmin: false,
      isManager: false,
      isSuperAdmin: false,
      
      // UI helper functions
      filterVisibleProjects: (projects: Project[]) => [],
      filterVisibleTasks: (tasks: Task[]) => [],
      getAccessibleMenuItems: () => []
    };
  }

  return {
    user,
    
    // Core permission functions
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasContextualPermission: (context: Omit<PermissionContext, 'user'>) => 
      hasContextualPermission({ ...context, user }),
    
    // Resource-specific permission checks
    canManageUser: (targetUser: User) => canManageUser(user, targetUser),
    canAccessProject: (project: Project) => canAccessProject(user, project),
    canAccessTask: (task: Task) => canAccessTask(user, task),
    getUserPermissions: () => getUserPermissions(user),
    
    // Common permission shortcuts
    canCreateProjects: hasPermission(user, Permission.PROJECT_CREATE),
    canManageUsers: hasPermission(user, Permission.USER_MANAGE_ROLES),
    canManageDepartments: hasPermission(user, Permission.DEPARTMENT_MANAGE_MEMBERS),
    canViewAnalytics: hasPermission(user, Permission.ANALYTICS_VIEW),
    canExportData: hasPermission(user, Permission.ANALYTICS_EXPORT),
    
    // Role-based shortcuts
    isAdmin: hasAnyPermission(user, [Permission.SYSTEM_ADMIN, Permission.USER_MANAGE_ROLES]),
    isManager: hasPermission(user, Permission.DEPARTMENT_MANAGE_MEMBERS),
    isSuperAdmin: hasPermission(user, Permission.SYSTEM_ADMIN),
    
    // UI helper functions
    filterVisibleProjects: (projects: Project[]) => 
      projects.filter(project => canAccessProject(user, project)),
    
    filterVisibleTasks: (tasks: Task[]) => 
      tasks.filter(task => canAccessTask(user, task)),
    
    getAccessibleMenuItems: () => {
      const menuItems = [];
      
      if (hasPermission(user, Permission.PROJECT_READ)) {
        menuItems.push({ id: 'projects', label: 'Projekte', path: '/projects' });
      }
      
      if (hasPermission(user, Permission.DEPARTMENT_READ)) {
        menuItems.push({ id: 'departments', label: 'Departments', path: '/departments' });
      }
      
      if (hasPermission(user, Permission.USER_READ)) {
        menuItems.push({ id: 'users', label: 'Benutzer', path: '/users' });
      }
      
      if (hasPermission(user, Permission.ANALYTICS_VIEW)) {
        menuItems.push({ id: 'analytics', label: 'Analytics', path: '/analytics' });
      }
      
      if (hasPermission(user, Permission.SYSTEM_ADMIN)) {
        menuItems.push({ id: 'admin', label: 'Administration', path: '/admin' });
      }
      
      return menuItems;
    }
  };
};

/**
 * Hook for project-specific permissions
 */
export const useProjectPermissions = (project?: Project) => {
  const permissions = usePermissions();
  
  if (!project || !permissions.user) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageTeam: false,
      canCreateTasks: false,
      isOwner: false,
      isMember: false
    };
  }
  
  const isOwner = project.ownerId === permissions.user.id && project.ownerType === 'user';
  const teamMember = project.teamMembers?.find(
    member => member.personId === permissions.user!.id && member.personType === 'user'
  );
  const isMember = !!teamMember;
  
  return {
    canView: permissions.canAccessProject(project),
    canEdit: permissions.hasContextualPermission({
      resource: { type: 'project', data: project },
      action: Permission.PROJECT_UPDATE
    }),
    canDelete: permissions.hasContextualPermission({
      resource: { type: 'project', data: project },
      action: Permission.PROJECT_DELETE
    }),
    canManageTeam: permissions.hasContextualPermission({
      resource: { type: 'project', data: project },
      action: Permission.PROJECT_MANAGE_TEAM
    }),
    canCreateTasks: permissions.hasContextualPermission({
      resource: { type: 'project', data: project },
      action: Permission.TASK_CREATE
    }),
    isOwner,
    isMember,
    memberRole: teamMember?.role
  };
};

/**
 * Hook for task-specific permissions
 */
export const useTaskPermissions = (task?: Task) => {
  const permissions = usePermissions();
  
  if (!task || !permissions.user) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAssign: false,
      isAssignee: false,
      isReporter: false,
      isWatcher: false
    };
  }
  
  const isAssignee = task.assigneeId === permissions.user.id && task.assigneeType === 'user';
  const isReporter = task.reporterId === permissions.user.id && task.reporterType === 'user';
  const isWatcher = task.watchers?.some(
    watcher => watcher.id === permissions.user!.id && watcher.type === 'user'
  );
  
  return {
    canView: permissions.canAccessTask(task),
    canEdit: permissions.hasContextualPermission({
      resource: { type: 'task', data: task },
      action: Permission.TASK_UPDATE
    }),
    canDelete: permissions.hasContextualPermission({
      resource: { type: 'task', data: task },
      action: Permission.TASK_DELETE
    }),
    canAssign: permissions.hasContextualPermission({
      resource: { type: 'task', data: task },
      action: Permission.TASK_ASSIGN
    }),
    isAssignee,
    isReporter,
    isWatcher
  };
};

/**
 * Hook for user management permissions
 */
export const useUserManagementPermissions = (targetUser?: User) => {
  const permissions = usePermissions();
  
  if (!targetUser || !permissions.user) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageRoles: false,
      isSelf: false
    };
  }
  
  const isSelf = permissions.user.id === targetUser.id;
  
  return {
    canView: permissions.hasContextualPermission({
      resource: { type: 'user', data: targetUser },
      action: Permission.USER_READ
    }),
    canEdit: permissions.hasContextualPermission({
      resource: { type: 'user', data: targetUser },
      action: Permission.USER_UPDATE
    }),
    canDelete: permissions.hasContextualPermission({
      resource: { type: 'user', data: targetUser },
      action: Permission.USER_DELETE
    }),
    canManageRoles: permissions.hasPermission(Permission.USER_MANAGE_ROLES) && !isSelf,
    isSelf
  };
};