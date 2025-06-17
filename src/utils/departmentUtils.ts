import { Department, DepartmentHierarchy, User, Person, PersonRef, Project, Task } from '../types';
import { formatPersonDisplayName, getPersonJobRoleColor } from './rolesUtils';

// Default department colors
export const DEPARTMENT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

// Default department templates
export const DEPARTMENT_TEMPLATES = [
  {
    name: 'Engineering',
    description: 'Software development and technical teams',
    color: '#3b82f6',
    tags: ['development', 'technical', 'software']
  },
  {
    name: 'Design',
    description: 'User experience and visual design',
    color: '#ec4899',
    tags: ['design', 'ux', 'ui', 'creative']
  },
  {
    name: 'Product Management',
    description: 'Product strategy and roadmap planning',
    color: '#8b5cf6',
    tags: ['product', 'strategy', 'planning']
  },
  {
    name: 'Quality Assurance',
    description: 'Testing and quality control',
    color: '#10b981',
    tags: ['testing', 'quality', 'qa']
  },
  {
    name: 'DevOps',
    description: 'Infrastructure and deployment operations',
    color: '#f59e0b',
    tags: ['infrastructure', 'deployment', 'operations']
  },
  {
    name: 'Marketing',
    description: 'Marketing and customer outreach',
    color: '#ef4444',
    tags: ['marketing', 'outreach', 'promotion']
  },
  {
    name: 'Sales',
    description: 'Sales and business development',
    color: '#06b6d4',
    tags: ['sales', 'business', 'revenue']
  },
  {
    name: 'Human Resources',
    description: 'People operations and talent management',
    color: '#84cc16',
    tags: ['hr', 'people', 'talent']
  }
];

// Build department hierarchy from flat list
export const buildDepartmentHierarchy = (
  departments: Department[],
  users: User[] = [],
  persons: Person[] = [],
  projects: Project[] = []
): DepartmentHierarchy[] => {
  const departmentMap = new Map<string, DepartmentHierarchy>();
  
  // Initialize all departments
  departments.forEach(dept => {
    departmentMap.set(dept.id, {
      ...dept,
      children: [],
      members: [],
      memberCount: 0,
      projectCount: 0
    });
  });
  
  // Add members to departments
  [...users, ...persons].forEach(person => {
    if (person.departmentId) {
      const dept = departmentMap.get(person.departmentId);
      if (dept) {
        const personRef: PersonRef = {
          id: person.id,
          type: 'systemRole' in person ? 'user' : 'person',
          displayName: formatPersonDisplayName(person),
          email: person.email,
          departmentId: person.departmentId,
          jobRole: person.jobRole,
          isActive: person.isActive
        };
        dept.members.push(personRef);
        dept.memberCount++;
      }
    }
  });
  
  // Count projects per department
  projects.forEach(project => {
    if (project.departmentId) {
      const dept = departmentMap.get(project.departmentId);
      if (dept) {
        dept.projectCount++;
      }
    }
  });
  
  // Build hierarchy
  const rootDepartments: DepartmentHierarchy[] = [];
  
  departments.forEach(dept => {
    const hierarchyDept = departmentMap.get(dept.id)!;
    
    if (dept.parentDepartmentId) {
      const parent = departmentMap.get(dept.parentDepartmentId);
      if (parent) {
        parent.children.push(hierarchyDept);
      } else {
        rootDepartments.push(hierarchyDept);
      }
    } else {
      rootDepartments.push(hierarchyDept);
    }
  });
  
  return rootDepartments;
};

// Get all department IDs in a hierarchy branch
export const getDepartmentBranchIds = (department: DepartmentHierarchy): string[] => {
  const ids = [department.id];
  department.children.forEach(child => {
    ids.push(...getDepartmentBranchIds(child));
  });
  return ids;
};

// Get department path (from root to department)
export const getDepartmentPath = (
  departmentId: string,
  departments: Department[]
): Department[] => {
  const departmentMap = new Map(departments.map(d => [d.id, d]));
  const path: Department[] = [];
  
  let currentId: string | undefined = departmentId;
  while (currentId) {
    const dept = departmentMap.get(currentId);
    if (dept) {
      path.unshift(dept);
      currentId = dept.parentDepartmentId;
    } else {
      break;
    }
  }
  
  return path;
};

// Get department breadcrumb string
export const getDepartmentBreadcrumb = (
  departmentId: string,
  departments: Department[],
  separator: string = ' > '
): string => {
  const path = getDepartmentPath(departmentId, departments);
  return path.map(d => d.name).join(separator);
};

// Check if department is ancestor of another
export const isDepartmentAncestor = (
  ancestorId: string,
  descendantId: string,
  departments: Department[]
): boolean => {
  const path = getDepartmentPath(descendantId, departments);
  return path.some(d => d.id === ancestorId);
};

// Get all child department IDs (recursive)
export const getChildDepartmentIds = (
  parentId: string,
  departments: Department[]
): string[] => {
  const children = departments.filter(d => d.parentDepartmentId === parentId);
  const allChildIds = children.map(c => c.id);
  
  children.forEach(child => {
    allChildIds.push(...getChildDepartmentIds(child.id, departments));
  });
  
  return allChildIds;
};

// Validate department hierarchy (no circular references)
export const validateDepartmentHierarchy = (departments: Department[]): string[] => {
  const errors: string[] = [];
  
  departments.forEach(dept => {
    if (dept.parentDepartmentId) {
      // Check if parent exists
      const parent = departments.find(d => d.id === dept.parentDepartmentId);
      if (!parent) {
        errors.push(`Department "${dept.name}" has non-existent parent ID: ${dept.parentDepartmentId}`);
        return;
      }
      
      // Check for circular reference
      if (isDepartmentAncestor(dept.id, dept.parentDepartmentId, departments)) {
        errors.push(`Circular reference detected: Department "${dept.name}" cannot be its own ancestor`);
      }
    }
  });
  
  return errors;
};

// Get department by ID
export const getDepartmentById = (
  departmentId: string,
  departments: Department[]
): Department | undefined => {
  return departments.find(d => d.id === departmentId);
};

// Get departments by manager
export const getDepartmentsByManager = (
  managerId: string,
  departments: Department[]
): Department[] => {
  return departments.filter(d => d.managerId === managerId);
};

// Get random department color
export const getRandomDepartmentColor = (): string => {
  return DEPARTMENT_COLORS[Math.floor(Math.random() * DEPARTMENT_COLORS.length)];
};

// Generate department suggestions based on existing tags
export const generateDepartmentSuggestions = (
  existingDepartments: Department[],
  templates: typeof DEPARTMENT_TEMPLATES = DEPARTMENT_TEMPLATES
): typeof DEPARTMENT_TEMPLATES => {
  const existingNames = new Set(
    existingDepartments.map(d => d.name.toLowerCase())
  );
  
  return templates.filter(template => 
    !existingNames.has(template.name.toLowerCase())
  );
};

// Calculate department workload
export const calculateDepartmentWorkload = (
  departmentId: string,
  users: User[],
  persons: Person[],
  tasks: Task[]
): {
  totalMembers: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  utilizationRate: number;
} => {
  const departmentMembers = [...users, ...persons].filter(
    p => p.departmentId === departmentId && p.isActive
  );
  
  const memberIds = departmentMembers.map(m => m.id);
  const departmentTasks = tasks.filter(
    t => (t.assigneeId && memberIds.includes(t.assigneeId)) || t.departmentId === departmentId
  );
  
  const activeTasks = departmentTasks.filter(t => 
    t.status === 'todo' || t.status === 'in-progress'
  ).length;
  
  const completedTasks = departmentTasks.filter(t => 
    t.status === 'done'
  ).length;
  
  const overdueTasks = departmentTasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;
  
  const totalEstimatedHours = departmentTasks.reduce(
    (sum, task) => sum + (task.estimatedHours || 0), 0
  );
  
  const totalActualHours = departmentTasks.reduce(
    (sum, task) => sum + (task.actualHours || 0), 0
  );
  
  const utilizationRate = totalEstimatedHours > 0 
    ? (totalActualHours / totalEstimatedHours) * 100 
    : 0;
  
  return {
    totalMembers: departmentMembers.length,
    activeTasks,
    completedTasks,
    overdueTasks,
    totalEstimatedHours,
    totalActualHours,
    utilizationRate: Math.round(utilizationRate * 100) / 100
  };
};

// Search departments
export const searchDepartments = (
  departments: Department[],
  query: string
): Department[] => {
  const lowercaseQuery = query.toLowerCase();
  
  return departments.filter(dept => 
    dept.name.toLowerCase().includes(lowercaseQuery) ||
    dept.description?.toLowerCase().includes(lowercaseQuery) ||
    dept.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    dept.location?.toLowerCase().includes(lowercaseQuery)
  );
};