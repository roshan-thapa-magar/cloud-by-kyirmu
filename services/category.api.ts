import api from "@/lib/axios";

export interface CategoryPayload {
  categoryName: string;
  image?: string;
}

export interface Category {
  _id: string;
  categoryName: string;
  image?: string;
}

export interface PaginatedResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ================= GET WITH PAGINATION ================= */

export const getCategories = async (page?: number, limit?: number) => {
  let url = "/category";

  if (page && limit) {
    url += `?page=${page}&limit=${limit}`;
  }

  const res = await api.get(url);
  return res.data;
};

/* ================= CREATE ================= */

export const createCategory = async (data: CategoryPayload) => {
  const res = await api.post("/category", data);
  return res.data.category;
};

/* ================= UPDATE ================= */

export const updateCategory = async (
  id: string,
  data: CategoryPayload
) => {
  const res = await api.put(`/category/${id}`, data);
  return res.data.category;
};

/* ================= DELETE ================= */

export const deleteCategory = async (id: string) => {
  const res = await api.delete(`/category/${id}`);
  return res.data;
};