document.addEventListener('DOMContentLoaded', () => {
  loadSystemState();
});

// Tải trạng thái hệ thống và cập nhật giao diện
async function loadSystemState() {
  try {
    const res = await fetch('/api/state');
    const data = await res.json();

    // Hiển thị Traceability Matrix
    document.getElementById('traceabilityMatrix').textContent = JSON.stringify(data, null, 2);

    // Render trạng thái Quality Gates
    const gatesContainer = document.getElementById('gatesContainer');
    gatesContainer.innerHTML = '';

    Object.keys(data.gates).forEach(gateId => {
      const gate = data.gates[gateId];
      const gateCard = document.createElement('div');
      gateCard.className = `gate-card ${gate.status}`;
      
      gateCard.innerHTML = `
        <h3>${gateId}</h3>
        <p>Trạng thái: <strong>${gate.status}</strong></p>
        <p><small>Người duyệt: ${gate.approvedBy || 'Chưa duyệt'}</small></p>
        ${gate.status === 'READY_FOR_REVIEW' ? 
          `<button onclick="approveGate('${gateId}')" class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8em;">Phê duyệt</button>` : ''
        }
      `;
      gatesContainer.appendChild(gateCard);
    });
  } catch (err) {
    console.error('Lỗi tải trạng thái hệ thống:', err);
  }
}

// Khởi tạo dự án
async function initProject() {
  const name = document.getElementById('projName').value;
  const description = document.getElementById('projDesc').value;
  const velocity = document.getElementById('projVelocity').value;

  if (!name || !description) {
    alert('Vui lòng điền đầy đủ thông tin dự án.');
    return;
  }

  try {
    const res = await fetch('/api/project/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, velocity })
    });
    const data = await res.json();
    alert(data.message);
    loadSystemState();
  } catch (err) {
    alert('Khởi tạo dự án thất bại.');
  }
}

// Phê duyệt Gate
async function approveGate(gateId) {
  const approver = prompt(`Nhập tên người phê duyệt cho cổng ${gateId}:`, 'Tech Lead / Product Owner');
  if (!approver) return;

  try {
    const res = await fetch('/api/gates/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateId, approver })
    });
    const data = await res.json();
    alert(data.message);
    loadSystemState();
  } catch (err) {
    alert('Phê duyệt thất bại.');
  }
}

// Lập kế hoạch Sprint tự động
async function planSprints() {
  try {
    const res = await fetch('/api/sprint/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errData = await res.json();
      alert(errData.error || 'Lập kế hoạch Sprint thất bại.');
      return;
    }

    const data = await res.json();
    const sprintResult = document.getElementById('sprintResult');
    sprintResult.innerHTML = `<h3>🎯 Kết quả phân bổ Sprint:</h3>`;
    
    data.sprints.forEach(sprint => {
      const sprintDiv = document.createElement('div');
      sprintDiv.style.marginBottom = '15px';
      sprintDiv.innerHTML = `
        <strong>${sprint.id} (Tổng điểm: ${sprint.totalPoints} SP)</strong>
        <ul>
          ${sprint.stories.map(s => `<li>[${s.id}] ${s.title} (${s.points} SP - Ưu tiên: ${s.priority})</li>`).join('')}
        </ul>
      `;
      sprintResult.appendChild(sprintDiv);
    });

    loadSystemState();
  } catch (err) {
    alert('Lỗi kết nối hệ thống khi lập kế hoạch Sprint.');
  }
}

// Chạy Code Review tự động
async function runCodeReview() {
  const codeSnippet = document.getElementById('codeSnippet').value;
  if (!codeSnippet) {
    alert('Vui lòng nhập mã nguồn cần rà soát.');
    return;
  }

  try {
    const res = await fetch('/api/code/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeSnippet })
    });
    const data = await res.json();
    
    const reviewResult = document.getElementById('reviewResult');
    reviewResult.innerHTML = `
      <h3>🔍 Kết quả phân tích tĩnh:</h3>
      <p>Trạng thái Gate G4 sau review: <strong>${data.gateStatus}</strong></p>
    `;

    data.findings.forEach(finding => {
      const item = document.createElement('div');
      item.className = `finding-item ${finding.severity}`;
      item.innerHTML = `<strong>[${finding.severity}]</strong> ${finding.message}`;
      reviewResult.appendChild(item);
    });

    loadSystemState();
  } catch (err) {
    alert('Lỗi kết nối hệ thống khi chạy Code Review.');
  }
}
```

---