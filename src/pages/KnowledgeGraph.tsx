import React, { useEffect, useRef, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  Paper,
  FormGroup,
  FormControlLabel,
  Switch,
  Chip,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fade,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Refresh as RefreshIcon,
  AccountTree as LayoutIcon,
} from '@mui/icons-material';
import cytoscape from 'cytoscape';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  transformToCytoscapeData, 
  getGraphStats, 
  filterGraphData, 
  getCytoscapeStyles,
  NODE_STYLES 
} from '../utils/cytoscapeUtils';

const KnowledgeGraph: React.FC = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [graphStats, setGraphStats] = useState<any>(null);
  const [layout, setLayout] = useState('cose');
  const [filters, setFilters] = useState({
    showProjects: true,
    showUsers: true,
    showPersons: true,
    showDepartments: true,
    showTasks: true,
    showTags: true,
  });

  const projects = useSelector((state: RootState) => state.projects.projects);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { users, persons } = useSelector((state: RootState) => state.userManagement);
  const { departments } = useSelector((state: RootState) => state.departments);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!graphRef.current) {
        console.warn('KnowledgeGraph: Container ref not available');
        return;
      }

      // Create mock data if no projects exist
      let mockProjects = projects;
      let mockUsers = users;
      let mockPersons = persons;
      let mockDepartments = departments;

      if (projects.length === 0) {
        mockProjects = [
          {
            id: 'marketing-q3',
            name: 'Marketing Kampagne Q3',
            description: 'Digitale Marketingstrategie für Q3',
            status: 'active' as const,
            priority: 'high' as const,
            ownerId: currentUser?.id || 'user-1',
            ownerType: 'user' as const,
            teamMembers: [
              {
                personId: currentUser?.id || 'user-1',
                personType: 'user' as const,
                role: 'owner' as const,
                joinedAt: new Date()
              }
            ],
            tasks: [],
            links: [],
            files: [],
            tags: ['marketing', 'digital'],
            skillsRequired: ['Marketing', 'Design'],
            objectives: ['Steigerung der Markenbekanntheit'],
            risks: [],
            milestones: []
          },
          {
            id: 'kbh',
            name: 'KBH',
            description: 'Knowledge Base Hub Development',
            status: 'active' as const,
            priority: 'medium' as const,
            ownerId: 'external-1',
            ownerType: 'person' as const,
            teamMembers: [
              {
                personId: 'external-1',
                personType: 'person' as const,
                role: 'owner' as const,
                joinedAt: new Date()
              }
            ],
            tasks: [],
            links: [],
            files: [],
            tags: ['development', 'knowledge'],
            skillsRequired: ['Development', 'UI/UX'],
            objectives: ['Aufbau einer zentralen Wissensdatenbank'],
            risks: [],
            milestones: []
          }
        ];

        mockPersons = [
          {
            id: 'external-1',
            firstName: 'Maria',
            lastName: 'Schmidt',
            email: 'maria.schmidt@external.com',
            jobRole: 'consultant' as const,
            isExternal: true,
            isActive: true,
            skillTags: ['Consulting', 'Strategy'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }

    try {
      // Transform data with mock data if needed
      const rawGraphData = transformToCytoscapeData(mockProjects, mockUsers, mockPersons, mockDepartments, currentUser || undefined);
      const graphData = filterGraphData(rawGraphData, filters);
      
      // Calculate stats
      setGraphStats(getGraphStats(graphData));

      // Destroy existing instance
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      // Create new Cytoscape instance
      if (!graphRef.current) {
        console.error('KnowledgeGraph: Container ref became null before cytoscape initialization');
        return;
      }
      
      try {
        cyRef.current = cytoscape({
        container: graphRef.current,
        elements: [...graphData.nodes, ...graphData.edges],
        style: getCytoscapeStyles(),
        layout: {
          name: layout as any,
          fit: true,
          padding: 50,
          animationDuration: 800,
          animationEasing: 'ease-out',
          // COSE layout specific options - optimized for better spacing
          ...(layout === 'cose' && {
            nodeRepulsion: function(node: any) { 
              const nodeType = node.data('type');
              return nodeType === 'project' ? 800000 : 600000;
            },
            nodeOverlap: 40,
            idealEdgeLength: function(edge: any) { 
              const sourceType = edge.source().data('type');
              const targetType = edge.target().data('type');
              if (sourceType === 'project' || targetType === 'project') {
                return 120;
              }
              return 80;
            },
            edgeElasticity: function(edge: any) { return 200; },
            nestingFactor: 1.2,
            gravity: 60,
            numIter: 2000,
            randomize: true,
            componentSpacing: 80,
            coolingFactor: 0.95,
            initialTemp: 1000
          }),
          // Grid layout options
          ...(layout === 'grid' && {
            rows: undefined,
            cols: undefined,
            position: function(node: any) { return {}; },
            sort: undefined,
            animate: true,
            animationDuration: 500
          }),
          // Circle layout options - improved spacing
          ...(layout === 'circle' && {
            radius: Math.min(window.innerWidth, window.innerHeight) * 0.3,
            startAngle: -Math.PI / 2,
            sweep: 2 * Math.PI,
            clockwise: true,
            sort: function(a: any, b: any) {
              const aType = a.data('type');
              const bType = b.data('type');
              const priority: { [key: string]: number } = { project: 3, user: 2, person: 2, department: 1, task: 1, tag: 0 };
              return (priority[bType] || 0) - (priority[aType] || 0);
            },
            animate: true,
            animationDuration: 800
          }),
          // Concentric layout options - better hierarchy
          ...(layout === 'concentric' && {
            concentric: function(node: any) {
              const nodeType = node.data('type');
              switch(nodeType) {
                case 'project': return 100;
                case 'user': return 80;
                case 'person': return 70;
                case 'department': return 60;
                case 'task': return 40;
                case 'tag': return 20;
                default: return 10;
              }
            },
            levelWidth: function(nodes: any) { return Math.max(2, Math.ceil(nodes.length / 8)); },
            minNodeSpacing: 60,
            animate: true,
            animationDuration: 800
          })
        },
        wheelSensitivity: 0.2,
        minZoom: 0.3,
        maxZoom: 3
      });
      } catch (error) {
        console.error('KnowledgeGraph: Error initializing cytoscape:', error);
        return;
      }

      // Add event listeners
      cyRef.current.on('tap', 'node', (evt) => {
        const node = evt.target;
        setSelectedNode({
          label: node.data('label'),
          data: { type: node.data('type'), ...node.data('nodeData') }
        });
      });

      cyRef.current.on('tap', (evt) => {
        if (evt.target === cyRef.current) {
          setSelectedNode(null);
        }
      });

      // Hover effects
      cyRef.current.on('mouseover', 'node', (evt) => {
        if (graphRef.current) {
          graphRef.current.style.cursor = 'pointer';
        }
        evt.target.style('shadow-blur', 15);
        evt.target.style('shadow-opacity', 0.6);
      });

      cyRef.current.on('mouseout', 'node', (evt) => {
        if (graphRef.current) {
          graphRef.current.style.cursor = 'default';
        }
        evt.target.style('shadow-blur', 10);
        evt.target.style('shadow-opacity', 0.3);
      });

    } catch (error) {
      console.error('Error creating knowledge graph:', error);
    }

    }, 150); // 150ms delay for larger graph

    return () => {
      clearTimeout(timeoutId);
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch (error) {
          console.warn('KnowledgeGraph: Error destroying cytoscape instance:', error);
        }
        cyRef.current = null;
      }
    };
  }, [projects, users, persons, departments, filters, currentUser, layout]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      const zoom = cyRef.current.zoom();
      cyRef.current.zoom({
        level: zoom * 1.25,
        renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 }
      });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const zoom = cyRef.current.zoom();
      cyRef.current.zoom({
        level: zoom * 0.8,
        renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 }
      });
    }
  };

  const handleCenter = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
    }
  };

  const handleRefresh = () => {
    if (cyRef.current) {
      cyRef.current.layout({ name: layout as any }).run();
    }
  };

  const handleFilterChange = (filterName: string, value: boolean) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleLayoutChange = (newLayout: string) => {
    setLayout(newLayout);
  };

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
      color: '#ffffff',
      p: 3
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: '2.5rem',
            letterSpacing: '-0.02em',
            mb: 1
          }}>
            Knowledge Graph
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            fontWeight: 400
          }}>
            Visualisiere Verbindungen zwischen Projekten, Teams und Aufgaben
          </Typography>
        </Box>
        
        <Box display="flex" gap={3} alignItems="center">
          <FormControl size="medium" sx={{ 
            minWidth: 160,
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 600
            },
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              color: '#ffffff',
              '& .MuiSelect-icon': {
                color: 'rgba(255, 255, 255, 0.8)'
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(102, 126, 234, 0.4)'
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid #667eea',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.2)'
              }
            }
          }}>
            <InputLabel>Layout</InputLabel>
            <Select
              value={layout}
              label="Layout"
              onChange={(e) => handleLayoutChange(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(15, 15, 35, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    '& .MuiMenuItem-root': {
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.2)'
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="cose">Force-Directed</MenuItem>
              <MenuItem value="circle">Circular</MenuItem>
              <MenuItem value="grid">Grid</MenuItem>
              <MenuItem value="concentric">Concentric</MenuItem>
            </Select>
          </FormControl>
          
          <ButtonGroup 
            variant="contained" 
            size="medium"
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              '& .MuiButton-root': {
                border: 'none',
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: '600',
                fontSize: '0.875rem',
                px: 2.5,
                py: 1.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                color: 'rgba(255, 255, 255, 0.9)',
                position: 'relative',
                overflow: 'hidden',
                '&:first-of-type': {
                  borderRadius: '16px 0 0 16px'
                },
                '&:last-of-type': {
                  borderRadius: '0 16px 16px 0'
                },
                '&:only-child': {
                  borderRadius: '16px'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)',
                  '&::before': {
                    opacity: 1
                  },
                  '& .MuiSvgIcon-root, & span': {
                    position: 'relative',
                    zIndex: 1
                  }
                },
                '&:active': {
                  transform: 'translateY(0px)'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.1rem'
                },
                '& span': {
                  position: 'relative',
                  zIndex: 1
                }
              }
            }}
          >
            <Button startIcon={<ZoomInIcon />} onClick={handleZoomIn}>
              ZOOM IN
            </Button>
            <Button startIcon={<ZoomOutIcon />} onClick={handleZoomOut}>
              ZOOM OUT
            </Button>
            <Button startIcon={<CenterIcon />} onClick={handleCenter}>
              ZENTRIEREN
            </Button>
            <Button startIcon={<RefreshIcon />} onClick={handleRefresh}>
              AKTUALISIEREN
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      <Box display="flex" gap={4} height="calc(100vh - 250px)">
        <Box flex={1}>
          <Paper
            ref={graphRef}
            sx={{
              height: '100%',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.05),
                0 20px 40px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              backdropFilter: 'blur(20px)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
                zIndex: 1
              }
            }}
          />
        </Box>

        <Box width={400}>
          {/* Filters */}
          <Card sx={{ 
            mb: 3, 
            borderRadius: '20px', 
            boxShadow: `
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 20px 40px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '1.2rem',
                mb: 4,
                letterSpacing: '-0.01em'
              }}>
                <LayoutIcon fontSize="medium" sx={{ 
                  color: '#667eea',
                  filter: 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))'
                }} />
                Visualisierung
              </Typography>
              <FormGroup sx={{ gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showProjects}
                      onChange={(e) => handleFilterChange('showProjects', e.target.checked)}
                      sx={{
                        width: 52,
                        height: 28,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                          padding: 0,
                          margin: '2px',
                          transitionDuration: '300ms',
                          '&.Mui-checked': {
                            transform: 'translateX(24px)',
                            color: '#ffffff',
                            '& + .MuiSwitch-track': {
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              opacity: 1,
                              border: 0,
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            },
                            '& .MuiSwitch-thumb': {
                              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                            }
                          },
                          '&.Mui-focusVisible .MuiSwitch-thumb': {
                            color: '#ffffff',
                            border: '3px solid rgba(102, 126, 234, 0.3)'
                          }
                        },
                        '& .MuiSwitch-thumb': {
                          boxSizing: 'border-box',
                          width: 24,
                          height: 24,
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 14,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          opacity: 1,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={2} sx={{ ml: 1 }}>
                      <Box sx={{ 
                        width: 20, 
                        height: 12, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 3,
                        boxShadow: '0 4px 8px rgba(102, 126, 234, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: '600', 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem',
                        letterSpacing: '0.01em'
                      }}>
                        Projekte
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showUsers}
                      onChange={(e) => handleFilterChange('showUsers', e.target.checked)}
                      size="small"
                      sx={{
                        width: 52,
                        height: 28,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                          padding: 0,
                          margin: '2px',
                          transitionDuration: '300ms',
                          '&.Mui-checked': {
                            transform: 'translateX(24px)',
                            color: '#ffffff',
                            '& + .MuiSwitch-track': {
                              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                              opacity: 1,
                              border: 0,
                              boxShadow: '0 4px 12px rgba(72, 187, 120, 0.4)'
                            }
                          }
                        },
                        '& .MuiSwitch-thumb': {
                          width: 24,
                          height: 24,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 14,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          opacity: 1,
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                        borderRadius: '50%',
                        boxShadow: '0 3px 6px rgba(72, 187, 120, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: '600', 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem'
                      }}>
                        Benutzer
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showPersons}
                      onChange={(e) => handleFilterChange('showPersons', e.target.checked)}
                      sx={{
                        width: 52,
                        height: 28,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                          padding: 0,
                          margin: '2px',
                          transitionDuration: '300ms',
                          '&.Mui-checked': {
                            transform: 'translateX(24px)',
                            color: '#ffffff',
                            '& + .MuiSwitch-track': {
                              background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                              opacity: 1,
                              border: 0,
                              boxShadow: '0 4px 12px rgba(79, 209, 199, 0.4)'
                            }
                          }
                        },
                        '& .MuiSwitch-thumb': {
                          width: 24,
                          height: 24,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 14,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          opacity: 1,
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                        borderRadius: '50%',
                        boxShadow: '0 3px 6px rgba(79, 209, 199, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: '600', 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem'
                      }}>
                        Personen
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showDepartments}
                      onChange={(e) => handleFilterChange('showDepartments', e.target.checked)}
                      sx={{
                        width: 52,
                        height: 28,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                          padding: 0,
                          margin: '2px',
                          transitionDuration: '300ms',
                          '&.Mui-checked': {
                            transform: 'translateX(24px)',
                            color: '#ffffff',
                            '& + .MuiSwitch-track': {
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              opacity: 1,
                              border: 0,
                              boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)'
                            }
                          }
                        },
                        '& .MuiSwitch-thumb': {
                          width: 24,
                          height: 24,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 14,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          opacity: 1,
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ 
                        width: 16,
                        height: 16,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        boxShadow: '0 3px 6px rgba(240, 147, 251, 0.4)',
                        filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.2))'
                      }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: '600', 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem'
                      }}>
                        Departments
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showTasks}
                      onChange={(e) => handleFilterChange('showTasks', e.target.checked)}
                      sx={{
                        width: 52,
                        height: 28,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                          padding: 0,
                          margin: '2px',
                          transitionDuration: '300ms',
                          '&.Mui-checked': {
                            transform: 'translateX(24px)',
                            color: '#ffffff',
                            '& + .MuiSwitch-track': {
                              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                              opacity: 1,
                              border: 0,
                              boxShadow: '0 4px 12px rgba(252, 182, 159, 0.4)'
                            }
                          }
                        },
                        '& .MuiSwitch-thumb': {
                          width: 24,
                          height: 24,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 14,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          opacity: 1,
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ 
                        width: 14,
                        height: 14,
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        transform: 'rotate(45deg)',
                        boxShadow: '0 3px 6px rgba(252, 182, 159, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: '600', 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem'
                      }}>
                        Tasks
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showTags}
                      onChange={(e) => handleFilterChange('showTags', e.target.checked)}
                      sx={{
                        width: 52,
                        height: 28,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                          padding: 0,
                          margin: '2px',
                          transitionDuration: '300ms',
                          '&.Mui-checked': {
                            transform: 'translateX(24px)',
                            color: '#ffffff',
                            '& + .MuiSwitch-track': {
                              background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                              opacity: 1,
                              border: 0,
                              boxShadow: '0 4px 12px rgba(167, 139, 250, 0.4)'
                            }
                          }
                        },
                        '& .MuiSwitch-thumb': {
                          width: 24,
                          height: 24,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 14,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          opacity: 1,
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ 
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '14px solid transparent',
                        background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                        width: 16,
                        height: 14,
                        boxShadow: '0 3px 6px rgba(167, 139, 250, 0.4)',
                        filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.2))'
                      }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: '600', 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem'
                      }}>
                        Tags
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card sx={{ 
            mb: 3, 
            borderRadius: '20px', 
            boxShadow: `
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 20px 40px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '1.2rem',
                mb: 3,
                letterSpacing: '-0.01em'
              }}>
                Statistiken
              </Typography>
              {graphStats ? (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Gesamt Knoten:
                    </Typography>
                    <Chip 
                      label={graphStats.totalNodes} 
                      size="medium" 
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
                      }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Verbindungen:
                    </Typography>
                    <Chip 
                      label={graphStats.totalEdges} 
                      size="medium" 
                      sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: '#ffffff',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 8px rgba(240, 147, 251, 0.3)'
                      }}
                    />
                  </Box>
                  <Divider sx={{ 
                    my: 3,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    '&::before, &::after': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Projekte:
                    </Typography>
                    <Chip 
                      label={graphStats.projects} 
                      size="medium" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Benutzer:
                    </Typography>
                    <Chip 
                      label={graphStats.users} 
                      size="medium" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Personen:
                    </Typography>
                    <Chip 
                      label={graphStats.persons} 
                      size="medium" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Departments:
                    </Typography>
                    <Chip 
                      label={graphStats.departments} 
                      size="medium" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Tasks:
                    </Typography>
                    <Chip 
                      label={graphStats.tasks} 
                      size="medium" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      Tags:
                    </Typography>
                    <Chip 
                      label={graphStats.tags} 
                      size="medium" 
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Alert 
                  severity="info"
                  sx={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    '& .MuiAlert-icon': {
                      color: '#3b82f6'
                    }
                  }}
                >
                  Keine Projekte zum Anzeigen
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Selected Node Details */}
          <Fade in={!!selectedNode}>
            <Card sx={{ 
              borderRadius: '20px', 
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.1),
                0 20px 40px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)'
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '1.2rem',
                  mb: 3,
                  letterSpacing: '-0.01em'
                }}>
                  Details
                </Typography>
                {selectedNode && (
                  <>
                    <Divider sx={{ 
                      mb: 3,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      '&::before, &::after': {
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }} />
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: '700',
                      color: '#ffffff',
                      fontSize: '1.1rem',
                      mb: 2
                    }}>
                      {selectedNode.label}
                    </Typography>
                    <Chip 
                      label={selectedNode.data.type} 
                      size="medium" 
                      sx={{ 
                        mb: 3,
                        background: `linear-gradient(135deg, ${NODE_STYLES[selectedNode.data.type as keyof typeof NODE_STYLES]?.backgroundColor || '#667eea'})`,
                        color: '#ffffff',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        textTransform: 'capitalize'
                      }}
                    />
                    {selectedNode.data.status && (
                      <Typography variant="body2" sx={{ 
                        mb: 2,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.95rem'
                      }}>
                        <Box component="span" sx={{ fontWeight: '600', color: '#ffffff' }}>Status:</Box> {selectedNode.data.status}
                      </Typography>
                    )}
                    {selectedNode.data.priority && (
                      <Typography variant="body2" sx={{ 
                        mb: 2,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.95rem'
                      }}>
                        <Box component="span" sx={{ fontWeight: '600', color: '#ffffff' }}>Priorität:</Box> {selectedNode.data.priority}
                      </Typography>
                    )}
                    {selectedNode.data.description && (
                      <Typography variant="body2" sx={{ 
                        mt: 2,
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6
                      }}>
                        {selectedNode.data.description}
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default KnowledgeGraph;