# 🏛️ Enterprise Agentic SDLC - Task & Sprint Management System

Hệ thống quản lý Task và Sprint chuẩn hóa theo phương pháp luận **BMad Method 6.12.0** và **Test Architecture Enterprise (TEA 1.27.2)** [ID:450]. Hệ thống tích hợp đầy đủ quy trình kiểm soát chất lượng nghiêm ngặt qua các cổng phê duyệt (Quality Gates G1-G5) [ID:475], tự động hóa đánh giá mã nguồn và lập kế hoạch Sprint thông minh [ID:132][ID:102].

## 📖 Kịch bản nghiệp vụ [SC-01]
1. **Khởi tạo dự án & Yêu cầu (Gate G1):** Người dùng nhập thông tin dự án, hệ thống tạo PRD và User Stories tương ứng [ID:475].
2. **Thiết kế & Lập kế hoạch (Gate G2 & G3):** Hệ thống tự động phân bổ User Stories vào các Sprint dựa trên độ phức tạp (Story Points) và độ ưu tiên sử dụng thuật toán tối ưu hóa năng lực (Velocity) [ID:132].
3. **Phát triển & Kiểm chứng (Gate G4):** Developer thực hiện viết mã nguồn, hệ thống kích hoạt bộ rà soát tự động phát hiện lỗi bảo mật, logic và code smell [ID:102].
4. **Nghiệm thu & Phát hành (Gate G5):** Xuất báo cáo Traceability Matrix từ Yêu cầu -> Thiết kế -> Kiểm thử -> Bằng chứng thực thi [ID:475].

## 🛠️ Hướng dẫn cài đặt
Yêu cầu hệ thống đã cài đặt **Node.js (v16+)** và **npm**.

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install
```

## 🚀 Hướng dẫn khởi chạy
```bash
# Khởi chạy server ở chế độ Production
npm start
```
Sau khi khởi chạy thành công, truy cập ứng dụng tại địa chỉ: `http://localhost:3000`

## 🧪 Hướng dẫn chạy Test
Hệ thống tích hợp sẵn bộ kiểm thử tự động (Unit Test & Integration Test) đảm bảo tính toàn vẹn của luồng nghiệp vụ:
```bash
# Chạy toàn bộ test suite
npm test
```

## 🗂️ Cấu trúc thư mục dự án [ID:450][ID:475]
```text
├── README.md                  # Tài liệu hướng dẫn và kịch bản hệ thống
├── package.json               # Cấu hình dự án và các dependencies
├── server.js                  # Backend API Server (Express)
├── tests/                     # Thư mục chứa các kịch bản kiểm thử tự động
│   └── app.test.js
└── public/                    # Giao diện người dùng (Frontend)
    ├── index.html             # Giao diện chính điều phối SDLC
    ├── style.css              # Giao diện trực quan hóa hiện đại
    └── app.js                 # Logic xử lý Client-side & API Integration
```
```

---