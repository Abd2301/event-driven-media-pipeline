import axios from 'axios';
import { config } from '../config';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  due_date?: string;
}

// Create task request interface
export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}

// Update task request interface
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}

// API response interfaces
export interface ApiResponse<T> {
  statusCode: number;
  body: T;
}

export interface TasksResponse {
  tasks: Task[];
  count: number;
}

export interface TaskResponse {
  task: Task;
}

export interface MessageResponse {
  message: string;
  task?: Task;
}

// Health check response
export interface HealthResponse {
  status: string;
  timestamp: string;
  environment: string;
  service?: string;
  version?: string;
  database?: string;
  lambda?: {
    function_name: string;
    memory_limit: string;
    timeout: number;
  };
}

// API service class
class ApiService {
  // Health check
  async checkHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  }

  // Task operations
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<MessageResponse>('/tasks', taskData);
    return response.data.task!;
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get<TaskResponse>(`/tasks/${taskId}`);
    return response.data.task;
  }

  async listTasks(): Promise<Task[]> {
    const response = await apiClient.get<TasksResponse>('/tasks');
    return response.data.tasks;
  }

  async updateTask(taskId: string, taskData: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put<MessageResponse>(`/tasks/${taskId}`, taskData);
    return response.data.task!;
  }

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  }
}

// Export singleton instance
export const apiService = new ApiService(); 