import { useEffect, useState } from "react";
import { Button, Checkbox, InputNumber, Popover, message } from "antd";
import {
  BellOutlined,
  DesktopOutlined,
  EditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import ConfirmDialog from "../common/ConfirmDialog";
import { counterService } from "../../api/services/counterService";
import { ROUTES } from "../../constants/routes";
import {
  HISTORY_RESULT_COLOR,
  HISTORY_RESULT_LABEL,
} from "../../constants/enums";
import {
  CallingTicket,
  HandlingHistory,
  QueueTicket,
} from "../../types/counter";
import { callBatch, callTicket, getHistory } from "../../api/apiBE/queue";
import styles from "./CallPanel.module.css";

const MAX_BATCH = 6; // SRS OPR-03: tối đa 6 số đang xử lý cùng lúc

interface Props {
  counterId: string;
  waiting: number;
  selectedTicket: QueueTicket | null; // số đang chọn ở bảng bên trái
  onClearSelected: () => void; // xóa lựa chọn sau khi đã gọi
  onChanged: () => void; // báo trang cha tải lại số liệu
}

export default function CallPanel({
  counterId,
  waiting,
  selectedTicket,
  onClearSelected,
  onChanged,
}: Props) {
  const navigate = useNavigate();

  const [now, setNow] = useState(dayjs());
  const [calling, setCalling] = useState<CallingTicket[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(MAX_BATCH);
  const [history, setHistory] = useState<HandlingHistory[]>([]);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "multi">("multi");

  // Các vé đang ở trạng thái đang xử lý
  const processing = calling.filter((c) => c.callState === "PROCESSING");
  const hasProcessing = processing.length > 0;
  const first = calling[0];
  const checkedTickets = processing.filter((c) => checked.includes(c.id));
  const noneChecked = checkedTickets.length === 0;
  const allChecked =
    hasProcessing && checkedTickets.length === processing.length;

  // Đồng hồ
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 30000);
    return () => clearInterval(t);
  }, []);

  // Tải lịch sử xử lý
  const reloadHistory = () => getHistory(counterId).then(setHistory);

  useEffect(() => {
    reloadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counterId]);

  // Thêm vé vừa gọi vào khung hiển thị, giữ lại vé đang xử lý trước đó
  const addToCalling = (newTickets: QueueTicket[]) => {
    const merged: CallingTicket[] = [
      ...processing,
      ...newTickets.map((t) => ({ ...t, callState: "PROCESSING" as const })),
    ];
    setCalling(merged);
    setMode(merged.length === 1 ? "single" : "multi");
    setChecked(merged.map((t) => t.id)); // SRS OPR-03: tự tích chọn tất cả
  };

  // Số còn có thể gọi thêm
  const slotsLeft = () => MAX_BATCH - processing.length;

  // Gọi đúng số đang chọn ở bảng bên trái
  const handleCallSelected = async () => {
    if (!selectedTicket || busy) return;

    if (slotsLeft() <= 0) {
      message.warning(`Đã đạt tối đa ${MAX_BATCH} số đang xử lý cùng lúc`);
      return;
    }

    setBusy(true);
    try {
      const ticket = await callTicket(counterId, selectedTicket.id);
      addToCalling([ticket]);
      onClearSelected();
      onChanged();
    } catch {
      message.error("Gọi số thất bại, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  };

  // Gọi N số kế tiếp trong hàng chờ
  const handleCallNext = async (count: number) => {
    if (busy) return;

    if (slotsLeft() <= 0) {
      message.warning(`Đã đạt tối đa ${MAX_BATCH} số đang xử lý cùng lúc`);
      return;
    }

    setBusy(true);
    try {
      const picked = await callBatch(
        counterId,
        Math.min(Math.max(1, count), slotsLeft()),
      );
      if (picked.length === 0) {
        message.info("Hiện không còn số đang chờ");
        return;
      }
      addToCalling(picked);
      onChanged();
    } catch {
      message.error("Gọi số thất bại, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  };

  // Nút "Gọi Số": ưu tiên số đang chọn, không có thì gọi số kế tiếp
  const handleCallMain = () => {
    if (selectedTicket) handleCallSelected();
    else handleCallNext(1);
  };

  // Hoàn thành / Bỏ qua cho các số được tích
  const handleFinish = async (result: "DONE" | "ABSENT") => {
    if (noneChecked || busy) return;
    setBusy(true);
    try {
      await counterService.finishTickets(counterId, checkedTickets, result);

      // SRS OPR-05: bỏ qua thì loa đọc 3 lần
      if (result === "ABSENT") {
        await counterService.playTicketsAudio(counterId, checkedTickets, 3);
      }

      const ids = checkedTickets.map((t) => t.id);
      setCalling((list) =>
        list.map((c) => (ids.includes(c.id) ? { ...c, callState: result } : c)),
      );
      setChecked([]);
      await reloadHistory();
      onChanged();
    } catch {
      message.error("Thao tác thất bại, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  };

  // Gọi lại các số đang được tích
  const handleRecall = async () => {
    if (noneChecked || busy) return;
    setBusy(true);
    try {
      message.success(
        `Đang gọi lại số ${checkedTickets.map((t) => t.number).join(", ")}`,
      );
      await counterService.recallTickets(counterId, checkedTickets);
    } catch {
      message.error("Gọi lại thất bại, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  };

  // Gọi lại một số vắng từ lịch sử
  const handleRecallHistory = async (item: HandlingHistory) => {
    if (busy) return;
    setBusy(true);
    try {
      message.success(`Đang gọi lại số ${item.number}`);
      const payload = {
        id: item.id,
        number: item.number,
        serviceName: item.serviceName,
      } as QueueTicket;
      await counterService.recallTickets(counterId, [payload]);
    } catch {
      message.error("Gọi lại thất bại, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  };

  const toggleOne = (id: string) =>
    setChecked((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );

  const toggleAll = () =>
    setChecked(allChecked ? [] : processing.map((t) => t.id));

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        message.warning("Trình duyệt không cho phép toàn màn hình");
      });
    }
  };

  const notReady = () => message.info("Chức năng đang làm");

  const batchEditor = (
    <div className={styles.batchEditor}>
      <div>Số lượng xử lý / lần (tối đa {MAX_BATCH})</div>
      <InputNumber
        min={1}
        max={MAX_BATCH}
        value={batchSize}
        onChange={(v) => setBatchSize(v ?? 1)}
      />
    </div>
  );

  return (
    <div className={styles.panel}>
      {/* Số lượt chờ + giờ */}
      <div className={styles.top}>
        <div>
          <div className={styles.waiting}>
            Số lượt chờ: <span className={styles.waitingCount}>{waiting}</span>
          </div>
          <div className={styles.clock}>
            {now.format("DD/MM/YYYY")}
            <span className={styles.clockTime}>{now.format("hh:mm A")}</span>
          </div>
        </div>

        <div className={styles.topButtons}>
          <Button
            className={styles.outlineOrange}
            icon={<DesktopOutlined />}
            onClick={toggleFullscreen}
          >
            Phóng to
          </Button>
          <Button
            className={styles.outlineOrange}
            icon={<BellOutlined />}
            onClick={notReady}
          >
            Thông báo
          </Button>
        </div>
      </div>

      {/* Hàng nút điều khiển */}
      <div className={styles.actionRow}>
        <Button
          className={styles.multiBtn}
          loading={busy}
          disabled={processing.length >= MAX_BATCH}
          onClick={() => handleCallNext(batchSize)}
        >
          Gọi nhiều số
          <span className={styles.multiCount}>{batchSize}</span>
          <Popover content={batchEditor} trigger="click" placement="bottom">
            <EditOutlined onClick={(e) => e.stopPropagation()} />
          </Popover>
        </Button>
        <Button className={styles.stopBtn} onClick={() => setPaused((p) => !p)}>
          {paused ? "Tiếp nhận lại" : "Ngưng tiếp nhận"}
        </Button>
        <Button className={styles.closeBtn} onClick={() => setCloseOpen(true)}>
          Đóng quầy
        </Button>
      </div>

      {/* Khung gọi số / đang xử lý */}
      <div className={styles.callBox}>
        <div className={styles.callHead}>
          <span className={styles.callTitle}>
            {calling.length > 0 && mode === "multi"
              ? `Đang xử lý (${processing.length}/${MAX_BATCH})`
              : ""}
          </span>
          {hasProcessing && mode === "multi" && (
            <Checkbox checked={allChecked} onChange={toggleAll}>
              Chọn tất cả
            </Checkbox>
          )}
        </div>

        <div className={styles.callBody}>
          {calling.length === 0 && selectedTicket ? (
            // Chưa gọi, nhưng đã chọn số ở bảng trái: hiện số đó
            <div className={styles.single}>
              <div className={styles.currentNumber}>
                {selectedTicket.number}
              </div>
              <div className={styles.currentService}>
                DV: {selectedTicket.serviceName}
              </div>
            </div>
          ) : calling.length === 0 ? (
            <div className={styles.hint}>
              <div>Vui lòng bấm nút</div>
              <div>
                <span className={styles.hintStrong}>“Gọi Số”</span> để tiếp tục
                làm việc
              </div>
            </div>
          ) : mode === "single" ? (
            <div className={styles.single}>
              <div className={styles.currentNumber}>{first.number}</div>
              <div className={styles.currentService}>
                DV: {first.serviceName}
              </div>
              {first.callState !== "PROCESSING" && (
                <span
                  className={styles.ticketResult}
                  style={{ color: HISTORY_RESULT_COLOR[first.callState] }}
                >
                  {HISTORY_RESULT_LABEL[first.callState]}
                </span>
              )}
            </div>
          ) : (
            <div className={styles.ticketGrid}>
              {calling.map((t) => (
                <div
                  key={t.id}
                  className={`${styles.ticketCard} ${
                    t.callState !== "PROCESSING" ? styles.ticketDone : ""
                  }`}
                >
                  <div className={styles.ticketTop}>
                    <span className={styles.ticketNumber}>{t.number}</span>
                    {t.callState === "PROCESSING" ? (
                      <Checkbox
                        checked={checked.includes(t.id)}
                        onChange={() => toggleOne(t.id)}
                      />
                    ) : (
                      <span
                        className={styles.ticketResult}
                        style={{ color: HISTORY_RESULT_COLOR[t.callState] }}
                      >
                        {HISTORY_RESULT_LABEL[t.callState]}
                      </span>
                    )}
                  </div>
                  <div className={styles.ticketService}>
                    DV: {t.serviceName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.callButtons}>
          {hasProcessing ? (
            <Button
              type="primary"
              className={`${styles.callBtn} ${styles.callMain}`}
              disabled={noneChecked}
              loading={busy}
              onClick={() => handleFinish("DONE")}
            >
              Hoàn Thành
            </Button>
          ) : (
            <Button
              type="primary"
              className={`${styles.callBtn} ${styles.callMain}`}
              loading={busy}
              onClick={handleCallMain}
            >
              Gọi Số
            </Button>
          )}
          <Button
            className={styles.callBtn}
            disabled={noneChecked}
            loading={busy}
            onClick={handleRecall}
          >
            Gọi Lại
          </Button>
          <Button
            className={styles.callBtn}
            disabled={noneChecked}
            loading={busy}
            onClick={() => handleFinish("ABSENT")}
          >
            Bỏ Qua
          </Button>
          <Button
            className={styles.callBtn}
            disabled={noneChecked}
            onClick={notReady}
          >
            Chuyển quầy
          </Button>
        </div>
      </div>

      {/* Lịch sử xử lý */}
      <div className={styles.historyTitle}>Lịch sử xử lý</div>
      <div className={styles.history}>
        {history.map((h) => (
          <div key={h.id} className={styles.historyRow}>
            <span>
              <span className={styles.historyNum}>{h.number}</span>
              DV: {h.serviceName}
            </span>
            <span>{h.staffName}</span>
            <span
              className={styles.result}
              style={{ color: HISTORY_RESULT_COLOR[h.result] }}
            >
              {HISTORY_RESULT_LABEL[h.result]}
            </span>
            <span>
              {h.result === "ABSENT" && (
                <Button
                  size="small"
                  className={styles.recallBtn}
                  icon={<ReloadOutlined />}
                  disabled={busy}
                  onClick={() => handleRecallHistory(h)}
                >
                  Gọi lại
                </Button>
              )}
            </span>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={closeOpen}
        title="Đóng quầy"
        content="Bạn có chắc chắn muốn đóng quầy?"
        onOk={() => navigate(ROUTES.COUNTERS)}
        onCancel={() => setCloseOpen(false)}
      />
    </div>
  );
}
