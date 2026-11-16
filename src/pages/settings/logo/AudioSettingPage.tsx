import { useEffect, useRef, useState } from 'react';
import { Button, Input, message } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import styles from './AudioSettingPage.module.css';
import {
    audioApiService,
    AudioConfigResponse,
    AudioTemplateItem,
    BACKEND_ORIGIN,
} from '../../../api/services/settingService';
import { SPEED_OPTIONS, TEMPLATE_TOKENS } from '../../../constants/enums';
import { SpeechSpeed } from '../../../types/setting';

const WAVE = [8, 14, 22, 12, 28, 18, 10, 26, 16, 30, 12, 20, 8, 24, 14, 28, 10, 18, 26, 12, 22, 16, 30, 10, 20];

const API_BASE_URL = BACKEND_ORIGIN;

function renderTemplate(text: string) {
    const parts = text.split(/(\{soThuTu\}|\{quayTen\})/g);
    return parts.map((part, i) => {
        const token = TEMPLATE_TOKENS.find((t) => t.key === part);
        if (token) {
            return (
                <span key={i} className={styles.chipInline}>
                    {token.label}
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

export default function AudioSettingPage() {
    const [saved, setSaved] = useState<AudioConfigResponse | null>(null);
    const [templates, setTemplates] = useState<AudioTemplateItem[]>([]);
    const [templateId, setTemplateId] = useState<number>(1);
    const [speed, setSpeed] = useState<SpeechSpeed>(1);
    const [template, setTemplate] = useState('');
    const [saving, setSaving] = useState(false);
    const [playing, setPlaying] = useState(false);

    const textRef = useRef<TextAreaRef>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isPlayingRef = useRef(false);

    const stopAudio = () => {
        isPlayingRef.current = false;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setPlaying(false);
    };

    const applyConfig = (cfg: AudioConfigResponse, tplList: AudioTemplateItem[]) => {
        setTemplateId(cfg.templateId);
        setSpeed(cfg.readingSpeed);
        const matched = tplList.find((t) => t.id === cfg.templateId) ?? tplList[0];
        if (matched) {
            setTemplate(matched.templateText);
        }
    };

    useEffect(() => {
        let mounted = true;

        Promise.all([
            audioApiService.getAudioTemplates(),
            audioApiService.getAudioConfig(),
        ])
            .then(([tplList, cfg]) => {
                if (!mounted) return;
                setTemplates(tplList);
                setSaved(cfg);
                applyConfig(cfg, tplList);
            })
            .catch(() => {
                if (mounted) message.error('Không tải được cấu hình audio từ hệ thống');
            });

        return () => {
            mounted = false;
            stopAudio();
        };
    }, []);

    // Chèn cụm thông tin tại vị trí con trỏ
    const insertToken = (token: string) => {
        const el = textRef.current?.resizableTextArea?.textArea;
        if (!el) {
            setTemplate((t) => t + token);
            return;
        }
        const start = el.selectionStart;
        const end = el.selectionEnd;
        setTemplate(template.slice(0, start) + token + template.slice(end));
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(start + token.length, start + token.length);
        }, 0);
    };

    // Phát tuần tự danh sách file .wav trả về từ BE
    const playAudioSequence = async (urls: string[], playbackRate: number) => {
        isPlayingRef.current = true;
        setPlaying(true);

        try {
            for (const relativeUrl of urls) {
                if (!isPlayingRef.current) break;

                const fullUrl = relativeUrl.startsWith('http')
                    ? relativeUrl
                    : `${API_BASE_URL}${relativeUrl}`;

                await new Promise<void>((resolve, reject) => {
                    const audio = new Audio(fullUrl);
                    audio.playbackRate = playbackRate;
                    audioRef.current = audio;

                    audio.onended = () => resolve();
                    audio.onerror = () => reject(new Error(`Không phát được file: ${fullUrl}`));
                    audio.play().catch(reject);
                });
            }
        } catch {
            if (isPlayingRef.current) {
                message.error('Lỗi khi phát file âm thanh từ máy chủ');
            }
        } finally {
            stopAudio();
        }
    };

    // Nghe thử từ API POST /api/v1/configs/audio/preview
    const handleListen = async () => {
        if (playing) {
            stopAudio();
            return;
        }

        const matchedTpl = templates.find((t) => t.templateText.trim() === template.trim());
        const targetTemplateId = matchedTpl ? matchedTpl.id : templateId;

        try {
            const res = await audioApiService.previewAudio({
                sampleTicketNumber: 'A001',
                sampleCounterName: '1',
                templateId: targetTemplateId,
                readingSpeed: speed,
            });

            if (!res.playSequence || res.playSequence.length === 0) {
                message.warning('Không có dữ liệu âm thanh để phát');
                return;
            }

            await playAudioSequence(res.playSequence, speed);
        } catch {
            message.error('Không thể tạo bản nghe thử từ máy chủ');
            stopAudio();
        }
    };

    const handleSelectSample = (sample: AudioTemplateItem) => {
        stopAudio();
        setTemplateId(sample.id);
        setTemplate(sample.templateText);
    };

    const handleSubmit = async () => {
        if (!template.trim()) {
            message.error('Vui lòng chọn câu đọc');
            return;
        }

        const matchedTpl = templates.find((t) => t.templateText.trim() === template.trim());
        if (!matchedTpl) {
            message.warning('Vui lòng chọn một trong 3 mẫu câu có sẵn bên dưới');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                templateId: matchedTpl.id,
                readingSpeed: speed,
            };
            await audioApiService.updateAudioConfig(payload);
            setTemplateId(matchedTpl.id);
            setSaved(payload);
            message.success('Lưu thiết lập audio thành công');
        } catch {
            message.error('Lưu thất bại, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.body}>
                {/* Cột trái */}
                <div className={styles.left}>
                    <div className={styles.label}>Tốc độ đọc</div>
                    <div className={styles.chipRow}>
                        {SPEED_OPTIONS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`${styles.pill} ${styles.pillRound} ${speed === s ? styles.pillActive : ''}`}
                                onClick={() => setSpeed(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className={styles.label}>Nghe thử</div>
                    <div className={styles.player}>
                        <button type="button" className={styles.playBtn} onClick={handleListen}>
                            {playing ? <PauseOutlined /> : <CaretRightOutlined />}
                        </button>
                        <div className={styles.wave}>
                            {WAVE.map((h, i) => (
                                <span
                                    key={i}
                                    className={`${styles.bar} ${playing ? styles.barPlaying : ''}`}
                                    style={{ height: h, animationDelay: `${i * 40}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cột phải */}
                <div className={styles.right}>
                    <div className={styles.label}>Thiết lập câu đọc</div>
                    <div className={styles.hint}>Chọn cụm thông tin hoặc chọn mẫu câu bên dưới</div>

                    <div className={styles.editor}>
                        <div className={styles.tokenBar}>
                            <span className={styles.tokenTitle}>Cụm thông tin</span>
                            {TEMPLATE_TOKENS.map((t) => {
                                const used = template.includes(t.key);
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        disabled={used}
                                        className={`${styles.chip} ${used ? styles.chipUsed : ''}`}
                                        onClick={() => insertToken(t.key)}
                                    >
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                        <Input.TextArea
                            ref={textRef}
                            className={styles.textarea}
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            placeholder="Nhập hoặc chọn câu đọc..."
                            variant="borderless"
                            rows={4}
                        />
                        <div className={styles.preview}>{renderTemplate(template)}</div>
                    </div>

                    <div className={`${styles.label} ${styles.sampleTitle}`}>Một số câu mẫu</div>
                    <div className={styles.samples}>
                        {templates.map((s) => (
                            <div
                                key={s.id}
                                className={styles.sample}
                                onClick={() => handleSelectSample(s)}
                            >
                                {renderTemplate(s.templateText)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <Button
                    className={styles.cancelButton}
                    onClick={() => {
                        stopAudio();
                        if (saved) applyConfig(saved, templates);
                    }}
                >
                    Hủy bỏ
                </Button>
                <Button type="primary" className={styles.okButton} loading={saving} onClick={handleSubmit}>
                    Xác nhận
                </Button>
            </div>
        </div>
    );
}