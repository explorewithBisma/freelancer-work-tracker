import api from "./axios";

export const getInvoices = async () => {
  const res = await api.get("/invoices");
  return res.data;
};

export const getInvoiceById = async (invoiceId) => {
  const res = await api.get(`/invoices/${invoiceId}`);
  return res.data;
};

export const createInvoice = async (invoiceData) => {
  const res = await api.post("/invoices", invoiceData);
  return res.data;
};

export const deleteInvoice = async (invoiceId) => {
  const res = await api.delete(`/invoices/${invoiceId}`);
  return res.data;
};