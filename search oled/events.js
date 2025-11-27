function highlightClickedPoint(eventData) {
    const pointIndex = eventData.points[0].pointIndex;  // 獲取被點擊點的索引
    const update = {
        marker: {
            color: [],  // 初始化顏色數組
            size: [],   // 初始化大小數組
            opacity: [], // 初始化透明度數組
            line: {
                color: [],  // 初始化邊框顏色數組
                width: []   // 初始化邊框寬度數組
            }
        }
    };

    // 為所有點設置默認屬性
    for (let i = 0; i < currentData.length; i++) {
        update.marker.color[i] = 'black';      // 默認設為黑色
        update.marker.size[i] = 6;             // 設置點的大小為6
        update.marker.opacity[i] = 0.8;        // 設置點的透明度為0.7
        update.marker.line.color[i] = 'white'; // 設置點的邊框顏色為白色
        update.marker.line.width[i] = 0.1;       // 設置點的邊框寬度為1
    }

    // 將被點擊的點設為黃色並增大大小
    update.marker.color[pointIndex] = 'yellow';
    update.marker.size[pointIndex] = 10;       // 增加被點擊點的大小以更顯眼

    // 更新圖表
    Plotly.restyle('chart', update, [0]);
}


function addPlotlyClickEvent(chartId, data, tableId) {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) {
    console.error(`No DOM element with ID '${chartId}' found.`);
    return;
  }

  chartElement.on('plotly_click', function (eventData) {
    highlightClickedPoint(eventData); // 高亮被點擊的點

    const point = eventData.points[0];
    const raw = String(point.text || "");

    // 抓第一行（Materials: ...），支援 <br> 與換行
    const firstLine = raw.split(/<br\s*\/?>|\r?\n/i)[0].trim();

    // 移掉 "Materials:" 前綴
    const materialName = firstLine.replace(/^Materials:\s*/i, "").trim();

    // 在 data 找到對應材料
    const material = data.find(d =>
      String(d.emitter || d.name || d.material || "").trim() === materialName
    );

    // 取出 SMILES
    const materialSmiles = material ? material.smiles : null;

    // console 顯示
    console.log("點擊的材料名稱:", materialName);
    console.log("對應的 SMILES:", materialSmiles || "(未找到)");

    // ✅ 顯示結構圖
    if (materialSmiles) {
      renderSmiles(materialSmiles, 'clickedMaterialCanvas1', 'Clicked Material Structure', materialName);
    }

    // 呼叫你的 createMaterialPropertiesTable
    const materialTableHtml = createMaterialPropertiesTable1(materialName, data, tableId);

    if (!tableId) {
      return materialTableHtml;
    }
  });
}





