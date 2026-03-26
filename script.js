// ---------- 全局变量 ----------
<<<<<<< HEAD
let mockHistory = []; // 将从后端加载
=======
let mockHistory = [];          // 将从后端加载
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
let currentDetectResult = null;
let currentPage = 1;
const pageSize = 5;

// ---------- 全局变量（新增）----------
<<<<<<< HEAD
let totalRecords = 0; // 总记录数（用于分页）
let currentFilters = {
  imageName: "",
  maturity: "",
  startDate: "",
  endDate: "",
};

// ---------- 工具函数：获取 API 基础 URL ----------
function getApiBaseUrl() {
  // 如果当前页面是从 localhost:5000 访问的，使用相对路径
  // 否则（如从 IDE 预览），使用完整的 Flask URL
  if (window.location.port === '5000' || !window.location.port) {
    return '';
  }
  return 'http://localhost:5000';
}

// ---------- 工具函数：获取认证 Token ----------
function getAuthToken() {
  // 优先从 localStorage 读取
  let token = localStorage.getItem('token');
  
  // 如果 localStorage 没有，尝试从 cookie 读取
  if (!token) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        token = value;
        break;
      }
    }
  }
  
  return token || '';
}

// 检查是否已登录（用于页面加载时）
function checkAuth() {
  return !!getAuthToken();
}

// ---------- 工具函数：加载历史数据 ----------
async function loadHistory() {
  try {
    const res = await fetch(getApiBaseUrl() + "/history", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await res.json();
    mockHistory = data;
  } catch (e) {
    console.log("后端未开启，使用空数据");
    mockHistory = [];
  }
=======
let totalRecords = 0;               // 总记录数（用于分页）
let currentFilters = {               // 当前筛选条件
    imageName: '',
    maturity: '',
    startDate: '',
    endDate: ''
};


// ---------- 工具函数：加载历史数据 ----------
async function loadHistory() {
    try {
        const res = await fetch("http://localhost:5000/history");
        const data = await res.json();
        mockHistory = data;
    } catch (e) {
        console.log("后端未开启，使用空数据");
        mockHistory = [];
    }
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
}

// ---------- 导航高亮 ----------
function setActiveNav() {
<<<<<<< HEAD
  // 移除 .html 并与路由匹配
  const path = window.location.pathname;
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    const href = item.getAttribute("href");
    if (href === path) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
=======
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === path) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
}

// ---------- 首页更新 ----------
async function updateHomePage() {
<<<<<<< HEAD
  try {
    // 1. 获取统计数据
    const res = await fetch(getApiBaseUrl() + "/api/dashboard", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await res.json();

    // 2. 更新顶部卡片
    document.getElementById("todayCount").innerText = data.today_count;
    document.getElementById("ripePercent").innerText = data.ripe_rate + "%";
    document.getElementById("rottenPercent").innerText = data.rotten_rate + "%";
    document.getElementById("avgSugar").innerText = data.avg_sugar + " °Brix";

    // 3. 更新趋势图
    const trendChart = echarts.init(document.getElementById("trendChart"));
    trendChart.setOption({
      title: { text: "7天成熟度趋势" },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: data.trend_dates },
      yAxis: { type: "value", max: 100, name: "成熟度%" },
      series: [
        {
          data: data.trend_values,
          type: "line",
          smooth: true,
          color: "#4caf50",
        },
      ],
    });

    // 4. 最近检测记录（仍从 history 接口获取？）
    const historyRes = await fetch(getApiBaseUrl() + "/history", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const historyData = await historyRes.json();
    const recentTbody = document.querySelector("#recentTable tbody");
    recentTbody.innerHTML = "";
    historyData.slice(0, 5).forEach((r) => {
      let badgeClass = "ripe";
      if (r.class === "unripe_orange") badgeClass = "unripe";
      else if (r.class === "ripe_orange") badgeClass = "ripe";
      else if (r.class === "rotten_orange") badgeClass = "overripe";
      const row = `<tr>
=======
    try {
        // 1. 获取统计数据
        const res = await fetch('http://localhost:5000/dashboard');
        const data = await res.json();

        // 2. 更新顶部卡片
        document.getElementById('todayCount').innerText = data.today_count;
        document.getElementById('ripePercent').innerText = data.ripe_rate + '%';
        document.getElementById('rottenPercent').innerText = data.rotten_rate + '%';
        document.getElementById('avgSugar').innerText = data.avg_sugar + ' °Brix';

        // 3. 更新趋势图
        const trendChart = echarts.init(document.getElementById('trendChart'));
        trendChart.setOption({
            title: { text: '近7天成熟度趋势' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: data.trend_dates },
            yAxis: { type: 'value', max: 100, name: '成熟度 %' },
            series: [{ data: data.trend_values, type: 'line', smooth: true, color: '#4caf50' }]
        });

        // 4. 最近检测记录（仍从 history 接口获取）
        const historyRes = await fetch('http://localhost:5000/history');
        const historyData = await historyRes.json();
        const recentTbody = document.querySelector('#recentTable tbody');
        recentTbody.innerHTML = '';
        historyData.slice(0, 5).forEach(r => {
            let badgeClass = 'ripe';
            if (r.class === 'unripe_orange') badgeClass = 'unripe';
            else if (r.class === 'ripe_orange') badgeClass = 'ripe';
            else if (r.class === 'rotten_orange') badgeClass = 'overripe';
            const row = `<tr>
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
                <td>${r.time}</td>
                <td>${r.image}</td>
                <td><span class="maturity-badge ${badgeClass}">${r.maturity}%</span></td>
                <td>${r.sugar}°Brix</td>
                <td>${r.suggestion}</td>
            </tr>`;
<<<<<<< HEAD
      recentTbody.innerHTML += row;
    });
  } catch (error) {
    console.error("加载首页数据失败", error);
    // 可以保留原来的随机数据作为降级方案
  }
=======
            recentTbody.innerHTML += row;
        });

    } catch (error) {
        console.error('加载首页数据失败', error);
        // 可以保留原来的随机数据作为降级方案
    }
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
}

// ---------- 检测页面功能 ----------
function initDetectPage() {
<<<<<<< HEAD
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const previewImage = document.getElementById("previewImage");
  const imagePreview = document.getElementById("imagePreview");
  const detectBtn = document.getElementById("detectBtn");
  const resetBtn = document.getElementById("resetBtn");
  const saveResultBtn = document.getElementById("saveResultBtn");
  const resultContainer = document.getElementById("resultContainer");
  const noResultMessage = document.getElementById("noResultMessage");
  const maturityValue = document.getElementById("maturityValue");
  const maturityFill = document.getElementById("maturityFill");
  const colorScore = document.getElementById("colorScore");
  const sizeValue = document.getElementById("sizeValue");
  const sugarContent = document.getElementById("sugarContent");
  const harvestDays = document.getElementById("harvestDays");
  const recommendationText = document.getElementById("recommendationText");

  if (!uploadArea) return;

  let lastQuality = null;

  const qualityHint = document.createElement("div");
  qualityHint.id = "qualityHint";
  qualityHint.className = "quality-hint";
  qualityHint.style.display = "none";
  uploadArea.insertAdjacentElement("afterend", qualityHint);

  function showQualityHint(text, level) {
    qualityHint.textContent = text || "";
    qualityHint.classList.remove("ok", "warn", "bad");
    if (level) qualityHint.classList.add(level);
    qualityHint.style.display = text ? "block" : "none";
  }

  async function sendClientLog(event, data) {
    try {
      await fetch(getApiBaseUrl() + "/client_log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data, time: new Date().toISOString() }),
      });
    } catch (e) {}
  }

  function assessImageQuality(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;
        const gray = new Float32Array(size * size);
        let mean = 0;
        for (let i = 0; i < size * size; i++) {
          const r = imageData[i * 4];
          const g = imageData[i * 4 + 1];
          const b = imageData[i * 4 + 2];
          const v = 0.299 * r + 0.587 * g + 0.114 * b;
          gray[i] = v;
          mean += v;
        }
        mean /= size * size;
        let varGray = 0;
        for (let i = 0; i < size * size; i++) {
          const d = gray[i] - mean;
          varGray += d * d;
        }
        varGray /= size * size;

        let sumSq = 0;
        let count = 0;
        for (let y = 1; y < size - 1; y++) {
          for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x;
            const c = gray[idx];
            const lap =
              -4 * c +
              gray[idx - 1] +
              gray[idx + 1] +
              gray[idx - size] +
              gray[idx + size];
            sumSq += lap * lap;
            count++;
          }
        }
        const blurScore = sumSq / Math.max(1, count);
        resolve({
          blurScore: Number(blurScore.toFixed(2)),
          brightness: Number(mean.toFixed(1)),
          contrast: Number(Math.sqrt(varGray).toFixed(2)),
        });
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  function showNoDetection(message) {
    resultContainer.style.display = "block";
    noResultMessage.style.display = "none";
    maturityValue.textContent = message;
    maturityFill.style.width = "0%";
    maturityFill.style.background = "#ddd";
    colorScore.textContent = "-";
    sizeValue.textContent = "-";
    sugarContent.textContent = "-";
    harvestDays.textContent = "-";
    recommendationText.textContent =
      "图像不清晰或未包含柑橘主体，请重新上传后再试";
    saveResultBtn.disabled = true;
    currentDetectResult = null;
  }

  function resetUi() {
    fileInput.value = "";
    previewImage.src = "";
    imagePreview.style.display = "none";
    resultContainer.style.display = "none";
    noResultMessage.style.display = "block";
    maturityFill.style.width = "0%";
    detectBtn.disabled = true;
    saveResultBtn.disabled = true;
    currentDetectResult = null;
    lastQuality = null;
    showQualityHint("", null);
  }

  uploadBtn.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
      handleImageUpload(e.target.files[0]);
    }
  });

  function handleImageUpload(file) {
    if (!file.type.match("image.*")) {
      alert("请选择图像文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("文件大小不能超过5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImage.src = e.target.result;
      imagePreview.style.display = "block";
      detectBtn.disabled = false;
      saveResultBtn.disabled = true;
      showQualityHint("", null);
      assessImageQuality(e.target.result).then((q) => {
        lastQuality = q;
        if (!q) return;
        if (q.blurScore < 20 || q.brightness < 25 || q.contrast < 15) {
          showQualityHint(
            "图像质量较差：可能过于模糊或光照不足，建议重新上传清晰图像",
            "bad",
          );
          detectBtn.disabled = true;
          sendClientLog("upload_quality_bad", q);
        } else if (q.blurScore < 60 || q.brightness < 45) {
          showQualityHint("图像可能不够清晰，检测结果可能不稳定", "warn");
          sendClientLog("upload_quality_warn", q);
        } else {
          showQualityHint("图像质量良好", "ok");
        }
      });
    };
    reader.readAsDataURL(file);
  }

  detectBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      alert("请先上传图片");
      return;
    }

    detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 检测中...';
    detectBtn.disabled = true;

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);

    try {
      const response = await fetch(getApiBaseUrl() + "/detect", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data && data.error) {
        const msg =
          lastQuality && lastQuality.blurScore < 60
            ? "图像不清晰，请重新上传"
            : String(data.error);
        showNoDetection(msg);
        sendClientLog("detect_no_object", {
          error: data.error,
          quality: lastQuality,
        });
        return;
      }

      resultContainer.style.display = "block";
      noResultMessage.style.display = "none";

      currentDetectResult = {
        imageName: fileInput.files[0].name,
        data: data,
      };
      saveResultBtn.disabled = false;

      if (data.class === "rotten_orange") {
        maturityValue.textContent = "已腐烂";
        maturityFill.style.width = "100%";
        maturityFill.style.background = "#f44336";
        harvestDays.textContent = "不适合采摘";
      } else {
        const m = Number(data.maturity);
        maturityValue.textContent = Number.isFinite(m)
          ? `${m.toFixed(1)}%`
          : "-";
        const w = Number.isFinite(m) ? Math.max(0, Math.min(100, m)) : 0;
        maturityFill.style.width = `${w}%`;
        maturityFill.style.background =
          "linear-gradient(90deg, #ffeb3b, #ff9800, #4caf50)";
        harvestDays.textContent =
          Number(data.days) <= 0 ? "现在可采摘" : `${data.days} 天`;
      }

      recommendationText.textContent = data.suggestion || "-";
      colorScore.textContent = data.color || "未知";
      sizeValue.textContent =
        data.diameter != null ? `${data.diameter} cm` : "-";
      sugarContent.textContent =
        data.sugar != null ? `${data.sugar} °Brix` : "-";

      sendClientLog("detect_success", {
        class: data.class,
        maturity: data.maturity,
        quality: lastQuality,
      });
    } catch (error) {
      console.error("前端错误:", error);
      alert("检测失败：前端处理数据时出错");
      sendClientLog("detect_client_error", {
        message: String(error),
        quality: lastQuality,
      });
    } finally {
      detectBtn.innerHTML = '<i class="fas fa-search"></i> 开始检测成熟度';
      detectBtn.disabled = !!(
        lastQuality &&
        (lastQuality.blurScore < 20 ||
          lastQuality.brightness < 25 ||
          lastQuality.contrast < 15)
      );
    }
  });

  resetBtn.addEventListener("click", () => resetUi());

  saveResultBtn.addEventListener("click", async () => {
    if (!currentDetectResult) return;

    const { imageName, data } = currentDetectResult;
    const now = new Date();
    const timeStr = now.toISOString().slice(0, 19).replace("T", " ");
    const sugar = sugarContent.textContent.replace("°Brix", "").trim();

    const newRecord = {
      time: timeStr,
      image: imageName,
      maturity: data.maturity || 0,
      sugar: sugar,
      suggestion: data.suggestion,
      class: data.class,
      days: data.days,
    };

    try {
      const response = await fetch(getApiBaseUrl() + "/save_record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(newRecord),
      });

      let result = null;
      try {
        result = await response.json();
      } catch (e) {
        result = null;
      }

      if (response.ok && result && result.success) {
        alert("保存成功！");
        saveResultBtn.disabled = true;
        mockHistory.unshift(newRecord);
        sendClientLog("save_record_success", { image: imageName });
      } else {
        const msg =
          result && result.message
            ? result.message
            : `保存失败（HTTP ${response.status}）`;
        alert(msg);
        sendClientLog("save_record_failed", {
          status: response.status,
          message: msg,
        });
      }
    } catch (err) {
      console.error(err);
      alert("保存失败：无法连接到后端服务");
      sendClientLog("save_record_network_error", { message: String(err) });
    }
  });

  async function updateQuickHistory() {
    const quickDiv = document.getElementById("quickHistory");
    if (!quickDiv) return;
    quickDiv.innerHTML = "";
    mockHistory.slice(0, 3).forEach((r) => {
      const canOpen = r.id != null;
      const btnHtml = canOpen
        ? `<button class="btn" style="margin-top:10px;" onclick="openDetectionDetail('${r.id}')">查看详情</button>`
        : `<button class="btn" style="margin-top:10px;" disabled>查看详情</button>`;
      quickDiv.innerHTML += `
                <div style="background: #f5f5f5; padding: 15px; border-radius: var(--border-radius); flex:1; min-width:200px;">
                    <strong>${r.time}</strong><br>
                    成熟度 ${r.maturity}%<br>
                    建议: ${r.suggestion}<br>
                    ${btnHtml}
                </div>
            `;
    });
  }

  window.openDetectionDetail = function (detectionId) {
    window.location.href = `/detection_detail?id=${encodeURIComponent(
      detectionId,
    )}`;
  };

  loadHistory().then(() => updateQuickHistory());
  setInterval(() => updateQuickHistory(), 10000);
}

async function initDetectionDetailPage() {
  const statusEl = document.getElementById("detailStatus");
  const bodyEl = document.getElementById("detailBody");
  const imgEl = document.getElementById("detailImage");
  const reloadBtn = document.getElementById("reloadImageBtn");

  if (!statusEl || !bodyEl || !imgEl) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    statusEl.textContent = "缺少 detectionId";
    return;
  }

  const token = localStorage.getItem("token") || "";
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  async function sendClientLog(event, data) {
    try {
      await fetch(getApiBaseUrl() + "/client_log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data, time: new Date().toISOString() }),
      });
    } catch (e) {}
  }

  async function loadImage(imageUrl, retryIndex) {
    const url =
      retryIndex > 0
        ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
        : imageUrl;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    imgEl.onload = () => URL.revokeObjectURL(objUrl);
    imgEl.src = objUrl;
  }

  async function loadImageWithRetry(imageUrl, detectionId, imageId) {
    reloadBtn.style.display = "none";
    try {
      await loadImage(imageUrl, 0);
      await sendClientLog("detail_image_load_ok", { detectionId, imageId });
    } catch (e1) {
      try {
        await loadImage(imageUrl, 1);
        await sendClientLog("detail_image_retry_ok", { detectionId, imageId });
      } catch (e2) {
        reloadBtn.style.display = "inline-block";
        await sendClientLog("detail_image_load_failed", {
          detectionId,
          imageId,
          statusCode: e2.status || null,
          message: String(e2),
        });
        throw e2;
      }
    }
  }

  try {
    statusEl.textContent = "正在加载...";
    const res = await fetch(getApiBaseUrl() + `/api/v1/detection/${id}`, {
      headers,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || !json.success) {
      const msg =
        json && json.message ? json.message : `加载失败（HTTP ${res.status}）`;
      statusEl.textContent = msg;
      await sendClientLog("detail_load_failed", {
        detectionId: id,
        statusCode: res.status,
        message: msg,
      });
      return;
    }

    const data = json.data;
    document.getElementById("detailMaturity").textContent =
      data.maturity != null ? `${Number(data.maturity).toFixed(1)}%` : "-";
    document.getElementById("detailSugar").textContent =
      data.sugar != null ? `${data.sugar} °Brix` : "-";
    document.getElementById("detailDays").textContent =
      data.days != null
        ? Number(data.days) <= 0
          ? "现在可采摘"
          : `${data.days} 天`
        : "-";
    document.getElementById("detailClass").textContent = data.class || "-";
    document.getElementById("detailSuggestion").textContent =
      data.suggestion || "-";

    const imageIds = Array.isArray(data.image_ids) ? data.image_ids : [];
    const imageId = imageIds[0];
    if (!imageId) {
      statusEl.textContent = "图片加载失败";
      reloadBtn.style.display = "none";
      await sendClientLog("detail_no_image", { detectionId: id });
      return;
    }

    const imageUrl = getApiBaseUrl() + `/api/v1/detection/${id}/image/${encodeURIComponent(
      imageId,
    )}`;
    await loadImageWithRetry(imageUrl, id, imageId);

    statusEl.textContent = "";
    bodyEl.style.display = "block";

    reloadBtn.onclick = async () => {
      try {
        statusEl.textContent = "正在重新加载图片...";
        await loadImageWithRetry(imageUrl, id, imageId);
        statusEl.textContent = "";
      } catch (e) {
        statusEl.textContent = "图片加载失败";
      }
    };
  } catch (e) {
    statusEl.textContent = "加载失败";
    reloadBtn.style.display = "none";
  }
=======
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewImage = document.getElementById('previewImage');
    const imagePreview = document.getElementById('imagePreview');
    const detectBtn = document.getElementById('detectBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveResultBtn = document.getElementById('saveResultBtn');
    const resultContainer = document.getElementById('resultContainer');
    const noResultMessage = document.getElementById('noResultMessage');
    const maturityValue = document.getElementById('maturityValue');
    const maturityFill = document.getElementById('maturityFill');
    const colorScore = document.getElementById('colorScore');
    const sizeValue = document.getElementById('sizeValue');
    const sugarContent = document.getElementById('sugarContent');
    const harvestDays = document.getElementById('harvestDays');
    const recommendationText = document.getElementById('recommendationText');

    if (!uploadArea) return; // 不在检测页

    uploadBtn.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageUpload(e.target.files[0]);
        }
    });

    function handleImageUpload(file) {
        if (!file.type.match('image.*')) {
            alert('请选择图像文件');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('文件大小不能超过5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImage.src = e.target.result;
            imagePreview.style.display = 'block';
            detectBtn.disabled = false;
            saveResultBtn.disabled = true;
        };
        reader.readAsDataURL(file);
    }

    detectBtn.addEventListener('click', async () => {
        if (!fileInput.files.length) {
            alert("请先上传图片");
            return;
        }

        detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 检测中...';
        detectBtn.disabled = true;

        const formData = new FormData();
        formData.append("image", fileInput.files[0]);

        try {
            const response = await fetch("http://localhost:5000/detect", {
                method: "POST",
                body: formData
            });

            const text = await response.text();
            console.log("服务器原始返回:", text);
            const data = JSON.parse(text);
            console.log("解析后的JSON:", data);

            resultContainer.style.display = 'block';
            noResultMessage.style.display = 'none';

            currentDetectResult = {
                imageName: fileInput.files[0].name,
                data: data
            };
            saveResultBtn.disabled = false;

            if (data.class === "rotten_orange") {
                maturityValue.textContent = "已腐烂";
                maturityFill.style.width = "100%";
                maturityFill.style.background = "#f44336";
                harvestDays.textContent = "不适合采摘";
            } else {
                maturityValue.textContent = data.maturity + "%";
                maturityFill.style.width = data.maturity + "%";
                maturityFill.style.background = "linear-gradient(90deg, #ffeb3b, #ff9800, #4caf50)";
                if (data.days <= 0) {
                    harvestDays.textContent = "现在可采摘";
                } else {
                    harvestDays.textContent = data.days + " 天";
                }
            }

            recommendationText.textContent = data.suggestion;

            if (data.class === "unripe_orange") {
                colorScore.textContent = "青绿色";
            } else if (data.class === "ripe_orange") {
                colorScore.textContent = "橙色成熟";
            } else if (data.class === "rotten_orange") {
                colorScore.textContent = "深褐色";
            } else {
                colorScore.textContent = "未知";
            }

            let diameter = (6 + Math.random() * 2).toFixed(1);
            sizeValue.textContent = diameter + " cm";

            let sugar = (data.maturity * 0.15 + 5).toFixed(1);
            sugarContent.textContent = sugar + " °Brix";

        } catch (error) {
            console.error("前端错误:", error);
            alert("检测失败：前端处理数据时出错");
        } finally {
            detectBtn.innerHTML = '<i class="fas fa-search"></i> 开始检测成熟度';
            detectBtn.disabled = false;
        }
    });

    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        previewImage.src = '';
        imagePreview.style.display = 'none';
        resultContainer.style.display = 'none';
        noResultMessage.style.display = 'block';
        maturityFill.style.width = '0%';
        detectBtn.disabled = true;
        saveResultBtn.disabled = true;
        currentDetectResult = null;
    });

    saveResultBtn.addEventListener('click', async () => {
        if (!currentDetectResult) return;

        const { imageName, data } = currentDetectResult;
        const now = new Date();
        const timeStr = now.toISOString().slice(0, 19).replace('T', ' ');
        const sugar = sugarContent.textContent.replace('°Brix', '').trim();

        const newRecord = {
            time: timeStr,
            image: imageName,
            maturity: data.maturity || 0,
            sugar: sugar,
            suggestion: data.suggestion,
            class: data.class
        };

        try {
            const response = await fetch("http://localhost:5000/save_record", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRecord)
            });

            const result = await response.json();

            if (result.success) {
                alert("保存成功！");
                saveResultBtn.disabled = true;
                mockHistory.unshift(newRecord);
                // 更新其他页面相关数据（如果当前页面是首页或数据中心，会在下次加载时刷新）
            } else {
                alert("保存失败");
            }
        } catch (err) {
            console.error(err);
            alert("数据库连接失败");
        }
    });

    // 快速跳转卡片更新
    async function updateQuickHistory() {
        const quickDiv = document.getElementById('quickHistory');
        if (!quickDiv) return;
        quickDiv.innerHTML = '';
        mockHistory.slice(0, 3).forEach(r => {
            quickDiv.innerHTML += `
                <div style="background: #f5f5f5; padding: 15px; border-radius: var(--border-radius); flex:1; min-width:200px;">
                    <strong>${r.time}</strong><br>
                    成熟度: ${r.maturity}%<br>
                    建议: ${r.suggestion}<br>
                    <button class="btn" style="margin-top:10px;" onclick="jumpToDetect('${r.image}')">查看详情</button>
                </div>
            `;
        });
    }

    window.jumpToDetect = function (imageName) {
        alert(`跳转到检测页面并加载图片 ${imageName} (需后端支持)`);
        window.location.href = 'detect.html';
    };

    // 初始加载快速跳转
    loadHistory().then(() => updateQuickHistory());
    setInterval(() => updateQuickHistory(), 10000);
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
}

// ---------- 新增：从后端获取筛选后的记录 ----------
async function fetchFilteredRecords(page, filters) {
<<<<<<< HEAD
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("pageSize", pageSize);
  if (filters.imageName) params.append("imageName", filters.imageName);
  if (filters.maturity) params.append("maturity", filters.maturity);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  try {
    const res = await fetch(
      getApiBaseUrl() + `/api/records?${params.toString()}`,
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!res.ok) throw new Error("请求失败");
    return await res.json(); // 期望返回 { total, page, pageSize, data }
  } catch (e) {
    console.error("获取筛选记录失败", e);
    return { total: 0, page: 1, pageSize: pageSize, data: [] };
  }
=======
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', pageSize);
    if (filters.imageName) params.append('imageName', filters.imageName);
    if (filters.maturity) params.append('maturity', filters.maturity);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    try {
        const res = await fetch(`http://localhost:5000/api/records?${params.toString()}`);
        if (!res.ok) throw new Error('请求失败');
        return await res.json();   // 期望返回 { total, page, pageSize, data }
    } catch (e) {
        console.error('获取筛选记录失败', e);
        return { total: 0, page: 1, pageSize: pageSize, data: [] };
    }
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
}

// ---------- 数据中心页面 ----------
async function renderDataTable(page) {
<<<<<<< HEAD
  const tbody = document.querySelector("#dataTable tbody");
  if (!tbody) return;

  // 获取筛选后的数据
  const result = await fetchFilteredRecords(page, currentFilters);
  const pageData = result.data || [];
  totalRecords = result.total || 0;

  tbody.innerHTML = "";
  pageData.forEach((r, idx) => {
    let badgeClass = "ripe";
    if (r.class === "unripe_orange") badgeClass = "unripe";
    else if (r.class === "ripe_orange") badgeClass = "ripe";
    else if (r.class === "rotten_orange") badgeClass = "overripe";
    const row = document.createElement("tr");
    row.innerHTML = `
=======
    const tbody = document.querySelector('#dataTable tbody');
    if (!tbody) return;

    // 获取筛选后的数据
    const result = await fetchFilteredRecords(page, currentFilters);
    const pageData = result.data || [];
    totalRecords = result.total || 0;

    tbody.innerHTML = '';
    pageData.forEach((r, idx) => {
        let badgeClass = 'ripe';
        if (r.class === 'unripe_orange') badgeClass = 'unripe';
        else if (r.class === 'ripe_orange') badgeClass = 'ripe';
        else if (r.class === 'rotten_orange') badgeClass = 'overripe';
        const row = document.createElement('tr');
        row.innerHTML = `
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
            <td>${r.time}</td>
            <td>${r.image}</td>
            <td><span class="maturity-badge ${badgeClass}">${r.maturity}%</span></td>
            <td>${r.sugar}°Brix</td>
            <td>${r.suggestion}</td>
            <td><i class="fas fa-trash delete-btn" data-id="${r.id}"></i></td>
        `;
<<<<<<< HEAD
    tbody.appendChild(row);
  });

  // 绑定删除事件（需要后端DELETE接口？）
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (!confirm("确定删除这条记录吗？")) return;
      try {
        const res = await fetch(getApiBaseUrl() + `/record/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
        if (res.ok) {
          // 重新加载当前页
          await renderDataTable(currentPage);
        } else {
          alert("删除失败");
        }
      } catch (err) {
        console.error(err);
        alert("网络错误");
      }
    });
  });

  // 更新分页信息
  const totalPages = Math.ceil(totalRecords / pageSize);
  document.getElementById("pageInfo").innerText =
    `第${page}页 / ${totalPages}页`;
  document.getElementById("prevPage").disabled = page <= 1;
  document.getElementById("nextPage").disabled = page >= totalPages;
}

function initDataPage() {
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const applyFilter = document.getElementById("applyFilter");
  const exportBtn = document.getElementById("exportExcel");
  const searchImage = document.getElementById("searchImage");
  const filterMaturity = document.getElementById("filterMaturity");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");

  if (!prevBtn) return;

  // 初始加载第一页
  currentPage = 1;
  renderDataTable(currentPage);

  // 上一页
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderDataTable(currentPage);
    }
  });

  // 下一页
  nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderDataTable(currentPage);
    }
  });

  // 筛选按钮
  applyFilter.addEventListener("click", () => {
    currentFilters = {
      imageName: searchImage.value.trim(),
      maturity: filterMaturity.value,
      startDate: startDate.value,
      endDate: endDate.value,
    };
    currentPage = 1; // 重置到第一页
    renderDataTable(1);
  });

  // 导出 Excel
  exportBtn.addEventListener("click", async () => {
    // 构建筛选参数（不含分页）
    const params = new URLSearchParams();
    if (currentFilters.imageName)
      params.append("imageName", currentFilters.imageName);
    if (currentFilters.maturity)
      params.append("maturity", currentFilters.maturity);
    if (currentFilters.startDate)
      params.append("startDate", currentFilters.startDate);
    if (currentFilters.endDate)
      params.append("endDate", currentFilters.endDate);
    params.append("export", "true"); // 标识导出全部数据

    try {
      const res = await fetch(getApiBaseUrl() + `/api/records/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error("导出失败");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `records_${startDate.value}_${endDate.value}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("导出失败：" + e.message);
    }
  });
=======
        tbody.appendChild(row);
    });

    // 绑定删除事件（需要后端 DELETE 接口）
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (!confirm('确定删除这条记录吗？')) return;
            try {
                const res = await fetch(`http://localhost:5000/record/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    // 重新加载当前页
                    await renderDataTable(currentPage);
                } else {
                    alert('删除失败');
                }
            } catch (err) {
                console.error(err);
                alert('网络错误');
            }
        });
    });

    // 更新分页信息
    const totalPages = Math.ceil(totalRecords / pageSize);
    document.getElementById('pageInfo').innerText = `第${page}页 / 共${totalPages}页`;
    document.getElementById('prevPage').disabled = (page <= 1);
    document.getElementById('nextPage').disabled = (page >= totalPages);
}

function initDataPage() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const applyFilter = document.getElementById('applyFilter');
    const exportBtn = document.getElementById('exportExcel');
    const searchImage = document.getElementById('searchImage');
    const filterMaturity = document.getElementById('filterMaturity');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    if (!prevBtn) return;

    // 初始加载第一页
    currentPage = 1;
    renderDataTable(currentPage);

    // 上一页
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderDataTable(currentPage);
        }
    });

    // 下一页
    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            renderDataTable(currentPage);
        }
    });

    // 筛选按钮
    applyFilter.addEventListener('click', () => {
        currentFilters = {
            imageName: searchImage.value.trim(),
            maturity: filterMaturity.value,
            startDate: startDate.value,
            endDate: endDate.value
        };
        currentPage = 1;          // 重置到第一页
        renderDataTable(1);
    });

    // 导出 Excel
    exportBtn.addEventListener('click', async () => {
        // 构建筛选参数（不含分页）
        const params = new URLSearchParams();
        if (currentFilters.imageName) params.append('imageName', currentFilters.imageName);
        if (currentFilters.maturity) params.append('maturity', currentFilters.maturity);
        if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
        if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
        params.append('export', 'true');   // 标识导出全部数据

        try {
            const res = await fetch(`http://localhost:5000/api/records/export?${params.toString()}`);
            if (!res.ok) throw new Error('导出失败');
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `检测记录_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error(e);
            alert('导出接口未实现，请先配置后端');
        }
    });
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
}

// ---------- 数据分析页面（基于真实数据）----------
async function renderCharts() {
<<<<<<< HEAD
  // 确保图表容器存在（仅在 analysis.html 中执行）
  if (!document.getElementById("trendChart2")) return;

  // 加载最新历史数据
  await loadHistory();

  // 如果没有任何历史记录，则使用默认模拟数据（避免图表空白）
  if (mockHistory.length === 0) {
    console.log("暂无历史数据，使用模拟数据展示");
    mockHistory = [
      {
        time: "2025-04-01 09:23",
        image: "citrus1.jpg",
        maturity: 85,
        sugar: 12.3,
        class: "ripe_orange",
      },
      {
        time: "2025-04-02 10:45",
        image: "orange2.jpg",
        maturity: 32,
        sugar: 7.8,
        class: "unripe_orange",
      },
      {
        time: "2025-04-03 16:12",
        image: "fruit3.jpg",
        maturity: 95,
        sugar: 13.1,
        class: "overripe",
      },
      {
        time: "2025-04-04 11:30",
        image: "sample4.jpg",
        maturity: 67,
        sugar: 10.5,
        class: "ripe_orange",
      },
      {
        time: "2025-04-05 14:20",
        image: "test5.jpg",
        maturity: 12,
        sugar: 5.2,
        class: "unripe_orange",
      },
      {
        time: "2025-04-06 09:23",
        image: "citrus6.jpg",
        maturity: 45,
        sugar: 9.1,
        class: "unripe_orange",
      },
      {
        time: "2025-04-07 10:45",
        image: "orange7.jpg",
        maturity: 78,
        sugar: 11.5,
        class: "ripe_orange",
      },
    ];
  }

  // 1. 7天成熟度趋势（按日期聚合平均成熟度）
  const last7Days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getMonth() + 1}-${d
      .getDate()
      .toString()
      .padStart(2, "0")}`;
    last7Days.push(dateStr);
  }

  // 将记录按日期分组
  const dailyData = {};
  mockHistory.forEach((record) => {
    // 假设 time 格式为"YYYY-MM-DD HH:MM"
    const datePart = record.time.split(" ")[0]; // 取出日期部分 "YYYY-MM-DD"
    if (!dailyData[datePart]) {
      dailyData[datePart] = { totalMaturity: 0, count: 0, rottenCount: 0 };
    }
    dailyData[datePart].totalMaturity += record.maturity;
    dailyData[datePart].count++;
    if (record.class === "rotten_orange") {
      dailyData[datePart].rottenCount++;
    }
  });

  // 生成最近7天的趋势数据（如果某天无记录，则用前一天的均值或0填充？）
  let trendData = [];
  let rottenTrendData = [];
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - (6 - i));
    const ymd = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD
    if (dailyData[ymd]) {
      const avg = dailyData[ymd].totalMaturity / dailyData[ymd].count;
      trendData.push(avg.toFixed(1));
      const rottenRate = (
        (dailyData[ymd].rottenCount / dailyData[ymd].count) *
        100
      ).toFixed(1);
      rottenTrendData.push(rottenRate);
    } else {
      // 无记录则使用邻近值或0（此处用0，或可沿用前一天的？）
      trendData.push(0);
      rottenTrendData.push(0);
    }
  }

  // 2. 成熟等级分布
  let unripeCount = 0,
    ripeCount = 0,
    overripeCount = 0,
    rottenCount = 0;
  mockHistory.forEach((record) => {
    if (record.class === "unripe_orange") unripeCount++;
    else if (record.class === "ripe_orange") ripeCount++;
    else if (record.class === "rotten_orange") rottenCount++;
    else if (record.maturity > 90)
      overripeCount++; // 过熟按成熟度>90判断
    else if (record.maturity >= 70)
      ripeCount++; // 部分成熟归为成熟
    else if (record.maturity < 30) unripeCount++;
    else unripeCount++; // 30-70之间也算未成熟（可根据需要调整）
  });
  // 将腐烂单独作为一个类别，过熟也单独显示（但你的图表原来只有4个类别：未成熟、部分成熟、成熟、过熟）
  // 这里简化：未成熟（unripe）、成熟（ripe）、过熟（overripe）、腐烂（rotten）
  const maturityDistData = [unripeCount, ripeCount, overripeCount, rottenCount];

  // 3. 糖度分布（按类别统计平均糖度？）
  let sugarUnripe = [],
    sugarRipe = [],
    sugarOverripe = [],
    sugarRotten = [];
  mockHistory.forEach((record) => {
    const sugar = parseFloat(record.sugar) || 0;
    if (record.class === "unripe_orange") sugarUnripe.push(sugar);
    else if (record.class === "ripe_orange") sugarRipe.push(sugar);
    else if (record.class === "rotten_orange") sugarRotten.push(sugar);
    else if (record.maturity > 90) sugarOverripe.push(sugar);
    else if (record.maturity >= 70) sugarRipe.push(sugar);
    else sugarUnripe.push(sugar);
  });
  const avgSugar = (arr) =>
    arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;
  const sugarData = [
    avgSugar(sugarUnripe),
    avgSugar(sugarRipe),
    avgSugar(sugarOverripe),
    avgSugar(sugarRotten),
  ];

  // 4. 腐烂比例变化（已与趋势图共用 rottenTrendData？）

  // 初始化ECharts 图表
  const trendChart = echarts.init(document.getElementById("trendChart2"));
  trendChart.setOption({
    title: { text: "7天成熟度趋势" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: last7Days },
    yAxis: { type: "value", max: 100, name: "成熟度%" },
    series: [{ data: trendData, type: "line", smooth: true, color: "#4caf50" }],
  });

  const barChart = echarts.init(document.getElementById("barChart"));
  barChart.setOption({
    title: { text: "成熟等级分布" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["未成�?, "成熟", "过熟", "腐烂"] },
    yAxis: { type: "value" },
    series: [{ data: maturityDistData, type: "bar", color: "#ff9800" }],
  });

  const rottenChart = echarts.init(document.getElementById("rottenChart"));
  rottenChart.setOption({
    title: { text: "腐烂比例变化" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: last7Days },
    yAxis: { type: "value", name: "比例 %" },
    series: [
      { data: rottenTrendData, type: "line", smooth: true, color: "#f44336" },
    ],
  });

  const sugarChart = echarts.init(document.getElementById("sugarChart"));
  sugarChart.setOption({
    title: { text: "糖度分布（平均）" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["未成�?, "成熟", "过熟", "腐烂"] },
    yAxis: { type: "value", name: "°Brix" },
    series: [{ data: sugarData, type: "bar", color: "#2196F3" }],
  });
=======
    // 确保图表容器存在（仅在 analysis.html 中执行）
    if (!document.getElementById('trendChart2')) return;

    // 加载最新历史数据
    await loadHistory();

    // 如果没有任何历史记录，则使用默认模拟数据（避免图表空白）
    if (mockHistory.length === 0) {
        console.log("暂无历史数据，使用模拟数据展示");
        mockHistory = [
            { time: '2025-04-01 09:23', image: 'citrus1.jpg', maturity: 85, sugar: 12.3, class: 'ripe_orange' },
            { time: '2025-04-02 10:45', image: 'orange2.jpg', maturity: 32, sugar: 7.8, class: 'unripe_orange' },
            { time: '2025-04-03 16:12', image: 'fruit3.jpg', maturity: 95, sugar: 13.1, class: 'overripe' },
            { time: '2025-04-04 11:30', image: 'sample4.jpg', maturity: 67, sugar: 10.5, class: 'ripe_orange' },
            { time: '2025-04-05 14:20', image: 'test5.jpg', maturity: 12, sugar: 5.2, class: 'unripe_orange' },
            { time: '2025-04-06 09:23', image: 'citrus6.jpg', maturity: 45, sugar: 9.1, class: 'unripe_orange' },
            { time: '2025-04-07 10:45', image: 'orange7.jpg', maturity: 78, sugar: 11.5, class: 'ripe_orange' },
        ];
    }

    // 1. 近7天成熟度趋势（按日期聚合平均成熟度）
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getMonth()+1}-${d.getDate().toString().padStart(2,'0')}`;
        last7Days.push(dateStr);
    }

    // 将记录按日期分组
    const dailyData = {};
    mockHistory.forEach(record => {
        // 假设 time 格式为 "YYYY-MM-DD HH:MM"
        const datePart = record.time.split(' ')[0]; // 取出日期部分 "YYYY-MM-DD"
        if (!dailyData[datePart]) {
            dailyData[datePart] = { totalMaturity: 0, count: 0, rottenCount: 0 };
        }
        dailyData[datePart].totalMaturity += record.maturity;
        dailyData[datePart].count++;
        if (record.class === 'rotten_orange') {
            dailyData[datePart].rottenCount++;
        }
    });

    // 生成最近7天的趋势数据（如果某天无记录，则用前一天的均值或0填充）
    let trendData = [];
    let rottenTrendData = [];
    for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - (6 - i));
        const ymd = targetDate.toISOString().slice(0,10); // YYYY-MM-DD
        if (dailyData[ymd]) {
            const avg = dailyData[ymd].totalMaturity / dailyData[ymd].count;
            trendData.push(avg.toFixed(1));
            const rottenRate = (dailyData[ymd].rottenCount / dailyData[ymd].count * 100).toFixed(1);
            rottenTrendData.push(rottenRate);
        } else {
            // 无记录则使用邻近值或0（此处用0，或可沿用前一天的）
            trendData.push(0);
            rottenTrendData.push(0);
        }
    }

    // 2. 成熟等级分布
    let unripeCount = 0, ripeCount = 0, overripeCount = 0, rottenCount = 0;
    mockHistory.forEach(record => {
        if (record.class === 'unripe_orange') unripeCount++;
        else if (record.class === 'ripe_orange') ripeCount++;
        else if (record.class === 'rotten_orange') rottenCount++;
        else if (record.maturity > 90) overripeCount++; // 过熟按成熟度>90判断
        else if (record.maturity >= 70) ripeCount++;    // 部分成熟归为成熟
        else if (record.maturity < 30) unripeCount++;
        else unripeCount++; // 30-70之间也算未成熟（可根据需要调整）
    });
    // 将腐烂单独作为一个类别，过熟也单独显示（但你的图表原有4个类别：未成熟、部分成熟、成熟、过熟）
    // 这里简化：未成熟（unripe）、成熟（ripe）、过熟（overripe）、腐烂（rotten）
    const maturityDistData = [unripeCount, ripeCount, overripeCount, rottenCount];

    // 3. 糖度分布（按类别统计平均糖度）
    let sugarUnripe = [], sugarRipe = [], sugarOverripe = [], sugarRotten = [];
    mockHistory.forEach(record => {
        const sugar = parseFloat(record.sugar) || 0;
        if (record.class === 'unripe_orange') sugarUnripe.push(sugar);
        else if (record.class === 'ripe_orange') sugarRipe.push(sugar);
        else if (record.class === 'rotten_orange') sugarRotten.push(sugar);
        else if (record.maturity > 90) sugarOverripe.push(sugar);
        else if (record.maturity >= 70) sugarRipe.push(sugar);
        else sugarUnripe.push(sugar);
    });
    const avgSugar = (arr) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : 0;
    const sugarData = [
        avgSugar(sugarUnripe),
        avgSugar(sugarRipe),
        avgSugar(sugarOverripe),
        avgSugar(sugarRotten)
    ];

    // 4. 腐烂比例变化（已与趋势图共用 rottenTrendData）

    // 初始化 ECharts 图表
    const trendChart = echarts.init(document.getElementById('trendChart2'));
    trendChart.setOption({
        title: { text: '近7天成熟度趋势' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: last7Days },
        yAxis: { type: 'value', max: 100, name: '成熟度 %' },
        series: [{ data: trendData, type: 'line', smooth: true, color: '#4caf50' }]
    });

    const barChart = echarts.init(document.getElementById('barChart'));
    barChart.setOption({
        title: { text: '成熟等级分布' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['未成熟', '成熟', '过熟', '腐烂'] },
        yAxis: { type: 'value' },
        series: [{ data: maturityDistData, type: 'bar', color: '#ff9800' }]
    });

    const rottenChart = echarts.init(document.getElementById('rottenChart'));
    rottenChart.setOption({
        title: { text: '腐烂比例变化' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: last7Days },
        yAxis: { type: 'value', name: '比例 %' },
        series: [{ data: rottenTrendData, type: 'line', smooth: true, color: '#f44336' }]
    });

    const sugarChart = echarts.init(document.getElementById('sugarChart'));
    sugarChart.setOption({
        title: { text: '糖度分布（平均）' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['未成熟', '成熟', '过熟', '腐烂'] },
        yAxis: { type: 'value', name: '°Brix' },
        series: [{ data: sugarData, type: 'bar', color: '#2196F3' }]
    });
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
}

// ---------- 预警中心 ----------
async function updateWarning() {
<<<<<<< HEAD
  await loadHistory();
  const rottenCount = mockHistory.filter(
    (r) => r.class === "rotten_orange",
  ).length;
  const total = mockHistory.length;
  const rottenRate = total ? ((rottenCount / total) * 100).toFixed(1) : 0;

  const riskLevel = document.getElementById("riskLevel");
  const riskDesc = document.getElementById("riskDesc");
  const suggestionList = document.getElementById("suggestionList");

  if (!riskLevel) return;

  if (rottenRate > 20) {
    riskLevel.className = "level-high";
    riskLevel.innerText = "高风�?";
    riskDesc.innerText = `当前腐烂�?${rottenRate}%，超�?0%，建议立即巡查果园，考虑提前采摘。`;
    suggestionList.innerHTML =
      "<li>立即组织人员巡查果园</li><li>优先采摘已成熟果�?/li><li>喷洒生物药剂防治</li>";
  } else if (rottenRate > 10) {
    riskLevel.className = "level-medium";
    riskLevel.innerText = "中风�?";
    riskDesc.innerText = `当前腐烂�?${rottenRate}%，建议加强巡查，关注病害。`;
    suggestionList.innerHTML =
      "<li>增加巡查频率</li><li>检查果实是否有伤口</li><li>准备采摘工具</li>";
  } else {
    riskLevel.className = "level-low";
    riskLevel.innerText = "低风�?";
    riskDesc.innerText = `当前腐烂�?${rottenRate}%，果园状态良好。`;
    suggestionList.innerHTML = "<li>继续正常巡查</li><li>7天后复测</li>";
  }
}

// ---------- 页面初始化（修改版）----------
document.addEventListener("DOMContentLoaded", async () => {
  setActiveNav();

  // 根据当前页面执行对应初始化
  const path = window.location.pathname.split("/").pop();

  if (path === "" || path === "index.html") {
    await updateHomePage();
  } else if (path === "detect.html") {
    initDetectPage();
  } else if (path === "data.html") {
    initDataPage();
  } else if (path === "analysis.html") {
    await renderCharts();
  } else if (path === "warning.html") {
    await updateWarning();
    setInterval(updateWarning, 5000);
  } else if (path === "detection_detail.html") {
    await initDetectionDetailPage();
  } else if (path === "about.html") {
    // 无需特殊操作
  }

  // 加载统计数据（可共用？）
  fetch(getApiBaseUrl() + "/stats", {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  })
    .then((res) => res.json())
    .catch((e) => console.log("后端未开启"));

  // ===== 新增：初始化 AI 问答 =====
  initChat();
=======
    await loadHistory();
    const rottenCount = mockHistory.filter(r => r.class === 'rotten_orange').length;
    const total = mockHistory.length;
    const rottenRate = total ? (rottenCount / total * 100).toFixed(1) : 0;

    const riskLevel = document.getElementById('riskLevel');
    const riskDesc = document.getElementById('riskDesc');
    const suggestionList = document.getElementById('suggestionList');

    if (!riskLevel) return;

    if (rottenRate > 20) {
        riskLevel.className = 'level-high';
        riskLevel.innerText = '高风险';
        riskDesc.innerText = `当前腐烂率 ${rottenRate}%，超过20%，建议立即巡查果园，考虑提前采摘。`;
        suggestionList.innerHTML = '<li>立即组织人员巡查果园</li><li>优先采摘已成熟果实</li><li>喷洒生物药剂防治</li>';
    } else if (rottenRate > 10) {
        riskLevel.className = 'level-medium';
        riskLevel.innerText = '中风险';
        riskDesc.innerText = `当前腐烂率 ${rottenRate}%，建议加强巡查，关注病害。`;
        suggestionList.innerHTML = '<li>增加巡查频率</li><li>检查果实是否有伤口</li><li>准备采摘工具</li>';
    } else {
        riskLevel.className = 'level-low';
        riskLevel.innerText = '低风险';
        riskDesc.innerText = `当前腐烂率 ${rottenRate}%，果园状态良好。`;
        suggestionList.innerHTML = '<li>继续正常巡查</li><li>7天后复测</li>';
    }
}

// ---------- 页面初始化（修改版）----------
document.addEventListener('DOMContentLoaded', async () => {
    setActiveNav();

    // 根据当前页面执行对应初始化
    const path = window.location.pathname.split('/').pop();

    if (path === '' || path === 'index.html') {
        await updateHomePage();
    } else if (path === 'detect.html') {
        initDetectPage();
    } else if (path === 'data.html') {
        initDataPage();
    } else if (path === 'analysis.html') {
        await renderCharts();
    } else if (path === 'warning.html') {
        await updateWarning();
        setInterval(updateWarning, 5000);
    } else if (path === 'about.html') {
        // 无需特殊操作
    }

    // 加载统计数据（可共用）
    fetch("http://localhost:5000/stats")
        .then(res => res.json())
        .catch(e => console.log('后端未开启'));

    // ===== 新增：初始化 AI 问答 =====
    initChat();
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
});

// ---------- AI 智能问答 ----------
let chatMessages = []; // 可选的本地消息历史

<<<<<<< HEAD
// 初始化聊天界面DOM元素和事件
function initChat() {
  if (document.querySelector(".chat-toggle")) return;

  const chatToggle = document.createElement("button");
  chatToggle.className = "chat-toggle";
  chatToggle.innerHTML =
    '<i class="fas fa-robot"></i><span class="assistant-badge" id="assistantBadge"></span>';
  document.body.appendChild(chatToggle);

  const chatWindow = document.createElement("div");
  chatWindow.className = "chat-window";
  chatWindow.id = "chatWindow";
  chatWindow.innerHTML = `
        <div class="chat-header" id="assistantHeader">
            <h3><i class="fas fa-robot"></i> 农业智能助手</h3>
            <div class="assistant-actions">
              <button class="assistant-btn" id="assistantReset" title="复位"><i class="fas fa-undo"></i></button>
              <button class="assistant-btn" id="assistantMinimize" title="最小化"><i class="fas fa-minus"></i></button>
              <button class="assistant-btn" id="closeChat" title="关闭"><i class="fas fa-times"></i></button>
            </div>
=======
// 初始化聊天相关 DOM 元素和事件
function initChat() {
    // 如果已经存在聊天按钮，则不再重复添加
    if (document.querySelector('.chat-toggle')) return;

    // 创建聊天按钮和窗口（如果页面中未包含 HTML，这里动态创建；但建议直接在 HTML 中添加）
    // 为了兼容可能未在 HTML 中添加的情况，我们动态创建
    const chatToggle = document.createElement('button');
    chatToggle.className = 'chat-toggle';
    chatToggle.innerHTML = '<i class="fas fa-robot"></i>';
    document.body.appendChild(chatToggle);

    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.id = 'chatWindow';
    chatWindow.innerHTML = `
        <div class="chat-header">
            <h3><i class="fas fa-robot"></i> 农业智能助手</h3>
            <button class="close-btn" id="closeChat"><i class="fas fa-times"></i></button>
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="message bot">
                你好！我是你的农业助手，有什么关于柑橘种植、成熟度检测的问题可以问我哦~
            </div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chatInput" placeholder="输入你的问题...">
<<<<<<< HEAD
            <button id="sendMessage">发�?/button>
        </div>
        <div class="assistant-resize-handle assistant-resize-n" data-dir="n"></div>
        <div class="assistant-resize-handle assistant-resize-s" data-dir="s"></div>
        <div class="assistant-resize-handle assistant-resize-e" data-dir="e"></div>
        <div class="assistant-resize-handle assistant-resize-w" data-dir="w"></div>
        <div class="assistant-resize-handle assistant-resize-ne" data-dir="ne"></div>
        <div class="assistant-resize-handle assistant-resize-nw" data-dir="nw"></div>
        <div class="assistant-resize-handle assistant-resize-se" data-dir="se"></div>
        <div class="assistant-resize-handle assistant-resize-sw" data-dir="sw"></div>
    `;
  document.body.appendChild(chatWindow);

  const closeBtn = document.getElementById("closeChat");
  const resetBtn = document.getElementById("assistantReset");
  const minimizeBtn = document.getElementById("assistantMinimize");
  const sendBtn = document.getElementById("sendMessage");
  const chatInput = document.getElementById("chatInput");
  const messagesContainer = document.getElementById("chatMessages");
  const header = document.getElementById("assistantHeader");
  const badge = document.getElementById("assistantBadge");
  const resizeHandles = Array.from(
    chatWindow.querySelectorAll(".assistant-resize-handle"),
  );

  const POSITION_KEY = "assistant_position";
  const SIZE_KEY = "assistant_size";
  const MINIMIZED_KEY = "assistant_minimized";

  function isMobile() {
    return (
      window.matchMedia("(max-width: 576px)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function applyDefaultLayout() {
    chatWindow.style.width = "350px";
    chatWindow.style.height = "500px";
    chatWindow.style.left = "";
    chatWindow.style.top = "";
    chatWindow.style.right = "30px";
    chatWindow.style.bottom = "100px";
  }

  function applySavedLayout() {
    const pos = readJson(POSITION_KEY, null);
    const size = readJson(SIZE_KEY, null);

    if (
      size &&
      typeof size.width === "number" &&
      typeof size.height === "number"
    ) {
      chatWindow.style.width = `${size.width}px`;
      chatWindow.style.height = `${size.height}px`;
    }

    if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
      chatWindow.style.right = "";
      chatWindow.style.bottom = "";
      chatWindow.style.left = `${pos.x}px`;
      chatWindow.style.top = `${pos.y}px`;
    } else {
      chatWindow.style.left = "";
      chatWindow.style.top = "";
      chatWindow.style.right = "30px";
      chatWindow.style.bottom = "100px";
    }
  }

  function savePosition(x, y) {
    writeJson(POSITION_KEY, { x, y });
  }

  function saveSize(width, height) {
    writeJson(SIZE_KEY, { width, height });
  }

  function refreshBadge() {
    const pending =
      window.assistantReconnect &&
      typeof window.assistantReconnect.pendingCount === "function"
        ? window.assistantReconnect.pendingCount()
        : 0;
    if (!badge) return;
    if (pending > 0) {
      badge.textContent = String(pending);
      badge.classList.add("show");
    } else {
      badge.textContent = "";
      badge.classList.remove("show");
    }
  }

  applySavedLayout();
  refreshBadge();

  if (isMobile()) {
    resizeHandles.forEach((h) => {
      if (h.dataset.dir !== "se") h.style.display = "none";
    });
  }

  chatToggle.addEventListener("click", () => {
    localStorage.setItem(MINIMIZED_KEY, "0");
    chatWindow.classList.add("open");
    applySavedLayout();
    if (
      window.assistantReconnect &&
      typeof window.assistantReconnect.flush === "function"
    ) {
      window.assistantReconnect.flush().finally(refreshBadge);
    } else {
      refreshBadge();
    }
  });

  closeBtn.addEventListener("click", () => {
    chatWindow.classList.remove("open");
  });

  minimizeBtn.addEventListener("click", () => {
    localStorage.setItem(MINIMIZED_KEY, "1");
    chatWindow.classList.remove("open");
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(POSITION_KEY);
    localStorage.removeItem(SIZE_KEY);
    localStorage.removeItem(MINIMIZED_KEY);
    applyDefaultLayout();
    refreshBadge();
  });

  window.addEventListener("online", () => {
    if (
      window.assistantReconnect &&
      typeof window.assistantReconnect.flush === "function"
    ) {
      window.assistantReconnect.flush().finally(refreshBadge);
    } else {
      refreshBadge();
    }
  });

  async function sendUserMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage("user", text);
    chatInput.value = "";

    sendBtn.disabled = true;
    const typingIndicator = appendMessage("bot", "正在输入...", true);

    try {
      const sessionId = localStorage.getItem("ai_chat_session_id");
      const reqPayload = { message: text, session_id: sessionId };

      const response = await fetch(getApiBaseUrl() + "/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(reqPayload),
      });
      const data = await response.json();

      if (data.session_id) {
        localStorage.setItem("ai_chat_session_id", data.session_id);
      }

      typingIndicator.remove();
      appendMessage("bot", data.reply || "抱歉，我没有理解你的问题？");

      const retryable = data && data.retryable === true;
      if (!response.ok || retryable) {
        if (
          window.assistantReconnect &&
          typeof window.assistantReconnect.enqueue === "function"
        ) {
          window.assistantReconnect.enqueue({
            message: text,
            session_id: sessionId || data.session_id || null,
            url: "/chat",
          });
        }
        refreshBadge();
      } else {
        if (
          window.assistantReconnect &&
          typeof window.assistantReconnect.flush === "function"
        ) {
          window.assistantReconnect.flush().finally(refreshBadge);
        } else {
          refreshBadge();
        }
      }
    } catch (error) {
      console.error("聊天接口错误:", error);
      typingIndicator.remove();
      appendMessage(
        "bot",
        "暂时无法连接智能助手，但你可以继续提问。我会记住你的问题？",
      );
      const sessionId = localStorage.getItem("ai_chat_session_id");
      if (
        window.assistantReconnect &&
        typeof window.assistantReconnect.enqueue === "function"
      ) {
        window.assistantReconnect.enqueue({
          message: text,
          session_id: sessionId || null,
          url: "/chat",
        });
      }
      refreshBadge();
    } finally {
      sendBtn.disabled = false;
    }
  }

  function appendMessage(sender, content, isTyping = false) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    if (
      sender === "bot" &&
      !isTyping &&
      typeof window.renderMarkdownToHtml === "function"
    ) {
      msgDiv.classList.add("assistant-markdown-message");
      msgDiv.innerHTML = window.renderMarkdownToHtml(content);
    } else {
      msgDiv.textContent = content;
    }
    if (isTyping) {
      msgDiv.id = "typingIndicator";
    }
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgDiv;
  }

  sendBtn.addEventListener("click", sendUserMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendUserMessage();
  });

  if (!isMobile()) {
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".assistant-actions")) return;
      dragging = true;
      document.body.classList.add("assistant-no-select");
      header.setPointerCapture(e.pointerId);
      const rect = chatWindow.getBoundingClientRect();
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      chatWindow.style.right = "";
      chatWindow.style.bottom = "";
      chatWindow.style.left = `${rect.left}px`;
      chatWindow.style.top = `${rect.top}px`;
    });

    header.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const rect = chatWindow.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const maxX = window.innerWidth - w;
      const maxY = window.innerHeight - h;
      const x = clamp(startLeft + dx, 0, maxX);
      const y = clamp(startTop + dy, 0, maxY);
      chatWindow.style.left = `${x}px`;
      chatWindow.style.top = `${y}px`;
    });

    header.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("assistant-no-select");
      const rect = chatWindow.getBoundingClientRect();
      savePosition(Math.round(rect.left), Math.round(rect.top));
    });
  }

  let resizing = false;
  let resizeDir = "";
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartW = 0;
  let resizeStartH = 0;
  let resizeStartL = 0;
  let resizeStartT = 0;

  function onResizeStart(e) {
    resizing = true;
    resizeDir = e.currentTarget.dataset.dir;
    document.body.classList.add("assistant-no-select");
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = chatWindow.getBoundingClientRect();
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = rect.width;
    resizeStartH = rect.height;
    resizeStartL = rect.left;
    resizeStartT = rect.top;
    chatWindow.style.right = "";
    chatWindow.style.bottom = "";
    chatWindow.style.left = `${rect.left}px`;
    chatWindow.style.top = `${rect.top}px`;
  }

  function onResizeMove(e) {
    if (!resizing) return;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;
    const minW = 320;
    const minH = 240;
    const maxW = Math.floor(window.innerWidth * 0.8);
    const maxH = Math.floor(window.innerHeight * 0.8);

    let newW = resizeStartW;
    let newH = resizeStartH;
    let newL = resizeStartL;
    let newT = resizeStartT;

    if (resizeDir.includes("e")) newW = resizeStartW + dx;
    if (resizeDir.includes("s")) newH = resizeStartH + dy;
    if (resizeDir.includes("w")) {
      newW = resizeStartW - dx;
      newL = resizeStartL + dx;
    }
    if (resizeDir.includes("n")) {
      newH = resizeStartH - dy;
      newT = resizeStartT + dy;
    }

    newW = clamp(newW, minW, maxW);
    newH = clamp(newH, minH, maxH);

    const maxX = window.innerWidth - newW;
    const maxY = window.innerHeight - newH;
    newL = clamp(newL, 0, maxX);
    newT = clamp(newT, 0, maxY);

    chatWindow.style.width = `${Math.round(newW)}px`;
    chatWindow.style.height = `${Math.round(newH)}px`;
    chatWindow.style.left = `${Math.round(newL)}px`;
    chatWindow.style.top = `${Math.round(newT)}px`;
  }

  function onResizeEnd() {
    if (!resizing) return;
    resizing = false;
    document.body.classList.remove("assistant-no-select");
    const rect = chatWindow.getBoundingClientRect();
    savePosition(Math.round(rect.left), Math.round(rect.top));
    saveSize(Math.round(rect.width), Math.round(rect.height));
  }

  resizeHandles.forEach((h) => {
    h.addEventListener("pointerdown", onResizeStart);
    h.addEventListener("pointermove", onResizeMove);
    h.addEventListener("pointerup", onResizeEnd);
    h.addEventListener("pointercancel", onResizeEnd);
  });
}
=======
            <button id="sendMessage">发送</button>
        </div>
    `;
    document.body.appendChild(chatWindow);

    // 获取元素
    const closeBtn = document.getElementById('closeChat');
    const sendBtn = document.getElementById('sendMessage');
    const chatInput = document.getElementById('chatInput');
    const messagesContainer = document.getElementById('chatMessages');

    // 打开聊天窗口
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('open');
    });

    // 关闭聊天窗口
    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    // 发送消息
    async function sendUserMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 添加用户消息
        appendMessage('user', text);
        chatInput.value = '';

        // 禁用发送按钮，防止重复发送
        sendBtn.disabled = true;

        // 显示“正在输入”占位
        const typingIndicator = appendMessage('bot', '正在输入...', true);

        try {
            // 调用后端 AI 接口（请根据实际情况修改 URL）
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            // 移除“正在输入”
            typingIndicator.remove();
            // 添加机器人回复
            appendMessage('bot', data.reply || '抱歉，我没有理解你的问题。');
        } catch (error) {
            console.error('聊天接口错误:', error);
            typingIndicator.remove();
            // 模拟回复（当后端不可用时）
            appendMessage('bot', '暂时无法连接智能助手，但你可以继续提问。我会记住你的问题。');
        } finally {
            sendBtn.disabled = false;
        }
    }

    // 辅助函数：添加消息到聊天框
    function appendMessage(sender, content, isTyping = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = content;
        if (isTyping) {
            msgDiv.id = 'typingIndicator';
        }
        messagesContainer.appendChild(msgDiv);
        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return msgDiv;
    }

    sendBtn.addEventListener('click', sendUserMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendUserMessage();
    });
}

// 在页面加载完成后初始化聊天
document.addEventListener('DOMContentLoaded', () => {
    // 原有的初始化代码保持不变，我们在其后添加
    // 为了保证顺序，可以将原代码包裹在一个函数中，然后在这里调用，但为简洁，我们直接追加
    // 注意：原代码中已有 DOMContentLoaded 监听器，我们需要合并，或者将本代码放在原监听器内部末尾
    // 由于原代码已经存在 DOMContentLoaded 监听器，我们不能重复添加，因此需要修改原监听器。
    // 但为了最小改动，我们可以在原 DOMContentLoaded 内部调用 initChat。
});

// 为了不破坏原有结构，我建议你将原 DOMContentLoaded 的内容包裹在一个函数中，然后在新监听器中同时调用。
// 或者直接修改原 DOMContentLoaded 回调，在末尾加上 initChat()。
// 这里我给出修改后的完整 DOMContentLoaded 部分（需要替换原有部分）。
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
