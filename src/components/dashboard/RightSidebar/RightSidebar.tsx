import React, { useEffect, useState } from "react";
import styles from "./RightSidebar.module.css";
import MiniCard from "./MiniCard";
import { Monitor, MessageSquare, Layers } from "lucide-react";
import ServicePieChart from "./ServicePieChart";
import RatingBars from "./RatingBars";

import {
  CountByStatus,
  DashboardServiceStatistics,
  getCountByStatus,
  getServiceStatistics,
  TimeFilterMode,
} from "../../../api/apiBE/dashboards";

const MINI_CARD_DATA = [
  {
    id: 1,
    title: "Thiết bị",
    total: 4221,
    icon: Monitor,
    themeColor: "#FF7506",
    statuses: [
      { label: "Đang hoạt động", count: 3799, color: "#FF7506" },
      { label: "Ngưng hoạt động", count: 422, color: "#E73F3F" },
    ],
  },
  {
    id: 2,
    title: "Dịch vụ",
    total: 4221,
    icon: MessageSquare,
    themeColor: "#4277FF",
    statuses: [
      { label: "Đang hoạt động", count: 3799, color: "#4277FF" },
      { label: "Ngưng hoạt động", count: 422, color: "#E73F3F" },
    ],
  },
  {
    id: 3,
    title: "Cấp số",
    total: 4221,
    icon: Layers,
    themeColor: "#35C75A",
    statuses: [
      { label: "Đang hoạt động", count: 3799, color: "#35C75A" },
      { label: "Ngưng hoạt động", count: 422, color: "#E73F3F" },
      { label: "Bỏ qua", count: 30, color: "#7E7D88" },
    ],
  },
];

const RightSidebar = () => {
  const [status, setStatus] = useState<CountByStatus | null>(null);
  useEffect(() => {
    // Fetch data from API and update the state
    const fetchData = async () => {
      try {
        const response = await getCountByStatus();
        // Update the state with the fetched data
        setStatus(response);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const MINI_CARD_DATA = [
    {
      id: 1,
      title: "Thiết bị",
      total: status?.totalDevices ?? 0,
      icon: Monitor,
      themeColor: "#FF7506",
      statuses: [
        {
          label: "Đang hoạt động",
          count: status?.statusDeviceActive ?? 0,
          color: "#FF7506",
        },
        {
          label: "Ngưng hoạt động",
          count: status?.statusDeviceInactive ?? 0,
          color: "#E73F3F",
        },
      ],
    },
    {
      id: 2,
      title: "Dịch vụ",
      total: status?.totalServices ?? 0,
      icon: MessageSquare,
      themeColor: "#4277FF",
      statuses: [
        {
          label: "Đang hoạt động",
          count: status?.statusServiceActive ?? 0,
          color: "#4277FF",
        },
        {
          label: "Ngưng hoạt động",
          count: status?.statusServiceInactive ?? 0,
          color: "#E73F3F",
        },
      ],
    },
    {
      id: 3,
      title: "Cấp số",
      total: status?.totalTickets ?? 0,
      icon: Layers,
      themeColor: "#35C75A",
      statuses: [
        {
          label: "Đang hoạt động",
          count: status?.statusTicketIssued ?? 0,
          color: "#35C75A",
        },
        {
          label: "Ngưng hoạt động",
          count: status?.statusTicketUsed ?? 0,
          color: "#E73F3F",
        },
        {
          label: "Bỏ qua",
          count: status?.statusTicketSkipped ?? 0,
          color: "#7E7D88",
        },
      ],
    },
  ];

  const [serviceStatistics, setServiceStatistics] =
    useState<DashboardServiceStatistics | null>(null);
  useEffect(() => {
    const fetchServiceStatistics = async () => {
      try {
        const result = await getServiceStatistics();
        setServiceStatistics(result);
      } catch (error) {
        console.error("Error fetching service statistics:", error);
      }
    };

    fetchServiceStatistics();
  }, []);

  const SERVICE_COLORS = [
    "#22D3EE",
    "#FF9640",
    "#3B82F6",
    "#22C55E",
    "#F87171",
    "#A855F7",
  ];

  const getServiceColor = (serviceId: number) =>
    SERVICE_COLORS[Math.abs(serviceId) % SERVICE_COLORS.length];

  return (
    <aside className={styles.container}>
      <div className={styles.cardList}>
        {MINI_CARD_DATA.map((item) => (
          <MiniCard
            key={item.id}
            total={item.total}
            title={item.title}
            icon={item.icon}
            themeColor={item.themeColor}
            statuses={item.statuses}
          />
        ))}
      </div>
      <ServicePieChart
        data={
          serviceStatistics?.serviceRatios.map((item) => ({
            title: item.serviceName,
            value: item.totalUsed,
            color: getServiceColor(item.serviceId),
          })) ?? []
        }
      />
      <RatingBars
        data={
          serviceStatistics?.ratingBars.map((item) => ({
            id: String(item.serviceId),
            name: item.serviceName,
            value: item.averageRating,
            color: getServiceColor(item.serviceId),
          })) ?? []
        }
      />
    </aside>
  );
};

export default RightSidebar;
