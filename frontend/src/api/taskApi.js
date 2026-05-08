import api from "./axios";

// Fetch all tasks for the logged-in user
// Hits: http://127.0.0.1:8000/tasks/
export const getTasks = () => api.get("/tasks/");

// Create a new task
export const createTask = (taskData) => api.post("/tasks/", taskData);

// Update task status
// Hits: http://127.0.0.1:8000/tasks/{id}/
export const updateTaskStatus = (id, taskData) => 
    api.patch(`/tasks/${id}/`, { status: taskData.status });

// Delete a task
export const deleteTask = (id) => api.delete(`/tasks/${id}/`);