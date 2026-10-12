const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const DB_FILE = path.join(__dirname, '../sdlc_state.json');

describe('Enterprise Agentic SDLC Integration Tests', () => {
  // Dọn dẹp và khởi tạo lại DB trước khi chạy test suite
  beforeAll(() => {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
  });

  afterAll(() => {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
  });

  it('1. Nên khởi tạo dự án thành công và sinh User Stories (Gate G1 chuyển sang READY_FOR_REVIEW)', async () => {
    const res = await request(app)
      .post('/api/project/init')
      .send({
        name: 'Hệ thống quản lý chuỗi cung ứng',
        description: 'Hệ thống theo dõi vận đơn thời gian thực',
        velocity: 10
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('project');
    expect(res.body.stories.length).toBeGreaterThan(0);
    
    const stateRes = await request(app).get('/api/state');
    expect(stateRes.body.gates.G1.status).toBe('READY_FOR_REVIEW');
  });

  it('2. Không cho phép lập kế hoạch Sprint nếu Gate G1 chưa được APPROVED', async () => {
    const res = await request(app).post('/api/sprint/plan');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('Yêu cầu phê duyệt Gate G1');
  });

  it('3. Phê duyệt Gate G1 thành công', async () => {
    const res = await request(app)
      .post('/api/gates/approve')
      .send({
        gateId: 'G1',
        approver: 'QA Lead'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.gates.G1.status).toBe('APPROVED');
  });

  it('4. Lập kế hoạch Sprint thành công sau khi Gate G1 đã APPROVED', async () => {
    const res = await request(app).post('/api/sprint/plan');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('sprints');
    expect(res.body.sprints.length).toBeGreaterThan(0);
  });

  it('5. Chạy Code Review phát hiện lỗi BLOCKER và cập nhật Gate G4 thành REJECTED', async () => {
    const dangerousCode = `
      function executeCommand(cmd) {
        eval(cmd);
      }
    `;
    const res = await request(app)
      .post('/api/code/review')
      .send({ codeSnippet: dangerousCode });

    expect(res.statusCode).toEqual(200);
    expect(res.body.gateStatus).toBe('REJECTED');
    expect(res.body.findings.some(f => f.severity === 'BLOCKER')).toBe(true);
  });

  it('6. Chạy Code Review với mã nguồn an toàn và cập nhật Gate G4 thành APPROVED', async () => {
    const safeCode = `
      function calculateTotal(items) {
        try {
          return items.reduce((sum, item) => sum + item.price, 0);
        } catch (error) {
          console.error('Lỗi tính toán:', error);
          return 0;
        }
      }
    `;
    const res = await request(app)
      .post('/api/code/review')
      .send({ codeSnippet: safeCode });

    expect(res.statusCode).toEqual(200);
    expect(res.body.gateStatus).toBe('APPROVED');
  });
});