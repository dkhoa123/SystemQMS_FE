import { axiosClient } from "./axiosClient";
import { CounterListParams, CounterSummary } from "../../types/counter";
import { PageResult } from "../../types/common";

export async function getCounters(
  params: CounterListParams,
): Promise<PageResult<CounterSummary>> {
  try {
    const response = await axiosClient.get("/Counters", { params });
    console.log("Response from getCounters:", response.data);
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching counters:", error);
    throw error;
  }
}

export async function getCounterById(
  counterId: number,
): Promise<CounterSummary> {
  try {
    const response = await axiosClient.get(`/Counters/${counterId}/work`);

    return response.data.data ?? response.data;
  } catch (error) {
    console.error(`Error fetching counter with ID ${counterId}:`, error);
    throw error;
  }
}
