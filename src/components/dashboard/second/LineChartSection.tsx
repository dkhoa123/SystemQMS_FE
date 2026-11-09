import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Calendar, ChevronDown } from "lucide-react";
import styles from "./LineChartSection.module.css";

export interface LineChartPoint {
  time: string;
  value: number;
  [key: string]: any; // thêm dòng này để recharts không báo lỗi gạch đỏ data
}

// các kiểu mốc thời gian lọc
export type TimeFilterMode = "Giờ" | "Ngày" | "Tuần" | "Tháng";

// khai báo props cho component (đã sẵn sàng để nhận api từ cha truyền xuống)
export interface LineChartSectionProps {
  data?: LineChartPoint[];
  isLoading?: boolean;
  onFilterChange?: (filter: TimeFilterMode) => void;
  onDateRangeChange?: (fromDate: string, toDate: string) => void;
}

// mock
const defaultData: LineChartPoint[] = [
  { time: "Figma", value: 3800 },
  { time: "Sketch", value: 4100 },
  { time: "XD", value: 3600 },
  { time: "PS", value: 6040 },
  { time: "AI", value: 3800 },
  { time: "CorelDRAW", value: 4100 },
  { time: "InDesign", value: 3900 },
];

export default function LineChartSection({
  data = defaultData,
  isLoading = false,
  onFilterChange,
  onDateRangeChange,
}: LineChartSectionProps) {
  const [filterMode, setFilterMode] = useState<TimeFilterMode>("Ngày");

  // Mặc định từ đầu tháng đến hôm nay
  const today = new Date();

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [fromDate, setFromDate] = useState(formatDate(firstDay));

  const [toDate, setToDate] = useState(formatDate(today));

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as TimeFilterMode;

    setFilterMode(newMode);
    onFilterChange?.(newMode);
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;

    setFromDate(newDate);
    onDateRangeChange?.(newDate, toDate);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;

    setToDate(newDate);
    onDateRangeChange?.(fromDate, newDate);
  };

  // vẽ chấm tròn viền xanh ruột trắng và cái nhãn 6040 trên đỉnh
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    // kiểm tra điểm cao nhất ở mốc ps
    const isHighestPoint = payload.value === 6040 || payload.time === "PS";

    return (
      <g key={`dot-${payload.time}`}>
        {/* chấm tròn ruột trắng viền xanh */}
        <circle
          cx={cx}
          cy={cy}
          r={3.5}
          fill="#ffffff"
          stroke="#5185f7"
          strokeWidth={1.5}
        />

        {/* nhãn số 6040 nổi lên trên đỉnh */}
        {isHighestPoint && (
          <g>
            <rect
              x={cx - 26}
              y={cy - 30}
              width={52}
              height={22}
              rx={4}
              fill="#ffffff"
              stroke="#8979FF"
              strokeWidth={1}
              style={{ filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))" }}
            />
            <text
              x={cx}
              y={cy - 15}
              textAnchor="middle"
              fill="#374151"
              fontSize={12}
              fontWeight="600"
            >
              {payload.value.toLocaleString()}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className={styles.card}>
      {/* thanh tiêu đề và các nút lọc */}
      <div className={styles.header}>
        <h3 className={styles.title}>Bảng thống kê số lượng STT cấp</h3>

        <div className={styles.controls}>
          {/* ô chọn giờ ngày tuần tháng */}
          <div className={styles.selectWrapper}>
            <select
              value={filterMode}
              onChange={handleFilterChange}
              className={styles.select}
            >
              <option value="Giờ">Giờ</option>
              <option value="Ngày">Ngày</option>
              <option value="Tuần">Tuần</option>
              <option value="Tháng">Tháng</option>
            </select>
            <ChevronDown className={styles.selectArrow} size={14} />
          </div>

          {/* khung chọn khoảng ngày */}
          <div className={styles.dateRange}>
            <div className={styles.dateBox}>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={handleFromDateChange}
                className={styles.dateInput}
              />
              {/* <Calendar size={13} /> */}
            </div>

            <span className={styles.separator}>&gt;</span>

            <div className={styles.dateBox}>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={formatDate(today)}
                onChange={handleToDateChange}
                className={styles.dateInput}
              />
              {/* <Calendar size={13} /> */}
            </div>
          </div>
        </div>
      </div>

      {/* vùng vẽ biểu đồ */}
      <div className={styles.chartContainer}>
        {isLoading ? (
          <div className={styles.loadingText}>đang tải dữ liệu biểu đồ...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data as any[]}
              margin={{ top: 35, right: 10, left: -25, bottom: 0 }}
            >
              {/* màu chuyển tiếp từ xanh lam sang trong suốt */}
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5185f7" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#5185f7" stopOpacity={0.0} />
                </linearGradient>
                <filter
                  id="areaGlow"
                  x="-10%"
                  y="-10%"
                  width="120%"
                  height="120%"
                >
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* đường kẻ ngang mờ mờ */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />

              {/* trục hoành phía dưới */}
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />

              {/* trục tung bên trái */}
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />

              {/* hộp thông tin khi rê chuột */}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className={styles.customTooltip}>
                        <p className={styles.tooltipValue}>
                          {payload[0].value?.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* đường cong màu xanh và tô nền */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8979FF"
                strokeWidth={1}
                fillOpacity={1}
                fill="url(#blueGradient)"
                filter="url(#areaGlow)"
                dot={renderCustomDot}
                activeDot={{
                  r: 5,
                  fill: "#5185f7",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
