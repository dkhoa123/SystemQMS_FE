import { axiosClient } from "./axiosClient";

// ============================================================
//  KIỂU DỮ LIỆU
// ============================================================

export interface EvaluationListItemDto {
  id: number;
  sttId: string | null;
  counterId: number;
  counterName: string | null;
  serviceName: string | null;
  evaluationTime: string;
  content: string | null;
  opinion: string | null;
}

export interface EvaluationListResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: EvaluationListItemDto[] | null;
}

export interface EvaluationDetailDto {
  id: number;
  sttId: string | null;
  unitId: number;
  counterId: number;
  counterName: string | null;
  serviceId: number;
  serviceName: string | null;
  templateId: string | null;
  timeMark: number;
  attitudeMark: number;
  materialMark: number;
  satisfedMark: number;   
  content: string | null;
  opinion: string | null;
  guestPhone: string | null;
  guestName: string | null;
  evaluationTime: string;
}

export interface EvaluationLookupDto {
  sttId: string | null;
  found: boolean;
  counterId: number | null;
  counterName: string | null;
  serviceId: number | null;
  serviceName: string | null;
  handlerName: string | null;
  templateId: string | null;
  contentQuestion: string | null;
}

export interface RatingScreenServiceDto {
  serviceId: number;
  serviceName: string | null;
}

export interface RatingScreenDto {
  counterId: number;
  counterName: string | null;
  counterStatus: string | null;
  currentSttId: string | null;
  currentTicketStatus: string | null;
  canRate: boolean;
  handlerUserId: number | null;
  handlerName: string | null;
  handlerAvatarBase64: string | null;
  services: RatingScreenServiceDto[] | null;
  templateId: string | null;
  contentQuestion: string | null;
}

export interface EvaluationTemplateDto {
  id: number;
  unitId: number;
  templateId: string | null;
  templateName: string | null;
  contentQuestion: string | null;
  isActive: boolean;
}

export interface EvaluationTemplateUpsertDto {
  unitId: number;
  templateId?: string | null;
  templateName?: string | null;
  contentQuestion?: string | null;
}

export interface EvaluationSubmitDto {
  sttId: string | null;
  unitId: number;
  counterId?: number | null;
  serviceId?: number | null;
  templateId?: string | null;
  timeMark: number;
  attitudeMark: number;
  materialMark: number;
  satisfedMark: number;   // ⚠️ giữ đúng spelling
  guestPhone?: string | null;
  guestName?: string | null;
  opinion?: string | null;
}

// ASP.NET Core cần `counterIds=1&counterIds=2` (repeat key)
const arrayParams = { indexes: null } as const;

// ============================================================
//  RTG — ĐÁNH GIÁ
// ============================================================
export const evaluationsApi = {
  /**
   * GET /api/Evaluations?unitId=&page=&keyword=&counterIds=&from=&to=
   * Trả { page, pageSize, totalCount, items }, 10 dòng/trang.
   */
  getList: (
    params: {
      unitId?: number;
      page?: number;
      keyword?: string;
      counterIds?: number[];
      from?: string;
      to?: string;
    } = {}
  ) =>
    axiosClient.get<EvaluationListResponse>("/Evaluations", {
      params,
      paramsSerializer: arrayParams,
    }),

  /** GET /api/Evaluations/{id} */
  getDetail: (id: number) =>
    axiosClient.get<EvaluationDetailDto>(`/Evaluations/${id}`),

  /**
   * GET /api/Evaluations/export
   * Trả FILE Excel → PHẢI có responseType: "blob", không thì file hỏng.
   */
  exportExcel: (
    params: {
      unitId?: number;
      keyword?: string;
      counterIds?: number[];
      from?: string;
      to?: string;
    } = {}
  ) =>
    axiosClient.get("/Evaluations/export", {
      params,
      paramsSerializer: arrayParams,
      responseType: "blob",
    }),

    /**
   * GET /api/Evaluations/lookup/{sttId}?unitId=...
   * Dùng cho Kiosk.
   * - found: false  => KHÔNG tìm thấy phiếu (sttId không tồn tại / sai unit).
   * - found: true   => phiếu tồn tại; nếu chưa ai đánh giá thì các field
   *                    counterId/serviceId/templateId vẫn có, chỉ là chưa
   *                    có Evaluation gắn với nó — UI cần tự xử lý.
   */
  lookup: (sttId: string, unitId: number) =>
    axiosClient.get<EvaluationLookupDto>(
      `/Evaluations/lookup/${sttId}`,
      { params: { unitId } }
    ),

  /**
   * GET /api/Evaluations/device-screen?counterId=... (hoặc deviceId=...)
   * Truyền 1 trong 2, không thì BE trả 400.
   */
  getDeviceScreen: (params: { counterId?: number; deviceId?: string }) =>
    axiosClient.get<RatingScreenDto>("/Evaluations/device-screen", {
      params,
    }),

  /** POST /api/Evaluations — gửi đánh giá, trả chi tiết vừa tạo */
  submit: (body: EvaluationSubmitDto) =>
    axiosClient.post<EvaluationDetailDto>("/Evaluations", body),
};

// ============================================================
//  RTG — MẪU ĐÁNH GIÁ
// ============================================================
export const evaluationTemplatesApi = {
  /** GET /api/evaluation-templates?unitId=&keyword= */
  getList: (params: { unitId?: number; keyword?: string } = {}) =>
    axiosClient.get<EvaluationTemplateDto[]>("/evaluation-templates", {
      params,
    }),

  /** GET /api/evaluation-templates/{id} */
  getDetail: (id: number) =>
    axiosClient.get<EvaluationTemplateDto>(`/evaluation-templates/${id}`),

  /** POST /api/evaluation-templates */
  create: (body: EvaluationTemplateUpsertDto) =>
    axiosClient.post<EvaluationTemplateDto>("/evaluation-templates", body),

  /** PUT /api/evaluation-templates/{id} */
  update: (id: number, body: EvaluationTemplateUpsertDto) =>
    axiosClient.put<EvaluationTemplateDto>(
      `/evaluation-templates/${id}`,
      body
    ),

  /** DELETE /api/evaluation-templates/{id} */
  remove: (id: number) =>
    axiosClient.delete(`/evaluation-templates/${id}`),

  /** POST /api/evaluation-templates/{id}/clone */
  clone: (id: number) =>
    axiosClient.post<EvaluationTemplateDto>(
      `/evaluation-templates/${id}/clone`
    ),

  /** POST /api/evaluation-templates/{id}/activate */
  activate: (id: number) =>
    axiosClient.post(`/evaluation-templates/${id}/activate`),
};

// ============================================================
//  HRS — kiểm tra dịch vụ đang hoạt động
// ============================================================
export interface ShiftDto {
  wordShift: string | null;
  startTime: string | null;
  endTime: string | null;
}

export interface ServiceAvailabilityResponse {
  serviceId: number;
  serviceName: string | null;
  inWorkingHours: boolean;
  hasOpenCounter: boolean;
  isAvailable: boolean;
  reason: string | null;
  currentShift: string | null;
  shifts: ShiftDto[] | null;
}

export const schedulesApi = {
  /** GET /api/schedules/check-active?serviceId=... */
  checkActive: (serviceId: number) =>
    axiosClient.get<ServiceAvailabilityResponse>(
      "/schedules/check-active",
      { params: { serviceId } }
    ),
};