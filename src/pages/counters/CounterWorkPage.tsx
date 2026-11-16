import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./CounterWorkPage.module.css";
import CounterHeader from "../../components/counters/CounterHeader";
import QueuePanel from "../../components/counters/QueuePanel";
import CallPanel from "../../components/counters/CallPanel";
import { counterService } from "../../api/services/counterService";
import { CounterSummary, QueueStats, QueueTicket } from "../../types/counter";
import { getQueueStats } from "../../api/apiBE/queue";

export default function CounterWorkPage() {
  const { counterId = "" } = useParams();

  const [counter, setCounter] = useState<CounterSummary | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Số đang được chọn ở bảng bên trái, chờ bấm "Gọi Số" bên phải
  const [selectedTicket, setSelectedTicket] = useState<QueueTicket | null>(
    null,
  );

  useEffect(() => {
    counterService.getSummary(counterId).then((c) => setCounter(c ?? null));
  }, [counterId]);

  useEffect(() => {
    getQueueStats(Number(counterId) || 0).then(setStats);
  }, [counterId, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);

  return (
    <div className={styles.page}>
      <CounterHeader title={counter?.name ?? "Quầy dịch vụ"} />

      <div className={styles.body}>
        <QueuePanel
          counterId={counterId}
          serviceName={counter?.services[0] ?? ""}
          stats={stats}
          refreshKey={refreshKey}
          selectedId={selectedTicket?.id}
          onSelectTicket={setSelectedTicket}
        />

        <CallPanel
          counterId={counterId}
          waiting={stats?.waiting ?? 0}
          selectedTicket={selectedTicket}
          onClearSelected={() => setSelectedTicket(null)}
          onChanged={reload}
        />
      </div>
    </div>
  );
}
