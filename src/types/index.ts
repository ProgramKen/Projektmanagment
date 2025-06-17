// Role and Permission System
export type SystemRole = 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'member' | 'viewer';
export type JobRole = 'ceo' | 'manager' | 'senior_developer' | 'developer' | 'junior_developer' | 'designer' | 'qa_engineer' | 'devops' | 'intern' | 'apprentice' | 'consultant' | 'freelancer' | 'software_developer' | 'team_lead' | 'architect';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: 'projects' | 'tasks' | 'users' | 'departments' | 'settings' | 'reports';
  action: 'create' | 'read' | 'update' | 'delete' | 'assign' | 'manage';
}

export interface RolePermissions {
  systemRole: SystemRole;
  permissions: Permission[];
  canManageUsers: boolean;
  canManageDepartments: boolean;
  canCreateProjects: boolean;
  canDeleteProjects: boolean;
  canAssignTasks: boolean;
  canViewReports: boolean;
}

// Department System
export interface Department {
  id: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  parentId?: string; // Alternative naming
  managerId?: string;
  color: string;
  budget?: number;
  location?: string;
  tags: string[];
  memberCount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended User for platform users
export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  systemRole: SystemRole;
  jobRole: JobRole;
  departmentId?: string;
  managerId?: string;
  employeeId?: string;
  phone?: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  skillTags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Person interface for non-platform users and external stakeholders
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email?: string;
  phone?: string;
  jobRole: JobRole;
  departmentId?: string;
  organizationId?: string;
  organization?: string; // For external persons
  isExternal: boolean;
  isActive: boolean;
  skillTags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Organization for external stakeholders
export interface Organization {
  id: string;
  name: string;
  type: 'client' | 'vendor' | 'partner' | 'contractor';
  website?: string;
  address?: string;
  contactPerson?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  ownerId: string;
  ownerType: 'user' | 'person';
  departmentId?: string;
  clientId?: string; // Reference to external organization
  budget?: number;
  currency?: string;
  teamMembers: TeamMember[];
  tasks: Task[];
  links: ProjectLink[];
  files: FileReference[];
  tags: string[];
  skillsRequired: string[];
  objectives: string[];
  risks: ProjectRisk[];
  milestones: ProjectMilestone[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  mitigation?: string;
  status: 'identified' | 'mitigated' | 'resolved' | 'occurred';
  createdAt: Date;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  dependencies: string[]; // Task IDs
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'testing' | 'done' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  assigneeType?: 'user' | 'person'; // Type of assignee
  reporterId: string;
  reporterType: 'user' | 'person';
  departmentId?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  dependencies: string[];
  subtasks: string[]; // References to other tasks
  tags: string[];
  skillsRequired: string[];
  comments: Comment[];
  attachments: FileReference[];
  watchers: { id: string; type: 'user' | 'person' }[]; // People watching this task
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeamMember {
  personId: string; // Can be User or Person
  personType: 'user' | 'person';
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'consultant' | 'manager' | 'lead';
  responsibility?: string;
  workloadPercentage?: number;
  hourlyRate?: number;
  joinedAt: Date;
  leftAt?: Date;
}

export interface ProjectLink {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  type: 'dependency' | 'related' | 'parent' | 'child' | 'blocks' | 'blocked-by';
  description?: string;
  createdAt: Date;
  createdBy: string;
}

export interface FileReference {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploaderType: 'user' | 'person';
  uploadedAt: Date;
  projectId?: string;
  taskId?: string;
  departmentId?: string;
  tags: string[];
  isPublic: boolean;
  accessLevel: 'private' | 'team' | 'department' | 'organization' | 'public';
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorType: 'user' | 'person';
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
  mentions: { id: string; type: 'user' | 'person' }[];
  attachments?: FileReference[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'project' | 'user' | 'person' | 'department' | 'organization' | 'task' | 'file' | 'tag' | 'skill' | 'milestone';
  data: any;
  position?: { x: number; y: number };
}

// Extended graph data for mini-graphs
export interface GraphContext {
  focusId: string;
  focusType: 'project' | 'task' | 'user' | 'person' | 'department';
  depth: number; // How many connection levels to show
  includeTypes: ('project' | 'user' | 'person' | 'department' | 'task' | 'tag')[];
}

export interface KnowledgeGraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  weight?: number;
  label?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'project_updated' | 'comment_added' | 'deadline_approaching';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface ChatMessage {
  id: string;
  projectId?: string;
  taskId?: string;
  departmentId?: string;
  authorId: string;
  authorType: 'user' | 'person';
  content: string;
  type: 'text' | 'file' | 'system' | 'announcement';
  createdAt: Date;
  editedAt?: Date;
  replyToId?: string;
  mentions: { id: string; type: 'user' | 'person' }[];
}

// Helper types for the UI
export type PersonRef = {
  id: string;
  type: 'user' | 'person';
  displayName: string;
  email?: string;
  departmentId?: string;
  jobRole: JobRole;
  isActive: boolean;
};

export interface DepartmentHierarchy extends Department {
  children: DepartmentHierarchy[];
  members: PersonRef[];
  memberCount: number;
  projectCount: number;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  departments?: string[];
  roles?: (SystemRole | JobRole)[];
  skills?: string[];
  isActive?: boolean;
  isExternal?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ProjectAssignment {
  projectId: string;
  projectName: string;
  role: TeamMember['role'];
  workloadPercentage?: number;
  startDate: Date;
  endDate?: Date;
}

export interface TaskAssignment {
  taskId: string;
  taskTitle: string;
  projectName: string;
  status: Task['status'];
  priority: Task['priority'];
  dueDate?: Date;
  estimatedHours?: number;
}

// Analytics and reporting types
export interface DepartmentStats {
  departmentId: string;
  memberCount: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  totalHours: number;
  utilizationRate: number;
}

export interface PersonWorkload {
  personId: string;
  personType: 'user' | 'person';
  displayName: string;
  totalAssignedTasks: number;
  completedTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  currentWorkloadPercentage: number;
  projects: ProjectAssignment[];
  tasks: TaskAssignment[];
}

// UI State types
export interface UserManagementState {
  users: User[];
  persons: Person[];
  departments: Department[];
  organizations: Organization[];
  selectedUser?: User;
  selectedPerson?: Person;
  selectedDepartment?: Department;
  loading: boolean;
  error?: string;
  filters: SearchFilters;
}