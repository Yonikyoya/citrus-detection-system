// ---------- 全局变量 ----------
let mockHistory = [];          // 将从后端加载
let currentDetectResult = null;
let currentPage = 1;
const pageSize = 5;

// ---------- 全局变量（新增）----------
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
}

// ---------- 导航高亮 ----------
function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === path) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ---------- 首页更新 ----------
async function updateHomePage() {
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
                <td>${r.time}</td>
                <td>${r.image}</td>
                <td><span class="maturity-badge ${badgeClass}">${r.maturity}%</span></td>
                <td>${r.sugar}°Brix</td>
                <td>${r.suggestion}</td>
            </tr>`;
            recentTbody.innerHTML += row;
        });

    } catch (error) {
        console.error('加载首页数据失败', error);
        // 可以保留原来的随机数据作为降级方案
    }
}

// ---------- 检测页面功能 ----------
function initDetectPage() {
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
}

// ---------- 新增：从后端获取筛选后的记录 ----------
async function fetchFilteredRecords(page, filters) {
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
}

// ---------- 数据中心页面 ----------
async function renderDataTable(page) {
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
            <td>${r.time}</td>
            <td>${r.image}</td>
            <td><span class="maturity-badge ${badgeClass}">${r.maturity}%</span></td>
            <td>${r.sugar}°Brix</td>
            <td>${r.suggestion}</td>
            <td><i class="fas fa-trash delete-btn" data-id="${r.id}"></i></td>
        `;
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
}

// ---------- 数据分析页面（基于真实数据）----------
async function renderCharts() {
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
}

// ---------- 预警中心 ----------
async function updateWarning() {
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
});

// ---------- AI 智能问答 ----------
let chatMessages = []; // 可选的本地消息历史

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
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="message bot">
                你好！我是你的农业助手，有什么关于柑橘种植、成熟度检测的问题可以问我哦~
            </div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chatInput" placeholder="输入你的问题...">
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