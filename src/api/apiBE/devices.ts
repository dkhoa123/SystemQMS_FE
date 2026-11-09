import {
  Device,
  UpdateDevice,
  UpdateVolumeDevice,
  DetailDevice,
} from "../../types/device";
import { PageResult } from "../../types/common";
import { axiosClient } from "./axiosClient";

export async function createDevice(
  deviceData: any,
  unitId: number,
): Promise<Device> {
  try {
    //(Khuyên dùng): Dùng config params của axios cho sạch code
    const response = await axiosClient.post("/Device/create", deviceData, {
      params: {
        unitId: unitId,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating device:", error);
    throw error;
  }
}

export async function getDevices(
  page = 1,
  pageSize = 10,
  keyword = "",
  availability = "",
  connectionStatus = "",
): Promise<PageResult<Device>> {
  try {
    const response = await axiosClient.get("/Device/getAll", {
      params: {
        page,
        pageSize,
        keyword,
        availability,
        connectionStatus,
      },
    });
    console.log("Raw response:", response.data);

    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
}

export async function updateDevice(
  deviceId: string,
  deviceData: UpdateDevice,
): Promise<Device> {
  try {
    console.log("UPDATE URL:", `/Device/update/${deviceId}`);
    console.log("UPDATE BODY:", JSON.stringify(deviceData, null, 2));

    const response = await axiosClient.put(
      `/Device/update/${deviceId}`,
      deviceData,
    );

    return response.data;
  } catch (error: any) {
    console.error("UPDATE ERROR:", error.response?.data ?? error);
    throw error;
  }
}

export async function UpdateVolumeDevices(
  deviceId: string[],
  volume: number,
): Promise<Device> {
  try {
    const response = await axiosClient.put(`/Device/update-volume/`, {
      deviceIds: deviceId,
      volume: volume,
    });
    return response.data.data ?? response.data;
  } catch (error: any) {
    console.error("Update error:", error.response?.data ?? error);
    throw error;
  }
}

export async function DetailDevices(deviceId: string): Promise<DetailDevice> {
  try {
    const response = await axiosClient.get(`/Device/get/${deviceId}`);
    return response.data.data ?? response.data;
  } catch (error: any) {
    console.error(
      "Error fetching device details:",
      error.response?.data ?? error,
    );
    throw error;
  }
}

export async function DeleteDevices(deviceIds: string[]): Promise<void> {
  try {
    await axiosClient.delete("/Device/delete", {
      data: { deviceIds },
    });
  } catch (error: any) {
    console.error("========== DELETE ERROR ==========");
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("Request:", error.config?.data);
    throw error;
  }
}
