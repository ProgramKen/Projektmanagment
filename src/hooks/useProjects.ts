import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setProjects, setLoading, setError, addProject, updateProject, deleteProject } from '../store/slices/projectsSlice';
import { ProjectService } from '../services/firebase/projects';
import { Project } from '../types';

export const useProjects = () => {
  const dispatch = useDispatch();
  const { projects, currentProject, loading, error, filter } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(setLoading(true));
      
      // Load projects from localStorage
      const savedProjects = localStorage.getItem('projects');
      if (savedProjects) {
        try {
          const projects = JSON.parse(savedProjects);
          const parsedProjects = projects.map((project: any) => ({
            ...project,
            startDate: project.startDate ? new Date(project.startDate) : undefined,
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
            teamMembers: project.teamMembers?.map((member: any) => ({
              ...member,
              joinedAt: new Date(member.joinedAt),
            })) || [],
          }));
          dispatch(setProjects(parsedProjects));
        } catch (error) {
          console.error('Error loading projects from localStorage:', error);
          // Create sample projects if parsing fails
          createSampleProjects(user.id);
        }
      } else {
        // Create sample projects for new users
        createSampleProjects(user.id);
      }
      
      dispatch(setLoading(false));
    }
  }, [user?.id, dispatch]);

  const createSampleProjects = (userId: string) => {
    const sampleProjects: Project[] = [
      {
        id: 'project-' + Date.now(),
        name: 'Website Redesign',
        description: 'Komplette Überarbeitung der Unternehmenswebsite',
        status: 'active',
        priority: 'high',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-15'),
        tags: ['design', 'development', 'ux'],
        ownerId: userId,
        ownerType: 'user',
        teamMembers: [{ personId: userId, personType: 'user', role: 'owner', joinedAt: new Date() }],
        tasks: [],
        links: [],
        files: [],
        skillsRequired: [],
        objectives: [],
        risks: [],
        milestones: [],
        createdAt: new Date('2025-06-01'),
        updatedAt: new Date(),
      },
      {
        id: 'project-' + (Date.now() + 1),
        name: 'Marketing Kampagne Q3',
        description: 'Planung und Durchführung der Sommerkampagne',
        status: 'planning',
        priority: 'medium',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-09-30'),
        tags: ['marketing', 'social-media'],
        ownerId: userId,
        ownerType: 'user',
        teamMembers: [{ personId: userId, personType: 'user', role: 'owner', joinedAt: new Date() }],
        tasks: [],
        links: [],
        files: [],
        skillsRequired: [],
        objectives: [],
        risks: [],
        milestones: [],
        createdAt: new Date('2025-05-15'),
        updatedAt: new Date(),
      }
    ];
    localStorage.setItem('projects', JSON.stringify(sampleProjects));
    dispatch(setProjects(sampleProjects));
  };

  const saveProjectsToStorage = (projects: Project[]) => {
    localStorage.setItem('projects', JSON.stringify(projects));
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    setTimeout(() => {
      const newProject: Project = {
        ...projectData,
        id: 'project-' + Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: user?.id || 'user',
        ownerType: 'user',
        teamMembers: [{ personId: user?.id || 'user', personType: 'user', role: 'owner', joinedAt: new Date() }],
        tasks: [],
        links: [],
        files: [],
        skillsRequired: projectData.skillsRequired || [],
        objectives: projectData.objectives || [],
        risks: projectData.risks || [],
        milestones: projectData.milestones || [],
      };
      
      dispatch(addProject(newProject));
      const updatedProjects = [...projects, newProject];
      saveProjectsToStorage(updatedProjects);
      dispatch(setLoading(false));
    }, 1000);
  };

  const updateProjectData = async (projectId: string, updates: Partial<Project>) => {
    dispatch(setError(null));
    const updatedProject = { ...updates, id: projectId, updatedAt: new Date() } as Project;
    dispatch(updateProject(updatedProject));
    
    // Update localStorage
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
    );
    saveProjectsToStorage(updatedProjects);
  };

  const deleteProjectData = async (projectId: string) => {
    dispatch(setError(null));
    dispatch(deleteProject(projectId));
    
    // Update localStorage
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjectsToStorage(updatedProjects);
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    if (filter.status !== 'all') {
      filtered = filtered.filter(project => project.status === filter.status);
    }

    if (filter.priority !== 'all') {
      filtered = filtered.filter(project => project.priority === filter.priority);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  return {
    projects: getFilteredProjects(),
    allProjects: projects,
    currentProject,
    loading,
    error,
    filter,
    createProject,
    updateProject: updateProjectData,
    deleteProject: deleteProjectData,
  };
};