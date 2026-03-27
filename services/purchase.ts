export interface Purchase {
  _id?: string;
  date: string;
  supplier: string;
  item: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: string;
  billImage: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedPurchasesResponse {
  purchases: Purchase[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPurchases: number;
    limit: number;
  };
}

export interface GetPurchasesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function fetchPurchases(params?: GetPurchasesParams): Promise<PaginatedPurchasesResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = `/api/purchases${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch purchases");
    return await res.json();
  } catch (err) {
    console.error(err);
    return {
      purchases: [],
      pagination: { currentPage: 1, totalPages: 0, totalPurchases: 0, limit: 10 },
    };
  }
}

export async function addPurchase(formData: FormData): Promise<Purchase | null> {
  try {
    const res = await fetch("/api/purchases", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Failed to add purchase");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function updatePurchase(id: string, formData: FormData): Promise<Purchase | null> {
  try {
    const res = await fetch(`/api/purchases/${id}`, { method: "PUT", body: formData });
    if (!res.ok) throw new Error("Failed to update purchase");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function deletePurchase(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete purchase");
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}