import { axiosClient } from "./axiosClient";
import axios from "axios";
import {
  HandlingHistory,
  QueueListParams,
  QueueStats,
  QueueTicket,
} from "../../types/counter";
import { PageResult } from "../../types/common";

const BACKEND_ORIGIN = "https://localhost:7058";

interface AudioCallEventDto {
  audioFiles: string[];
  readingSpeed: number;
  repeatCount: number;
}

async function playAudioSequence(
  audioFiles: string[],
  readingSpeed = 1,
  repeatCount = 1,
): Promise<void> {
  for (let repeat = 0; repeat < repeatCount; repeat += 1) {
    for (const path of audioFiles) {
      await new Promise<void>((resolve) => {
        const audio = new Audio(
          path.startsWith("http") ? path : `${BACKEND_ORIGIN}${path}`,
        );
        audio.playbackRate = readingSpeed;
        audio.onended = () => resolve();
        audio.onerror = () => {
          console.error("[Audio] Không tải được file:", audio.src);
          resolve();
        };
        audio.play().catch((error) => {
          console.error("[Audio] Trình duyệt không cho phép phát:", error);
          resolve();
        });
      });
    }
  }
}

async function playTicketAudio(counterId: string, ticket: QueueTicket) {
  const response = await axios.post<AudioCallEventDto>(
    `${BACKEND_ORIGIN}/api/v1/dsp/counters/${counterId}/play-audio`,
    null,
    { params: { sttId: ticket.id, repeatCount: 1 } },
  );
  if (response.data.audioFiles?.length) {
    await playAudioSequence(
      response.data.audioFiles,
      response.data.readingSpeed,
      response.data.repeatCount,
    );
  }
}

export async function getQueueStats(counterId: number): Promise<QueueStats> {
  try {
    const response = await axiosClient.get(
      `/Counters/${counterId}/queue/tickets`,
    );
    console.log("Response from getQueueStats:", response.data);
    return response.data.data ?? response.data;
  } catch (error) {
    console.error(
      `Error fetching queue stats for counter ID ${counterId}:`,
      error,
    );
    throw error;
  }
}

export async function getQueueTickets(
  counterId: string,
  params: QueueListParams,
): Promise<PageResult<QueueTicket>> {
  try {
    console.log("[FE -> BE] GET queue tickets filter", {
      url: `/Counters/${counterId}/queue/tickets/filter`,
      counterId,
      params,
    });
    const response = await axiosClient.get(
      `/Counters/${counterId}/queue/tickets/filter`,
      { params },
    );
    console.log("Response from getQueue:", response.data);
    return response.data.data ?? response.data;
  } catch (error) {
    console.error(`Error fetching queue for counter ID:`, counterId, error);
    if (axios.isAxiosError(error)) {
      console.error("[BE response]", {
        status: error.response?.status,
        data: error.response?.data,
        requestUrl: error.config?.url,
        requestParams: error.config?.params,
      });
    }
    throw error;
  }
}

export async function getHistory(
  counterId: string,
): Promise<HandlingHistory[]> {
  try {
    const response = await axiosClient.get(
      `/Counters/${counterId}/queue/history`,
    );
    console.log("Response from getHistory:", response.data);
    return response.data.data ?? response.data;
  } catch (error) {
    console.error(
      `Error fetching handling history for counter ID ${counterId}:`,
      error,
    );
    throw error;
  }
}

// Gọi N số kế tiếp trong hàng chờ
export async function callBatch(
  counterId: string,
  count: number,
): Promise<QueueTicket[]> {
  try {
    console.log("[FE -> BE] POST call batch", {
      url: `/Counters/${counterId}/queue/call`,
      counterId,
      payload: { count },
    });
    const res = await axiosClient.post(`/Counters/${counterId}/queue/call`, {
      count,
    });
    console.log(
      `Response from callBatch for counter ID ${counterId} and count ${count}:`,
      res.data,
    );
    const tickets: QueueTicket[] = res.data.data ?? res.data;
    for (const ticket of tickets) await playTicketAudio(counterId, ticket);
    return tickets;
  } catch (error) {
    console.error(
      `Error calling batch of ${count} tickets for counter ID ${counterId}:`,
      error,
    );
    if (axios.isAxiosError(error)) {
      console.error("[BE response]", {
        status: error.response?.status,
        data: error.response?.data,
        requestUrl: error.config?.url,
        requestData: error.config?.data,
      });
    }
    throw error;
  }
}

// Gọi đúng một số đã chọn
export async function callTicket(
  counterId: string,
  sttId: string,
): Promise<QueueTicket> {
  try {
    console.log("[FE -> BE] POST call ticket", {
      url: `/Counters/${counterId}/queue/call`,
      counterId,
      payload: { sttId },
    });
    const res = await axiosClient.post(`/Counters/${counterId}/queue/call`, {
      sttId,
    });
    console.log(
      `Response from callTicket for counter ID ${counterId} and ticket ID ${sttId}:`,
      res.data,
    );
    const ticket: QueueTicket = res.data.data ?? res.data;
    await playTicketAudio(counterId, ticket);
    return ticket;
  } catch (error) {
    console.error(
      `Error calling ticket with ID ${sttId} for counter ID ${counterId}:`,
      error,
    );
    if (axios.isAxiosError(error)) {
      console.error("[BE response]", {
        status: error.response?.status,
        data: error.response?.data,
        requestUrl: error.config?.url,
        requestData: error.config?.data,
      });
    }
    throw error;
  }
}
