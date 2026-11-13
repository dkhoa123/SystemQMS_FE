import React, { useEffect, useState } from "react";
import styles from "./DashboardPage.module.css";
import StartOverView from "../../components/dashboard/topCard/StartOverView/StartOverView";
import RightSidebar from "../../components/dashboard/RightSidebar/RightSidebar";
import LineChartSection from "../../components/dashboard/second/LineChartSection";
import BarChartSection from "../../components/dashboard/second/BarChartSection";
import TicketListModal from "../../components/tickets/TicketListModal";
import {
  getServiceBarStatistics,
  getTicketIssuedStatistics,
  LineChartPoint,
  ServiceBarPoint,
  TimeFilterMode,
} from "../../api/apiBE/dashboards";
import { Ticket, TicketFilter } from "../../types/ticket";

const getInitialDateRange = () => {
  const today = new Date();
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    fromDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: formatDate(today),
  };
};

export default function DashboardPage() {
  const [chartData, setChartData] = useState<LineChartPoint[]>([]);

  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<TimeFilterMode>("Ngày");
  const [filterService, setFilterService] = useState<TimeFilterMode>("Ngày");
  const [serviceData, setServiceData] = useState<ServiceBarPoint[]>([]);
  const [isServiceLoading, setIsServiceLoading] = useState(false);

  const [fromDate, setFromDate] = useState("2026-11-09");

  const [filters, setFilters] = useState<TicketFilter>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // State ngày được nhận từ component con
  const [dateRange, setDateRange] = useState(getInitialDateRange);

  const fetchStatistics = async (
    selectedFilter: TimeFilterMode,
    fromDate: string,
    toDate: string,
  ) => {
    if (!fromDate || !toDate) return;

    setLoading(true);

    try {
      const result = await getTicketIssuedStatistics(
        selectedFilter,
        fromDate,
        toDate,
      );

      setChartData(result);
    } catch (error) {
      console.error("Lỗi lấy thống kê STT:", error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceStatistics = async () => {
    try {
      setIsServiceLoading(true);

      const result = await getServiceBarStatistics(filterService, fromDate);

      setServiceData(result);
    } catch (error) {
      console.error("Lỗi lấy thống kê STT theo dịch vụ:", error);
      setServiceData([]);
    } finally {
      setIsServiceLoading(false);
    }
  };

  // Khi người dùng thay đổi filter hoặc ngày
  useEffect(() => {
    if (!dateRange.fromDate || !dateRange.toDate) return;

    fetchStatistics(filter, dateRange.fromDate, dateRange.toDate);
  }, [filter, dateRange]);

  // Khi người dùng thay đổi filterService hoặc fromDate
  useEffect(() => {
    if (!fromDate) return;

    fetchServiceStatistics();
  }, [filterService, fromDate]);
  return (
    <div className={styles.container}>
      {/* cọt trá*/}
      <div className={styles.leftCol}>
        <StartOverView />
        <div className={styles.main}>
          {/* hàng ngang chứa 2 biểu đồ */}
          <div className={styles.chartsRow}>
            <div className={styles.lineCol}>
              <LineChartSection
                data={chartData}
                isLoading={loading}
                onFilterChange={setFilter}
                onDateRangeChange={(fromDate, toDate) => {
                  setDateRange({ fromDate, toDate });
                }}
              />
            </div>
            <div className={styles.barCol}>
              <BarChartSection
                data={serviceData}
                isLoading={isServiceLoading}
                onFilterChange={(newFilter) => setFilterService(newFilter)}
              />
            </div>
          </div>
        </div>

        {/* table */}
        <div className={styles.table}>
          <TicketListModal
            filters={filters}
            refreshKey={refreshKey}
            pageSize={5}
          />
        </div>
      </div>

      {/* cọtt phải chứa RightSidebar */}
      <div className={styles.rightCol}>
        <RightSidebar />
      </div>
    </div>
  );
}
