import { axiosClient } from "./axiosClient";
import type { PageResult } from "../../types/common";
import type { PermissionGroup, Role, RoleForm } from "../../types/role";

function mapRole(item: any): Role {
  return {
    roleId: String(item.roleId ?? item.id ?? ""),
    roleName: item.roleName ?? "",
    description: item.description ?? "",
    userCount: Number(item.userCount ?? 0),
    permissions: Array.isArray(item.permissions)
      ? item.permissions.map(String)
      : [],
  };
}

export async function getRoles(params: {
  page: number;
  pageSize: number;
  keyword?: string;
}): Promise<PageResult<Role>> {
  try {
    const response = await axiosClient.get("/v1/roles", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword?.trim() || undefined,
      },
    });

    const raw = response.data.data ?? response.data;
    const rawItems = Array.isArray(raw) ? raw : (raw.items ?? []);

    return {
      items: rawItems.map(mapRole),
      page: raw.page ?? params.page,
      pageSize: raw.pageSize ?? params.pageSize,
      total: raw.total ?? rawItems.length,
    };
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
}

export async function getRoleById(roleId: string): Promise<Role> {
  try {
    const response = await axiosClient.get(`/v1/roles/${roleId}`);
    const raw = response.data.data ?? response.data;
    return mapRole(raw);
  } catch (error) {
    console.error(`Error fetching role with ID ${roleId}:`, error);
    throw error;
  }
}

export async function getPermissionGroups(): Promise<PermissionGroup[]> {
  try {
    const response = await axiosClient.get("/v1/roles/permissions");
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching permission groups:", error);
    throw error;
  }
}

export async function createRole(payload: RoleForm): Promise<Role> {
  try {
    const response = await axiosClient.post("/v1/roles", payload);
    const raw = response.data.data ?? response.data;
    return mapRole(raw);
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
}

export async function updateRole(
  roleId: string,
  payload: RoleForm,
): Promise<Role> {
  try {
    const response = await axiosClient.put(`/v1/roles/${roleId}`, payload);
    const raw = response.data.data ?? response.data;
    return mapRole(raw);
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
}

export async function deleteRoles(roleIds: string[]): Promise<void> {
  try {
    await axiosClient.delete("/v1/roles", {
      data: roleIds,
    });
  } catch (error) {
    console.error("Error deleting roles:", error);
    throw error;
  }
}