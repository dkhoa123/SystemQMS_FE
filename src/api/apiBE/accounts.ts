import { axiosClient } from "./axiosClient";
import { ACCOUNT_STATUS } from "../../constants/enums";
import type { AccountStatus } from "../../constants/enums";
import type {
  Account,
  AccountCreateBody,
  AccountQuery,
} from "../../types/account";
import type { PageResult } from "../../types/common";

export interface UpdateAccountPayload {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  roleId: string;
  status: AccountStatus;
}

function mapAccount(item: any): Account {
  const rawStatus = String(item.status ?? "").toUpperCase();
  const status: AccountStatus =
    rawStatus === "SUSPENDED" ||
    rawStatus === "INACTIVE" ||
    item.isActive === false
      ? ACCOUNT_STATUS.SUSPENDED
      : ACCOUNT_STATUS.ACTIVE;

  return {
    accountId: String(item.userId ?? item.accountId ?? item.id ?? ""),
    username: item.username ?? "",
    fullName: item.fullName ?? item.name ?? "",
    phone: item.phone ?? item.numberPhone ?? "",
    email: item.email ?? "",
    status,
    roleId: String(item.roleId ?? ""),
    roleName: item.roleName ?? "",
  };
}

export async function getAccounts(
  params: AccountQuery,
): Promise<PageResult<Account>> {
  try {
    const response = await axiosClient.get("/v1/users", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword?.trim() || undefined,
        status: params.status || undefined,
        roleId: params.roleId ? Number(params.roleId) : undefined,
      },
    });

    const raw = response.data.data ?? response.data;
    const rawItems = Array.isArray(raw) ? raw : (raw.items ?? []);

    return {
      items: rawItems.map(mapAccount),
      page: raw.page ?? params.page,
      pageSize: raw.pageSize ?? params.pageSize,
      total: raw.total ?? rawItems.length,
    };
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
}

export async function getAccountById(accountId: string): Promise<Account> {
  try {
    const response = await axiosClient.get(`/v1/users/${accountId}`);
    const raw = response.data.data ?? response.data;
    return mapAccount(raw);
  } catch (error) {
    console.error(`Error fetching account ${accountId}:`, error);
    throw error;
  }
}

export async function createAccount(
  payload: AccountCreateBody,
): Promise<Account> {
  try {
    const response = await axiosClient.post("/v1/users", {
      fullName: payload.fullName,
      username: payload.username,
      password: payload.password,
      email: payload.email,
      phone: payload.phone,
      roleId: Number(payload.roleId),
      status: payload.status,
    });
    const raw = response.data.data ?? response.data;
    return mapAccount(raw);
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

export async function updateAccount(
  accountId: string,
  payload: UpdateAccountPayload,
): Promise<Account> {
  try {
    const response = await axiosClient.put(`/v1/users/${accountId}`, {
      fullName: payload.fullName,
      username: payload.username,
      email: payload.email,
      phone: payload.phone,
      roleId: Number(payload.roleId),
      status: payload.status,
    });
    const raw = response.data.data ?? response.data;
    return mapAccount(raw);
  } catch (error) {
    console.error(`Error updating account ${accountId}:`, error);
    throw error;
  }
}

export async function changeAccountPassword(
  accountId: string,
  payload: { newPassword: string; confirmPassword?: string },
): Promise<void> {
  try {
    await axiosClient.put(`/v1/users/${accountId}/password`, payload);
  } catch (error) {
    console.error(`Error changing password for account ${accountId}:`, error);
    throw error;
  }
}

export async function deleteAccounts(accountIds: string[]): Promise<void> {
  try {
    await axiosClient.delete("/v1/users", {
      data: accountIds.map((id) => Number(id)),
    });
  } catch (error) {
    console.error("Error deleting accounts:", error);
    throw error;
  }
}