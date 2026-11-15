import axios from 'axios';
import type { DisplaySetting, AudioSetting } from '../../types/setting';
import { displaySettingMock, MOCK_AUDIO_SETTING } from '../../mock/settings.mock';

const USE_MOCK = false; // Đã chuyển sang gọi API thật

// Khai báo đúng Route từ backend Controller
// Trong settingService.ts
const DISPLAY_API_URL = 'https://localhost:7058/alta-api/api/configs/display';
const AUDIO_API_URL = 'https://localhost:7058/api/v1/configs/audio';

export const settingService = {
    async getDisplaySetting(): Promise<DisplaySetting> {
        if (USE_MOCK) return { ...displaySettingMock };
        
        const res = await axios.get(DISPLAY_API_URL);
        const data = res.data;
        
        // Map dữ liệu từ DisplayConfigResponseDto (Backend) sang DisplaySetting (Frontend)
        return {
            unitName: data.unitName,
            logoUrl: data.logoUrl,
            backgroundUrl: data.backgroundImageUrl,
            bannerText: data.bannerText,
            themeColor: data.toneColorHex,
        } as DisplaySetting;
    },

    // Sửa lại hàm save để nhận thêm file và gửi đi dưới dạng FormData (do BE dùng [FromForm])
    async saveDisplaySetting(
        body: DisplaySetting, 
        backgroundFile?: File, 
        logoFile?: File
    ): Promise<DisplaySetting> {
        if (USE_MOCK) return { ...body };

        const formData = new FormData();
        if (body.unitName !== undefined) formData.append('UnitName', body.unitName);
        if (body.bannerText) formData.append('BannerText', body.bannerText);
        if (body.themeColor) formData.append('ToneColorHex', body.themeColor);
        if (backgroundFile) formData.append('BackgroundFile', backgroundFile);
        if (logoFile) formData.append('LogoFile', logoFile);

        const res = await axios.put(DISPLAY_API_URL, formData);
        
        return res.data.data;
    },

    async resetDisplayField(fieldName: string): Promise<void> {
        // Gọi API HttpDelete("{fieldName}") của backend
        await axios.delete(`${DISPLAY_API_URL}/${fieldName}`);
    },

    async getAudioSetting(): Promise<AudioSetting> {
        if (USE_MOCK) return { ...MOCK_AUDIO_SETTING };
        const res = await axios.get(AUDIO_API_URL);
        return res.data.data;
    },

    async saveAudioSetting(body: AudioSetting): Promise<void> {
        if (USE_MOCK) return;
        await axios.put(AUDIO_API_URL, body);
    },
    async previewAudio(templateId: number, ticketNumber: string, counterName: string): Promise<string[]> {
    if (USE_MOCK) {
        return ['/AudioConfigs/welcome.wav', '/AudioConfigs/1-default.wav']; // Mock
    }
    
    const res = await axios.post('/api/v1/configs/audio/preview', {
        sampleTicketNumber: ticketNumber,
        sampleCounterName: counterName,
        templateId: templateId
    });
    
    // Backend trả về mảng chuỗi đường dẫn (VD: ["/AudioConfigs/welcome.wav", ...])
    return res.data.playSequence;
    }
};