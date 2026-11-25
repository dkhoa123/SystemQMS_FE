import { axiosClient } from "./axiosClient";
import { DashboardStatic } from "../../types/dashbroad";

export async function DashboardStatics(): Promise<DashboardStatic> {
  try {
    const response = await axiosClient.get("/Dashboard/tickets/status");
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching dashboard statics:", error);
    throw error;
  }
}

export type TimeFilterMode = "Giờ" | "Ngày" | "Tuần" | "Tháng";
export interface LineChartPoint {
  time: string;
  value: number;
}
const filterMapping: Record<TimeFilterMode, string> = {
  Giờ: "Gio",
  Ngày: "Ngay",
  Tuần: "Tuan",
  Tháng: "Thang",
};

export async function getTicketIssuedStatistics(
  filter: TimeFilterMode,
  fromDate?: string,
  toDate?: string,
): Promise<LineChartPoint[]> {
  const response = await axiosClient.get("/Dashboard/tickets/issued", {
    params: {
      filter: filterMapping[filter],
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
    },
  });

  return response.data.data ?? response.data;
}

export interface ServiceBarPoint {
  serviceName: string;
  count: number;
}

export async function getServiceBarStatistics(
  filter: TimeFilterMode,
  fromDate?: string,
): Promise<ServiceBarPoint[]> {
  try {
    const response = await axiosClient.get("/Dashboard/tickets/by-service", {
      params: {
        filter: filterMapping[filter],
        ...(fromDate && { fromDate }),
      },
    });

    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching service bar statistics:", error);
    throw error;
  }
}

export interface CountByStatus {
  totalDevices: number;
  totalServices: number;
  totalTickets: number;
  statusDeviceActive: number;
  statusDeviceInactive: number;
  statusServiceActive: number;
  statusServiceInactive: number;
  statusTicketIssued: number;
  statusTicketUsed: number;
  statusTicketSkipped: number;
}

export async function getCountByStatus(): Promise<CountByStatus> {
  try {
    const response = await axiosClient.get(
      "/Dashboard/counters-services/summary",
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching count by status:", error);
    throw error;
  }
}

export interface TrendPoint {
  percentIssued?: number;
  percentWaiting?: number;
  percentUsed?: number;
  percentSkipped?: number;
}

export async function getTrendStatistics(
  value: TrendPoint,
): Promise<TrendPoint> {
  try {
    const response = await axiosClient.get("/Dashboard/tickets/trend", {
      params: value,
    });
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching trend statistics:", error);
    throw error;
  }
}

export interface RatingBarResponse {
  serviceId: number;
  serviceName: string;
  averageRating: number;
}

export interface ServiceRatioResponse {
  serviceId: number;
  serviceName: string;
  totalUsed: number;
}

export interface DashboardServiceStatistics {
  ratingBars: RatingBarResponse[];
  serviceRatios: ServiceRatioResponse[];
}

export async function getServiceStatistics(): Promise<DashboardServiceStatistics> {
  const response = await axiosClient.get("/Dashboard/services/statistics");

  return response.data.data ?? response.data;
}
