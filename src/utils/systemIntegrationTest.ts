/**
 * System Integration Test and Performance Optimization Utilities
 * 
 * This file contains utilities to test the entire user management system
 * and identify potential performance bottlenecks.
 */

import { User, Person, Department, Project, Task, SystemRole, JobRole } from '../types';
import { 
  transformToCytoscapeData, 
  getGraphStats, 
  filterGraphData 
} from './cytoscapeUtils';
import { 
  transformDepartmentsToNodes,
  transformUsersToNodes,
  transformPersonsToNodes,
  calculateGraphMetrics
} from './graphTransformUtils';
import {
  Permission,
  hasPermission,
  hasContextualPermission,
  canAccessProject,
  canAccessTask
} from './permissions';

// Test data generators
export const generateTestUser = (id: string, overrides: Partial<User> = {}): User => ({
  id,
  firstName: `User${id}`,
  lastName: `Lastname${id}`,
  displayName: `User${id} Lastname${id}`,
  email: `user${id}@example.com`,
  systemRole: 'member',
  jobRole: 'software_developer',
  departmentId: 'dept1',
  skillTags: ['JavaScript', 'React'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const generateTestPerson = (id: string, overrides: Partial<Person> = {}): Person => ({
  id,
  firstName: `Person${id}`,
  lastName: `External${id}`,
  displayName: `Person${id} External${id}`,
  email: `person${id}@external.com`,
  jobRole: 'consultant',
  departmentId: 'dept1',
  skillTags: ['Consulting', 'Strategy'],
  isExternal: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const generateTestDepartment = (id: string, overrides: Partial<Department> = {}): Department => ({
  id,
  name: `Department ${id}`,
  description: `Test department ${id}`,
  color: '#2563eb',
  tags: [],
  memberCount: 5,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const generateTestProject = (id: string, overrides: Partial<Project> = {}): Project => ({
  id,
  name: `Project ${id}`,
  description: `Test project ${id}`,
  status: 'active',
  priority: 'medium',
  ownerId: 'user1',
  ownerType: 'user',
  departmentId: 'dept1',
  teamMembers: [
    {
      personId: 'user1',
      personType: 'user',
      role: 'owner',
      responsibility: 'Project Owner',
      workloadPercentage: 100,
      joinedAt: new Date(),
    }
  ],
  tasks: [],
  links: [],
  files: [],
  tags: ['test', 'integration'],
  skillsRequired: ['JavaScript', 'React'],
  objectives: ['Complete integration tests'],
  risks: [],
  milestones: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const generateTestTask = (id: string, projectId: string, overrides: Partial<Task> = {}): Task => ({
  id,
  projectId,
  title: `Task ${id}`,
  description: `Test task ${id}`,
  status: 'todo',
  priority: 'medium',
  assigneeId: 'user1',
  assigneeType: 'user',
  reporterId: 'user1',
  reporterType: 'user',
  departmentId: 'dept1',
  dependencies: [],
  subtasks: [],
  tags: ['test'],
  skillsRequired: ['JavaScript'],
  comments: [],
  attachments: [],
  watchers: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// System integration tests
export interface SystemTestResult {
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface PerformanceMetrics {
  componentRenderTime: number;
  dataTransformTime: number;
  permissionCheckTime: number;
  graphGenerationTime: number;
  memoryUsage: number;
}

export class SystemIntegrationTester {
  private users: User[] = [];
  private persons: Person[] = [];
  private departments: Department[] = [];
  private projects: Project[] = [];
  private tasks: Task[] = [];

  constructor() {
    this.generateTestData();
  }

  private generateTestData() {
    // Generate test departments
    this.departments = [
      generateTestDepartment('dept1', { name: 'Engineering', memberCount: 10 }),
      generateTestDepartment('dept2', { name: 'Marketing', memberCount: 5, parentDepartmentId: 'dept1' }),
      generateTestDepartment('dept3', { name: 'Sales', memberCount: 8 }),
    ];

    // Generate test users
    this.users = [
      generateTestUser('user1', { systemRole: 'admin', jobRole: 'team_lead' }),
      generateTestUser('user2', { systemRole: 'project_manager', jobRole: 'manager' }),
      generateTestUser('user3', { systemRole: 'member', departmentId: 'dept2' }),
      generateTestUser('user4', { systemRole: 'team_lead', jobRole: 'senior_developer' }),
      generateTestUser('user5', { systemRole: 'viewer', departmentId: 'dept3' }),
    ];

    // Generate test persons
    this.persons = [
      generateTestPerson('person1', { jobRole: 'consultant' }),
      generateTestPerson('person2', { jobRole: 'designer', departmentId: 'dept2' }),
      generateTestPerson('person3', { jobRole: 'architect' }),
    ];

    // Generate test projects
    this.projects = [
      generateTestProject('proj1', {
        teamMembers: [
          {
            personId: 'user1', personType: 'user', role: 'owner',
            responsibility: 'Project Owner', workloadPercentage: 50, joinedAt: new Date()
          },
          {
            personId: 'user2', personType: 'user', role: 'manager',
            responsibility: 'Project Manager', workloadPercentage: 80, joinedAt: new Date()
          },
          {
            personId: 'person1', personType: 'person', role: 'member',
            responsibility: 'Consultant', workloadPercentage: 30, joinedAt: new Date()
          }
        ]
      }),
      generateTestProject('proj2', { departmentId: 'dept2', ownerId: 'user2' }),
      generateTestProject('proj3', { departmentId: 'dept3', ownerId: 'user4' }),
    ];

    // Generate test tasks
    this.tasks = [
      generateTestTask('task1', 'proj1', { 
        assigneeId: 'user3', 
        watchers: [{ id: 'user1', type: 'user' }, { id: 'person1', type: 'person' }]
      }),
      generateTestTask('task2', 'proj1', { assigneeId: 'person1', assigneeType: 'person' }),
      generateTestTask('task3', 'proj2', { assigneeId: 'user2', status: 'in-progress' }),
      generateTestTask('task4', 'proj2', { assigneeId: 'user5', status: 'done' }),
      generateTestTask('task5', 'proj3', { assigneeId: 'user4', priority: 'high' }),
    ];

    // Add tasks to projects
    this.projects[0].tasks = [this.tasks[0], this.tasks[1]];
    this.projects[1].tasks = [this.tasks[2], this.tasks[3]];
    this.projects[2].tasks = [this.tasks[4]];
  }

  // Test data structure integrity
  testDataIntegrity(): SystemTestResult {
    const start = performance.now();
    
    try {
      // Test department hierarchy
      const dept2 = this.departments.find(d => d.id === 'dept2');
      if (!dept2 || dept2.parentId !== 'dept1') {
        throw new Error('Department hierarchy is incorrect');
      }

      // Test user-department relationships
      const user3 = this.users.find(u => u.id === 'user3');
      if (!user3 || user3.departmentId !== 'dept2') {
        throw new Error('User-department relationship is incorrect');
      }

      // Test project-team relationships
      const proj1 = this.projects.find(p => p.id === 'proj1');
      if (!proj1 || !proj1.teamMembers || proj1.teamMembers.length !== 3) {
        throw new Error('Project team structure is incorrect');
      }

      // Test task-project relationships
      const task1 = this.tasks.find(t => t.id === 'task1');
      if (!task1 || task1.projectId !== 'proj1') {
        throw new Error('Task-project relationship is incorrect');
      }

      // Test mixed user/person assignments
      const task2 = this.tasks.find(t => t.id === 'task2');
      if (!task2 || task2.assigneeType !== 'person' || task2.assigneeId !== 'person1') {
        throw new Error('Person assignment is incorrect');
      }

      const duration = performance.now() - start;
      return {
        success: true,
        message: 'Data integrity test passed',
        duration,
        details: {
          departments: this.departments.length,
          users: this.users.length,
          persons: this.persons.length,
          projects: this.projects.length,
          tasks: this.tasks.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Data integrity test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: performance.now() - start
      };
    }
  }

  // Test permissions system
  testPermissions(): SystemTestResult {
    const start = performance.now();
    
    try {
      const admin = this.users.find(u => u.systemRole === 'admin')!;
      const member = this.users.find(u => u.systemRole === 'member')!;
      const viewer = this.users.find(u => u.systemRole === 'viewer')!
      const project = this.projects[0];
      const task = this.tasks[0];

      // Test basic permissions
      if (!hasPermission(admin, Permission.USER_MANAGE_ROLES)) {
        throw new Error('Admin should have user management permissions');
      }

      if (hasPermission(viewer, Permission.PROJECT_DELETE)) {
        throw new Error('Viewer should not have project deletion permissions');
      }

      // Test contextual permissions
      if (!hasContextualPermission({
        user: admin,
        resource: { type: 'project', data: project },
        action: Permission.PROJECT_UPDATE
      })) {
        throw new Error('Admin should have contextual project update permissions');
      }

      // Test project access
      if (!canAccessProject(member, project)) {
        throw new Error('Project team member should have access to project');
      }

      // Test task access
      if (!canAccessTask(this.users.find(u => u.id === task.assigneeId)!, task)) {
        throw new Error('Task assignee should have access to task');
      }

      const duration = performance.now() - start;
      return {
        success: true,
        message: 'Permissions test passed',
        duration,
        details: {
          basicPermissions: 'OK',
          contextualPermissions: 'OK',
          resourceAccess: 'OK'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Permissions test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: performance.now() - start
      };
    }
  }

  // Test graph generation and transformations
  testGraphGeneration(): SystemTestResult {
    const start = performance.now();
    
    try {
      // Test cytoscape data transformation
      const cytoscapeData = transformToCytoscapeData(
        this.projects,
        this.users,
        this.persons,
        this.departments
      );

      if (!cytoscapeData.nodes || cytoscapeData.nodes.length === 0) {
        throw new Error('Cytoscape data transformation failed - no nodes generated');
      }

      if (!cytoscapeData.edges || cytoscapeData.edges.length === 0) {
        throw new Error('Cytoscape data transformation failed - no edges generated');
      }

      // Test graph statistics
      const stats = getGraphStats(cytoscapeData);
      if (stats.totalNodes !== cytoscapeData.nodes.length) {
        throw new Error('Graph statistics calculation is incorrect');
      }

      // Test graph filtering
      const filteredData = filterGraphData(cytoscapeData, {
        showProjects: true,
        showUsers: false,
        showPersons: true,
        showDepartments: true,
        showTasks: false,
        showTags: false
      });

      const hasUsers = filteredData.nodes.some(n => n.data.type === 'user');
      const hasPersons = filteredData.nodes.some(n => n.data.type === 'person');

      if (hasUsers) {
        throw new Error('Graph filtering failed - users should be filtered out');
      }

      if (!hasPersons) {
        throw new Error('Graph filtering failed - persons should be included');
      }

      // Test utility transformations
      const departmentNodes = transformDepartmentsToNodes(this.departments);
      const userNodes = transformUsersToNodes(this.users);
      const personNodes = transformPersonsToNodes(this.persons);

      if (departmentNodes.length !== this.departments.length) {
        throw new Error('Department transformation failed');
      }

      const duration = performance.now() - start;
      return {
        success: true,
        message: 'Graph generation test passed',
        duration,
        details: {
          nodes: cytoscapeData.nodes.length,
          edges: cytoscapeData.edges.length,
          filtering: 'OK',
          transformations: 'OK'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Graph generation test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: performance.now() - start
      };
    }
  }

  // Performance benchmarking
  benchmarkPerformance(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      componentRenderTime: 0,
      dataTransformTime: 0,
      permissionCheckTime: 0,
      graphGenerationTime: 0,
      memoryUsage: 0
    };

    // Benchmark data transformation
    const transformStart = performance.now();
    for (let i = 0; i < 100; i++) {
      transformToCytoscapeData(this.projects, this.users, this.persons, this.departments);
    }
    metrics.dataTransformTime = performance.now() - transformStart;

    // Benchmark permission checks
    const permStart = performance.now();
    const admin = this.users[0];
    for (let i = 0; i < 1000; i++) {
      hasPermission(admin, Permission.PROJECT_READ);
      canAccessProject(admin, this.projects[0]);
      canAccessTask(admin, this.tasks[0]);
    }
    metrics.permissionCheckTime = performance.now() - permStart;

    // Benchmark graph generation
    const graphStart = performance.now();
    for (let i = 0; i < 50; i++) {
      const data = transformToCytoscapeData(this.projects, this.users, this.persons, this.departments);
      getGraphStats(data);
      filterGraphData(data, { showProjects: true, showUsers: true });
    }
    metrics.graphGenerationTime = performance.now() - graphStart;

    // Memory usage estimation
    if ((performance as any).memory) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    return metrics;
  }

  // Run all tests
  runAllTests(): {
    results: SystemTestResult[];
    performance: PerformanceMetrics;
    summary: {
      passed: number;
      failed: number;
      totalDuration: number;
    };
  } {
    const results = [
      this.testDataIntegrity(),
      this.testPermissions(),
      this.testGraphGeneration()
    ];

    const performance = this.benchmarkPerformance();

    const summary = {
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    };

    return { results, performance, summary };
  }
}

// Performance optimization recommendations
export const getPerformanceOptimizations = (metrics: PerformanceMetrics): string[] => {
  const recommendations: string[] = [];

  if (metrics.dataTransformTime > 500) {
    recommendations.push(
      'Consider implementing data transformation caching or memoization'
    );
    recommendations.push(
      'Use React.useMemo for expensive data transformations'
    );
  }

  if (metrics.permissionCheckTime > 100) {
    recommendations.push(
      'Implement permission caching with TTL (Time To Live)'
    );
    recommendations.push(
      'Pre-compute user permissions at login time'
    );
  }

  if (metrics.graphGenerationTime > 1000) {
    recommendations.push(
      'Implement lazy loading for graph components'
    );
    recommendations.push(
      'Use virtual scrolling for large datasets'
    );
    recommendations.push(
      'Consider pagination for graph data'
    );
  }

  if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
    recommendations.push(
      'Implement data cleanup in useEffect cleanup functions'
    );
    recommendations.push(
      'Use React.memo for pure components'
    );
    recommendations.push(
      'Consider implementing data virtualization'
    );
  }

  // General recommendations
  recommendations.push(
    'Use React.lazy for code splitting of heavy components'
  );
  recommendations.push(
    'Implement Redux middleware for action debouncing'
  );
  recommendations.push(
    'Use IndexedDB for client-side data caching'
  );
  recommendations.push(
    'Implement proper error boundaries for component isolation'
  );

  return recommendations;
};

// Export test runner instance
export const systemTester = new SystemIntegrationTester();