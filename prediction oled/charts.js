function calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXsq = x.reduce((a, b) => a + b * b, 0);
    const sumYsq = y.reduce((a, b) => a + b * b, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt((n * sumXsq - sumX * sumX) * (n * sumYsq - sumY * sumY));

    return numerator / denominator;
}
let chartStates = {}; // 用於記錄每張圖表的狀態

function highlightClickedPoint(chartId, pointIndex, tableId, spectrumContainerId) {


    // 初始化狀態
    if (!chartStates[chartId]) {
        chartStates[chartId] = {
            originalColors: [],
            originalSizes: [],
            lastMarkedPoint: null,
        };
    }

    const chart = document.getElementById(chartId);
    if (!chart) {
        console.error(`未找到圖表元素，chartId: ${chartId}`);
        return;
    }

    const data = chart.data[0];
    const chartState = chartStates[chartId];

    if (!data || !data.marker || !data.marker.color || !data.marker.size) {
        console.error(`圖表 ${chartId} 中未找到有效的 marker 數據`);
        return;
    }

    // 初始化原始樣式
    if (chartState.originalColors.length === 0) {
        chartState.originalColors = [...data.marker.color];
        chartState.originalSizes = [...data.marker.size];
    }

    // 邊界檢查
    if (pointIndex < 0 || pointIndex >= data.marker.color.length) {
        console.error(`點索引 ${pointIndex} 超出範圍（可用範圍: 0-${data.marker.color.length - 1}）`);
        return;
    }

    // 恢復上一個高亮點
    if (chartState.lastMarkedPoint !== null) {
        const lastIndex = chartState.lastMarkedPoint;
        data.marker.color[lastIndex] = chartState.originalColors[lastIndex];
        data.marker.size[lastIndex] = chartState.originalSizes[lastIndex];
    }

    // 高亮或取消高亮當前點
    if (chartState.lastMarkedPoint === pointIndex) {
        chartState.lastMarkedPoint = null; // 取消高亮
        const donorCanvasId = `clickedDonorCanvas${chartId.split('chart')[1]}`;
        const acceptorCanvasId = `clickedAcceptorCanvas${chartId.split('chart')[1]}`;

        // 清空相關元素
        document.getElementById(tableId).innerHTML = "";
        document.getElementById(spectrumContainerId).innerHTML = "";
        changeCanvasLabelColor(donorCanvasId, 'white');
        changeCanvasLabelColor(acceptorCanvasId, 'white');
        clearCanvas(donorCanvasId);
        clearCanvas(acceptorCanvasId);

        console.log(`已清空 tableId: ${tableId}, spectrumContainerId: ${spectrumContainerId}, donorCanvasId: ${donorCanvasId}, acceptorCanvasId: ${acceptorCanvasId}`);
    } else {
        data.marker.color[pointIndex] = 'yellow';
        data.marker.size[pointIndex] = 12;
        chartState.lastMarkedPoint = pointIndex; // 記錄當前高亮點
    }

    // 更新圖表
    Plotly.restyle(chartId, {
        'marker.color': [data.marker.color.slice()],
        'marker.size': [data.marker.size.slice()],
    });

    console.log(`圖表 ${chartId} 成功高亮點索引: ${pointIndex}`);
}











function findMatchingSMILES(inputDonor, inputAcceptor) {
    // 使用你提供的函數來查找 SMILES
    const donorSMILES = findDonorSmiles(inputDonor);
    const acceptorSMILES = findAcceptorSmiles(inputAcceptor);

    // Log 是否找到了 Donor 和 Acceptor 的 SMILES
    if (donorSMILES) {
        console.log(`找到 Donor 的 SMILES: ${donorSMILES} (Donor: ${inputDonor})`);
    } else {
        console.log(`未找到 Donor 的 SMILES (Donor: ${inputDonor})`);
    }

    if (acceptorSMILES) {
        console.log(`找到 Acceptor 的 SMILES: ${acceptorSMILES} (Acceptor: ${inputAcceptor})`);
    } else {
        console.log(`未找到 Acceptor 的 SMILES (Acceptor: ${inputAcceptor})`);
    }

    return { donorSMILES, acceptorSMILES };
}

function highlightItemsBySMILES(data, donorSMILES, acceptorSMILES, homodData, lumodData, bandgapDonorData, homoaData, lumoaData, bandgapAcceptorData) {
    // 找到所有匹配 Donor SMILES 的項目
    const donorItems = data.filter(item => item['Donor SMILES'] === donorSMILES);

    // 找到所有匹配 Acceptor SMILES 的項目
    const acceptorItems = data.filter(item => item['Acceptor SMILES'] === acceptorSMILES);

    // Log 匹配的數量
    console.log(`找到 ${donorItems.length} 個與 Donor SMILES 匹配的材料 (${donorSMILES})`);
    console.log(`找到 ${acceptorItems.length} 個與 Acceptor SMILES 匹配的材料 (${acceptorSMILES})`);

    donorItems.forEach(donorItem => {
        const inputLabel = `${donorItem.Donor}–${donorItem.Acceptor}`;
        console.log(`查找 Donor 標籤: ${inputLabel}`);
        
        let found = false;
        homodData.text.forEach((label, index) => {
            if (label === inputLabel) { // 使用嚴格相等比較
                found = true;
                homodData.marker.color[index] = 'red';
                lumodData.marker.color[index] = 'red';
                bandgapDonorData.marker.color[index] = 'red';
            }
        });
    
        if (!found) {
            console.log(`未找到匹配的 Donor 標籤: ${inputLabel}`);
        }
    });
    
    

     // 高亮 Acceptor SMILES 匹配的數據點
     acceptorItems.forEach(acceptorItem => {
        const inputLabel = `${acceptorItem.Donor}–${acceptorItem.Acceptor}`;
        console.log(`查找 Acceptor 標籤: ${inputLabel}`);

        let found = false;
        homoaData.text.forEach((label, index) => {
            console.log(`查找 Acceptor 標籤: ${inputLabel}`);
            if (label=== inputLabel) {
                found = true;
                homoaData.marker.color[index] = 'red';
                lumoaData.marker.color[index] = 'red';
                bandgapAcceptorData.marker.color[index] = 'red';
            }
        });

        if (!found) {
            console.log(`未找到匹配的 Acceptor 標籤: ${inputLabel}`);
        }
    });
}



function highlightPerformanceItems(data, donorSMILES, acceptorSMILES, pceData, vocData, jscData, ffData) {
    // Constants for highlight colors
    const DONOR_COLOR = 'red';
    const ACCEPTOR_COLOR = 'blue';
    const BOTH_COLOR = 'green'; // 新增同時匹配 Donor 和 Acceptor 的顏色

    // Create a lookup map for quicker label indexing
    const labelIndexMap = new Map();
    pceData.text.forEach((label, index) => {
        labelIndexMap.set(label, index);
    });

    // Highlight matching donor items
    const donorItems = data.filter(item => item['Donor SMILES'] === donorSMILES);
    const acceptorItems = data.filter(item => item['Acceptor SMILES'] === acceptorSMILES);

    donorItems.forEach(donorItem => {
        const inputLabel = `${donorItem.Donor}–${donorItem.Acceptor}`;
        let found = false;
        
        // 搜尋捐贈體匹配的 PCE、Voc、Jsc、FF 數據點並高亮
        if (labelIndexMap.has(inputLabel)) {
            const index = labelIndexMap.get(inputLabel);
            found = true;

            // 檢查是否同時符合 Acceptor 條件
            const isAcceptorMatch = acceptorItems.some(acceptorItem => `${acceptorItem.Donor}–${acceptorItem.Acceptor}` === inputLabel);

            // 如果同時匹配 Donor 和 Acceptor，設為綠色
            if (isAcceptorMatch) {
                pceData.marker.color[index] = BOTH_COLOR;
                vocData.marker.color[index] = BOTH_COLOR;
                jscData.marker.color[index] = BOTH_COLOR;
                ffData.marker.color[index] = BOTH_COLOR;
            } else {
                // 只匹配 Donor，設為紅色
                pceData.marker.color[index] = DONOR_COLOR;
                vocData.marker.color[index] = DONOR_COLOR;
                jscData.marker.color[index] = DONOR_COLOR;
                ffData.marker.color[index] = DONOR_COLOR;
            }
        }
        
        if (!found) {
            console.log(`未找到匹配的 Donor 標籤: ${inputLabel}`);
        }
    });

    // Highlight matching acceptor items
    acceptorItems.forEach(acceptorItem => {
        const inputLabel = `${acceptorItem.Donor}–${acceptorItem.Acceptor}`;
        let found = false;

        if (labelIndexMap.has(inputLabel)) {
            const index = labelIndexMap.get(inputLabel);
            found = true;

            // 如果尚未被設為綠色，才將顏色設為藍色
            if (pceData.marker.color[index] !== BOTH_COLOR) {
                pceData.marker.color[index] = ACCEPTOR_COLOR;
                vocData.marker.color[index] = ACCEPTOR_COLOR;
                jscData.marker.color[index] = ACCEPTOR_COLOR;
                ffData.marker.color[index] = ACCEPTOR_COLOR;
            }
        }

        if (!found) {
            console.log(`未找到匹配的 Acceptor 標籤: ${inputLabel}`);
        }
    });
}

function highlightPerformanceByName(data, inputDonor, inputAcceptor, pceData, vocData, jscData, ffData) {
    // 使用 findMatchingSMILES 函數來查找 Donor 和 Acceptor 的 SMILES
    const { donorSMILES, acceptorSMILES } = findMatchingSMILES(inputDonor, inputAcceptor);

    if (donorSMILES && acceptorSMILES) {
        console.log(`找到 Donor SMILES: ${donorSMILES}，Acceptor SMILES: ${acceptorSMILES}`);
        // 使用 SMILES 來高亮匹配的數據點
        highlightPerformanceItems(data, donorSMILES, acceptorSMILES, pceData, vocData, jscData, ffData);
    } else {
        if (!donorSMILES) console.log(`未找到 Donor 的 SMILES: ${inputDonor}`);
        if (!acceptorSMILES) console.log(`未找到 Acceptor 的 SMILES: ${inputAcceptor}`);
    }
}

function exportToCSV(data, filename) {
    // 將數據轉換為 CSV 格式
    const csvContent = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    
    // 建立下載連結
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = "none";
    
    // 觸發下載
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function resetWithoutHighlight(data, inputDonor, inputAcceptor, type, chartId,tableId,spectrumContainerId) {
    // 重繪圖表並跳過高亮
    plotPropertyGraphs(data, inputDonor, inputAcceptor, type, true, chartId);
    const donorCanvasId = `clickedDonorCanvas${chartId.split('chart')[1]}`;
    const acceptorCanvasId = `clickedAcceptorCanvas${chartId.split('chart')[1]}`;

    // 清空相關元素
    document.getElementById(tableId).innerHTML = "";
    document.getElementById(spectrumContainerId).innerHTML = "";
    changeCanvasLabelColor(donorCanvasId, 'white');
    changeCanvasLabelColor(acceptorCanvasId, 'white');
    clearCanvas(donorCanvasId);
    clearCanvas(acceptorCanvasId);

}
function resetChart(data, inputDonor, inputAcceptor, type, chartId,tableId,spectrumContainerId) {
    // 完全重繪圖表，並包含高亮
    plotPropertyGraphs(data, inputDonor, inputAcceptor, type, false, chartId);
    const donorCanvasId = `clickedDonorCanvas${chartId.split('chart')[1]}`;
    const acceptorCanvasId = `clickedAcceptorCanvas${chartId.split('chart')[1]}`;

    // 清空相關元素
    document.getElementById(tableId).innerHTML = "";
    document.getElementById(spectrumContainerId).innerHTML = "";
    changeCanvasLabelColor(donorCanvasId, 'white');
    changeCanvasLabelColor(acceptorCanvasId, 'white');
    clearCanvas(donorCanvasId);
    clearCanvas(acceptorCanvasId);
}


function plotPLQY_EQE(data, opts = {}) {
  const {
    plqyId = 'chartPLQY',
    eqeId  = 'chartEQE',
    responsive = true,
    chartId = null,

    highlight = null,

    titleIdPLQY = 'titlePLQY',
    canvasIdPLQY = 'clickedMaterialCanvasPLQY',
    tableIdPLQY = 'tablePLQY_click',

    titleIdEQE = 'titleEQE',
    canvasIdEQE = 'clickedMaterialCanvasEQE',
    tableIdEQE = 'tableEQE_click',

    onRenderStructure = (smiles, canvasId) => {
      if (typeof renderSmiles === 'function' && smiles && canvasId) {
        renderSmiles(smiles, canvasId);
      }
    },

    clickHighlightColor = 'gold',
    clickHighlightSizeBump = 4,
    syncSiblingHighlight = true,
  } = opts;

  const toNum = v => (v == null || v === '' ? NaN : Number(v));
  const isNum = v => Number.isFinite(v);
  const corr = (xs, ys) => {
    const n = xs.length;
    if (!n) return NaN;
    const mx = xs.reduce((a,b)=>a+b,0)/n;
    const my = ys.reduce((a,b)=>a+b,0)/n;
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i=0;i<n;i++){ const dx = xs[i]-mx, dy = ys[i]-my; num += dx*dy; dx2 += dx*dx; dy2 += dy*dy; }
    return (dx2===0 || dy2===0) ? NaN : (num / Math.sqrt(dx2*dy2));
  };
  const toSet = v => v == null ? new Set() : new Set([].concat(v));
  const hiSet = toSet(highlight);

  const mkTrace = (title) => ({
    name: title,
    x: [], y: [], text: [],
    mode: 'markers',
    type: 'scatter',
    marker: { size: [], color: [], opacity: 0.9, line: { width: 0.1 } },
    hovertemplate: 'Exp: %{x:.4f}<br>Pred: %{y:.4f}<br>%{text}<extra></extra>',
  });

  const trPLQY = mkTrace('PLQY');
  const trEQE  = mkTrace('EQE');
  const byEmitter = new Map();

  const arr = Array.isArray(data) ? data : (data ? [data] : []);

  for (const item of arr) {
    const label = (item?.emitter ?? '').toString();
    if (label) byEmitter.set(label, item);

    const x1 = toNum(item?.plqy);
    const y1 = toNum(item?.['plqy.1']);
    if (isNum(x1) && isNum(y1)) {
      trPLQY.x.push(x1); trPLQY.y.push(y1); trPLQY.text.push(label);
      const hi = label && hiSet.has(label);
      trPLQY.marker.size.push(hi ? 10 : 6);
      trPLQY.marker.color.push(hi ? 'red' : 'black');
    }

    const x2 = toNum(item?.EQE);
    const y2 = toNum(item?.['EQE.1']);
    if (isNum(x2) && isNum(y2)) {
      trEQE.x.push(x2); trEQE.y.push(y2); trEQE.text.push(label);
      const hi = label && hiSet.has(label);
      trEQE.marker.size.push(hi ? 10 : 6);
      trEQE.marker.color.push(hi ? 'red' : 'black');
    }
  }

  // --- 後續 drawOne 和 click handler 跟原來相同 ---
  // (這裡不重複貼，可以直接保留你先前版本的 drawOne/renderTable/applyHighlight)



 

  // -------- 點擊高亮：狀態與輔助 --------
  const chartState = {}; // { [containerId]: { baseColors, baseSizes, idxByEmitter } }

  function buildIdxByEmitter(trace) {
    const map = new Map();
    trace.text.forEach((label, i) => {
      if (!label) return;
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(i);
    });
    return map;
  }

  function applyHighlight(containerId, indices, sizeBump = clickHighlightSizeBump, color = clickHighlightColor) {
    const st = chartState[containerId];
    if (!st) return;
    const colors = st.baseColors.slice();
    const sizes  = st.baseSizes.slice();
    (indices || []).forEach(i => {
      if (i == null || i < 0 || i >= sizes.length) return;
      colors[i] = color;
      sizes[i]  = Math.max(st.baseSizes[i] + sizeBump, 10);
    });
    Plotly.restyle(containerId, { 'marker.color': [colors], 'marker.size': [sizes] }, [0]);
  }

  // -------- 表格渲染（中文樣式 + 誤差%）--------
  function renderTable(targetId, { title, rows }) {
    const host = document.getElementById(targetId);
    if (!host) return;

    // rows 形式：
    // ['PLQY (Experiment)', v], ['PLQY (Prediction)', v], ['EQE (Experiment)', v], ['EQE (Prediction)', v]
    const agg = {}; // { PLQY:{exp, pred}, EQE:{exp, pred} }
    for (const [k, v] of (rows || [])) {
      const m = String(k).match(/^(PLQY|EQE)\s*\((Experiment|Prediction)\)/i);
      if (!m) continue;
      const name = m[1].toUpperCase();
      const which = m[2].toLowerCase();
      if (!agg[name]) agg[name] = {};
      agg[name][which === 'experiment' ? 'exp' : 'pred'] = v;
    }

    const stripZeros = (s) =>
      String(s).replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'');
    const fmtExp = (v) => { // 實驗值：保留原樣或四位後去零
      if (v == null || v === '' || (typeof v === 'number' && !isFinite(v))) return '—';
      if (typeof v === 'string') return stripZeros(v);
      return stripZeros(Number(v).toFixed(4));
    };
    const fmtPred = (v) => { // 預測值：固定三位
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(3) : '—';
    };
    const percentErr = (exp, pred) => { // 相對誤差 %
      const a = Number(exp), b = Number(pred);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return '—';
      if (a === 0) return (Math.abs(b) < 1e-12) ? '0.00%' : '—';
      const pe = Math.abs((b - a) / a) * 100;
      return `${pe.toFixed(2)}%`;
    };

    const order = ['PLQY', 'EQE'];
    const dataRows = order
      .filter(name => agg[name] && (agg[name].exp != null || agg[name].pred != null))
      .map(name => {
        const exp = agg[name].exp;
        const pred = agg[name].pred;
        return {
          name,
          expDisp: fmtExp(exp),
          predDisp: fmtPred(pred),
          err: percentErr(exp, pred)
        };
      });

    const css = `
      .cn-table { border-collapse: collapse; width: 100%; max-width: 680px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans', Arial, 'Microsoft JhengHei', sans-serif; }
      .cn-table th, .cn-table td { border: 2px solid #999; padding: 10px 14px; text-align: center; }
      .cn-table th { background: #f5f5f5; font-weight: 700; }
      .cn-table td.name { text-align: center; padding-left: 0; font-weight: 700; }
      .cn-table td { font-variant-numeric: tabular-nums; }
      .cn-title {
        margin: 8px 0 10px; font-weight: 800; font-size: 22px;
        line-height: 1.25; letter-spacing: .2px; word-break: break-word;
      }
    `;

    let html = `<style>${css}</style>`;
    if (title) html += `<div class="cn-title">${title}</div>`;
    html += `<table class="cn-table">
      <thead>
        <tr>
          <th>參數</th>
          <th>實驗值</th>
          <th>預測值</th>
          <th>誤差</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows.map(r => `
          <tr>
            <td class="name">${r.name}</td>
            <td>${r.expDisp}</td>
            <td>${r.predDisp}</td>
            <td>${r.err}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
    host.innerHTML = html;
  }

  // -------- 單張圖繪製 + 點擊處理（含高亮）--------
  const drawOne = (containerId, trace, title, tableId, canvasId, titleId, siblingId = null) => {
    if (!trace.x.length) {
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = '<div style="padding:8px;color:#666">無可繪製的資料</div>';
      return;
    }

    const r = corr(trace.x, trace.y);
    const minXY = Math.min(...trace.x, ...trace.y);
    const maxXY = Math.max(...trace.x, ...trace.y);

    const layout = {
      title,
      hovermode: 'closest',
      showlegend: false,
      width: 1000,     // ← 增加寬度
      height: 1000,    // ← 增加高度
      xaxis: { title: `Experiment ${title}` },
      yaxis: { title: `Prediction ${title}` },
      annotations: [{
        xref: 'paper', yref: 'paper',
        x: 1, y: 0, xanchor: 'right', yanchor: 'bottom',
        text: `r = ${Number.isFinite(r) ? r.toFixed(3) : 'NaN'}<br>紅色為搜尋材料<br>黃色為點擊材料`,
        showarrow: false
      }],
      shapes: [{
        type: 'line',
        x0: minXY, y0: minXY,
        x1: maxXY, y1: maxXY,
        line: { width: 1, dash: 'dash' }
      }],
    };

    Plotly.newPlot(containerId, [trace], layout, { responsive });

    // 初始化本圖的 base 狀態（含先驗高亮）
    chartState[containerId] = {
      baseColors: trace.marker.color.slice(),
      baseSizes:  trace.marker.size.slice(),
      idxByEmitter: buildIdxByEmitter(trace)
    };

    const el = document.getElementById(containerId);
    if (!el) return;

    // 清掉舊的點擊 handler（避免重複綁定）
    if (el.__plotlyClickHandler && el.removeListener) {
      el.removeListener('plotly_click', el.__plotlyClickHandler);
    } else if (el.removeAllListeners) {
      el.removeAllListeners('plotly_click');
    }

    el.__plotlyClickHandler = (evt) => {
      if (!evt?.points?.length) return;
      const p = evt.points[0];
      const emitter = (p.text || '').toString();

      // (A) 高亮本圖點
      applyHighlight(containerId, [p.pointIndex]);

      // (B) 同步高亮兄弟圖
      if (syncSiblingHighlight && siblingId && chartState[siblingId]) {
        const idxs = chartState[siblingId].idxByEmitter.get(emitter) || [];
        applyHighlight(siblingId, idxs);
      }

      // (C) 顯示結構標題
      if (titleId) {
        const t = document.getElementById(titleId);
        if (t) {
          t.textContent = emitter;
          Object.assign(t.style, {
            fontSize: '22px',
            fontWeight: '700',
            lineHeight: '1.25',
            margin: '8px 0 6px',
            letterSpacing: '0.2px',
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          });
        }
      }

      const item = byEmitter.get(emitter);
      if (!item) {
        console.warn(`[plotPLQY_EQE] 點擊材料 '${emitter}' 沒在 data 裡`);
        return;
      }
      console.log(`[plotPLQY_EQE] 找到材料:`, item);

      // (D) 畫結構（若有）
      if (canvasId && item.smiles) onRenderStructure(item.smiles, canvasId);

      // (E) 渲染中文表格（不顯示 SMILES）
      renderTable(tableId, {
        rows: [
          ['PLQY (Experiment)',  item.plqy],
          ['PLQY (Prediction)',  item['plqy.1']],
          ['EQE (Experiment)',   item.EQE],
          ['EQE (Prediction)',   item['EQE.1']],
        ]
      });
    };

    el.on('plotly_click', el.__plotlyClickHandler);
  };

  // -------- 繪製兩張圖（互為兄弟，用於同步高亮）--------
  if (chartId === null || chartId === plqyId)
    drawOne(plqyId, trPLQY, 'PLQY', tableIdPLQY, canvasIdPLQY, titleIdPLQY, /*sibling*/ null);

  if (chartId === null || chartId === eqeId)
    drawOne(eqeId,  trEQE,  'EQE',  tableIdEQE,  canvasIdEQE,  titleIdEQE,  /*sibling*/ null);
}





function plotDummyMaterial(materialName, preds = {}, opts = {}) {
  const {
    plqyId = 'chartPLQY',
    eqeId  = 'chartEQE',
    responsive = true,

    titleIdPLQY   = 'titlePLQY',
    canvasIdPLQY  = 'clickedMaterialCanvasPLQY',
    tableIdPLQY   = 'tablePLQY_click',

    titleIdEQE    = 'titleEQE',
    canvasIdEQE   = 'clickedMaterialCanvasEQE',
    tableIdEQE    = 'tableEQE_click',

    onRenderStructure = (smiles, canvasId) => {
      if (typeof renderSmiles === 'function' && smiles && canvasId) {
        renderSmiles(smiles, canvasId);
      }
    }
  } = opts;

  const toNum = v => (v == null || v === '' ? NaN : Number(v));
  const isNum = v => Number.isFinite(v);

  // 將「預測值」視為「實驗值=預測值」
  const plqy = toNum(preds.plqyPred);
  const eqe  = toNum(preds.eqePred);

  // 標題 & 結構
  function setTitle(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || '';
    Object.assign(el.style, {
      fontSize: '22px',
      fontWeight: '700',
      lineHeight: '1.25',
      margin: '8px 0 6px',
      letterSpacing: '0.2px',
      wordBreak: 'break-word',
      whiteSpace: 'normal'
    });
  }
  setTitle(titleIdPLQY, materialName);
  setTitle(titleIdEQE,  materialName);

  if (preds.smiles && canvasIdPLQY) onRenderStructure(preds.smiles, canvasIdPLQY);
  if (preds.smiles && canvasIdEQE)  onRenderStructure(preds.smiles, canvasIdEQE);

  // 表格（Exp=Pred，誤差 0%）
  function renderTable(targetId, name, val) {
    const host = document.getElementById(targetId);
    if (!host) return;
    const fmt = (v) => (Number.isFinite(v) ? Number(v).toFixed(3) : '—');
    const css = `
      .cn-table { border-collapse: collapse; width: 100%; max-width: 680px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans', Arial, 'Microsoft JhengHei', sans-serif; }
      .cn-table th, .cn-table td { border: 2px solid #999; padding: 10px 14px; text-align: center; }
      .cn-table th { background: #f5f5f5; font-weight: 700; }
      .cn-table td.name { font-weight: 700; }
      .cn-note { margin-top: 6px; color: #666; font-size: 12px; }
    `;
    host.innerHTML = `
      <style>${css}</style>
      <table class="cn-table">
        <thead>
          <tr>
            <th>參數</th><th>實驗值</th><th>預測值</th><th>誤差</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="name">${name}</td>
            <td>${fmt(val)}</td>
            <td>${fmt(val)}</td>
            <td>${Number.isFinite(val) ? '0.00%' : '—'}</td>
          </tr>
        </tbody>
      </table>
      <div class="cn-note">此模式將預測值視為實驗值（Exp=Pred）。</div>
    `;
  }
  if (isNum(plqy)) renderTable(tableIdPLQY, 'PLQY', plqy);
  if (isNum(eqe))  renderTable(tableIdEQE,  'EQE',  eqe);

  // Exp–Pred 單點散佈圖（位在 y=x 上）
  function drawOne(containerId, title, val) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!isNum(val)) {
      el.innerHTML = '<div style="padding:8px;color:#666">沒有可用的值</div>';
      return;
    }

    const trace = {
      name: title,
      x: [val], y: [val], text: [materialName],
      mode: 'markers',
      type: 'scatter',
      marker: { size: [12], color: ['red'], opacity: 0.95, line: { width: 1 } },
      hovertemplate: 'Exp: %{x:.4f}<br>Pred: %{y:.4f}<br>%{text}<extra></extra>',
    };

    // 軸範圍：若值在 [0,1]，就用 0~1；否則以值為中心留 10% 邊界
    let xaxis, yaxis;
    if (val >= 0 && val <= 1) {
      xaxis = { title: `Experiment ${title}`, range: [0, 1] };
      yaxis = { title: `Prediction ${title}`, range: [0, 1] };
    } else {
      const pad = Math.abs(val) * 0.1 || 0.1;
      xaxis = { title: `Experiment ${title}`, range: [val - pad, val + pad] };
      yaxis = { title: `Prediction ${title}`, range: [val - pad, val + pad] };
    }

    const layout = {
      title,
      hovermode: 'closest',
      showlegend: false,
      xaxis, yaxis,
      shapes: [{
        type: 'line',
        x0: xaxis.range[0], y0: xaxis.range[0],
        x1: xaxis.range[1], y1: xaxis.range[1],
        line: { width: 1, dash: 'dash' }
      }],
      annotations: [{
        xref: 'paper', yref: 'paper',
        x: 1, y: 0, xanchor: 'right', yanchor: 'bottom',
        text: 'Exp = Pred（誤差 0%）',
        showarrow: false
      }],
      margin: { t: 60, r: 20, b: 60, l: 60 }
    };

    Plotly.newPlot(containerId, [trace], layout, { responsive });
  }

  if (isNum(plqy)) drawOne(plqyId, 'PLQY', plqy);
  if (isNum(eqe))  drawOne(eqeId,  'EQE',  eqe);
}



async function overlayPredPoint(materialName, preds = {}, opts = {}) {
  const {
    plqyId = 'chartPLQY',
    eqeId  = 'chartEQE',

    titleIdPLQY = 'titlePLQY',
    tableIdPLQY = 'tablePLQY_click',
    canvasIdPLQY = 'clickedMaterialCanvasPLQY',

    titleIdEQE  = 'titleEQE',
    tableIdEQE  = 'tableEQE_click',
    canvasIdEQE = 'clickedMaterialCanvasEQE',

    onRenderStructure = (smiles, canvasId) => {
      if (typeof renderSmiles === 'function' && smiles && canvasId) {
        renderSmiles(smiles, canvasId);
      }
    }
  } = opts;

  const toNum = v => (v == null || v === '' ? NaN : Number(v));
  const isNum = v => Number.isFinite(v);
  const plqy = toNum(preds.plqyPred);
  const eqe  = toNum(preds.eqePred);

  // 1) 疊加到 PLQY 圖
  if (document.getElementById(plqyId) && isNum(plqy)) {
    const tracePLQY = {
      name: `${materialName} (Pred=Exp)`,
      x: [plqy], y: [plqy], text: [materialName],
      mode: 'markers',
      type: 'scatter',
      marker: { size: 13, color: 'red', opacity: 0.95, line: { width: 1 } },
      hovertemplate: 'Exp: %{x:.4f}<br>Pred: %{y:.4f}<br>%{text}<extra></extra>',
      showlegend: false
    };
    Plotly.addTraces(plqyId, tracePLQY);
  }

  // 2) 疊加到 EQE 圖
  if (document.getElementById(eqeId) && isNum(eqe)) {
    const traceEQE = {
      name: `${materialName} (Pred=Exp)`,
      x: [eqe], y: [eqe], text: [materialName],
      mode: 'markers',
      type: 'scatter',
      marker: { size: 13, color: 'red', opacity: 0.95, line: { width: 1 } },
      hovertemplate: 'Exp: %{x:.4f}<br>Pred: %{y:.4f}<br>%{text}<extra></extra>',
      showlegend: false
    };
    Plotly.addTraces(eqeId, traceEQE);
  }

  // 3) 點紅點時顯示 Exp=Pred 表格 + 標題 + 結構（不干擾你原本 data 點的 click）
  function attachClick(containerId, titleId, tableId, canvasId, val) {
    const el = document.getElementById(containerId);
    if (!el || !isNum(val)) return;

    const handler = (evt) => {
      if (!evt?.points?.length) return;
      const p = evt.points[evt.points.length - 1]; // 取最後點（支援多 trace 疊加）
      const txt = (p.text || '').toString();
      if (txt !== materialName) return; // 只攔截我們的紅點

      // 標題
      const t = document.getElementById(titleId);
      if (t) {
        t.textContent = materialName;
        Object.assign(t.style, {
          fontSize: '22px', fontWeight: '700', lineHeight: '1.25',
          margin: '8px 0 6px', letterSpacing: '0.2px', wordBreak: 'break-word'
        });
      }

      // 結構（若有）
      if (preds.smiles && canvasId) onRenderStructure(preds.smiles, canvasId);

      // 表格（Exp=Pred，誤差 0%）
      const host = document.getElementById(tableId);
      if (host) {
        const fmt = (v) => (Number.isFinite(v) ? Number(v).toFixed(3) : '—');
        host.innerHTML = `
          <table style="border-collapse:collapse;width:100%;text-align:center;border:2px solid #999">
            <thead>
              <tr><th>參數</th><th>實驗值</th><th>預測值</th><th>誤差</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="name">${containerId === plqyId ? 'PLQY' : 'EQE'}</td>
                <td>${fmt(val)}</td>
                <td>${fmt(val)}</td>
                <td>${Number.isFinite(val) ? '0.00%' : '—'}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top:6px;color:#666;font-size:12px">此點以 Pred=Exp 疊加於全資料分布。</div>
        `;
      }
    };

    // 用 on() 疊加；不移除你原本 plotPLQY_EQE 綁的 handler
    el.on?.('plotly_click', handler);
  }

  attachClick(plqyId, titleIdPLQY, tableIdPLQY, canvasIdPLQY, plqy);
  attachClick(eqeId,  titleIdEQE,  tableIdEQE,  canvasIdEQE,  eqe);
}











function plotGraphs(data, inputDonor, inputAcceptor) {
    const labels = [];
    const pceData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const vocData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const jscData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const ffData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };

    // 處理數據
    data.forEach(item => {
        const label = `${item.Donor}–${item.Acceptor}`;
        labels.push(label);
        const defaultColor = 'black';
        const defaultSize = 6;

        pceData.x.push(item['PCE (%)']);
        pceData.y.push(item['PCE (%).1']);
        pceData.text.push(label);
        pceData.marker.color.push(defaultColor);
        pceData.marker.size.push(defaultSize);

        vocData.x.push(item['Voc (V)']);
        vocData.y.push(item['Voc (V).1']);
        vocData.text.push(label);
        vocData.marker.color.push(defaultColor);
        vocData.marker.size.push(defaultSize);

        jscData.x.push(item['Jsc (mAcm-2)']);
        jscData.y.push(item['Jsc (mAcm-2).1']);
        jscData.text.push(label);
        jscData.marker.color.push(defaultColor);
        jscData.marker.size.push(defaultSize);

        ffData.x.push(item.FF);
        ffData.y.push(item['FF.1']);
        ffData.text.push(label);
        ffData.marker.color.push(defaultColor);
        ffData.marker.size.push(defaultSize);
    });

    
    // 檢查 Donor 和 Acceptor 是否為 SMILES 或名稱，或為 null
    const isDonorSmiles = inputDonor ? isSmiles(inputDonor) : false;
    const isAcceptorSmiles = inputAcceptor ? isSmiles(inputAcceptor) : false;

    let donorSMILES = null;
    let acceptorSMILES = null;

    // 1. 處理 Donor
    if (inputDonor) {
        if (isDonorSmiles) {
            donorSMILES = inputDonor; // Donor 是 SMILES，直接使用
        } else {
            const matching = findMatchingSMILES(inputDonor, inputAcceptor); // Donor 是名稱，查找 SMILES
            donorSMILES = matching.donorSMILES;
        }
    }

    // 2. 處理 Acceptor
    if (inputAcceptor) {
        if (isAcceptorSmiles) {
            acceptorSMILES = inputAcceptor; // Acceptor 是 SMILES，直接使用
        } else {
            // 如果 Acceptor 是名稱，進行查找
            const matching = findMatchingSMILES(null, inputAcceptor); // 查找 Acceptor 名稱對應的 SMILES
            acceptorSMILES = matching.acceptorSMILES;
        }
    }



    // 4. 使用 SMILES 進行數據高亮
    if (donorSMILES || acceptorSMILES) {
        highlightPerformanceItems(data, donorSMILES, acceptorSMILES, pceData, vocData, jscData, ffData);
    }

    // 2. 高亮匹配的項目，分別根據 Donor、Acceptor 或兩者匹配進行高亮
    data.forEach((item, index) => {
        const donorMatched = item['Donor SMILES'] === donorSMILES;
        const acceptorMatched = item['Acceptor SMILES'] === acceptorSMILES;

        if (donorMatched && acceptorMatched) {
            // Donor 和 Acceptor 同時匹配，用綠色標記
            pceData.marker.color[index] = 'green';
            pceData.marker.size[index] = 16;
            vocData.marker.color[index] = 'green';
            vocData.marker.size[index] = 16;
            jscData.marker.color[index] = 'green';
            jscData.marker.size[index] = 16;
            ffData.marker.color[index] = 'green';
            ffData.marker.size[index] = 16;
        } else if (donorMatched) {
            // 只有 Donor 匹配，用紅色標記
            pceData.marker.color[index] = 'red';
            vocData.marker.color[index] = 'red';
            jscData.marker.color[index] = 'red';
            ffData.marker.color[index] = 'red';
        } else if (acceptorMatched) {
            // 只有 Acceptor 匹配，用藍色標記
            pceData.marker.color[index] = 'blue';
            vocData.marker.color[index] = 'blue';
            jscData.marker.color[index] = 'blue';
            ffData.marker.color[index] = 'blue';
        }
    });

    // 計算相關性
    const pceCorrelation = calculateCorrelation(pceData.x, pceData.y);
    const vocCorrelation = calculateCorrelation(vocData.x, vocData.y);
    const jscCorrelation = calculateCorrelation(jscData.x, jscData.y);
    const ffCorrelation = calculateCorrelation(ffData.x, ffData.y);

    // 設定佈局
    const layoutTemplate = (title, xTitle, yTitle, xRange, yRange, correlation) => ({
        title: title,
        width: 1000,
        height: 800,
        xaxis: { title: xTitle, range: xRange },
        yaxis: { title: yTitle, range: yRange },
        hovermode: 'closest',
        showlegend: false,
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 1,
            y: 0,
            xanchor: 'right',
            yanchor: 'bottom',
            text: `r = ${correlation.toFixed(2)}<br>紅色圓點= Donor, 藍色圓點= Acceptor, 綠色圓點=實驗中有此組合, 綠色三角形=實驗中無此組合`,
            showarrow: false,
            font: {           // 新增 font 屬性
                size: 16      // 調整這裡的數值來設置文字大小，單位是像素
            }
        }],
        shapes: [{
            type: 'line',
            x0: xRange[0],
            y0: yRange[0],
            x1: xRange[1],
            y1: yRange[1],
            line: {
                color: 'rgba(0, 0, 0, 0.5)',
                width: 2,
                dash: 'dash'
            }
        }]
    });

    // 建立圖表
    const pceLayout = layoutTemplate('PCE (%)', 'Experiment PCE (%)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性能數據', 'Prediction PCE (%)', [0, 20], [0, 20], pceCorrelation);
    const vocLayout = layoutTemplate('Voc (V)', 'Experiment Voc (V)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性能數據', 'Prediction Voc (V)', [0, 1.2], [0, 1.2], vocCorrelation);
    const jscLayout = layoutTemplate('Jsc (mAcm-2)', 'Experiment Jsc (mAcm-2)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性能數據', 'Prediction Jsc (mAcm-2)', [0, 30], [0, 30], jscCorrelation);
    const ffLayout = layoutTemplate('FF', 'Experiment FF<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性能數據', 'Prediction FF', [0, 1], [0, 1], ffCorrelation);

    Plotly.newPlot('chartPCE', [pceData], pceLayout);
    Plotly.newPlot('chartVoc', [vocData], vocLayout);
    Plotly.newPlot('chartJsc', [jscData], jscLayout);
    Plotly.newPlot('chartFF', [ffData], ffLayout);

    document.getElementById('chartPCE').style.display = 'block';
    document.getElementById('chartVoc').style.display = 'block';
    document.getElementById('chartJsc').style.display = 'block';
    document.getElementById('chartFF').style.display = 'block';

    // 使用 Plotly 的方法綁定點擊事件
    charts = ['chartPCE', 'chartVoc', 'chartJsc', 'chartFF'];
    charts.forEach(chartId => {
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            chartElement.on('plotly_click', function(eventData) {
                if (eventData.points && eventData.points.length > 0) {
                    const pointIndex = eventData.points[0].pointIndex;
                    highlightClickedPoint(chartId, pointIndex);
                }
            });
        }
    });

    // 添加其他事件處理功能
    addPlotlyClickEventForPerformance('chartPCE', data, 'tablePCE_click');
    addPlotlyClickEventForPerformance('chartVoc', data, 'tableVoc_click');
    addPlotlyClickEventForPerformance('chartJsc', data, 'tableJsc_click');
    addPlotlyClickEventForPerformance('chartFF', data, 'tableFF_click');
}














