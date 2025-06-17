import { Project, User, Task, Person, Department } from '../types';

export interface CytoscapeGraphData {
  nodes: Array<{
    data: {
      id: string;
      label: string;
      type: string;
      nodeData: any;
      size?: number;
    };
    classes?: string;
  }>;
  edges: Array<{
    data: {
      id: string;
      source: string;
      target: string;
      label?: string;
      type: string;
      weight?: number;
    };
    classes?: string;
  }>;
}

export const NODE_STYLES = {
  project: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderColor: '#5a67d8',
    shape: 'round-rectangle',
    textColor: '#ffffff',
    shadowColor: '#667eea'
  },
  user: {
    backgroundColor: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', 
    borderColor: '#38a169',
    shape: 'ellipse',
    textColor: '#ffffff',
    shadowColor: '#48bb78'
  },
  person: {
    backgroundColor: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)', 
    borderColor: '#38b2ac',
    shape: 'ellipse',
    textColor: '#ffffff',
    shadowColor: '#4fd1c7'
  },
  department: {
    backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    borderColor: '#e53e3e',
    shape: 'hexagon',
    textColor: '#ffffff',
    shadowColor: '#f093fb'
  },
  task: {
    backgroundColor: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    borderColor: '#ed8936', 
    shape: 'diamond',
    textColor: '#2d3748',
    shadowColor: '#ffecd2'
  },
  tag: {
    backgroundColor: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    borderColor: '#7c3aed',
    shape: 'triangle',
    textColor: '#ffffff',
    shadowColor: '#a78bfa'
  },
};

export const transformToCytoscapeData = (
  projects: Project[],
  users: User[] = [],
  persons: Person[] = [],
  departments: Department[] = [],
  currentUser?: User
): CytoscapeGraphData => {
  const nodes: CytoscapeGraphData['nodes'] = [];
  const edges: CytoscapeGraphData['edges'] = [];
  const processedTags = new Set<string>();

  // Add project nodes
  projects.forEach(project => {
    nodes.push({
      data: {
        id: `project-${project.id}`,
        label: project.name,
        type: 'project',
        nodeData: project,
        size: 60 + (project.tasks?.length || 0) * 5
      },
      classes: `project ${project.status} ${project.priority}`
    });

    // Add project tags as nodes
    project.tags?.forEach(tag => {
      const tagId = `tag-${tag}`;
      if (!processedTags.has(tagId)) {
        nodes.push({
          data: {
            id: tagId,
            label: tag,
            type: 'tag',
            nodeData: { type: 'tag', name: tag },
            size: 30
          },
          classes: 'tag'
        });
        processedTags.add(tagId);
      }

      // Connect project to tag
      edges.push({
        data: {
          id: `${project.id}-${tagId}`,
          source: `project-${project.id}`,
          target: tagId,
          label: 'tagged',
          type: 'tagged'
        },
        classes: 'tagged'
      });
    });

    // Add team members as user/person nodes and connections
    project.teamMembers?.forEach(member => {
      const memberId = `${member.personType}-${member.personId}`;
      
      // Add user/person node if not exists
      const existingMember = nodes.find(n => n.data.id === memberId);
      if (!existingMember) {
        let memberData;
        let label = 'Gastbenutzer';
        
        if (member.personType === 'user') {
          const user = users.find(u => u.id === member.personId);
          memberData = user;
          if (user?.firstName && user?.lastName) {
            label = `${user.firstName} ${user.lastName}`;
          } else if (user?.displayName) {
            label = user.displayName;
          } else if (user?.email) {
            label = user.email.split('@')[0];
          } else {
            label = 'Benutzer';
          }
        } else {
          const person = persons.find(p => p.id === member.personId);
          memberData = person;
          if (person?.firstName && person?.lastName) {
            label = `${person.firstName} ${person.lastName}`;
          } else if (person?.email) {
            label = person.email.split('@')[0];
          } else {
            label = 'Externe Person';
          }
        }
        
        nodes.push({
          data: {
            id: memberId,
            label,
            type: member.personType,
            nodeData: { ...memberData, projectRole: member.role },
            size: 50
          },
          classes: member.personType
        });
      }

      // Connect user/person to project
      edges.push({
        data: {
          id: `${member.personId}-${project.id}`,
          source: memberId,
          target: `project-${project.id}`,
          label: member.role,
          type: member.role === 'owner' ? 'owner' : 'member'
        },
        classes: member.role === 'owner' ? 'owner' : 'member'
      });
    });

    // Add tasks as nodes
    project.tasks?.forEach(task => {
      const taskId = `task-${task.id}`;
      nodes.push({
        data: {
          id: taskId,
          label: task.title,
          type: 'task',
          nodeData: task,
          size: 40
        },
        classes: `task ${task.status} ${task.priority}`
      });

      // Connect task to project
      edges.push({
        data: {
          id: `${task.id}-${project.id}`,
          source: taskId,
          target: `project-${project.id}`,
          type: 'belongs'
        },
        classes: 'belongs'
      });

      // Connect task to assignee
      if (task.assigneeId && task.assigneeType) {
        const assigneeId = `${task.assigneeType}-${task.assigneeId}`;
        edges.push({
          data: {
            id: `${task.id}-${task.assigneeId}`,
            source: taskId,
            target: assigneeId,
            type: 'assigned'
          },
          classes: 'assigned'
        });
      }

      // Add task dependencies
      task.dependencies?.forEach(depId => {
        edges.push({
          data: {
            id: `${task.id}-${depId}`,
            source: taskId,
            target: `task-${depId}`,
            type: 'depends'
          },
          classes: 'depends'
        });
      });

      // Add task tags
      task.tags?.forEach(tag => {
        const tagId = `tag-${tag}`;
        if (!processedTags.has(tagId)) {
          nodes.push({
            data: {
              id: tagId,
              label: tag,
              type: 'tag',
              nodeData: { type: 'tag', name: tag },
              size: 30
            },
            classes: 'tag'
          });
          processedTags.add(tagId);
        }

        edges.push({
          data: {
            id: `${task.id}-${tagId}`,
            source: taskId,
            target: tagId,
            type: 'tagged'
          },
          classes: 'tagged'
        });
      });
    });

    // Add project links/relationships
    project.links?.forEach(link => {
      const targetId = `project-${link.targetProjectId}`;
      if (projects.find(p => p.id === link.targetProjectId)) {
        edges.push({
          data: {
            id: `${project.id}-${link.targetProjectId}`,
            source: `project-${project.id}`,
            target: targetId,
            type: link.type
          },
          classes: link.type.includes('depend') ? 'dependency' : 'related'
        });
      }
    });
  });

  // Add department nodes
  departments.forEach(department => {
    nodes.push({
      data: {
        id: `department-${department.id}`,
        label: department.name,
        type: 'department',
        nodeData: department,
        size: 70 + (department.memberCount || 0) * 3
      },
      classes: 'department'
    });

    // Connect projects to their departments
    projects.forEach(project => {
      if (project.departmentId === department.id) {
        edges.push({
          data: {
            id: `${project.id}-dept-${department.id}`,
            source: `project-${project.id}`,
            target: `department-${department.id}`,
            type: 'belongs-to-department'
          },
          classes: 'department-relation'
        });
      }
    });

    // Connect users to their departments
    users.forEach(user => {
      if (user.departmentId === department.id) {
        const userId = `user-${user.id}`;
        if (nodes.find(n => n.data.id === userId)) {
          edges.push({
            data: {
              id: `${user.id}-dept-${department.id}`,
              source: userId,
              target: `department-${department.id}`,
              type: 'member-of-department'
            },
            classes: 'department-membership'
          });
        }
      }
    });

    // Connect persons to their departments
    persons.forEach(person => {
      if (person.departmentId === department.id) {
        const personId = `person-${person.id}`;
        if (nodes.find(n => n.data.id === personId)) {
          edges.push({
            data: {
              id: `${person.id}-dept-${department.id}`,
              source: personId,
              target: `department-${department.id}`,
              type: 'member-of-department'
            },
            classes: 'department-membership'
          });
        }
      }
    });

    // Connect to parent departments (hierarchy)
    if (department.parentId) {
      edges.push({
        data: {
          id: `dept-${department.id}-parent-${department.parentId}`,
          source: `department-${department.id}`,
          target: `department-${department.parentId}`,
          type: 'subdepartment'
        },
        classes: 'department-hierarchy'
      });
    }
  });

  return { nodes, edges };
};

export const getGraphStats = (graphData: CytoscapeGraphData) => {
  const nodesByType = graphData.nodes.reduce((acc, node) => {
    acc[node.data.type] = (acc[node.data.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalNodes: graphData.nodes.length,
    totalEdges: graphData.edges.length,
    projects: nodesByType['project'] || 0,
    users: nodesByType['user'] || 0,
    persons: nodesByType['person'] || 0,
    departments: nodesByType['department'] || 0,
    tasks: nodesByType['task'] || 0,
    tags: nodesByType['tag'] || 0,
  };
};

export const filterGraphData = (
  graphData: CytoscapeGraphData,
  filters: {
    showProjects?: boolean;
    showUsers?: boolean;
    showPersons?: boolean;
    showDepartments?: boolean;
    showTasks?: boolean;
    showTags?: boolean;
    projectStatus?: string[];
    priority?: string[];
  }
): CytoscapeGraphData => {
  const { 
    showProjects = true, 
    showUsers = true, 
    showPersons = true, 
    showDepartments = true, 
    showTasks = true, 
    showTags = true 
  } = filters;
  
  let filteredNodes = graphData.nodes.filter(node => {
    // Filter by node type
    if (node.data.type === 'project' && !showProjects) return false;
    if (node.data.type === 'user' && !showUsers) return false;
    if (node.data.type === 'person' && !showPersons) return false;
    if (node.data.type === 'department' && !showDepartments) return false;
    if (node.data.type === 'task' && !showTasks) return false;
    if (node.data.type === 'tag' && !showTags) return false;

    // Filter by project status
    if (node.data.type === 'project' && filters.projectStatus?.length) {
      return filters.projectStatus.includes(node.data.nodeData.status);
    }

    // Filter by priority
    if ((node.data.type === 'project' || node.data.type === 'task') && filters.priority?.length) {
      return filters.priority.includes(node.data.nodeData.priority);
    }

    return true;
  });

  const nodeIds = new Set(filteredNodes.map(n => n.data.id));
  const filteredEdges = graphData.edges.filter(edge => 
    nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target)
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  };
};

// Cytoscape styles configuration
export const getCytoscapeStyles = (): any => [
  // Default node style - modern design
  {
    selector: 'node',
    style: {
      'background-color': '#667eea',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'color': '#ffffff',
      'font-size': '14px',
      'font-weight': '600',
      'font-family': 'Inter, system-ui, sans-serif',
      'border-width': 3,
      'border-color': '#5a67d8',
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': '120px',
      'overlay-opacity': 0,
      'shadow-blur': 20,
      'shadow-color': '#667eea',
      'shadow-opacity': 0.4,
      'shadow-offset-x': 0,
      'shadow-offset-y': 4,
      'transition-property': 'background-color, border-color, shadow-blur',
      'transition-duration': '0.3s'
    }
  },
  // Project nodes - modern gradient style
  {
    selector: 'node.project',
    style: {
      'background-color': '#667eea',
      'border-color': '#5a67d8',
      'shape': 'round-rectangle',
      'shadow-color': '#667eea',
      'shadow-blur': 25,
      'shadow-opacity': 0.5,
      'border-width': 4,
      'font-size': '16px',
      'font-weight': '700'
    }
  },
  // User nodes - professional green
  {
    selector: 'node.user',
    style: {
      'background-color': '#48bb78',
      'border-color': '#38a169',
      'shape': 'ellipse',
      'shadow-color': '#48bb78',
      'shadow-blur': 20,
      'shadow-opacity': 0.4,
      'border-width': 3,
      'font-size': '14px'
    }
  },
  // Person nodes - modern teal
  {
    selector: 'node.person',
    style: {
      'background-color': '#4fd1c7',
      'border-color': '#38b2ac',
      'shape': 'ellipse',
      'shadow-color': '#4fd1c7',
      'shadow-blur': 20,
      'shadow-opacity': 0.4,
      'border-width': 3,
      'font-size': '14px'
    }
  },
  // Department nodes - vibrant pink
  {
    selector: 'node.department',
    style: {
      'background-color': '#f093fb',
      'border-color': '#e53e3e',
      'shape': 'hexagon',
      'shadow-color': '#f093fb',
      'shadow-blur': 25,
      'shadow-opacity': 0.5,
      'border-width': 4,
      'font-size': '15px',
      'font-weight': '600'
    }
  },
  // Task nodes - warm orange
  {
    selector: 'node.task',
    style: {
      'background-color': '#ffecd2',
      'border-color': '#ed8936',
      'color': '#2d3748',
      'shape': 'diamond',
      'shadow-color': '#ffecd2',
      'shadow-blur': 15,
      'shadow-opacity': 0.4,
      'border-width': 3,
      'font-size': '13px',
      'font-weight': '600'
    }
  },
  // Tag nodes - modern purple
  {
    selector: 'node.tag',
    style: {
      'background-color': '#a78bfa',
      'border-color': '#7c3aed',
      'shape': 'triangle',
      'shadow-color': '#a78bfa',
      'shadow-blur': 15,
      'shadow-opacity': 0.4,
      'border-width': 2,
      'font-size': '12px',
      'font-weight': '500'
    }
  },
  // Status-based task styling
  {
    selector: 'node.task.done',
    style: {
      'background-color': '#10b981',
      'border-color': '#059669'
    }
  },
  {
    selector: 'node.task.in-progress',
    style: {
      'background-color': '#3b82f6',
      'border-color': '#2563eb'
    }
  },
  {
    selector: 'node.task.todo',
    style: {
      'background-color': '#6b7280',
      'border-color': '#4b5563'
    }
  },
  // Priority-based styling
  {
    selector: 'node.critical',
    style: {
      'border-width': 4,
      'border-color': '#ef4444'
    }
  },
  {
    selector: 'node.high',
    style: {
      'border-width': 3,
      'border-color': '#f97316'
    }
  },
  // Default edge style - modern and subtle
  {
    selector: 'edge',
    style: {
      'width': 3,
      'line-color': '#e2e8f0',
      'target-arrow-color': '#94a3b8',
      'target-arrow-shape': 'triangle-backcurve',
      'target-arrow-size': 12,
      'curve-style': 'unbundled-bezier',
      'control-point-distances': [20, -20],
      'control-point-weights': [0.25, 0.75],
      'label': 'data(label)',
      'font-size': '11px',
      'font-family': 'Inter, system-ui, sans-serif',
      'font-weight': '500',
      'text-rotation': 'autorotate',
      'color': '#475569',
      'text-background-color': 'rgba(255, 255, 255, 0.95)',
      'text-background-opacity': 1,
      'text-background-padding': '4px',
      'text-background-shape': 'round-rectangle',
      'text-border-width': 1,
      'text-border-color': '#e2e8f0',
      'text-border-opacity': 0.5,
      'opacity': 0.8,
      'z-index': 1
    }
  },
  // Owner edges - strong purple
  {
    selector: 'edge.owner',
    style: {
      'line-color': '#8b5cf6',
      'target-arrow-color': '#8b5cf6',
      'width': 5,
      'opacity': 0.9,
      'z-index': 10
    }
  },
  // Member edges - professional green
  {
    selector: 'edge.member',
    style: {
      'line-color': '#48bb78',
      'target-arrow-color': '#48bb78',
      'width': 3,
      'opacity': 0.8
    }
  },
  // Dependency edges - warm orange with style
  {
    selector: 'edge.depends',
    style: {
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
      'width': 4,
      'line-style': 'dotted',
      'line-dash-pattern': [8, 4],
      'opacity': 0.7
    }
  },
  // Assignment edges
  {
    selector: 'edge.assigned',
    style: {
      'line-color': '#8b5cf6',
      'target-arrow-color': '#8b5cf6',
      'width': 2
    }
  },
  // Tag edges
  {
    selector: 'edge.tagged',
    style: {
      'line-color': '#d1d5db',
      'target-arrow-shape': 'none',
      'width': 1,
      'line-style': 'dotted'
    }
  },
  // Department relation edges
  {
    selector: 'edge.department-relation',
    style: {
      'line-color': '#dc2626',
      'target-arrow-color': '#dc2626',
      'width': 3,
      'line-style': 'solid'
    }
  },
  // Department membership edges
  {
    selector: 'edge.department-membership',
    style: {
      'line-color': '#f97316',
      'target-arrow-color': '#f97316',
      'width': 2,
      'line-style': 'solid'
    }
  },
  // Department hierarchy edges
  {
    selector: 'edge.department-hierarchy',
    style: {
      'line-color': '#7c2d12',
      'target-arrow-color': '#7c2d12',
      'width': 4,
      'line-style': 'solid'
    }
  },
  // Hover effects
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#fbbf24',
      'shadow-blur': 20,
      'shadow-opacity': 0.5
    }
  },
  {
    selector: 'edge:selected',
    style: {
      'width': 4,
      'line-color': '#fbbf24',
      'target-arrow-color': '#fbbf24'
    }
  }
];