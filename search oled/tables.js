














function createMaterialPropertiesTable1(material, data, containerId) { 
  // ---- 安全格式化 ----
  const fmt = v => (typeof v === 'number' && isFinite(v)) ? Number(v).toPrecision(3) : 'N/A';
  const pct = v => (typeof v === 'number' && isFinite(v)) ? `${v.toFixed(2)}%` : 'N/A';

  // ---- 強化版誤差（優先用外部，否則容錯版）----
  const calcErr = (exp, pred) => {
    if (typeof calculateError === 'function') {
      const out = calculateError(exp, pred);
      return (typeof out === 'number' && isFinite(out)) ? out : null;
    }
    // 內建容錯：PLQY/EQE 在 0~1 之間
    if (typeof exp === 'number' && isFinite(exp) &&
        typeof pred === 'number' && isFinite(pred)) {
      if (exp === 0) return (pred === 0) ? 0 : Math.abs(pred - exp) * 100; // 當作百分點差
      return Math.abs((pred - exp) / exp) * 100; // 一般 MAPE
    }
    return null;
  };

  // ---- 取得材料名稱 ----
  const name = (typeof material === 'string')
    ? material
    : (material?.emitter || material?.Donor || '未知材料');

  // ---- 正規化 data：支援陣列或單一物件 ----
  const arr = Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);
  // 名稱比對（去空白、大小寫不敏感）
  const norm = s => (typeof s === 'string') ? s.trim().toLowerCase() : s;
  let row = arr.find(d => norm(d.emitter || d.Donor) === norm(name));

  // 若仍找不到，且 material 是物件，就用 material 當 row（單筆直送）
  if (!row && material && typeof material === 'object') row = material;

  // ---- 樣式 ----
  const tableStyle = 'border:1px solid black;border-collapse:collapse;width:100%;';
  const thStyle    = 'border:1px solid black;padding:8px;background-color:#f2f2f2;text-align:center;';
  const tdStyle    = 'border:1px solid black;padding:8px;text-align:center;';

  // ---- 指標列表 ----
  const metrics = [
    { key: 'plqy', label: 'PLQY' },
    { key: 'EQE',  label: 'EQE'  },
  ];

  let html = '';
  html += `<h3>${name} 的性質</h3>`;
  html += `<table style="${tableStyle}">`;
  html += `<tr>
             <th style="${thStyle}">參數</th>
             <th style="${thStyle}">實驗值</th>
             <th style="${thStyle}">預測值</th>
             <th style="${thStyle}">誤差</th>
           </tr>`;

  const missingRow = !row;
  if (missingRow) {
    html += `<tr><td colspan="4" style="${tdStyle};color:green;">
               未在 data 中找到「${name}」。以下以 N/A/假定值顯示，請確認 data 的 emitter 名稱是否一致。
             </td></tr>`;
  }

  for (const { key, label } of metrics) {
    const expRaw  = row?.[key];
    // 若沒有預測值，預設 pred=exp（綠色標註）
    const hasPred = row && (key + '.1') in row && typeof row[`${key}.1`] !== 'undefined';
    const predRaw = hasPred ? row[`${key}.1`] : expRaw;

    const exp  = (typeof expRaw  === 'number' && isFinite(expRaw))  ? expRaw  : null;
    const pred = (typeof predRaw === 'number' && isFinite(predRaw)) ? predRaw : null;
    const err  = (exp !== null && pred !== null) ? calcErr(exp, pred) : null;

    const green = (!hasPred || missingRow) ? ';color:green;' : '';

    html += `<tr>
               <td style="${tdStyle}">${label}</td>
               <td style="${tdStyle}">${fmt(exp)}</td>
               <td style="${tdStyle}${green}">${fmt(pred)}</td>
               <td style="${tdStyle}${green}">${pct(err)}</td>
             </tr>`;
  }

  html += `</table>`;

  if (containerId) {
    const el = document.getElementById(containerId);
    if (el) {
      // 確保容器是可見的
      if (getComputedStyle(el).display === 'none') el.style.display = 'block';
      el.innerHTML = html;
    } else {
      console.warn(`[createMaterialPropertiesTable] 找不到容器 #${containerId}`);
    }
  }
  return html;
}





















function calculateError(actual, predicted) {
    if (actual === 0) return Math.abs(predicted) * 100; // 視作百分點差
    return (Math.abs(predicted - actual) / Math.abs(actual)) * 100;
}





// 初始化時調用此函數
addPlotlyClickEvent('chart', data, 'table');