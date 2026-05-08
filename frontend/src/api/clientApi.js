import api from "./axios";

export const getClients = async () => {
  const res = await api.get("/clients");
  return res.data;
};

export const getClientById = async (clientId) => {
  const res = await api.get(`/clients/${clientId}`);
  return res.data;
};

export const createClient = async (clientData) => {
  const res = await api.post("/clients", clientData);
  return res.data;
};

export const deleteClient = async (clientId) => {
  const res = await api.delete(`/clients/${clientId}`);
  return res.data;
};