import React, { useEffect, useState } from "react";
import { Button, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Ticket, TicketFilter } from "../../types/ticket";
import { getTickets } from "../../api/apiBE/tickets";
import StatusTag from "../common/StatusTag";

import styles from "./TicketList.module.css";

interface TicketListModalProps {
  filters: TicketFilter;
  refreshKey: number;
  pageSize?: number;
}

const TicketListModal: React.FC<TicketListModalProps> = ({
  filters,
  refreshKey,
  pageSize: initialPageSize = 10,
}) => {
  console.log("TicketListModal rendered");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Đồng bộ pageSize khi cha thay đổi
  useEffect(() => {
    setPageSize(initialPageSize);
    setPage(1);
  }, [initialPageSize]);

  // Khi thay đổi bộ lọc, quay lại trang đầu
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Lấy danh sách vé từ Backend
  useEffect(() => {
    console.log("TicketListModal useEffect chạy");

    let isMounted = true;

    const fetchTickets = async () => {
      setLoading(true);

      try {
        console.log("Fetching tickets:", {
          filters,
          page,
          pageSize,
        });

        const response = await getTickets(page, pageSize, filters);

        console.log("Tickets API response:", response);

        if (isMounted) {
          setTickets(response.items ?? []);
          setTotal(response.total ?? 0);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách cấp số:", error);

        if (isMounted) {
          setTickets([]);
          setTotal(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, filters, refreshKey]);

  // Tính tổng số trang dựa trên tổng bản ghi từ Backend
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Các cột của bảng
  const columns: ColumnsType<Ticket> = [
    {
      title: "Số thứ tự",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 100,
    },
    {
      title: "Tên dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      width: 190,
    },
    {
      title: "Thời gian cấp",
      dataIndex: "issuedTime",
      key: "issuedTime",
      width: 145,
    },
    {
      title: "Thời gian sử dụng",
      dataIndex: "usedTime",
      key: "usedTime",
      width: 145,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 125,
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Người thực hiện",
      dataIndex: "staffName",
      key: "staffName",
      width: 140,
    },
    {
      title: "Quầy dịch vụ",
      dataIndex: "counterName",
      key: "counterName",
      width: 120,
    },
  ];

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <Table<Ticket>
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          size="small"
          pagination={false}
          loading={loading}
          scroll={{ x: 1100 }}
          rowClassName={(record) =>
            record.status === "PROCESSING" ? styles.highlightRow : ""
          }
        />
      </div>

      {/* Footer và phân trang */}
      <div className={styles.tableFooter}>
        <div className={styles.pageSize}>
          <span>Đang hiển thị</span>

          <Select
            value={pageSize}
            options={[
              { label: "5", value: 5 },
              { label: "10", value: 10 },
              { label: "20", value: 20 },
              { label: "50", value: 50 },
            ]}
            onChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            style={{ width: 60 }}
          />

          <span>kết quả</span>
        </div>

        <div className={styles.pagination}>
          <Button
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => prev - 1)}
          >
            ‹ Trước
          </Button>

          <span>
            {page} / {totalPages}
          </span>

          <Button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Sau ›
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketListModal;
