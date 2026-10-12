const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database lưu trữ trạng thái SDLC [ID:475]
const DB_FILE = path.join(__dirname, 'sdlc_state.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      project: null,
      stories: [],
      sprints: [],
      gates: {
        G1: { status: 'DRAFT', approvedBy: null, date: null },
        G2: { status: 'DRAFT', approvedBy: null, date: null },
        G3: { status: 'DRAFT', approvedBy: null, date: null },
        G4: { status: 'DRAFT', approvedBy: null, date: null },
        G5: { status: 'DRAFT', approvedBy: null, date: null }
      },
      reviews: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// API 1: Khởi tạo dự án & Tạo User Stories (S0 - S1) [ID:475]
app.post('/api/project/init', (req, res) => {
  const { name, description, velocity } = req.body;
  if (!name || !description || !velocity) {
    return res.status(400).json({ error: 'Thiếu thông tin cấu hình dự án bắt buộc.' });
  }

  const db = readDB();
  db.project = { name, description, velocity: parseInt(velocity, 10) };
  
  // Tự động sinh User Stories mẫu dựa trên mô tả dự án để demo luồng SDLC
  db.stories = [
    { id: 'US-01', title: 'Thiết kế cơ sở dữ liệu phân quyền người dùng', points: 5, priority: 'High', status: 'DRAFT' },
    { id: 'US-02', title: 'Xây dựng API đăng nhập và xác thực JWT', points: 3, priority: 'High', status: 'DRAFT' },
    { id: 'US-03', title: 'Phát triển giao diện Dashboard giám sát hệ thống', points: 8, priority: 'Medium', status: 'DRAFT' },
    { id: 'US-04', title: 'Tích hợp cổng thanh toán trực tuyến', points: 13, priority: 'Low', status: 'DRAFT' }
  ];
  
  db.gates.G1.status = 'READY_FOR_REVIEW';
  writeDB(db);
  res.json({ message: 'Khởi tạo dự án thành công', project: db.project, stories: db.stories });
});

// API 2: Phê duyệt các Cổng Chất Lượng (Quality Gates) [ID:475]
app.post('/api/gates/approve', (req, res) => {
  const { gateId, approver } = req.body;
  const db = readDB();

  if (!db.gates[gateId]) {
    return res.status(404).json({ error: 'Cổng chất lượng không tồn tại.' });
  }

  db.gates[gateId] = {
    status: 'APPROVED',
    approvedBy: approver,
    date: new Date().toISOString()
  };

  writeDB(db);
  res.json({ message: `Phê duyệt thành công cổng ${gateId}`, gates: db.gates });
});

// API 3: Lập kế hoạch Sprint tự động (S3 - $bmad-sprint-planning) [ID:132]
app.post('/api/sprint/plan', (req, res) => {
  const db = readDB();
  if (db.gates.G1.status !== 'APPROVED') {
    return res.status(400).json({ error: 'Yêu cầu phê duyệt Gate G1 trước khi lập kế hoạch Sprint.' });
  }

  const velocity = db.project.velocity;
  let currentSprintId = 1;
  let currentSprintPoints = 0;
  let currentSprintStories = [];
  const sprints = [];

  // Sắp xếp stories theo độ ưu tiên và điểm số để phân bổ tối ưu
  const sortedStories = [...db.stories].sort((a, b) => {
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  sortedStories.forEach(story => {
    if (currentSprintPoints + story.points <= velocity) {
      currentSprintStories.push(story);
      currentSprintPoints += story.points;
    } else {
      if (currentSprintStories.length > 0) {
        sprints.push({
          id: `Sprint-${currentSprintId}`,
          stories: currentSprintStories,
          totalPoints: currentSprintPoints
        });
        currentSprintId++;
      }
      currentSprintStories = [story];
      currentSprintPoints = story.points;
    }
  });

  if (currentSprintStories.length > 0) {
    sprints.push({
      id: `Sprint-${currentSprintId}`,
      stories: currentSprintStories,
      totalPoints: currentSprintPoints
    });
  }

  db.sprints = sprints;
  db.gates.G3.status = 'READY_FOR_REVIEW';
  writeDB(db);
  res.json({ message: 'Lập kế hoạch Sprint hoàn tất', sprints });
});

// API 4: Rà soát mã nguồn tự động (S4 - $bmad-code-review) [ID:102]
app.post('/api/code/review', (req, res) => {
  const { codeSnippet } = req.body;
  if (!codeSnippet) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã nguồn cần rà soát.' });
  }

  const db = readDB();
  const findings = [];

  // Thực hiện phân tích tĩnh (Static Analysis) giả lập theo chuẩn an toàn [ID:102]
  if (codeSnippet.includes('eval(') || codeSnippet.includes('exec(')) {
    findings.push({
      severity: 'BLOCKER',
      message: 'Phát hiện sử dụng hàm eval/exec có nguy cơ dính lỗi thực thi mã độc hại (RCE).'
    });
  }
  if (codeSnippet.includes('password') || codeSnippet.includes('secret_key')) {
    findings.push({
      severity: 'WARNING',
      message: 'Phát hiện từ khóa nhạy cảm nghi ngờ rò rỉ thông tin bảo mật.'
    });
  }
  if (!codeSnippet.includes('try') && !codeSnippet.includes('catch')) {
    findings.push({
      severity: 'INFO',
      message: 'Nên bổ sung khối try-catch để xử lý ngoại lệ an toàn.'
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'INFO',
      message: 'Mã nguồn sạch, tuân thủ tốt các tiêu chuẩn kỹ thuật.'
    });
  }

  db.reviews.push({
    timestamp: new Date().toISOString(),
    codeLength: codeSnippet.length,
    findings
  });

  // Nếu không có lỗi BLOCKER, cập nhật trạng thái Gate G4 [ID:102][ID:475]
  const hasBlocker = findings.some(f => f.severity === 'BLOCKER');
  if (!hasBlocker) {
    db.gates.G4.status = 'APPROVED';
  } else {
    db.gates.G4.status = 'REJECTED';
  }

  writeDB(db);
  res.json({ message: 'Rà soát mã nguồn hoàn tất', findings, gateStatus: db.gates.G4.status });
});

// API 5: Lấy toàn bộ trạng thái hệ thống (Traceability Matrix) [ID:475]
app.get('/api/state', (req, res) => {
  res.json(readDB());
});

// Khởi chạy Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server is running on: http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}

module.exports = app;
```

---