import api from "./axios";

export const getProjects = async () => {
  const res = await api.get("/projects/");
  return res.data;
};

export const getProjectById = async (projectId) => {
  const res = await api.get(`/projects/${projectId}/`);
  return res.data;
};

export const createProject = async (projectData) => {
  const res = await api.post("/projects/", projectData);
  return res.data;
};

// ✅ NEW: Update existing project
export const updateProject = async (projectId, projectData) => {
  const res = await api.put(`/projects/${projectId}/`, projectData);
  return res.data;
};

export const deleteProject = async (projectId) => {
  const res = await api.delete(`/projects/${projectId}/`);
  return res.data;
};