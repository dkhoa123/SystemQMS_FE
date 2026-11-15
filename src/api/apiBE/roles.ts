import axios from "axios";
import type { PageResult } from "../../types/common";
import type { PermissionGroup, Role, RoleForm } from "../../types/role";
import { axiosClient } from "./axiosClient";

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

// 1. Lấy danh mục nhóm quyền chức năng
export async function getPermissionGroups(): Promise<PermissionGroup[]> {
  try {
    const response = await axiosClient.get("/v1/permissions");
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching permission groups:", error);
    throw new Error(extractErrorMessage(error, "Không thể tải danh sách quyền"));
  }
}

// 2. Lấy danh sách vai trò (Tìm kiếm + Phân trang)
export async function getRoles(
  page = 1,
  pageSize = 10,
  keyword = "",
): Promise<PageResult<Role>> {
  try {
    const response = await axiosClient.get("/v1/roles", {
      params: { page, pageSize, keyword },
    });
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw new Error(extractErrorMessage(error, "Không thể tải danh sách vai trò"));
  }
}

// 3. Lấy chi tiết 1 vai trò theo ID
export async function getRoleById(roleId: string): Promise<Role> {
  try {
    const response = await axiosClient.get(`/v1/roles/${roleId}`);
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error fetching role detail:", error);
    throw new Error(extractErrorMessage(error, "Không tìm thấy vai trò"));
  }
}

// 4. Thêm mới vai trò
export async function createRole(roleData: RoleForm): Promise<Role> {
  try {
    const response = await axiosClient.post("/v1/roles", roleData);
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw new Error(extractErrorMessage(error, "Thêm vai trò thất bại"));
  }
}

// 5. Cập nhật vai trò
export async function updateRole(
  roleId: string,
  roleData: RoleForm,
): Promise<Role> {
  try {
    const response = await axiosClient.put(`/v1/roles/${roleId}`, roleData);
    return response.data.data ?? response.data;
  } catch (error) {
    console.error("Error updating role:", error);
    throw new Error(extractErrorMessage(error, "Cập nhật vai trò thất bại"));
  }
}

// 6. Xóa một hoặc nhiều vai trò
export async function deleteRoles(ids: string[]): Promise<void> {
  try {
    await axiosClient.delete("/v1/roles", {
      data: { ids },
    });
  } catch (error) {
    console.error("Error deleting roles:", error);
    throw new Error(extractErrorMessage(error, "Xóa thất bại"));
  }
}