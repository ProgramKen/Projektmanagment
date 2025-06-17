import React from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Group,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { projects } = useProjects();
  const navigate = useNavigate();

  // Calculate real statistics
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalProjects = projects.length;
  const allTasks = projects.flatMap(p => p.tasks);
  const openTasks = allTasks.filter(t => t.status !== 'done').length;
  const completedTasks = allTasks.filter(t => t.status === 'done').length;
  const totalTasks = allTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Get team members (unique count)
  const allTeamMembers = projects.flatMap(p => p.teamMembers);
  const uniqueTeamMembers = new Set(allTeamMembers.map(member => member.personId));
  const teamMemberCount = uniqueTeamMembers.size;

  // Get upcoming deadlines
  const upcomingDeadlines = projects
    .filter(p => p.endDate && p.endDate > new Date() && p.status !== 'completed')
    .sort((a, b) => (a.endDate!.getTime() - b.endDate!.getTime()))
    .slice(0, 5);

  const stats = [
    {
      title: 'Aktive Projekte',
      value: activeProjects.toString(),
      total: `von ${totalProjects}`,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Team Mitglieder',
      value: teamMemberCount.toString(),
      icon: <Group sx={{ fontSize: 40 }} />,
      color: '#388e3c',
    },
    {
      title: 'Offene Tasks',
      value: openTasks.toString(),
      total: `von ${totalTasks}`,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#f57c00',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">
                      {stat.value}
                    </Typography>
                    {stat.total && (
                      <Typography variant="body2" color="textSecondary">
                        {stat.total}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Projekt Übersicht
              </Typography>
              {projects.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    Noch keine Projekte erstellt
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/projects')}
                  >
                    Erstes Projekt erstellen
                  </Button>
                </Box>
              ) : (
                <List>
                  {projects.slice(0, 5).map((project) => (
                    <ListItem 
                      key={project.id}
                      button
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <ListItemText
                        primary={project.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {project.description || 'Keine Beschreibung'}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip 
                                label={project.status} 
                                size="small" 
                                color={project.status === 'active' ? 'success' : 'default'}
                              />
                              <Chip 
                                label={`${project.tasks.length} Tasks`} 
                                size="small" 
                                variant="outlined"
                              />
                              {project.tasks.length > 0 && (
                                <Box sx={{ ml: 1, minWidth: 100 }}>
                                  <Typography variant="caption" color="textSecondary">
                                    {Math.round((project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100)}% erledigt
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.round((project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100)}
                                    sx={{ height: 4, borderRadius: 2 }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kommende Deadlines
              </Typography>
              {upcomingDeadlines.length === 0 ? (
                <Typography color="textSecondary" sx={{ p: 2 }}>
                  Keine anstehenden Deadlines
                </Typography>
              ) : (
                <List dense>
                  {upcomingDeadlines.map((project) => {
                    const daysUntilDeadline = Math.ceil((project.endDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <ListItem 
                        key={project.id}
                        button
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <ListItemText
                          primary={project.name}
                          secondary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={
                                  daysUntilDeadline <= 3 
                                    ? `${daysUntilDeadline} Tage` 
                                    : project.endDate!.toLocaleDateString('de-DE')
                                }
                                size="small" 
                                color={daysUntilDeadline <= 3 ? 'error' : daysUntilDeadline <= 7 ? 'warning' : 'info'}
                              />
                              {daysUntilDeadline <= 3 && <Warning color="error" fontSize="small" />}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;