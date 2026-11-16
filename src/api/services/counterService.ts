// import axios from "axios";
// import type { Counter } from "../../types/counter";
// import { countersMock } from "../../mock/counters.mock";
// import { takeMockTickets } from "../../mock/counterQueue.mock";
// import type {
//   CounterSummary,
//   CounterListParams,
//   QueueTicket,
//   QueueListParams,
//   QueueStats,
//   HandlingHistory,
// } from "../../types/counter"; // Điều chỉnh lại đường dẫn type cho khớp với dự án của bạn
// import type { PageResult } from "../../types/common";
// import { MOCK_COUNTERS } from "../../mock/counters.mock"; // Điều chỉnh lại đường dẫn mock cho khớp nếu cần
// import {
//   MOCK_QUEUE,
//   MOCK_QUEUE_STATS,
//   MOCK_HISTORY,
// } from "../../mock/counterQueue.mock"; // Đường dẫn chứa các biến mock hàng đợi

// const USE_MOCK = true; // đổi false khi backend sẵn sàng
// const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// export const counterService = {
//   // Danh sách quầy để chọn trong form (đường dẫn API tạm, chờ backend)
//   async getAll(): Promise<Counter[]> {
//     if (!USE_MOCK) {
//       const res = await axios.get("/api/v1/counters/options");
//       return res.data.data;
//     }
//     return delay(300).then(() => countersMock);
//   },

//   // Lấy danh sách phân trang và lọc quầy
//   async getList(
//     params: CounterListParams,
//   ): Promise<PageResult<CounterSummary>> {
//     if (USE_MOCK) {
//       await delay(300);
//       const kw = (params.keyword ?? "").trim().toLowerCase();
//       const filtered = MOCK_COUNTERS.filter(
//         (c) =>
//           (!kw ||
//             c.name.toLowerCase().includes(kw) ||
//             c.deviceCode.toLowerCase().includes(kw)) &&
//           (!params.serviceName || c.services.includes(params.serviceName)) &&
//           (!params.use || (params.use === "IN_USE") === c.inUse),
//       );
//       const start = (params.page - 1) * params.pageSize;
//       return {
//         items: filtered.slice(start, start + params.pageSize),
//         page: params.page,
//         pageSize: params.pageSize,
//         total: filtered.length,
//       };
//     }
//     const res = await axios.get("/counters", { params }); // Hoặc axiosClient tùy theo cách cấu hình dự án của bạn
//     return res.data;
//   },

//   // Lấy thông tin tóm tắt của một quầy
//   async getSummary(counterId: string): Promise<CounterSummary | undefined> {
//     if (USE_MOCK) {
//       await delay();
//       return MOCK_COUNTERS.find((c) => c.id === counterId);
//     }
//     const res = await axios.get(`/counters/${counterId}`); // đường dẫn tạm
//     return res.data;
//   },

//   // Lấy thống kê hàng đợi của quầy
//   async getQueueStats(counterId: string): Promise<QueueStats> {
//     if (USE_MOCK) {
//       await delay(200);
//       return { ...MOCK_QUEUE_STATS };
//     }
//     const res = await axios.get(`/counters/${counterId}/stats`);
//     return res.data;
//   },

//   // Lấy danh sách vé trong hàng đợi của quầy có phân trang và lọc
//   async getQueue(
//     counterId: string,
//     params: QueueListParams,
//   ): Promise<PageResult<QueueTicket>> {
//     if (USE_MOCK) {
//       await delay();
//       const kw = (params.keyword ?? "").trim().toLowerCase();
//       const filtered = MOCK_QUEUE.filter(
//         (t) =>
//           (!kw ||
//             t.number.includes(kw) ||
//             t.serviceName.toLowerCase().includes(kw)) &&
//           (!params.status || t.status === params.status) &&
//           (!params.startDate || t.issuedAt.slice(0, 10) >= params.startDate) &&
//           (!params.endDate || t.issuedAt.slice(0, 10) <= params.endDate),
//       );
//       const start = (params.page - 1) * params.pageSize;
//       return {
//         items: filtered.slice(start, start + params.pageSize),
//         page: params.page,
//         pageSize: params.pageSize,
//         total: filtered.length,
//       };
//     }
//     const res = await axios.get(`/counters/${counterId}/queue`, { params });
//     return res.data;
//   },

//   // Lấy lịch sử xử lý của quầy
//   async getHistory(counterId: string): Promise<HandlingHistory[]> {
//     if (USE_MOCK) {
//       await delay(200);
//       return MOCK_HISTORY.slice(0, 20);
//     }
//     const res = await axios.get(`/counters/${counterId}/history`);
//     return res.data;
//   },

//   // Gọi số kế tiếp. Nếu đang có số hiện tại thì số đó được ghi là "Hoàn thành"
//   // Gọi tối đa `count` số kế tiếp
//   async callBatch(counterId: string, count: number): Promise<QueueTicket[]> {
//     if (USE_MOCK) {
//       await delay(200);
//       MOCK_QUEUE_STATS.waiting = Math.max(0, MOCK_QUEUE_STATS.waiting - count);
//       return takeMockTickets(count);
//     }
//     const res = await axios.post(`/counters/${counterId}/call`, { count });
//     return res.data;
//   },

//   // Hoàn thành hoặc bỏ qua (vắng) các số được chọn
//   async finishTickets(
//     counterId: string,
//     tickets: QueueTicket[],
//     result: "DONE" | "ABSENT",
//   ): Promise<void> {
//     if (USE_MOCK) {
//       await delay(200);
//       tickets.forEach((t) =>
//         MOCK_HISTORY.unshift({
//           id: `h${Date.now()}-${t.id}`,
//           number: t.number,
//           serviceName: t.serviceName,
//           staffName: "Nguyen Van A",
//           result,
//         }),
//       );
//       if (result === "DONE") MOCK_QUEUE_STATS.used += tickets.length;
//       else MOCK_QUEUE_STATS.skipped += tickets.length;
//       return;
//     }
//     await axios.post(`/counters/${counterId}/finish`, {
//       ticketIds: tickets.map((t) => t.id),
//       result,
//     });
//   },
// };
import { axiosClient } from "../apiBE/axiosClient";
import { countersApi, queueApi, ticketsApi } from "../apiBE/counters";
import type {
  Counter,
  CounterSummary,
  CounterListParams,
  QueueTicket,
  QueueListParams,
  QueueStats,
  HandlingHistory,
} from "../../types/counter";
import type { PageResult } from "../../types/common";

// ⚠️ TODO: lấy từ auth context / localStorage khi có đăng nhập
const USER_ID = 1;
// ⚠️ TODO: lấy từ auth context
const UNIT_ID = 1;

// ============================================================
//  MAPPER: BE response → shape cũ (để 5 file kia không phải sửa)
// ============================================================

type BeCounter = Awaited<ReturnType<typeof countersApi.getList>>["data"][0];

const toInUse = (status: string | null): boolean =>
  status === "Idle" || status === "Serving" || status === "PausedAccepting";

function mapCounter(c: BeCounter): CounterSummary & Counter {
  return {
    id: String(c.id),
    name: c.counterName ?? "",
    deviceCode: c.counterId ?? "",
    inUse: toInUse(c.status),
    services: (c.services ?? []).map((s) => s.serviceName ?? ""),
    // Bổ sung field còn thiếu của type Counter — điền theo type thật
    counterId: c.counterId ?? "",
    counterCode: c.counterId ?? "",
    counterName: c.counterName ?? "",
  } as unknown as CounterSummary & Counter;
}

type BeQueueTicket = NonNullable<
  Awaited<ReturnType<typeof queueApi.getTickets>>["data"]["waiting"]
>[0];

function mapTicket(t: BeQueueTicket): QueueTicket {
  return {
    id: t.sttId ?? "",
    number: t.sttId ?? "",
    serviceName: t.serviceName ?? "",
    status: (t.status ?? "") as QueueTicket["status"],
    issuedAt: t.issuanceTime ?? "",
  };
}

type BeHistoryItem = NonNullable<
  Awaited<ReturnType<typeof queueApi.getHistory>>["data"]["items"]
>[0];

function mapHistory(h: BeHistoryItem): HandlingHistory {
  return {
    id: h.sttId ?? "",
    number: h.sttId ?? "",
    serviceName: h.serviceName ?? "",
    staffName: h.handlerName ?? "",
    result: (h.result ?? "") as HandlingHistory["result"],
  };
}

// ============================================================
//  counterService — giữ nguyên interface cũ
// ============================================================

const delay = (ms = 0) => new Promise((r) => setTimeout(r, ms));

export const counterService = {
  async getAll(): Promise<Counter[]> {
    const res = await countersApi.getList({ unitId: UNIT_ID });
    return res.data.map(mapCounter);
  },

  async getList(
    params: CounterListParams
  ): Promise<PageResult<CounterSummary>> {
    // BE trả hết 1 lần → filter + phân trang ở FE (data nhỏ, OK)
    const res = await countersApi.getList({
      unitId: UNIT_ID,
      search: params.keyword || undefined,
    });
    const all = res.data.map(mapCounter);

    const filtered = all.filter((c) => {
      if (params.serviceName && !c.services.includes(params.serviceName))
        return false;
      if (params.use === "IN_USE" && !c.inUse) return false;
      if (params.use && params.use !== "IN_USE" && c.inUse) return false;
      return true;
    });

    const start = (params.page - 1) * params.pageSize;
    return {
      items: filtered.slice(start, start + params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
      total: filtered.length,
    };
  },

  async getSummary(counterId: string): Promise<CounterSummary | undefined> {
    try {
      const res = await countersApi.getDetail(Number(counterId));
      return mapCounter(res.data as BeCounter);
    } catch {
      return undefined;
    }
  },

  async getQueueStats(counterId: string): Promise<QueueStats> {
  const [tickets, history] = await Promise.all([
    queueApi.getTickets(Number(counterId)),
    queueApi.getHistory(Number(counterId), { page: 1, pageSize: 500 }),
  ]);
  const items = history.data.items ?? [];
  return {
    waiting: tickets.data.waiting?.length ?? 0,
    processing: tickets.data.processing?.length ?? 0,
    used: items.filter((h) => h.result === "DONE").length,
    skipped: items.filter((h) => h.result === "ABSENT").length,
    issued: items.length,
    cancelled: 0,
  } as QueueStats;
  },

  async getQueue(
    counterId: string,
    params: QueueListParams
  ): Promise<PageResult<QueueTicket>> {
    const res = await queueApi.getTickets(Number(counterId));
    const all = [
      ...(res.data.waiting ?? []),
      ...(res.data.processing ?? []),
      ...(res.data.absent ?? []),
    ].map(mapTicket);

    const kw = (params.keyword ?? "").trim().toLowerCase();
    const filtered = all.filter(
      (t) =>
        (!kw ||
          t.number.toLowerCase().includes(kw) ||
          t.serviceName.toLowerCase().includes(kw)) &&
        (!params.status || t.status === params.status) &&
        (!params.startDate || t.issuedAt.slice(0, 10) >= params.startDate) &&
        (!params.endDate || t.issuedAt.slice(0, 10) <= params.endDate)
    );

    const start = (params.page - 1) * params.pageSize;
    return {
      items: filtered.slice(start, start + params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
      total: filtered.length,
    };
  },

  async getHistory(counterId: string): Promise<HandlingHistory[]> {
    const res = await queueApi.getHistory(Number(counterId), {
      page: 1,
      pageSize: 20,
    });
    return (res.data.items ?? []).map(mapHistory);
  },

  async callBatch(counterId: string, count: number): Promise<QueueTicket[]> {
    // BE tự quyết gọi bao nhiêu, không nhận `count`
    await ticketsApi.callMultiple(Number(counterId), USER_ID);
    await delay(200); // chờ BE cập nhật DB (tuỳ chọn)

    // Fetch lại để lấy vé đang processing
    const res = await queueApi.getTickets(Number(counterId));
    const called = (res.data.processing ?? []).map(mapTicket);
    return called.slice(0, count);
  },

  async finishTickets(
    counterId: string,
    tickets: QueueTicket[],
    result: "DONE" | "ABSENT"
  ): Promise<void> {
    // BE không có bulk → loop từng vé
    for (const t of tickets) {
      if (!t.id) continue;
      if (result === "DONE") {
        await ticketsApi.complete(Number(counterId), t.id, USER_ID);
      } else {
        await ticketsApi.skip(Number(counterId), t.id, USER_ID, {});
      }
    }
  },
};