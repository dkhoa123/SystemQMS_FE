import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Form, Input, Spin, message } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import { roleService } from '../../../api/services/roleService';
// import { ROUTES } from '../../../constants/routes';
//  [SỬA] Bổ sung useParams và đổi sang các hàm từ apiBE/roles
import { useNavigate, useParams } from 'react-router-dom';
import {
  createRole,
  getPermissionGroups,
  getRoleById,
  updateRole,
} from '../../../api/apiBE/role';
import { buildRoleDetailPath, ROUTES } from '../../../constants/routes';
import type { PermissionGroup, RoleForm } from '../../../types/role';
import PermissionSelector from '../../../components/roles/PermissionSelector';
import styles from './RoleFormPage.module.css';

// Đặt dấu * đỏ SAU nhãn như Figma
const renderRequiredMark = (label: ReactNode, { required }: { required: boolean }) => (
  <>
    {label}
    {required && <span className={styles.asterisk}> *</span>}
  </>
);

// export default function RoleFormPage() {
//   const navigate = useNavigate();
//   const [form] = Form.useForm<RoleForm>();
//   const [groups, setGroups] = useState<PermissionGroup[]>([]);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     roleService.getPermissionGroups().then(setGroups);
//   }, []);

export default function RoleFormPage() {
  const navigate = useNavigate();
  // [THÊM MỚI] Nhận diện chế độ Cập nhật nếu URL có roleId
  const { roleId } = useParams<{ roleId: string }>();
  const isEditMode = Boolean(roleId);

  const [form] = Form.useForm<RoleForm>();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  // [THÊM MỚI] State loading khi nạp dữ liệu sửa
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // [SỬA] Tải danh sách quyền + đổ dữ liệu cũ vào form nếu đang ở chế độ Cập nhật
  useEffect(() => {
    let active = true;

    const loadFormData = async () => {
      setLoadingData(true);
      try {
        if (isEditMode && roleId) {
          const [permissionGroups, roleData] = await Promise.all([
            getPermissionGroups(),
            getRoleById(roleId),
          ]);
          if (!active) return;

          setGroups(permissionGroups);
          form.setFieldsValue({
            roleName: roleData.roleName,
            description: roleData.description ?? '',
            permissions: roleData.permissions ?? [],
          });
        } else {
          const permissionGroups = await getPermissionGroups();
          if (!active) return;
          setGroups(permissionGroups);
        }
      } catch (error: any) {
        if (!active) return;
        message.error(
          error.response?.data?.message || 'Không tải được dữ liệu vai trò'
        );
        if (isEditMode) {
          navigate(ROUTES.ROLES, { replace: true });
        }
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    };

    void loadFormData();

    return () => {
      active = false;
    };
  }, [isEditMode, roleId, form, navigate]);

  // const onFinish = async (values: RoleForm) => {
  //   setSubmitting(true);
  //   try {
  //     await roleService.create({
  //       roleName: values.roleName.trim(),
  //       description: values.description ?? '',
  //       permissions: values.permissions ?? [],
  //     });
  //     message.success('Thêm vai trò thành công');
  //     navigate(ROUTES.ROLES);
  //   } catch (error) {
  //     message.error(error instanceof Error ? error.message : 'Thêm vai trò thất bại');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  // [SỬA] Lưu thêm mới hoặc cập nhật tùy theo isEditMode
  const onFinish = async (values: RoleForm) => {
    setSubmitting(true);
    try {
      const payload: RoleForm = {
        roleName: values.roleName.trim(),
        description: values.description ?? '',
        permissions: values.permissions ?? [],
      };

      if (isEditMode && roleId) {
        await updateRole(roleId, payload);
        message.success('Cập nhật vai trò thành công');
        navigate(buildRoleDetailPath(roleId));
      } else {
        await createRole(payload);
        message.success('Thêm vai trò thành công');
        navigate(ROUTES.ROLES);
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
          (isEditMode ? 'Cập nhật vai trò thất bại' : 'Thêm vai trò thất bại')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      // Thêm mới Khóa form trong lúc đang tải dữ liệu cũ
      disabled={loadingData}
      onFinish={onFinish}
      initialValues={{ permissions: [] }}
      requiredMark={renderRequiredMark}
      className={styles.form}
    >
      <div className={styles.columns}>
        {/* Cột trái */}
        <div className={styles.leftColumn}>
          <div className={styles.sectionTitle}>1. Thông tin vai trò</div>

          <Form.Item
            label="Tên vai trò"
            name="roleName"
            rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên vai trò' }]}
          >
            <Input placeholder="Nhập tên vai trò" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea placeholder="Nhập mô tả" rows={8} className={styles.textArea} />
          </Form.Item>

          <div className={styles.note}>
            <span className={styles.asterisk}>* </span>Là trường thông tin bắt buộc
          </div>
        </div>

        {/* Cột phải */}
        <div className={styles.rightColumn}>
          <div className={styles.sectionTitle}>2. Phân quyền chức năng</div>
          <div className={styles.permissionList}>
            {/*[SỬA] Thêm điều kiện && !loadingData */}
            {groups.length > 0 && !loadingData ? (
              <Form.Item name="permissions" noStyle>
                <PermissionSelector groups={groups} />
              </Form.Item>
            ) : (
              <Spin />
            )}
          </div>
        </div>
      </div>

      {/* Nút cố định ở đáy */}
      <div className={styles.footer}>
        {/* [SỬA] Quay về trang chi tiết nếu đang Sửa, về danh sách nếu đang Thêm */}
        {/* <Button className={styles.cancelButton} onClick={() => navigate(ROUTES.ROLES)}>
          Hủy bỏ */}
          <Button
          className={styles.cancelButton}
          onClick={() =>
            navigate(
              isEditMode && roleId ? buildRoleDetailPath(roleId) : ROUTES.ROLES
            )
          }
        >
          Hủy bỏ
        </Button>
        <Button type="primary" htmlType="submit" loading={submitting} className={styles.submitButton}>
          Xác nhận
        </Button>
      </div>
    </Form>
  );
}