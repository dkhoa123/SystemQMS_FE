import React, { useEffect, useState } from "react";
import styles from "./DashboardPage.module.css";
import StartOverView from "../../components/dashboard/topCard/StartOverView/StartOverView";
import RightSidebar from "../../components/dashboard/RightSidebar/RightSidebar";
import LineChartSection from "../../components/dashboard/second/LineChartSection";
import BarChartSection from "../../components/dashboard/second/BarChartSection";
import {
  getTicketIssuedStatistics,
  LineChartPoint,
  TimeFilterMode,
} from "../../api/apiBE/dashboards";

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

  // Khi người dùng thay đổi filter hoặc ngày
  useEffect(() => {
    if (!dateRange.fromDate || !dateRange.toDate) return;

    fetchStatistics(filter, dateRange.fromDate, dateRange.toDate);
  }, [filter, dateRange]);
  return (
    <div className={styles.container}>
      {/* cọt trá*/}
      <div className={styles.leftCol}>
        <StartOverView />
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
            <BarChartSection />
          </div>
        </div>
      </div>

      {/* cọtt phải chứa RightSidebar */}
      <div className={styles.rightCol}>
        <RightSidebar />
      </div>
    </div>
  );
}
