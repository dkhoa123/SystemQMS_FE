import axios from "axios";
import type { Counter } from "../../types/counter";
import { countersMock } from "../../mock/counters.mock";
import { takeMockTickets } from "../../mock/counterQueue.mock";
import type {
  CounterSummary,
  CounterListParams,
  QueueTicket,
  QueueListParams,
  QueueStats,
  HandlingHistory,
} from "../../types/counter";
import type { PageResult } from "../../types/common";
import { MOCK_COUNTERS } from "../../mock/counters.mock";
import {
  MOCK_QUEUE,
  MOCK_QUEUE_STATS,
  MOCK_HISTORY,
} from "../../mock/counterQueue.mock";

const USE_MOCK = true; // Giữ nguyên mock cho các chức năng chưa nối BE
const BACKEND_URL = "https://localhost:7058";
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));


export interface AudioCallEventDto {
  counterId: number;
  counterName: string;
  ticketNumber: string;
  audioFiles: string[];
  readingSpeed: number;
  repeatCount: number;
}

// Hàm hỗ trợ phát tuần tự danh sách file .wav từ BE (nếu phát trực tiếp tại trình duyệt)
export async function playAudioSequence(
  audioFiles: string[],
  readingSpeed = 1.0,
  repeatCount = 1,
): Promise<void> {
  if (!audioFiles || audioFiles.length === 0) return;

  for (let r = 0; r < repeatCount; r++) {
    for (const path of audioFiles) {
      // Nối thêm domain BE nếu path là đường dẫn tương đối (/AudioConfigs/...)
      const fullUrl = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

      await new Promise<void>((resolve) => {
        const audio = new Audio(fullUrl);
        audio.playbackRate = readingSpeed;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    }
  }
}

export const counterService = {
  // Danh sách quầy để chọn trong form (đường dẫn API tạm, chờ backend)
  async getAll(): Promise<Counter[]> {
    if (!USE_MOCK) {
      const res = await axios.get("/api/v1/counters/options");
      return res.data.data;
    }
    return delay(300).then(() => countersMock);
  },

  // Lấy danh sách phân trang và lọc quầy
  async getList(
    params: CounterListParams,
  ): Promise<PageResult<CounterSummary>> {
    if (USE_MOCK) {
      await delay(300);
      const kw = (params.keyword ?? "").trim().toLowerCase();
      const filtered = MOCK_COUNTERS.filter(
        (c) =>
          (!kw ||
            c.name.toLowerCase().includes(kw) ||
            c.deviceCode.toLowerCase().includes(kw)) &&
          (!params.serviceName || c.services.includes(params.serviceName)) &&
          (!params.use || (params.use === "IN_USE") === c.inUse),
      );
      const start = (params.page - 1) * params.pageSize;
      return {
        items: filtered.slice(start, start + params.pageSize),
        page: params.page,
        pageSize: params.pageSize,
        total: filtered.length,
      };
    }
    const res = await axios.get("/counters", { params });
    return res.data;
  },

  // Lấy thông tin tóm tắt của một quầy
  async getSummary(counterId: string): Promise<CounterSummary | undefined> {
    if (USE_MOCK) {
      await delay();
      return MOCK_COUNTERS.find((c) => c.id === counterId);
    }
    const res = await axios.get(`/counters/${counterId}`);
    return res.data;
  },

  // Lấy thống kê hàng đợi của quầy
  async getQueueStats(counterId: string): Promise<QueueStats> {
    if (USE_MOCK) {
      await delay(200);
      return { ...MOCK_QUEUE_STATS };
    }
    const res = await axios.get(`/counters/${counterId}/stats`);
    return res.data;
  },

  // Lấy danh sách vé trong hàng đợi của quầy có phân trang và lọc
  async getQueue(
    counterId: string,
    params: QueueListParams,
  ): Promise<PageResult<QueueTicket>> {
    if (USE_MOCK) {
      await delay();
      const kw = (params.keyword ?? "").trim().toLowerCase();
      const filtered = MOCK_QUEUE.filter(
        (t) =>
          (!kw ||
            t.number.includes(kw) ||
            t.serviceName.toLowerCase().includes(kw)) &&
          (!params.status || t.status === params.status) &&
          (!params.startDate || t.issuedAt.slice(0, 10) >= params.startDate) &&
          (!params.endDate || t.issuedAt.slice(0, 10) <= params.endDate),
      );
      const start = (params.page - 1) * params.pageSize;
      return {
        items: filtered.slice(start, start + params.pageSize),
        page: params.page,
        pageSize: params.pageSize,
        total: filtered.length,
      };
    }
    const res = await axios.get(`/counters/${counterId}/queue`, { params });
    return res.data;
  },

  // Lấy lịch sử xử lý của quầy
  async getHistory(counterId: string): Promise<HandlingHistory[]> {
    if (USE_MOCK) {
      await delay(200);
      return MOCK_HISTORY.slice(0, 20);
    }
    const res = await axios.get(`/counters/${counterId}/history`);
    return res.data;
  },

  // [NỐI BE] Gọi số kế tiếp & kích hoạt phát âm thanh DSP theo cấu hình mẫu câu + tốc độ đọc
  async callBatch(counterId: string, count: number): Promise<QueueTicket[]> {
    const safeCount = Math.min(Math.max(1, count), 6); // Giới hạn tối đa 6 số/lần theo SRS (OPR-03)

    // Lấy dữ liệu số kế tiếp
    let calledTickets: QueueTicket[] = [];
    if (USE_MOCK) {
      await delay(200);
      MOCK_QUEUE_STATS.waiting = Math.max(0, MOCK_QUEUE_STATS.waiting - safeCount);
      calledTickets = takeMockTickets(safeCount);
    } else {
      const res = await axios.post(`/counters/${counterId}/call`, {
        count: safeCount,
      });
      calledTickets = res.data;
    }

    // Kích hoạt BE build chuỗi file .wav theo cấu hình Audio (CFG-04, CFG-05) và bắn SignalR OnCallNumberAudio
    for (const ticket of calledTickets) {
      const sttId = ticket.number || ticket.id;
      const audioRes = await axios.post<AudioCallEventDto>(
        `${BACKEND_URL}/api/v1/dsp/counters/${counterId}/play-audio`,
        null,
        {
          params: {
            sttId,
            repeatCount: 1,
          },
        },
      );

      // Phát trực tiếp trên client nếu máy quầy kiêm loa (hoặc màn hình sảnh sẽ tự nghe qua SignalR)
      if (audioRes.data?.audioFiles?.length) {
        await playAudioSequence(
          audioRes.data.audioFiles,
          audioRes.data.readingSpeed,
          audioRes.data.repeatCount,
        );
      }
    }

    return calledTickets;
  },

  // [NỐI BE] Gọi lại các số đang xử lý hoặc số văng (OPR-06, DSP-07)
  async recallTickets(
    counterId: string,
    tickets: QueueTicket[],
  ): Promise<void> {
    for (const ticket of tickets) {
      const sttId = ticket.number || ticket.id;
      const audioRes = await axios.post<AudioCallEventDto>(
        `${BACKEND_URL}/api/v1/dsp/counters/${counterId}/play-audio`,
        null,
        {
          params: {
            sttId,
            repeatCount: 1,
          },
        },
      );

      if (audioRes.data?.audioFiles?.length) {
        await playAudioSequence(
          audioRes.data.audioFiles,
          audioRes.data.readingSpeed,
          audioRes.data.repeatCount,
        );
      }
    }
  },

  // Hoàn thành hoặc bỏ qua (vắng) các số được chọn (giữ nguyên)
  async finishTickets(
    counterId: string,
    tickets: QueueTicket[],
    result: "DONE" | "ABSENT",
  ): Promise<void> {
    if (USE_MOCK) {
      await delay(200);
      tickets.forEach((t) =>
        MOCK_HISTORY.unshift({
          id: `h${Date.now()}-${t.id}`,
          number: t.number,
          serviceName: t.serviceName,
          staffName: "Nguyen Van A",
          result,
        }),
      );
      if (result === "DONE") MOCK_QUEUE_STATS.used += tickets.length;
      else MOCK_QUEUE_STATS.skipped += tickets.length;
      return;
    }
    await axios.post(`${BACKEND_URL}/counters/${counterId}/finish`, {
      ticketIds: tickets.map((t) => t.id),
      result,
    });
  },
};