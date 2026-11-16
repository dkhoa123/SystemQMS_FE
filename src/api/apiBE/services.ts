import { PageResult } from "../../types/common";
import { Service } from "../../types/service";
import {
  ServicePageResult,
  ServiceCreateValues,
} from "../services/serviceService";
import { PageResultServiceHistory } from "../../types/serviceHistory";
import { axiosClient } from "./axiosClient";

interface GetAllServicesParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

// BE trả "id" (number) thay vì "serviceId" (string)
// Hàm này map lại cho khớp với type Service của frontend
function mapService(item: any): Service {
  return {
    ...item,
    // id số tự tăng dùng cho URL /Services/{id}/edit
    serviceId: String(item.id ?? item.serviceId),
    serviceCode: item.serviceCode ?? item.serviceId ?? "",
    serviceName: item.serviceName ?? "",
    description: item.description ?? "",
    assignmentMethod: item.assignmentMethod ?? "ASSIGN_ON_ISSUE",
    status: item.status ?? "ACTIVE",
  };
}

export async function getAllServices({
  page = 1,
  pageSize = 10,
  keyword = "",
  status,
  fromDate,
  toDate,
}: GetAllServicesParams): Promise<ServicePageResult> {
  try {
    const response = await axiosClient.get("/Services/getAllServices", {
      params: {
        page,
        pageSize,
        keyword,
        status,
        fromDate,
        toDate,
      },
    });

    const raw = response.data.data ?? response.data;

    // raw có thể là { items: [...] } hoặc mảng trực tiếp [...]
    const rawItems = Array.isArray(raw) ? raw : (raw.items ?? raw.data ?? []);
    const items = rawItems.map(mapService);

    return {
      items,
      page: raw.page ?? page,
      pageSize: raw.pageSize ?? pageSize,
      total: raw.total ?? raw.totalCount ?? items.length,
    };
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
}

export async function getServiceById(serviceId: string): Promise<Service> {
  try {
    const response = await axiosClient.get(`/Services/${serviceId}`);

    const raw = response.data.data ?? response.data;

    return mapService(raw);
  } catch (error) {
    console.error(`Error fetching service with ID ${serviceId}:`, error);
    throw error;
  }
}

interface GetDetailServicesParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export async function getServiceHistory(
  serviceId: string,
  {
    page = 1,
    pageSize = 10,
    keyword = "",
    status,
    fromDate,
    toDate,
  }: GetDetailServicesParams,
): Promise<PageResultServiceHistory> {
  try {
    const response = await axiosClient.get(`/Services/${serviceId}/history`, {
      params: {
        serviceId,
        page,
        pageSize,
        keyword,
        status,
        fromDate,
        toDate,
      },
    });
    console.log(
      "🔍 Service history data từ BE:",
      response.data.data ?? response.data,
    ); // Xem cấu trúc object BE trả về
    return response.data.data ?? response.data;
  } catch (error) {
    console.error(`Error fetching service history for ID ${serviceId}:`, error);
    throw error;
  }
}

export async function updateService(
  serviceId: string,
  value: ServiceCreateValues,
): Promise<Service> {
  try {
    console.log("📤 Payload gửi lên:", value);

    const response = await axiosClient.put(
      `/Services/${serviceId}/edit`,
      value,
    );

    const raw = response.data.data ?? response.data;

    console.log("📥 Response từ BE:", raw);

    return mapService(raw);
  } catch (error: any) {
    console.error("Update service error:", error);
    console.error("Response:", error.response?.data);
    console.error("Request:", error.config?.data);

    throw error;
  }
}

export async function createService(
  value: ServiceCreateValues,
): Promise<Service> {
  try {
    console.log("📤 Payload gửi lên:", value);

    const response = await axiosClient.post(`/Services/create`, value);

    const raw = response.data.data ?? response.data;

    console.log("📥 Response từ BE:", raw);

    return mapService(raw);
  } catch (error: any) {
    console.error("Create service error:", error);
    console.error("Response:", error.response?.data);
    console.error("Request:", error.config?.data);

    throw error;
  }
}

export async function deleteService(serviceIds: string[]): Promise<void> {
  try {
    console.log("📤 Payload gửi lên:", serviceIds);

    await axiosClient.delete("/Services/delete", {
      data: { serviceIds },
    });
  } catch (error) {
    console.error("Delete service error:", error);
    throw error;
  }
}
