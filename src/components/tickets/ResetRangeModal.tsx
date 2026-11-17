import React, { useState } from "react";
import { Modal, Form, InputNumber, Button, message } from "antd";
import { updateRange } from "../../api/apiBE/tickets";
// Xóa dòng import ticketService nếu không còn dùng tới

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ResetRangeModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.startNumber > values.endNumber) {
        message.error("Số bắt đầu phải nhỏ hơn số kết thúc.");
        return;
      }

      setLoading(true);

      await updateRange(values.startNumber, values.endNumber);

      message.success("Thiết lập dải số thành công.");

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      // Nếu lỗi từ API thì có thể thông báo thêm ở đây
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thiết lập dải số"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startNumber: 1,
          endNumber: 9999,
        }}
      >
        <Form.Item
          name="startNumber"
          label="Số bắt đầu"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập số bắt đầu",
            },
          ]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="endNumber"
          label="Số kết thúc"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập số kết thúc",
            },
          ]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
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
            Lưu thiết lập
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ResetRangeModal;
