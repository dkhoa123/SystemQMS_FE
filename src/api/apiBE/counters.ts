import { axiosClient } from "./axiosClient";
export interface ServiceInCounterDto {
  id: number;
  serviceId: string | null;
  serviceName: string | null;
}

/** GET /api/Counters trả về */
export interface CounterResponse {
  id: number;
  counterId: string | null;
  unitId: number;
  counterName: string | null;
  description: string | null;
  isActive: boolean;
  status: string | null;
  services: ServiceInCounterDto[] | null;
}

/** GET /api/Counters/{id} trả về (thêm handlerNames) */
export interface CounterDetailResponse extends CounterResponse {
  handlerNames: string[] | null;
}

export interface CreateCounterRequest {
  counterId?: string;
  unitId: number;
  counterName?: string | null;
  description?: string | null;
  isActive: boolean;
  serviceIds?: number[] | null;
}

export interface UpdateCounterRequest {
  counterName?: string | null;
  description?: string | null;
  isActive?: boolean;
  serviceIds?: number[] | null;
}

// --- Hàng đợi ---
export interface QueueTicketDto {
  sttId: string | null;
  status: string | null;
  stage: string | null;
  isPriority: boolean;
  issuanceTime: string;
  useTime: string;
  serviceName: string | null;
  handlerName: string | null;
}

export interface CounterTicketsResponse {
  counterId: number;
  counterStatus: string | null;
  waiting: QueueTicketDto[] | null;
  processing: QueueTicketDto[] | null;
  absent: QueueTicketDto[] | null;
}

export interface HistoryItemResponse {
  sttId: string | null;
  result: string | null;
  time: string;
  serviceName: string | null;
  handlerName: string | null;
  counterName: string | null;
  isPriority: boolean;
}

export interface CounterHistoryResponse {
  page: number;
  pageSize: number;
  total: number;
  items: HistoryItemResponse[] | null;
}

export interface CounterStateResponse {
  counterId: number;
  status: string | null;
  isAccepting: boolean;
  waitingCount: number;
  processingCount: number;
}

export interface SkipTicketRequestDto {
  note?: string | null;
}

// --- Chuyển quầy ---
export interface TransferRequest {
  sttIds?: string[] | null;
  toCounterId: number; //theo required của be
  isPriority?: boolean | null;
}

export interface TransferResponse {
  id: number;
  sttId: string | null;
  counterIdSender: number;
  counterIdReceive: number;
  status: string | null;
  createTime: string;  
   // Nếu BE còn trả isPriority / sttIdInfo / ... mở tab Response
  // ở Swagger gọi thử để chắc — đừng đoán thêm.
}

export interface TransferActionRequest {
  action: string | null;
}

// --- Session ---
export interface OpenSessionRequestDto {
  userId: number;
}

// --- Lịch sử phiếu ở quầy (CNT) ---
export interface CounterStickerResponse {
  sttId: string | null;
  status: string | null;
  stage: string | null;
  issuanceTime: string;
  useTime: string;
  serviceName: string | null;
  handlerName: string | null;
}
// ============================================================
//  HELPER — serialize mảng query cho ASP.NET Core
// ============================================================
// ASP.NET Core bind `counterIds=1&counterIds=2` -> List<int>
// Axios mặc định gửi `counterIds[]=1&counterIds[]=2` -> BE KHÔNG bind.
// indexes: null => axios gửi dạng "repeat key" (đúng ý ASP.NET Core).
const arrayParams = { indexes: null } as const;

// ============================================================
//  CNT — QUẦY
// ============================================================
export const countersApi = {
  /** GET /api/Counters?unitId=&status=&isActive=&search= */
  getList: (
    params: {
      unitId?: number;
      status?: string;
      isActive?: boolean;
      search?: string;
    } = {}
  ) => axiosClient.get<CounterResponse[]>("/Counters", { params }),

  /** GET /api/Counters/{id} — chi tiết, có thêm handlerNames */
  getDetail: (id: number) =>
    axiosClient.get<CounterDetailResponse>(`/Counters/${id}`),

  /** GET /api/Counters/{id}/stickers?status=&from=&to= */
  getStickers: (
    id: number,
    params: { status?: string; from?: string; to?: string } = {}
  ) =>
    axiosClient.get<CounterStickerResponse[]>(`/Counters/${id}/stickers`, {
      params,
    }),

  /** POST /api/Counters */
  create: (body: CreateCounterRequest) =>
    axiosClient.post<CounterResponse>("/Counters", body),

  /** PUT /api/Counters/{id} */
  update: (id: number, body: UpdateCounterRequest) =>
    axiosClient.put<CounterResponse>(`/Counters/${id}`, body),

  /** DELETE /api/Counters/{id} */
  remove: (id: number) => axiosClient.delete(`/Counters/${id}`),
};

// ============================================================
//  OPR — HÀNG ĐỢI TẠI QUẦY
// ============================================================
export const queueApi = {
  /** GET /api/counters/{counterId}/queue/tickets — 3 nhóm waiting/processing/absent */
  getTickets: (counterId: number) =>
    axiosClient.get<CounterTicketsResponse>(
      `/counters/${counterId}/queue/tickets`
    ),

  /** GET /api/counters/{counterId}/queue/history?page=&pageSize=&from=&to= */
  getHistory: (
    counterId: number,
    params: {
      page?: number;
      pageSize?: number;
      from?: string;
      to?: string;
    } = {}
  ) =>
    axiosClient.get<CounterHistoryResponse>(
      `/counters/${counterId}/queue/history`,
      { params }
    ),

  /** POST /api/counters/{counterId}/queue/pause — tạm ngưng nhận phiếu */
  pause: (counterId: number) =>
    axiosClient.post<CounterStateResponse>(
      `/counters/${counterId}/queue/pause`
    ),

  /** POST /api/counters/{counterId}/queue/resume — nhận lại */
  resume: (counterId: number) =>
    axiosClient.post<CounterStateResponse>(
      `/counters/${counterId}/queue/resume`
    ),

  /** POST /api/counters/{counterId}/toggle-receiving — bật/tắt nhận phiếu */
  toggleReceiving: (counterId: number) =>
    axiosClient.post<CounterStateResponse>(
      `/counters/${counterId}/toggle-receiving`
    ),

  /** POST /api/stickers/{sttId}/priority — đặt ưu tiên cho 1 phiếu */
  setPriority: (sttId: string) =>
    axiosClient.post<QueueTicketDto>(`/stickers/${sttId}/priority`),
};

// ============================================================
//  OPR — GỌI SỐ / HOÀN THÀNH / VẮNG / GỌI LẠI
//  userId BẮT BUỘC (id cán bộ đang ngồi quầy) — thiếu => 400
// ============================================================
export const ticketsApi = {
  /** POST /api/counters/{id}/tickets/call?userId=... */
  call: (counterId: number, userId: number) =>
    axiosClient.post(`/counters/${counterId}/tickets/call`, null, {
      params: { userId },
    }),

  /** POST /api/counters/{id}/tickets/call-multiple?userId=... */
  callMultiple: (counterId: number, userId: number) =>
    axiosClient.post(
      `/counters/${counterId}/tickets/call-multiple`,
      null,
      { params: { userId } }
    ),

  /** POST /api/counters/{id}/tickets/{sttId}/complete?userId=... */
  complete: (counterId: number, sttId: string, userId: number) =>
    axiosClient.post(
      `/counters/${counterId}/tickets/${sttId}/complete`,
      null,
      { params: { userId } }
    ),

  /**
   * POST /api/counters/{id}/tickets/{sttId}/skip?userId=...
   * Body: SkipTicketRequestDto ({ note? }) — để {} nếu không có ghi chú.
   */
  skip: (
    counterId: number,
    sttId: string,
    userId: number,
    body: SkipTicketRequestDto = {}
  ) =>
    axiosClient.post(
      `/counters/${counterId}/tickets/${sttId}/skip`,
      body,
      { params: { userId } }
    ),

  /** POST /api/counters/{id}/tickets/{sttId}/recall?userId=... */
  recall: (counterId: number, sttId: string, userId: number) =>
    axiosClient.post(
      `/counters/${counterId}/tickets/${sttId}/recall`,
      null,
      { params: { userId } }
    ),
};

// ============================================================
//  OPR — CHUYỂN QUẦY
// ============================================================
export const transfersApi = {
  /** POST /api/counters/{counterId}/transfer — trả mảng TransferResponse */
  create: (counterId: number, body: TransferRequest) =>
    axiosClient.post<TransferResponse[]>(
      `/counters/${counterId}/transfer`,
      body
    ),

  /** GET /api/counters/{counterId}/transfers/pending */
  getPending: (counterId: number) =>
    axiosClient.get<TransferResponse[]>(
      `/counters/${counterId}/transfers/pending`
    ),

  /** POST /api/transfers/{id}/action — duyệt/từ chối */
  action: (id: number, body: TransferActionRequest) =>
    axiosClient.post<TransferResponse>(`/transfers/${id}/action`, body),
};

// ============================================================
//  OPR — PHIÊN LÀM VIỆC (mở/đóng ca tại quầy)
// ============================================================
export const sessionApi = {
  /** POST /api/counters/{id}/session — mở phiên, body: { userId } */
  open: (counterId: number, body: OpenSessionRequestDto) =>
    axiosClient.post(`/counters/${counterId}/session`, body),

  /** GET /api/counters/{id}/session */
  get: (counterId: number) =>
    axiosClient.get(`/counters/${counterId}/session`),

  /** POST /api/counters/{id}/session/close?userId=... */
  closeSession: (counterId: number, userId: number) =>
    axiosClient.post(
      `/counters/${counterId}/session/close`,
      null,
      { params: { userId } }
    ),

  /** POST /api/counters/{id}/close — đóng quầy */
  close: (counterId: number) =>
    axiosClient.post(`/counters/${counterId}/close`),

  /** POST /api/counters/{id}/open — mở quầy */
  openCounter: (counterId: number) =>
    axiosClient.post(`/counters/${counterId}/open`),
};