import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Project, Task } from '../../types';

export class ProjectService {
  private static COLLECTION = 'projects';

  static async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...projectData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(`Error creating project: ${error.message}`);
    }
  }

  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, projectId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Error updating project: ${error.message}`);
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, projectId);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error(`Error deleting project: ${error.message}`);
    }
  }

  static async getProject(projectId: string): Promise<Project | null> {
    try {
      const docRef = doc(db, this.COLLECTION, projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
        } as Project;
      }
      return null;
    } catch (error: any) {
      throw new Error(`Error getting project: ${error.message}`);
    }
  }

  static async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('teamMembers', 'array-contains', { userId, role: 'member' }),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
        } as Project);
      });
      
      return projects;
    } catch (error: any) {
      throw new Error(`Error getting user projects: ${error.message}`);
    }
  }

  static subscribeToUserProjects(
    userId: string,
    callback: (projects: Project[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION),
      where('teamMembers', 'array-contains', { userId, role: 'member' }),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
        } as Project);
      });
      callback(projects);
    });
  }

  static async addTaskToProject(projectId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...task,
        projectId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(`Error adding task: ${error.message}`);
    }
  }

  static async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          dueDate: data.dueDate?.toDate(),
        } as Task);
      });
      
      return tasks;
    } catch (error: any) {
      throw new Error(`Error getting project tasks: ${error.message}`);
    }
  }
}