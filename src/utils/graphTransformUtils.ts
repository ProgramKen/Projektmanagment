import { Project, Task, User, Person, Department } from '../types';

export interface GraphNode {
  id: string;
  label: string;
  type: 'project' | 'task' | 'user' | 'person' | 'department' | 'tag';
  data: any;
  size: number;
  color: string;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  weight?: number;
  color: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  averageConnections: number;
  maxConnections: number;
  clusters: number;
}

// Color scheme for different node types
export const NODE_COLORS = {
  project: '#2563eb',
  task: '#f59e0b',
  user: '#10b981',
  person: '#06b6d4',
  department: '#dc2626',
  tag: '#8b5cf6'
};

// Edge colors for different relationship types
export const EDGE_COLORS = {
  owner: '#ef4444',
  member: '#10b981',
  assigned: '#8b5cf6',
  belongs: '#6b7280',
  tagged: '#d1d5db',
  'department-relation': '#dc2626',
  'department-membership': '#f97316',
  'department-hierarchy': '#7c2d12',
  dependency: '#f97316',
  watches: '#64748b'
};

/**
 * Transform department data into graph nodes
 */
export const transformDepartmentsToNodes = (departments: Department[]): GraphNode[] => {
  return departments.map(dept => ({
    id: `department-${dept.id}`,
    label: dept.name,
    type: 'department' as const,
    data: dept,
    size: 50 + (dept.memberCount || 0) * 2,
    color: NODE_COLORS.department
  }));
};

/**
 * Transform users into graph nodes
 */
export const transformUsersToNodes = (users: User[]): GraphNode[] => {
  return users.map(user => ({
    id: `user-${user.id}`,
    label: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email || 'Unknown User',
    type: 'user' as const,
    data: user,
    size: 40,
    color: NODE_COLORS.user
  }));
};

/**
 * Transform persons into graph nodes
 */
export const transformPersonsToNodes = (persons: Person[]): GraphNode[] => {
  return persons.map(person => ({
    id: `person-${person.id}`,
    label: person.firstName && person.lastName 
      ? `${person.firstName} ${person.lastName}` 
      : person.email || 'Unknown Person',
    type: 'person' as const,
    data: person,
    size: 40,
    color: NODE_COLORS.person
  }));
};

/**
 * Transform projects into graph nodes
 */
export const transformProjectsToNodes = (projects: Project[]): GraphNode[] => {
  return projects.map(project => ({
    id: `project-${project.id}`,
    label: project.name,
    type: 'project' as const,
    data: project,
    size: 60 + (project.tasks?.length || 0) * 3,
    color: NODE_COLORS.project
  }));
};

/**
 * Transform tasks into graph nodes
 */
export const transformTasksToNodes = (tasks: Task[]): GraphNode[] => {
  return tasks.map(task => ({
    id: `task-${task.id}`,
    label: task.title,
    type: 'task' as const,
    data: task,
    size: 35,
    color: NODE_COLORS.task
  }));
};

/**
 * Create department hierarchy edges
 */
export const createDepartmentHierarchyEdges = (departments: Department[]): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  
  departments.forEach(dept => {
    if (dept.parentId) {
      edges.push({
        id: `dept-hierarchy-${dept.id}-${dept.parentId}`,
        source: `department-${dept.id}`,
        target: `department-${dept.parentId}`,
        type: 'department-hierarchy',
        label: 'Teil von',
        color: EDGE_COLORS['department-hierarchy']
      });
    }
  });
  
  return edges;
};

/**
 * Create user-department membership edges
 */
export const createUserDepartmentEdges = (
  users: User[], 
  departments: Department[]
): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  
  users.forEach(user => {
    if (user.departmentId) {
      edges.push({
        id: `user-dept-${user.id}-${user.departmentId}`,
        source: `user-${user.id}`,
        target: `department-${user.departmentId}`,
        type: 'department-membership',
        label: 'Mitglied von',
        color: EDGE_COLORS['department-membership']
      });
    }
  });
  
  return edges;
};

/**
 * Create person-department membership edges
 */
export const createPersonDepartmentEdges = (
  persons: Person[], 
  departments: Department[]
): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  
  persons.forEach(person => {
    if (person.departmentId) {
      edges.push({
        id: `person-dept-${person.id}-${person.departmentId}`,
        source: `person-${person.id}`,
        target: `department-${person.departmentId}`,
        type: 'department-membership',
        label: 'Mitglied von',
        color: EDGE_COLORS['department-membership']
      });
    }
  });
  
  return edges;
};

/**
 * Create project-department edges
 */
export const createProjectDepartmentEdges = (
  projects: Project[], 
  departments: Department[]
): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  
  projects.forEach(project => {
    if (project.departmentId) {
      edges.push({
        id: `project-dept-${project.id}-${project.departmentId}`,
        source: `project-${project.id}`,
        target: `department-${project.departmentId}`,
        type: 'department-relation',
        label: 'Zugeordnet zu',
        color: EDGE_COLORS['department-relation']
      });
    }
  });
  
  return edges;
};

/**
 * Create team member edges for projects
 */
export const createTeamMemberEdges = (
  projects: Project[], 
  users: User[], 
  persons: Person[]
): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  const allPersons = [...users, ...persons];
  
  projects.forEach(project => {
    project.teamMembers?.forEach(member => {
      const person = allPersons.find(p => p.id === member.personId);
      if (person) {
        const personId = `${member.personType}-${member.personId}`;
        edges.push({
          id: `team-${member.personId}-${project.id}`,
          source: personId,
          target: `project-${project.id}`,
          type: member.role === 'owner' ? 'owner' : 'member',
          label: member.role,
          color: member.role === 'owner' ? EDGE_COLORS.owner : EDGE_COLORS.member,
          weight: member.workloadPercentage || 50
        });
      }
    });
  });
  
  return edges;
};

/**
 * Create task assignment edges
 */
export const createTaskAssignmentEdges = (
  tasks: Task[], 
  users: User[], 
  persons: Person[]
): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  const allPersons = [...users, ...persons];
  
  tasks.forEach(task => {
    if (task.assigneeId && task.assigneeType) {
      const assignee = allPersons.find(p => p.id === task.assigneeId);
      if (assignee) {
        const assigneeId = `${task.assigneeType}-${task.assigneeId}`;
        edges.push({
          id: `assigned-${task.id}-${task.assigneeId}`,
          source: `task-${task.id}`,
          target: assigneeId,
          type: 'assigned',
          label: 'Zugewiesen an',
          color: EDGE_COLORS.assigned
        });
      }
    }

    // Add watcher edges
    task.watchers?.forEach(watcher => {
      const watcherPerson = allPersons.find(p => p.id === watcher.id);
      if (watcherPerson) {
        const watcherId = `${watcher.type}-${watcher.id}`;
        edges.push({
          id: `watches-${task.id}-${watcher.id}`,
          source: watcherId,
          target: `task-${task.id}`,
          type: 'watches',
          label: 'Beobachtet',
          color: EDGE_COLORS.watches
        });
      }
    });
  });
  
  return edges;
};

/**
 * Calculate graph metrics
 */
export const calculateGraphMetrics = (graphData: GraphData): GraphMetrics => {
  const nodesByType = graphData.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate connections per node
  const nodeConnections = new Map<string, number>();
  graphData.edges.forEach(edge => {
    nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
    nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
  });

  const connectionCounts = Array.from(nodeConnections.values());
  const averageConnections = connectionCounts.length > 0 
    ? connectionCounts.reduce((sum, count) => sum + count, 0) / connectionCounts.length 
    : 0;
  const maxConnections = connectionCounts.length > 0 ? Math.max(...connectionCounts) : 0;

  // Simple cluster detection (connected components)
  const visited = new Set<string>();
  let clusters = 0;

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    graphData.edges.forEach(edge => {
      if (edge.source === nodeId && !visited.has(edge.target)) {
        dfs(edge.target);
      } else if (edge.target === nodeId && !visited.has(edge.source)) {
        dfs(edge.source);
      }
    });
  };

  graphData.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      clusters++;
      dfs(node.id);
    }
  });

  return {
    totalNodes: graphData.nodes.length,
    totalEdges: graphData.edges.length,
    nodesByType,
    averageConnections,
    maxConnections,
    clusters
  };
};

/**
 * Filter graph data by node types
 */
export const filterGraphByTypes = (
  graphData: GraphData,
  includeTypes: string[]
): GraphData => {
  const filteredNodes = graphData.nodes.filter(node => 
    includeTypes.includes(node.type)
  );
  
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = graphData.edges.filter(edge =>
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  };
};

/**
 * Find shortest path between two nodes
 */
export const findShortestPath = (
  graphData: GraphData,
  sourceId: string,
  targetId: string
): string[] => {
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list
  graphData.edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    if (!adjacencyList.has(edge.target)) {
      adjacencyList.set(edge.target, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
    adjacencyList.get(edge.target)!.push(edge.source);
  });

  // BFS to find shortest path
  const queue = [sourceId];
  const visited = new Set([sourceId]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current === targetId) {
      // Reconstruct path
      const path = [targetId];
      let node = targetId;
      while (parent.has(node)) {
        node = parent.get(node)!;
        path.unshift(node);
      }
      return path;
    }

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return []; // No path found
};

/**
 * Get nodes within n degrees of separation from a source node
 */
export const getNodesWithinDegrees = (
  graphData: GraphData,
  sourceId: string,
  degrees: number
): GraphNode[] => {
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list
  graphData.edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    if (!adjacencyList.has(edge.target)) {
      adjacencyList.set(edge.target, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
    adjacencyList.get(edge.target)!.push(edge.source);
  });

  const visited = new Set([sourceId]);
  let currentLevel = [sourceId];

  for (let i = 0; i < degrees && currentLevel.length > 0; i++) {
    const nextLevel: string[] = [];
    
    for (const nodeId of currentLevel) {
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextLevel.push(neighbor);
        }
      }
    }
    
    currentLevel = nextLevel;
  }

  return graphData.nodes.filter(node => visited.has(node.id));
};