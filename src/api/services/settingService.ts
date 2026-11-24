import axios from 'axios';
import type { DisplaySetting, AudioSetting, SpeechSpeed } from '../../types/setting';
import { displaySettingMock, MOCK_AUDIO_SETTING } from '../../mock/settings.mock';

const USE_MOCK = false;

export const BACKEND_ORIGIN = 'https://localhost:7058';
const DISPLAY_API_URL = `${BACKEND_ORIGIN}/alta-api/api/configs/display`;
const AUDIO_API_URL = `${BACKEND_ORIGIN}/api/v1/configs/audio`;

export interface AudioTemplateItem {
    id: number;
    name: string;
    description: string;
    templateText: string;
}

export interface AudioConfigResponse {
    templateId: number;
    readingSpeed: SpeechSpeed;
}

export interface AudioConfigUpdatePayload {
    templateId: number;
    readingSpeed: SpeechSpeed;
}

export interface AudioPreviewPayload {
    sampleTicketNumber: string;
    sampleCounterName: string;
    templateId: number;
    readingSpeed: SpeechSpeed;
}

export interface AudioPreviewResponse {
    playSequence: string[];
    readingSpeed: number;
}

const TEMPLATE_TOKEN_MAP: Record<number, string> = {
    1: 'Xin mời số thứ tự {soThuTu} đến quầy {quayTen}',
    2: '{soThuTu} đến quầy {quayTen}',
    3: 'Xin mời số thứ tự {soThuTu}',
};

const resolveImageUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${BACKEND_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const settingService = {
    // ================= DISPLAY CONFIG =================
    async getDisplaySetting(): Promise<DisplaySetting> {
        if (USE_MOCK) return { ...displaySettingMock };

        const res = await axios.get(DISPLAY_API_URL);
        const data = res.data;

        return {
            unitName: data.unitName,
            logoUrl: data.logoUrl,
            backgroundUrl: resolveImageUrl(data.backgroundImageUrl),
            bannerText: data.bannerText,
            themeColor: data.toneColorHex,
        } as DisplaySetting;
    },

    async saveDisplaySetting(
        body: DisplaySetting,
        backgroundFile?: File,
        logoFile?: File
    ): Promise<DisplaySetting> {
        if (USE_MOCK) return { ...body };

        const formData = new FormData();
        if (body.unitName !== undefined) formData.append('UnitName', body.unitName);
        if (body.bannerText !== undefined) formData.append('BannerText', body.bannerText);
        if (body.themeColor !== undefined) formData.append('ToneColorHex', body.themeColor);
        if (backgroundFile) formData.append('BackgroundFile', backgroundFile);
        if (logoFile) formData.append('LogoFile', logoFile);

        const res = await axios.put(DISPLAY_API_URL, formData);
        const data = res.data.data;

        return {
            unitName: data.unitName,
            logoUrl: data.logoUrl,
            backgroundUrl: resolveImageUrl(data.backgroundImageUrl),
            bannerText: data.bannerText,
            themeColor: data.toneColorHex,
        } as DisplaySetting;
    },

    async resetDisplayField(fieldName: string): Promise<void> {
        await axios.delete(`${DISPLAY_API_URL}/${fieldName}`);
    },

    // ================= AUDIO CONFIG =================
    async getAudioSetting(): Promise<AudioSetting> {
        if (USE_MOCK) return { ...MOCK_AUDIO_SETTING };
        const res = await axios.get(AUDIO_API_URL);
        return res.data;
    },

    async getAudioConfig(): Promise<AudioConfigResponse> {
        const res = await axios.get<AudioConfigResponse>(AUDIO_API_URL);
        return res.data;
    },

    async getAudioTemplates(): Promise<AudioTemplateItem[]> {
        const res = await axios.get<{ id: number; name: string; description: string }[]>(
            `${AUDIO_API_URL}/AudioTemplates`
        );
        return res.data.map((item) => ({
            ...item,
            templateText: TEMPLATE_TOKEN_MAP[item.id] ?? TEMPLATE_TOKEN_MAP[1],
        }));
    },

    async saveAudioSetting(body: AudioConfigUpdatePayload): Promise<void> {
        if (USE_MOCK) return;
        await axios.put(AUDIO_API_URL, body);
    },

    async previewAudio(payload: AudioPreviewPayload): Promise<AudioPreviewResponse> {
        if (USE_MOCK) {
            return {
                playSequence: ['/AudioConfigs/welcome.wav', '/AudioConfigs/1-default.wav'],
                readingSpeed: payload.readingSpeed,
            };
        }

        const res = await axios.post<AudioPreviewResponse>(`${AUDIO_API_URL}/preview`, payload);
        return res.data;
    },

    async updateAudioConfig(body: AudioConfigUpdatePayload): Promise<void> {
        return this.saveAudioSetting(body);
    },
};

export const audioApiService = settingService;