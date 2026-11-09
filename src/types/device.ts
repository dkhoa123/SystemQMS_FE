import type {
  DeviceType,
  DeviceAvailability,
  ConnectionStatus,
} from "../constants/enums";

import type { ListParams } from "./common";

export interface Device {
  deviceId: string;
  deviceCode: string;
  deviceName: string;

  deviceType: DeviceType;
  availability: DeviceAvailability;
  connectionStatus: ConnectionStatus;

  ipAddress?: string;

  volume: number;
  showQueue: boolean;

  kioskTemplateId?: string;

  serviceIds: string[];
  counterIds: string[];

  description?: string;
}

export interface UpdateDevice {
  deviceName?: string;
  deviceType?: DeviceType;
  availability?: DeviceAvailability;
  serviceIds?: string[];
  description?: string;
}

export interface DetailDevice extends Device {
  deviceCode: string;
  deviceName: string;
  deviceType: DeviceType;
  password?: string;
  connectionStatus: ConnectionStatus;
  ipAddress?: string;
  volume: number;
  serviceIds: string[];
}

export interface UpdateVolumeDevice {
  deviceIds: string[];
  volume: number;
}

export interface DeviceListParams extends ListParams {
  availability?: DeviceAvailability;
  connectionStatus?: ConnectionStatus;
}
