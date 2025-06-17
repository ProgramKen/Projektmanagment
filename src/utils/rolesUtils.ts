import { SystemRole, JobRole, Permission, RolePermissions, User, Person } from '../types';

// System Role Definitions
export const SYSTEM_ROLES: Record<SystemRole, { label: string; description: string; level: number }> = {
  super_admin: {
    label: 'Super Administrator',
    description: 'Full system access and management',
    level: 100
  },
  admin: {
    label: 'Administrator', 
    description: 'Organization-wide administration',
    level: 90
  },
  project_manager: {
    label: 'Project Manager',
    description: 'Manages projects and teams',
    level: 70
  },
  team_lead: {
    label: 'Team Lead',
    description: 'Leads development teams',
    level: 60
  },
  member: {
    label: 'Member',
    description: 'Regular team member',
    level: 30
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access',
    level: 10
  }
};

// Job Role Definitions
export const JOB_ROLES: Record<JobRole, { label: string; category: string; color: string }> = {
  ceo: { label: 'CEO', category: 'Leadership', color: '#dc2626' },
  manager: { label: 'Manager', category: 'Management', color: '#7c3aed' },
  senior_developer: { label: 'Senior Developer', category: 'Development', color: '#059669' },
  developer: { label: 'Developer', category: 'Development', color: '#0891b2' },
  junior_developer: { label: 'Junior Developer', category: 'Development', color: '#0d9488' },
  designer: { label: 'Designer', category: 'Design', color: '#db2777' },
  qa_engineer: { label: 'QA Engineer', category: 'Quality', color: '#ca8a04' },
  devops: { label: 'DevOps Engineer', category: 'Operations', color: '#ea580c' },
  intern: { label: 'Intern', category: 'Trainee', color: '#84cc16' },
  apprentice: { label: 'Apprentice', category: 'Trainee', color: '#65a30d' },
  consultant: { label: 'Consultant', category: 'External', color: '#6366f1' },
  freelancer: { label: 'Freelancer', category: 'External', color: '#8b5cf6' },
  software_developer: { label: 'Software Developer', category: 'Technical', color: '#10b981' },
  team_lead: { label: 'Team Lead', category: 'Leadership', color: '#3b82f6' },
  architect: { label: 'Architect', category: 'Technical', color: '#6366f1' }
};

// Default permissions for each system role
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, Partial<RolePermissions>> = {
  super_admin: {
    systemRole: 'super_admin',
    canManageUsers: true,
    canManageDepartments: true,
    canCreateProjects: true,
    canDeleteProjects: true,
    canAssignTasks: true,
    canViewReports: true
  },
  admin: {
    systemRole: 'admin',
    canManageUsers: true,
    canManageDepartments: true,
    canCreateProjects: true,
    canDeleteProjects: false,
    canAssignTasks: true,
    canViewReports: true
  },
  project_manager: {
    systemRole: 'project_manager',
    canManageUsers: false,
    canManageDepartments: false,
    canCreateProjects: true,
    canDeleteProjects: false,
    canAssignTasks: true,
    canViewReports: true
  },
  team_lead: {
    systemRole: 'team_lead',
    canManageUsers: false,
    canManageDepartments: false,
    canCreateProjects: false,
    canDeleteProjects: false,
    canAssignTasks: true,
    canViewReports: false
  },
  member: {
    systemRole: 'member',
    canManageUsers: false,
    canManageDepartments: false,
    canCreateProjects: false,
    canDeleteProjects: false,
    canAssignTasks: false,
    canViewReports: false
  },
  viewer: {
    systemRole: 'viewer',
    canManageUsers: false,
    canManageDepartments: false,
    canCreateProjects: false,
    canDeleteProjects: false,
    canAssignTasks: false,
    canViewReports: false
  }
};

// Utility functions
export const getSystemRoleLevel = (role: SystemRole): number => {
  if (!role || !SYSTEM_ROLES[role]) {
    console.warn(`Invalid system role: ${role}. Defaulting to member level.`);
    return SYSTEM_ROLES.member.level;
  }
  return SYSTEM_ROLES[role].level;
};

export const getJobRoleInfo = (role: JobRole) => {
  return JOB_ROLES[role];
};

export const canUserManageUser = (currentUser: User | null, targetUser: User | Person): boolean => {
  if (!currentUser || !('systemRole' in currentUser) || !currentUser.systemRole) return false;
  
  const currentUserLevel = getSystemRoleLevel(currentUser.systemRole);
  
  // Super admin can manage everyone
  if (currentUser.systemRole === 'super_admin') return true;
  
  // Admin can manage non-admins
  if (currentUser.systemRole === 'admin') {
    if ('systemRole' in targetUser) {
      return getSystemRoleLevel(targetUser.systemRole) < currentUserLevel;
    }
    return true; // Can manage all persons
  }
  
  // Project managers can manage team members in their projects
  if (currentUser.systemRole === 'project_manager') {
    if ('systemRole' in targetUser) {
      return targetUser.systemRole === 'member' || targetUser.systemRole === 'viewer';
    }
    return true; // Can manage persons
  }
  
  return false;
};

export const canUserAccessDepartment = (user: User, departmentId: string): boolean => {
  // Super admin and admin can access all departments
  if (user.systemRole === 'super_admin' || user.systemRole === 'admin') {
    return true;
  }
  
  // Users can access their own department
  if (user.departmentId === departmentId) {
    return true;
  }
  
  // Project managers can access departments of their projects
  if (user.systemRole === 'project_manager') {
    // This would need to be checked against actual project assignments
    return true;
  }
  
  return false;
};

export const getAvailableSystemRoles = (currentUser: User | null): SystemRole[] => {
  if (!currentUser || !currentUser.systemRole) {
    console.warn('Invalid currentUser or systemRole. Returning empty roles.');
    return [];
  }
  
  const currentLevel = getSystemRoleLevel(currentUser.systemRole);
  
  return Object.entries(SYSTEM_ROLES)
    .filter(([_, roleInfo]) => roleInfo.level < currentLevel)
    .map(([role, _]) => role as SystemRole);
};

export const formatPersonDisplayName = (person: User | Person): string => {
  return `${person.firstName} ${person.lastName}`;
};

export const getPersonJobRoleColor = (person: User | Person): string => {
  return JOB_ROLES[person.jobRole].color;
};

export const isPersonExternal = (person: User | Person): boolean => {
  if ('isExternal' in person) {
    return person.isExternal;
  }
  return false;
};

export const isPersonActive = (person: User | Person): boolean => {
  return person.isActive;
};

export const getPersonEmail = (person: User | Person): string | undefined => {
  return person.email;
};

export const getPersonDepartment = (person: User | Person): string | undefined => {
  return person.departmentId;
};

// Filter and search utilities
export const filterPersonsByRole = (persons: (User | Person)[], roles: (SystemRole | JobRole)[]): (User | Person)[] => {
  return persons.filter(person => {
    const hasSystemRole = 'systemRole' in person && roles.includes(person.systemRole);
    const hasJobRole = roles.includes(person.jobRole);
    return hasSystemRole || hasJobRole;
  });
};

export const filterPersonsByDepartment = (persons: (User | Person)[], departmentIds: string[]): (User | Person)[] => {
  return persons.filter(person => 
    person.departmentId && departmentIds.includes(person.departmentId)
  );
};

export const filterPersonsBySkills = (persons: (User | Person)[], skills: string[]): (User | Person)[] => {
  return persons.filter(person => 
    skills.some(skill => person.skillTags.includes(skill))
  );
};

export const searchPersons = (persons: (User | Person)[], query: string): (User | Person)[] => {
  const lowercaseQuery = query.toLowerCase();
  
  return persons.filter(person => {
    const displayName = formatPersonDisplayName(person).toLowerCase();
    const email = person.email?.toLowerCase() || '';
    const jobRole = JOB_ROLES[person.jobRole].label.toLowerCase();
    const skills = person.skillTags.join(' ').toLowerCase();
    
    return displayName.includes(lowercaseQuery) ||
           email.includes(lowercaseQuery) ||
           jobRole.includes(lowercaseQuery) ||
           skills.includes(lowercaseQuery);
  });
};