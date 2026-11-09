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
  fromDate: string,
  toDate: string,
): Promise<LineChartPoint[]> {
  const response = await axiosClient.get("/Dashboard/tickets/issued", {
    params: {
      filter: filterMapping[filter],
      fromDate,
      toDate,
    },
  });

  return response.data;
}
