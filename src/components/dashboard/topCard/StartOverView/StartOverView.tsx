import { useEffect, useState } from "react";

import StartCart, { ColorVariant } from "../StartCart/StartCart";
import {
  Clipboard,
  ClipboardCheck,
  ClipboardMinus,
  ClipboardX,
  LucideIcon,
} from "lucide-react";
import {
  DashboardStatics,
  getTrendStatistics,
  TrendPoint,
} from "../../../../api/apiBE/dashboards";
import { DashboardStatic } from "../../../../types/dashbroad";
interface CardItem {
  id: number;
  title: string;
  value: number;
  icon: LucideIcon;
  colorVariant: ColorVariant;
}

// //Mock data
// const MOCK_CARDS: CardItem[] = [
//   {
//     id: 1,
//     title: "Số thứ tự đã cấp",
//     value: 5329,
//     icon: Clipboard,
//     colorVariant: "blue",
//   },
//   {
//     id: 2,
//     title: "Số thứ tự đang chờ",
//     value: 5329,
//     icon: ClipboardMinus,
//     colorVariant: "orange",
//   },
//   {
//     id: 3,
//     title: "Số thứ tự đã sử dụng",
//     value: 5329,
//     icon: ClipboardCheck,
//     colorVariant: "green",
//   },
//   {
//     id: 4,
//     title: "Số thứ tự đã bỏ qua",
//     value: 5329,
//     icon: ClipboardX,
//     colorVariant: "purple",
//   },
// ];

export default function TopCardList() {
  const [statistics, setStatistics] = useState<DashboardStatic | null>(null);
  const [trend, setTrend] = useState<TrendPoint | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const result = await DashboardStatics();
        console.log("Fetched statistics:", result);
        setStatistics(result);
      } catch (error) {
        console.error("Lỗi lấy thống kê:", error);
      }
    };

    fetchStatistics();
  }, []);

  //
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const result = await getTrendStatistics(trend ?? {});
        setTrend(result);
      } catch (error) {
        console.error("Error fetching trend:", error);
      }
    };

    fetchTrend();
  }, []);

  const cards: CardItem[] = [
    {
      id: 1,
      title: "Số thứ tự đã cấp",
      value: statistics?.totalIssued ?? 0,
      icon: Clipboard,
      colorVariant: "blue",
    },
    {
      id: 2,
      title: "Số thứ tự đang chờ",
      value: statistics?.totalWaiting ?? 0,
      icon: ClipboardMinus,
      colorVariant: "orange",
    },
    {
      id: 3,
      title: "Số thứ tự đã sử dụng",
      value: statistics?.totalUsed ?? 0,
      icon: ClipboardCheck,
      colorVariant: "green",
    },
    {
      id: 4,
      title: "Số thứ tự đã bỏ qua",
      value: statistics?.totalSkipped ?? 0,
      icon: ClipboardX,
      colorVariant: "purple",
    },
  ];

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {cards.map((card) => (
        <StartCart
          key={card.id}
          title={card.title}
          value={card.value}
          percent={(() => {
            switch (card.id) {
              case 1:
                return trend?.percentIssued ?? 0;
              case 2:
                return trend?.percentWaiting ?? 0;
              case 3:
                return trend?.percentUsed ?? 0;
              case 4:
                return trend?.percentSkipped ?? 0;
              default:
                return 0;
            }
          })()}
          iconRight={card.icon}
          colorVariant={card.colorVariant}
        />
      ))}
    </div>
  );
}
