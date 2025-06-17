import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Permission, hasPermission, hasContextualPermission, PermissionContext } from '../../utils/permissions';

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  context?: Omit<PermissionContext, 'user' | 'action'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  fallbackMessage?: string;
}

/**
 * PermissionGate component for conditional rendering based on user permissions
 * 
 * Usage examples:
 * 
 * // Simple permission check
 * <PermissionGate permission={Permission.PROJECT_CREATE}>
 *   <CreateProjectButton />
 * </PermissionGate>
 * 
 * // Multiple permissions (any of them)
 * <PermissionGate permissions={[Permission.PROJECT_UPDATE, Permission.PROJECT_DELETE]}>
 *   <ProjectActions />
 * </PermissionGate>
 * 
 * // Multiple permissions (all required)
 * <PermissionGate permissions={[Permission.USER_CREATE, Permission.USER_MANAGE_ROLES]} requireAll>
 *   <AdvancedUserManagement />
 * </PermissionGate>
 * 
 * // With context (resource-specific)
 * <PermissionGate 
 *   permission={Permission.PROJECT_UPDATE}
 *   context={{ resource: { type: 'project', data: project } }}
 * >
 *   <EditProjectButton />
 * </PermissionGate>
 * 
 * // With custom fallback
 * <PermissionGate 
 *   permission={Permission.SYSTEM_ADMIN}
 *   fallback={<div>Access Denied</div>}
 * >
 *   <AdminPanel />
 * </PermissionGate>
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  context,
  children,
  fallback,
  showFallback = false,
  fallbackMessage = 'Sie haben nicht die erforderlichen Berechtigungen für diese Aktion.'
}) => {
  const user = useSelector((state: RootState) => state.auth.user);

  // If no user is logged in, deny access
  if (!user) {
    return showFallback ? (
      <React.Fragment>
        {fallback || (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded m-2">
            Sie müssen angemeldet sein, um auf diese Funktion zuzugreifen.
          </div>
        )}
      </React.Fragment>
    ) : null;
  }

  let hasAccess = false;

  // Check permissions based on props
  if (permission) {
    if (context) {
      // Context-aware permission check
      hasAccess = hasContextualPermission({
        user,
        action: permission,
        ...context
      });
    } else {
      // Simple permission check
      hasAccess = hasPermission(user, permission);
    }
  } else if (permissions && permissions.length > 0) {
    if (requireAll) {
      // User must have ALL permissions
      hasAccess = permissions.every(perm => {
        if (context) {
          return hasContextualPermission({
            user,
            action: perm,
            ...context
          });
        } else {
          return hasPermission(user, perm);
        }
      });
    } else {
      // User must have ANY of the permissions
      hasAccess = permissions.some(perm => {
        if (context) {
          return hasContextualPermission({
            user,
            action: perm,
            ...context
          });
        } else {
          return hasPermission(user, perm);
        }
      });
    }
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }

  // Render content based on access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if access is denied
  if (showFallback) {
    return (
      <React.Fragment>
        {fallback || (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded m-2">
            {fallbackMessage}
          </div>
        )}
      </React.Fragment>
    );
  }

  return null;
};

export default PermissionGate;

// Additional helper components for common permission patterns

/**
 * AdminOnly component - only renders for admin users
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <PermissionGate 
    permissions={[Permission.SYSTEM_ADMIN, Permission.USER_MANAGE_ROLES]} 
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * ManagerOnly component - only renders for manager level and above
 */
export const ManagerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <PermissionGate 
    permissions={[
      Permission.SYSTEM_ADMIN, 
      Permission.USER_MANAGE_ROLES, 
      Permission.PROJECT_MANAGE_TEAM,
      Permission.DEPARTMENT_MANAGE_MEMBERS
    ]} 
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * ProjectOwnerOnly component - only renders for project owners or admins
 */
export const ProjectOwnerOnly: React.FC<{ 
  project: any; 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}> = ({ project, children, fallback }) => (
  <PermissionGate 
    permission={Permission.PROJECT_UPDATE}
    context={{ resource: { type: 'project', data: project } }}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * TaskAssigneeOnly component - only renders for task assignees or managers
 */
export const TaskAssigneeOnly: React.FC<{ 
  task: any; 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}> = ({ task, children, fallback }) => (
  <PermissionGate 
    permission={Permission.TASK_UPDATE}
    context={{ resource: { type: 'task', data: task } }}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * DepartmentManagerOnly component - only renders for department managers
 */
export const DepartmentManagerOnly: React.FC<{ 
  department: any; 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}> = ({ department, children, fallback }) => (
  <PermissionGate 
    permission={Permission.DEPARTMENT_MANAGE_MEMBERS}
    context={{ resource: { type: 'department', data: department } }}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * ConditionalButton component - shows different buttons based on permissions
 */
export const ConditionalButton: React.FC<{
  permission: Permission;
  context?: Omit<PermissionContext, 'user' | 'action'>;
  authorizedComponent: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}> = ({ permission, context, authorizedComponent, unauthorizedComponent }) => (
  <PermissionGate permission={permission} context={context}>
    {authorizedComponent}
  </PermissionGate>
);