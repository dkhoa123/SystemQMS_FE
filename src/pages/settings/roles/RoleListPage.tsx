// import { useCallback, useEffect, useState } from 'react';
// [SỬA] Bỏ useCallback, đổi roleService sang apiBE/roles
import { useEffect, useState } from 'react';
import type { Key } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Table, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { DeleteOutlined, EditOutlined, SearchOutlined, UserAddOutlined } from '@ant-design/icons';
// import { roleService } from '../../../api/services/roleService';
import { deleteRoles, getRoles } from '../../../api/apiBE/role';
import PaginationBar from '../../../components/common/PaginationBar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { buildRoleDetailPath, ROUTES } from '../../../constants/routes';
import type { Role } from '../../../types/role';
import styles from './RoleListPage.module.css';

export default function RoleListPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // [THÊM MỚI] State kích hoạt tải lại danh sách sau khi xóa
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => navigate(ROUTES.ROLE_CREATE);
  const handleEdit = (role: Role) => navigate(buildRoleDetailPath(role.roleId));

  // Chờ 400ms sau khi ngừng gõ mới tìm
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchText);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Lấy danh sách vai trò
  // const fetchData = useCallback(async () => {
  //   setLoading(true);

  //   try {
  //     const res = await roleService.getList({ page, pageSize, keyword });
  //     setItems(res.items);
  //     setTotal(res.total);
  //   } catch (error) {
  //     message.error(error instanceof Error ? error.message : 'Không thể tải danh sách vai trò');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [page, pageSize, keyword]);

  // useEffect(() => {
  //   void fetchData();
  // }, [fetchData]);

  // [sửa] Lấy danh sách vai trò từ API BE 
  useEffect(() => {
    let active = true;

    const fetchRoles = async () => {
      setLoading(true);
      try {
        const res = await getRoles({ page, pageSize, keyword });
        if (active) {
          setItems(res.items);
          setTotal(res.total);
        }
      } catch (error: any) {
        if (active) {
          message.error(
            error.response?.data?.message || 'Không thể tải danh sách vai trò'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchRoles();

    return () => {
      active = false;
    };
  }, [page, pageSize, keyword, refreshKey]);

  // Xóa vai trò đã chọn
  const handleDelete = () => {
    if (selectedKeys.length === 0) {
      message.warning('Vui lòng chọn vai trò cần xóa');
      return;
    }

    setDeleteOpen(true);
  };

  // const handleConfirmDelete = async () => {
  //   setDeleting(true);
  //   try {
  //     await roleService.remove(selectedKeys.map(String));
  //     message.success('Đã xóa vai trò');
  //     setSelectedKeys([]);
  //     setDeleteOpen(false);
  //     await fetchData();
  //   } catch (error) {
  //     message.error(error instanceof Error ? error.message : 'Xóa thất bại');
  //   } finally {
  //     setDeleting(false);
  //   }
  // };

  // [SỬA] Gọi API xóa thật và tăng refreshKey để reload bảng
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const ids = selectedKeys.map(String);
      await deleteRoles(ids);
      message.success('Đã xóa vai trò');
      setSelectedKeys([]);
      setDeleteOpen(false);

      const remainingTotal = Math.max(0, total - ids.length);
      const lastPage = Math.max(1, Math.ceil(remainingTotal / pageSize));
      setPage((currentPage) => Math.min(currentPage, lastPage));
      setRefreshKey((current) => current + 1);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Xóa vai trò thất bại');
    } finally {
      setDeleting(false);
    }
  };

  // Cấu hình cột
  const columns: TableColumnsType<Role> = [
    { title: 'Tên vai trò', dataIndex: 'roleName', width: '25%' },
    { title: 'Số người dùng', dataIndex: 'userCount', width: '25%' },
    { title: 'Mô tả', dataIndex: 'description', width: '40%', ellipsis: true },
    {
      title: 'Hành động',
      align: 'right',
      width: '10%',
      render: (_, record) => (
        <Button
          type="text"
          aria-label={`Sửa ${record.roleName}`}
          icon={<EditOutlined />}
          className={styles.editButton}
          onClick={() => handleEdit(record)}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* Khu vực tìm kiếm */}
      <div className={styles.searchArea}>
        <div className={styles.fieldLabel}>Tìm kiếm</div>
        <Input
          prefix={<SearchOutlined className={styles.searchIcon} />}
          placeholder="Tìm kiếm"
          allowClear
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Bảng */}
      <div className={styles.tableWrap}>
        <Table<Role>
          tableLayout="fixed"
          rowKey="roleId"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={false}
          size="small"
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        />
      </div>

      {/* Phân trang cố định phía dưới */}
      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* Thanh chức năng bên phải */}
      <div className={styles.sideActions}>
        <Button
          type="text"
          aria-label="Thêm vai trò"
          icon={<UserAddOutlined className={styles.addIcon} />}
          onClick={handleAdd}
          className={styles.addButton}
        />
        <Button
          type="text"
          aria-label="Xóa vai trò đã chọn"
          icon={<DeleteOutlined className={styles.deleteIcon} />}
          disabled={selectedKeys.length === 0}
          onClick={handleDelete}
          className={styles.deleteButton}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Xác nhận xóa vai trò?"
        content={`Bạn có chắc muốn xóa ${selectedKeys.length} vai trò đã chọn? Hành động này không thể hoàn tác.`}
        loading={deleting}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}