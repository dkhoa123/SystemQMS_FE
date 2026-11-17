import { axiosClient } from "./axiosClient";
import { Ticket, TicketFilter, TicketStatistics } from "../../types/ticket";
import { PageResult } from "../../types/common";

export async function getStatistics(): Promise<TicketStatistics> {
  try {
    const response = await axiosClient.get("/Stickers/statistics");
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching all services:", error);
    throw error;
  }
}

export async function getTickets(
  page: number,
  pageSize: number,
  params: TicketFilter,
): Promise<PageResult<Ticket>> {
  try {
    console.log("GET TICKETS PARAMS:", {
      ...params,
      page,
      pageSize,
    });

    const response = await axiosClient.get("/Stickers/tickets", {
      params: {
        ...params,
        page,
        pageSize,
      },
    });

    console.log("GET TICKETS STATUS:", response.status);
    console.log("GET TICKETS DATA:", response.data);

    return response.data.data ?? response.data;
  } catch (error: any) {
    console.error("GET TICKETS ERROR:", error);
    console.error("ERROR RESPONSE:", error.response?.data);
    console.error("ERROR STATUS:", error.response?.status);

    throw error;
  }
}

export interface TicketRule {
  id: number;
  serviceId: number;
  serviceName: string;
  prefix: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
  resetDaily: boolean;
}

export interface IssueTicketRequest {
  serviceId: number;
}

export interface TicketsResponse {
  id: string;
  ticketNumber: string;
  serviceName: string;
  issueTime: string;
  status: string;
}

export async function getRules(): Promise<TicketRule[]> {
  const response = await axiosClient.get("/Stickers/rules");

  return response.data.data ?? response.data;
}
export async function updateRange(
  startNumber: number,
  endNumber: number,
): Promise<void> {
  await axiosClient.put("/Stickers/rules/range", {
    startNumber,
    endNumber,
  });
}
export async function issueTicket(serviceId: number): Promise<TicketsResponse> {
  try {
    const response = await axiosClient.post("/Stickers/create/tickets", {
      serviceId,
    });

    return response.data.data ?? response.data;
  } catch (error: any) {
    console.error("ISSUE TICKET ERROR:", error);
    console.error("ERROR RESPONSE:", error.response?.data);

    throw new Error(error.response?.data?.message ?? "Không thể cấp số.");
  }
}
