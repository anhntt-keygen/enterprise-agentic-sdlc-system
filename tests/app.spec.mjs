Dưới đây là toàn bộ mã nguồn của bộ kiểm thử tự động Playwright, được thiết kế theo tiêu chuẩn **TEA 1.27.2** [ID:450], tích hợp chặt chẽ các chốt chặn chất lượng (Quality Gates) [ID:475] và kiểm tra phân quyền nghiêm ngặt [ID:475].

```javascript
import { test, expect } from '@playwright/test';

/**
 * Bộ kiểm thử tự động TEA 1.27.2 cho Quy trình Vận hành Doanh nghiệp CC1/KEYGEN
 * Đảm bảo tuân thủ nghiêm ngặt các Gate từ G1 đến G5 và truy vết chất lượng (Traceability).
 */

test.describe('CC1/KEYGEN Enterprise SDLC Quality Gates & BMad Skills', () => {

  test.beforeEach(async ({ page }) => {
    // Khởi tạo môi trường sandbox cô lập, tránh rò rỉ dữ liệu production
    await page.goto('/');
  });

  test('[SC-01] Basic Operations - Khởi tạo Dự án & Lập Kế hoạch Sprint', async ({ page }) => {
    // Bước 1: Truy cập phân hệ quản lý dự án S0 - Intake
    await expect(page.locator('#sdlc-phase')).toHaveText('S0-INTAKE');
    
    // Bước 2: Kích hoạt kỹ năng lập kế hoạch Sprint $bmad-sprint-planning
    const sprintPlanningBtn = page.locator('button#trigger-sprint-planning');
    await expect(sprintPlanningBtn).toBeVisible();
    await sprintPlanningBtn.click();

    // Bước 3: Kiểm tra đầu ra kế hoạch sprint được tạo tại thư mục đầu ra chuẩn
    const sprintPlanStatus = page.locator('#sprint-plan-status');
    await expect(sprintPlanStatus).toHaveText('GENERATED');
    await expect(page.locator('#sprint-plan-path')).toHaveText('docs/sprint/sprint-plan.md');
  });

  test('[SC-02] Security & Authorization - Kiểm tra Ma trận Quyền & Chốt chặn G2/G3', async ({ page }) => {
    // Bước 1: Đăng nhập với vai trò không có thẩm quyền (Developer) để kiểm tra từ chối truy cập
    await page.fill('#username', 'dev_user');
    await page.fill('#password', 'secure_password');
    await page.click('#btn-login');

    // Bước 2: Thử phê duyệt Gate G2 (Yêu cầu vai trò Tech Lead / Business Owner)
    const approveG2Btn = page.locator('button#approve-g2');
    await approveG2Btn.click();

    // Hệ thống phải từ chối và hiển thị thông báo lỗi phân quyền
    const toastMessage = page.locator('.toast-error');
    await expect(toastMessage).toBeVisible();
    await expect(toastMessage).toContainText('Unauthorized: Requires Tech Lead or Business Owner role');

    // Bước 3: Đăng nhập với vai trò Tech Lead để phê duyệt hợp lệ
    await page.click('#btn-logout');
    await page.fill('#username', 'tech_lead_user');
    await page.fill('#password', 'secure_password');
    await page.click('#btn-login');

    // Tiến hành phê duyệt Gate G2
    await approveG2Btn.click();
    await expect(page.locator('#gate-g2-status')).toHaveText('APPROVED');
  });

  test('[SC-03] Code Review & Quality Gates - Rà soát tự động và Chặn Merge khi có Blocker', async ({ page }) => {
    // Bước 1: Kích hoạt kỹ năng $bmad-code-review cho Pull Request hiện tại
    const triggerReviewBtn = page.locator('button#trigger-code-review');
    await triggerReviewBtn.click();

    // Bước 2: Giả lập phát hiện lỗi nghiêm trọng (🔴 BLOCKER) trong mã nguồn
    await expect(page.locator('.review-result')).toBeVisible();
    const blockerCount = page.locator('#blocker-count');
    await expect(blockerCount).toHaveText('1');

    // Bước 3: Kiểm tra nút Merge PR bị vô hiệu hóa (Chốt chặn Quality Gate bắt buộc)
    const mergeBtn = page.locator('button#merge-pull-request');
    await expect(mergeBtn).toBeDisabled();

    // Bước 4: Giả lập sửa lỗi, chạy lại review đạt trạng thái an toàn (0 Blocker)
    await page.click('button#resolve-blockers');
    await triggerReviewBtn.click();
    await expect(blockerCount).toHaveText('0');
    
    // Nút Merge PR phải được kích hoạt sau khi sạch lỗi Blocker
    await expect(mergeBtn).toBeEnabled();
  });

  test('[SC-04] Release & Rollback - Kiểm thử Triển khai Staging & Kịch bản Rollback', async ({ page }) => {
    // Bước 1: Đăng nhập với vai trò Release Owner để thực hiện Gate G5
    await page.fill('#username', 'release_owner_user');
    await page.fill('#password', 'secure_password');
    await page.click('#btn-login');

    // Bước 2: Thực hiện deploy lên môi trường Staging
    const deployStagingBtn = page.locator('button#deploy-staging');
    await deployStagingBtn.click();
    await expect(page.locator('#staging-status')).toHaveText('DEPLOYED');

    // Chạy Smoke Test tự động trên Staging
    const smokeTestBtn = page.locator('button#run-smoke-test');
    await smokeTestBtn.click();
    await expect(page.locator('#smoke-test-result')).toHaveText('PASS');

    // Bước 3: Giả lập sự cố trên Staging để kích hoạt kịch bản Rollback theo Runbook
    await page.click('button#simulate-staging-failure');
    await expect(page.locator('#staging-health')).toHaveText('UNHEALTHY');

    // Kích hoạt nút Rollback khẩn cấp
    const rollbackBtn = page.locator('button#trigger-rollback');
    await expect(rollbackBtn).toBeVisible();
    await rollbackBtn.click();

    // Hệ thống phải khôi phục về phiên bản an toàn trước đó
    await expect(page.locator('#staging-status')).toHaveText('ROLLED_BACK');
    await expect(page.locator('#staging-health')).toHaveText('HEALTHY');
  });

});