import React, { useEffect, useState } from 'react';
import { settingService } from '../../api/services/settingService';
import DisplayPreview from './DisplayPreview';
import type { DisplaySetting } from '../../types/setting';

export default function DisplaySettingsPage() {
    const [settings, setSettings] = useState<DisplaySetting | null>(null);
    const [loading, setLoading] = useState(true);

    // Lấy dữ liệu thật từ Backend khi load trang
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingService.getDisplaySetting();
                setSettings(data);
            } catch (error) {
                console.error("Lỗi khi lấy cấu hình:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) return <div>Đang tải dữ liệu...</div>;
    if (!settings) return <div>Không có dữ liệu cấu hình.</div>;

    return (
        <div>
            {/* Truyền dữ liệu thật vào DisplayPreview */}
            <DisplayPreview 
                backgroundUrl={settings.backgroundUrl}
                logoUrl={settings.logoUrl}
                unitName={settings.unitName}
                bannerText={settings.bannerText}
                themeColor={settings.themeColor}
            />
            
            {/* Ví dụ nút lưu cấu hình kèm file */}
            <button onClick={() => {
                // Gọi settingService.saveDisplaySetting(settings, bgFile, logoFile)
            }}>
                Lưu cấu hình
            </button>
        </div>
    );
}