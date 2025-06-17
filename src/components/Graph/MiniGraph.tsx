import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import cytoscape from 'cytoscape';
import { Project, Task, User, Person, Department } from '../../types';
import { getCytoscapeStyles, NODE_STYLES } from '../../utils/cytoscapeUtils';

interface MiniGraphProps {
  project?: Project;
  task?: Task;
  users?: User[];
  persons?: Person[];
  departments?: Department[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  mode?: 'project' | 'task';
}

const MiniGraph: React.FC<MiniGraphProps> = ({
  project,
  task,
  users = [],
  persons = [],
  departments = [],
  width = 200,
  height = 150,
  showLabels = false,
  mode = 'project'
}) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    // Delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!graphRef.current) {
        console.warn('MiniGraph: Container ref not available');
        return;
      }

      const nodes: any[] = [];
      const edges: any[] = [];

    if (mode === 'project' && project) {
      // Add project node
      nodes.push({
        data: {
          id: `project-${project.id}`,
          label: showLabels ? project.name : '',
          type: 'project',
          size: 30
        },
        classes: 'project'
      });

      // Add department if exists
      if (project.departmentId) {
        const department = departments.find(d => d.id === project.departmentId);
        if (department) {
          nodes.push({
            data: {
              id: `department-${department.id}`,
              label: showLabels ? department.name : '',
              type: 'department',
              size: 25
            },
            classes: 'department'
          });

          edges.push({
            data: {
              id: `project-dept-${project.id}`,
              source: `project-${project.id}`,
              target: `department-${department.id}`,
              type: 'belongs-to-department'
            },
            classes: 'department-relation'
          });
        }
      }

      // Add team members (max 5 for mini view)
      const memberLimit = 5;
      project.teamMembers?.slice(0, memberLimit).forEach((member, index) => {
        const memberId = `${member.personType}-${member.personId}`;
        let memberData;
        let label = '';
        
        if (member.personType === 'user') {
          memberData = users.find(u => u.id === member.personId);
          label = memberData?.firstName ? `${memberData.firstName} ${memberData.lastName}` : 'User';
        } else {
          memberData = persons.find(p => p.id === member.personId);
          label = memberData?.firstName ? `${memberData.firstName} ${memberData.lastName}` : 'Person';
        }

        nodes.push({
          data: {
            id: memberId,
            label: showLabels ? label : '',
            type: member.personType,
            size: member.role === 'owner' ? 22 : 18
          },
          classes: member.personType
        });

        edges.push({
          data: {
            id: `member-${member.personId}-${project.id}`,
            source: memberId,
            target: `project-${project.id}`,
            type: member.role === 'owner' ? 'owner' : 'member'
          },
          classes: member.role === 'owner' ? 'owner' : 'member'
        });
      });

      // Add task nodes (max 3 for mini view)
      const taskLimit = 3;
      project.tasks?.slice(0, taskLimit).forEach((taskItem) => {
        nodes.push({
          data: {
            id: `task-${taskItem.id}`,
            label: showLabels ? taskItem.title : '',
            type: 'task',
            size: 15
          },
          classes: `task ${taskItem.status} ${taskItem.priority}`
        });

        edges.push({
          data: {
            id: `task-${taskItem.id}-project`,
            source: `task-${taskItem.id}`,
            target: `project-${project.id}`,
            type: 'belongs'
          },
          classes: 'belongs'
        });
      });

    } else if (mode === 'task' && task) {
      // Add task node
      nodes.push({
        data: {
          id: `task-${task.id}`,
          label: showLabels ? task.title : '',
          type: 'task',
          size: 25
        },
        classes: `task ${task.status} ${task.priority}`
      });

      // Add assignee
      if (task.assigneeId && task.assigneeType) {
        const assigneeId = `${task.assigneeType}-${task.assigneeId}`;
        let assigneeData;
        let label = '';
        
        if (task.assigneeType === 'user') {
          assigneeData = users.find(u => u.id === task.assigneeId);
          label = assigneeData?.firstName ? `${assigneeData.firstName} ${assigneeData.lastName}` : 'User';
        } else {
          assigneeData = persons.find(p => p.id === task.assigneeId);
          label = assigneeData?.firstName ? `${assigneeData.firstName} ${assigneeData.lastName}` : 'Person';
        }

        nodes.push({
          data: {
            id: assigneeId,
            label: showLabels ? label : '',
            type: task.assigneeType,
            size: 20
          },
          classes: task.assigneeType
        });

        edges.push({
          data: {
            id: `task-assignee-${task.id}`,
            source: `task-${task.id}`,
            target: assigneeId,
            type: 'assigned'
          },
          classes: 'assigned'
        });
      }

      // Add watchers (max 3)
      const watcherLimit = 3;
      task.watchers?.slice(0, watcherLimit).forEach((watcher) => {
        const watcherId = `${watcher.type}-${watcher.id}`;
        let watcherData;
        let label = '';
        
        if (watcher.type === 'user') {
          watcherData = users.find(u => u.id === watcher.id);
          label = watcherData?.firstName ? `${watcherData.firstName} ${watcherData.lastName}` : 'User';
        } else {
          watcherData = persons.find(p => p.id === watcher.id);
          label = watcherData?.firstName ? `${watcherData.firstName} ${watcherData.lastName}` : 'Person';
        }

        if (!nodes.find(n => n.data.id === watcherId)) {
          nodes.push({
            data: {
              id: watcherId,
              label: showLabels ? label : '',
              type: watcher.type,
              size: 15
            },
            classes: watcher.type
          });

          edges.push({
            data: {
              id: `task-watcher-${task.id}-${watcher.id}`,
              source: watcherId,
              target: `task-${task.id}`,
              type: 'watches'
            },
            classes: 'tagged'
          });
        }
      });

      // Add department if exists
      if (task.departmentId) {
        const department = departments.find(d => d.id === task.departmentId);
        if (department) {
          nodes.push({
            data: {
              id: `department-${department.id}`,
              label: showLabels ? department.name : '',
              type: 'department',
              size: 20
            },
            classes: 'department'
          });

          edges.push({
            data: {
              id: `task-dept-${task.id}`,
              source: `task-${task.id}`,
              target: `department-${department.id}`,
              type: 'belongs-to-department'
            },
            classes: 'department-relation'
          });
        }
      }
    }

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Create mini Cytoscape instance
    if (!graphRef.current) {
      console.error('MiniGraph: Container ref became null before cytoscape initialization');
      return;
    }
    
    try {
      cyRef.current = cytoscape({
        container: graphRef.current,
      elements: [...nodes, ...edges],
      style: getCytoscapeStyles().map((style: any) => ({
        ...style,
        style: {
          ...style.style,
          'font-size': showLabels ? '8px' : '0px',
          'text-max-width': '60px',
          'border-width': 1,
          'shadow-blur': 3,
          'shadow-opacity': 0.2
        }
      })),
      layout: {
        name: 'circle',
        fit: true,
        padding: 10,
        animate: false
      },
      wheelSensitivity: 0,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false,
      autoungrabify: true
    });
    } catch (error) {
      console.error('MiniGraph: Error initializing cytoscape:', error);
      return;
    }

    }, 100); // 100ms delay

    return () => {
      clearTimeout(timeoutId);
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch (error) {
          console.warn('MiniGraph: Error destroying cytoscape instance:', error);
        }
        cyRef.current = null;
      }
    };
  }, [project, task, users, persons, departments, showLabels, mode, width, height]);

  // Don't render if no data is available
  if ((!project && !task) || (!users && !persons)) {
    return (
      <Paper
        sx={{
          width,
          height,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}
      >
        <Typography variant="body2">Keine Daten verfügbar</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      ref={graphRef}
      sx={{
        width,
        height,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        position: 'relative'
      }}
    />
  );
};

export default MiniGraph;