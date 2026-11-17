import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Button, message } from "antd";
import { issueTicket, getRules, TicketRule } from "../../api/apiBE/tickets";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const IssueTicketModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<TicketRule[]>([]);
  const [fetching, setFetching] = useState(false);

  // Gọi API lấy danh sách dịch vụ mỗi khi mở Modal
  useEffect(() => {
    if (open) {
      const fetchServices = async () => {
        try {
          setFetching(true);
          const data = await getRules();
          setServices(data);
        } catch (error) {
          message.error("Không thể tải danh sách dịch vụ.");
        } finally {
          setFetching(false);
        }
      };

      fetchServices();
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      // values.serviceId bây giờ sẽ khớp với name="serviceId" ở Form.Item
      const ticket = await issueTicket(values.serviceId);

      message.success(`Cấp số thành công: ${ticket.ticketNumber}`);

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Không thể cấp số.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Cấp số mới"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Sửa name thành "serviceId" để khớp với values.serviceId */}
        <Form.Item
          name="serviceId"
          label="Tên dịch vụ"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn dịch vụ",
            },
          ]}
        >
          <Select
            placeholder="Chọn dịch vụ"
            loading={fetching}
            options={services.map((service) => ({
              label: service.serviceName,
              value: service.serviceId, // Dùng serviceId theo interface TicketRule
            }))}
          />
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <Button onClick={onClose}>Hủy</Button>

          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{
              background: "#ff7900",
              borderColor: "#ff7900",
            }}
          >
            Cấp số
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default IssueTicketModal;
