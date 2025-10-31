let defaultData = data;  // 預設數據
let currentData = defaultData;  // 當前使用的數據
const parameters = ['em_homo', 'em_lumo', 'em_eg', 'em_s1', 'em_t1', 'em_est', 'plqy', 'kISC', 'τp', 'τd', 'ht_lumo', 'ht_homo', 'ht_Eg', 'lumo_off', 'homo_off', 'EQE'];

function processData(json) {
    populateSelect('x-axis', parameters);
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.innerHTML = option;
        select.appendChild(opt);
    });
}

function updateYSelect() {
    const xAxis = document.getElementById('x-axis').value;
    const yOptions = parameters.filter(param => param !== xAxis);
    populateSelect('y-axis', yOptions);
    document.getElementById('y-axis').disabled = false;  // 啟用Y軸選擇
}



function updateChart(data) {
    const xAxis = document.getElementById('x-axis').value;
    const yAxis = document.getElementById('y-axis').value;

    const xData = data.map(d => d[xAxis]);
    const yData = data.map(d => d[yAxis]);
    const hoverText = data.map(d => 
        `Materials: ${d["emitter"]} <br>${xAxis}: ${d[xAxis]}<br>${yAxis}: ${d[yAxis]}`);

    const trace1 = {
        x: xData,
        y: yData,
        text: hoverText,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        name: 'Default Data',
        marker: {
            color: 'black',  // 設置點的顏色為黑色
            size: 6,  // 調整點的大小（可以根據需求調整）
            opacity: 0.8,  // 調整點的透明度（0 到 1 之間，1 為完全不透明）
            line: {
                color: 'white',  // 設置點的邊框顏色
                width: 0.1  // 設置點邊框的寬度
            }
        }
    };



    const layout = {
        title: `${xAxis} vs ${yAxis}`,
        xaxis: { 
            title: `${xAxis}<br><span style="font-size:12px; color:black;">按下數據點，數據點將變為黃色，並可以觀看材料結構及數據</span>` 
        },
        yaxis: { title: yAxis },
        hovermode: 'closest',
        width: 1000,
        height: 800
    };
    
    

    // 渲染圖表
    Plotly.newPlot('chart', [trace1], layout);


    // 顯示輸入框
    document.querySelector('.input-container').style.display = 'flex';

    // 添加點擊事件處理邏輯
    addPlotlyClickEvent('chart', data, 'tableId');
}
function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布內容
    }
}

// 查找 Donor 的所有 SMILES
function findMaterialSmiles(materialName, data) {
    const materialItems = data.filter(item => item.emitter === materialName);
    const materialSmilesList = [...new Set(materialItems.map(item => item.smiles))]; // 去重
    console.log(`找到 ${materialName} 的 Donor SMILES:`, materialSmilesList);
    return materialSmilesList;
}




// 預設容器 ID
const TABLE_ID  = 'tableId';
const CANVAS_ID = 'clickedMaterialCanvas1';

document.getElementById('actionButton').addEventListener('click', function () {
  // 1. 清空結構圖畫布
  clearCanvas(CANVAS_ID);

  // 2. 讀取輸入
  const material = document.getElementById('input1').value.trim();
  if (!material) {
    alert('請至少輸入材料名稱');
    return;
  }

  // 3. 查找 SMILES
  let materialSmilesList = findMaterialSmiles(material, data || []);
  if (!Array.isArray(materialSmilesList)) {
    // 容錯：若回傳單一字串
    materialSmilesList = materialSmilesList ? [materialSmilesList] : [];
  }

  if (materialSmilesList.length === 0) {
    alert(`材料名稱：${material} 不明材料`);
    return;
  }
  if (materialSmilesList.length > 1) {
    alert(`材料名稱：${material} 有多組 SMILES，請確認`);
    return;
  }

  const materialSmiles = materialSmilesList[0];

  // 4. 找到該材料的完整資料
  const materialRecord = (data || []).find(d =>
    String(d.emitter || d.name || d.material || '').trim() === material
  ) || { emitter: material };

  // 5. 顯示表格
  try {
    const html = createMaterialPropertiesTable1(material, data || [], TABLE_ID);
    const tableEl = document.getElementById(TABLE_ID);
    if (tableEl) {
      // 若函數只回傳 HTML，自己塞進 DOM
      if (!tableEl.innerHTML || !tableEl.innerHTML.includes('<table')) {
        tableEl.innerHTML = html;
      }
      tableEl.style.display = 'block';
    }
  } catch (err) {
    console.error('建立表格失敗：', err);
    alert('建立表格時發生錯誤，請查看 Console。');
  }

  // 6. 顯示 SMILES 圖片
  try {
    renderSmiles(materialSmiles, CANVAS_ID, `Clicked Material: ${material}`, materialRecord);
  } catch (err) {
    console.error('繪製結構失敗：', err);
    alert('繪製結構時發生錯誤，請查看 Console。');
  }

  // 7. 高亮圖上的點（可選）
  try {
    highlightMaterial(material);
  } catch (err) {
    console.warn('highlightMaterial 執行時發生問題：', err);
  }

  // 8. Console 診斷
  console.log("點擊的材料名稱:", material);
  console.log("對應的 SMILES:", materialSmiles);
});






function highlightMaterial(material) {
    let materialSmiles = '';

    let materialItem = [];


    let materialTableHtml = '';


    // 透過名稱找到對應的 Donor SMILES
    if (material) {
        const materialNameItem = currentData.find(item => 
            item.emitter === material
        );
        materialSmiles = materialNameItem ? materialNameItem.smiles : '';
    }

    

    // 如果找到 Donor SMILES，使用 SMILES 進行匹配
    if (materialSmiles) {
        materialItem = currentData.filter(item => 
            item.smiles === materialSmiles
        );
    }

   

   

    // 根據匹配的結果更新圖表和表格
    if (materialItem.length > 0 ) {
        updateMatchedChart(materialItem);

        // 渲染化學結構
        if (materialItem.length > 0) {
            renderSmiles(materialSmiles, 'clickedMaterialCanvas1', 'Clicked Material Structure',material);
            materialTableHtml = createMaterialPropertiesTable(material, currentData, "tableId");
        }

        


        document.getElementById('tableId').style.display = 'block';

        console.log(`Highlighted entries for Donor SMILES: ${materialSmiles}`);
    } else {
        console.warn(`No matching entries found for Donor: ${material} `);
    }
}













function updateMatchedChart(materialMatchedData) {
    const xAxis = document.getElementById('x-axis').value;
    const yAxis = document.getElementById('y-axis').value;

    const traces = [];

    // 顯示所有數據點的 trace1
    const trace1 = {
        x: currentData.map(d => d[xAxis]),
        y: currentData.map(d => d[yAxis]),
        text: currentData.map(d => 
            `Materials: ${d["emitter"]} <br>${xAxis}: ${d[xAxis]}<br>${yAxis}: ${d[yAxis]}`),
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        name: 'All Data',  // 所有數據
        marker: {
            color: 'black',  // 使用黑色標示所有數據
            size: 6,
            opacity: 0.7,
            line: {
                color: 'white',
                width: 0.1
            }
        }
    };
    traces.push(trace1);

    // Donor 匹配的數據（紅色）
    if (materialMatchedData.length > 0) {
        const materialTrace = {
            x: materialMatchedData.map(d => d[xAxis]),
            y: materialMatchedData.map(d => d[yAxis]),
            text: materialMatchedData.map(d => 
                `Materials: ${d["emitter"]} <br>${xAxis}: ${d[xAxis]}<br>${yAxis}: ${d[yAxis]}`),
            mode: 'markers',
            type: 'scatter',
            hoverinfo: 'text',
            name: 'Material Matched Data',  // Donor匹配數據
            marker: {
                color: 'red',  // 使用紅色標示Donor
                size: 10,
                opacity: 0.8,
                line: {
                    color: 'white',
                    width: 1
                }
            }
        };
        traces.push(materialTrace);
    }

    

    

    

    const layout = {
        title: `${xAxis} vs ${yAxis}`,
        xaxis: { title: xAxis },
        yaxis: { title: yAxis },
        hovermode: 'closest',
        width: 1000,
        height: 800
    };

    // 渲染圖表，顯示所有數據點和匹配數據點，並添加對角線
    Plotly.newPlot('chart', traces, layout);

    addPlotlyClickEvent('chart', data, 'tableId');
}





















document.getElementById('x-axis').addEventListener('change', () => {
    updateYSelect();
    updateChart(currentData);
});

document.getElementById('y-axis').addEventListener('change', () => updateChart(currentData));

// 初次加載圖表
processData(defaultData);