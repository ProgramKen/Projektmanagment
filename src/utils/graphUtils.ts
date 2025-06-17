import { Project, User, Task, KnowledgeGraphNode, KnowledgeGraphEdge } from '../types';

export interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    group: string;
    color?: string;
    size?: number;
    title?: string;
    data: any;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    label?: string;
    color?: string;
    width?: number;
    arrows?: string;
  }>;
}

export const NODE_COLORS = {
  project: '#1976d2',
  user: '#4caf50', 
  task: '#ff9800',
  tag: '#9c27b0',
};

export const NODE_GROUPS = {
  project: 'projects',
  user: 'users',
  task: 'tasks', 
  tag: 'tags',
};

export const transformToGraphData = (
  projects: Project[],
  users: User[] = [],
  currentUser?: User
): GraphData => {
  const nodes: GraphData['nodes'] = [];
  const edges: GraphData['edges'] = [];
  const processedTags = new Set<string>();

  // Add project nodes
  projects.forEach(project => {
    nodes.push({
      id: `project-${project.id}`,
      label: project.name,
      group: NODE_GROUPS.project,
      color: NODE_COLORS.project,
      size: 20 + (project.tasks?.length || 0) * 2, // Size based on task count
      title: `${project.name}\nStatus: ${project.status}\nPriority: ${project.priority}\nTasks: ${project.tasks?.length || 0}`,
      data: { type: 'project', ...project }
    });

    // Add project tags as nodes
    project.tags?.forEach(tag => {
      const tagId = `tag-${tag}`;
      if (!processedTags.has(tagId)) {
        nodes.push({
          id: tagId,
          label: tag,
          group: NODE_GROUPS.tag,
          color: NODE_COLORS.tag,
          size: 10,
          title: `Tag: ${tag}`,
          data: { type: 'tag', name: tag }
        });
        processedTags.add(tagId);
      }

      // Connect project to tag
      edges.push({
        id: `${project.id}-${tagId}`,
        from: `project-${project.id}`,
        to: tagId,
        label: 'tagged',
        color: '#ccc',
        width: 1
      });
    });

    // Add team members as user nodes and connections
    project.teamMembers?.forEach(member => {
      const userId = `user-${member.personId}`;
      
      // Add user node if not exists
      const existingUser = nodes.find(n => n.id === userId);
      if (!existingUser) {
        const user = users.find(u => u.id === member.personId);
        nodes.push({
          id: userId,
          label: user?.displayName || user?.email || 'Unknown User',
          group: NODE_GROUPS.user,
          color: NODE_COLORS.user,
          size: 15,
          title: `${user?.displayName || 'Unknown'}\nRole: ${member.role}`,
          data: { type: 'user', ...user, projectRole: member.role }
        });
      }

      // Connect user to project
      edges.push({
        id: `${member.personId}-${project.id}`,
        from: userId,
        to: `project-${project.id}`,
        label: member.role,
        color: member.role === 'owner' ? '#f44336' : '#4caf50',
        width: member.role === 'owner' ? 3 : 2,
        arrows: 'to'
      });
    });

    // Add tasks as nodes
    project.tasks?.forEach(task => {
      const taskId = `task-${task.id}`;
      nodes.push({
        id: taskId,
        label: task.title,
        group: NODE_GROUPS.task,
        color: NODE_COLORS.task,
        size: 12,
        title: `${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}`,
        data: { type: 'task', ...task }
      });

      // Connect task to project
      edges.push({
        id: `${task.id}-${project.id}`,
        from: taskId,
        to: `project-${project.id}`,
        label: 'belongs to',
        color: '#ddd',
        width: 1
      });

      // Connect task to assignee
      if (task.assigneeId) {
        const assigneeId = `user-${task.assigneeId}`;
        edges.push({
          id: `${task.id}-${task.assigneeId}`,
          from: taskId,
          to: assigneeId,
          label: 'assigned to',
          color: '#ff9800',
          width: 2,
          arrows: 'to'
        });
      }

      // Add task dependencies
      task.dependencies?.forEach(depId => {
        edges.push({
          id: `${task.id}-${depId}`,
          from: taskId,
          to: `task-${depId}`,
          label: 'depends on',
          color: '#f44336',
          width: 2,
          arrows: 'to'
        });
      });

      // Add task tags
      task.tags?.forEach(tag => {
        const tagId = `tag-${tag}`;
        if (!processedTags.has(tagId)) {
          nodes.push({
            id: tagId,
            label: tag,
            group: NODE_GROUPS.tag,
            color: NODE_COLORS.tag,
            size: 10,
            title: `Tag: ${tag}`,
            data: { type: 'tag', name: tag }
          });
          processedTags.add(tagId);
        }

        edges.push({
          id: `${task.id}-${tagId}`,
          from: taskId,
          to: tagId,
          label: 'tagged',
          color: '#ccc',
          width: 1
        });
      });
    });

    // Add project links/relationships
    project.links?.forEach(link => {
      const targetId = `project-${link.targetProjectId}`;
      if (projects.find(p => p.id === link.targetProjectId)) {
        edges.push({
          id: `${project.id}-${link.targetProjectId}`,
          from: `project-${project.id}`,
          to: targetId,
          label: link.type,
          color: link.type.includes('depend') ? '#f44336' : '#2196f3',
          width: 3,
          arrows: 'to'
        });
      }
    });
  });

  return { nodes, edges };
};

export const getGraphStats = (graphData: GraphData) => {
  const nodesByType = graphData.nodes.reduce((acc, node) => {
    acc[node.group] = (acc[node.group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalNodes: graphData.nodes.length,
    totalEdges: graphData.edges.length,
    projects: nodesByType[NODE_GROUPS.project] || 0,
    users: nodesByType[NODE_GROUPS.user] || 0,
    tasks: nodesByType[NODE_GROUPS.task] || 0,
    tags: nodesByType[NODE_GROUPS.tag] || 0,
  };
};

export const filterGraphData = (
  graphData: GraphData,
  filters: {
    showProjects?: boolean;
    showUsers?: boolean;
    showTasks?: boolean;
    showTags?: boolean;
    projectStatus?: string[];
    priority?: string[];
  }
): GraphData => {
  const { showProjects = true, showUsers = true, showTasks = true, showTags = true } = filters;
  
  let filteredNodes = graphData.nodes.filter(node => {
    // Filter by node type
    if (node.group === NODE_GROUPS.project && !showProjects) return false;
    if (node.group === NODE_GROUPS.user && !showUsers) return false;
    if (node.group === NODE_GROUPS.task && !showTasks) return false;
    if (node.group === NODE_GROUPS.tag && !showTags) return false;

    // Filter by project status
    if (node.group === NODE_GROUPS.project && filters.projectStatus?.length) {
      return filters.projectStatus.includes(node.data.status);
    }

    // Filter by priority
    if ((node.group === NODE_GROUPS.project || node.group === NODE_GROUPS.task) && filters.priority?.length) {
      return filters.priority.includes(node.data.priority);
    }

    return true;
  });

  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = graphData.edges.filter(edge => 
    nodeIds.has(edge.from) && nodeIds.has(edge.to)
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  };
};