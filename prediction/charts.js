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


function plotPropertyGraphs(data, inputDonor, inputAcceptor, type, skipHighlight = false, chartId = null) {
    const labels = [];
    const homoaData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const lumoaData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const homodData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const lumodData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const bandgapAcceptorData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };
    const bandgapDonorData = { x: [], y: [], text: [], mode: 'markers', type: 'scatter', marker: { size: [], color: [], opacity: 0.8, line: { width: 0.1 } } };

    data.forEach(item => {
        const label = `${item.Donor}–${item.Acceptor}`;
        labels.push(label);
        if ( type === 'both') {
            homodData.x.push(item['HOMO of Donor (eV)']);
            homodData.y.push(item['HOMO of Donor (eV).1']);
            homodData.text.push(label);
            homodData.marker.size.push(6);
            homodData.marker.color.push('black');

            lumodData.x.push(item['LUMO of Donor (eV)']);
            lumodData.y.push(item['LUMO of Donor (eV).1']);
            lumodData.text.push(label);
            lumodData.marker.size.push(6);
            lumodData.marker.color.push('black');

            bandgapDonorData.x.push(item['Bandgap of Donor (eV)']);
            bandgapDonorData.y.push(item['Bandgap of Donor (eV).1']);
            bandgapDonorData.text.push(label);
            bandgapDonorData.marker.size.push(6);
            bandgapDonorData.marker.color.push('black');

            homoaData.x.push(item['HOMO of Acceptor (eV)']);
            homoaData.y.push(item['HOMO of Acceptor (eV).1']);
            homoaData.text.push(label);
            homoaData.marker.size.push(6);
            homoaData.marker.color.push('black');

            lumoaData.x.push(item['LUMO of Acceptor (eV)']);
            lumoaData.y.push(item['LUMO of Acceptor (eV).1']);
            lumoaData.text.push(label);
            lumoaData.marker.size.push(6);
            lumoaData.marker.color.push('black');

            bandgapAcceptorData.x.push(item['Bandgap of Acceptor (eV)']);
            bandgapAcceptorData.y.push(item['Bandgap of Acceptor (eV).1']);
            bandgapAcceptorData.text.push(label);
            bandgapAcceptorData.marker.size.push(6);
            bandgapAcceptorData.marker.color.push('black');
        }
        if (type === 'donor' ) {
            homodData.x.push(item['HOMO of Donor (eV)']);
            homodData.y.push(item['HOMO of Donor (eV).1']);
            homodData.text.push(label);
            homodData.marker.size.push(6);
            homodData.marker.color.push('black');

            lumodData.x.push(item['LUMO of Donor (eV)']);
            lumodData.y.push(item['LUMO of Donor (eV).1']);
            lumodData.text.push(label);
            lumodData.marker.size.push(6);
            lumodData.marker.color.push('black');

            bandgapDonorData.x.push(item['Bandgap of Donor (eV)']);
            bandgapDonorData.y.push(item['Bandgap of Donor (eV).1']);
            bandgapDonorData.text.push(label);
            bandgapDonorData.marker.size.push(6);
            bandgapDonorData.marker.color.push('black');
        }
        if (type === 'acceptor' ) {
            homoaData.x.push(item['HOMO of Acceptor (eV)']);
            homoaData.y.push(item['HOMO of Acceptor (eV).1']);
            homoaData.text.push(label);
            homoaData.marker.size.push(6);
            homoaData.marker.color.push('black');

            lumoaData.x.push(item['LUMO of Acceptor (eV)']);
            lumoaData.y.push(item['LUMO of Acceptor (eV).1']);
            lumoaData.text.push(label);
            lumoaData.marker.size.push(6);
            lumoaData.marker.color.push('black');

            bandgapAcceptorData.x.push(item['Bandgap of Acceptor (eV)']);
            bandgapAcceptorData.y.push(item['Bandgap of Acceptor (eV).1']);
            bandgapAcceptorData.text.push(label);
            bandgapAcceptorData.marker.size.push(6);
            bandgapAcceptorData.marker.color.push('black');
        }
    });
    // 僅在skipHighlight為false時進行高亮
    if (!skipHighlight) {
        const { donorSMILES, acceptorSMILES } = findMatchingSMILES(inputDonor, inputAcceptor);
        highlightItemsBySMILES(data, donorSMILES, acceptorSMILES, homodData, lumodData, bandgapDonorData, homoaData, lumoaData, bandgapAcceptorData);
    }
    

    const homoaCorrelation = calculateCorrelation(homoaData.x, homoaData.y);
    const lumoaCorrelation = calculateCorrelation(lumoaData.x, lumoaData.y);
    const homodCorrelation = calculateCorrelation(homodData.x, homodData.y);
    const lumodCorrelation = calculateCorrelation(lumodData.x, lumodData.y);
    const bandgapAcceptorCorrelation = calculateCorrelation(bandgapAcceptorData.x, bandgapAcceptorData.y);
    const bandgapDonorCorrelation = calculateCorrelation(bandgapDonorData.x, bandgapDonorData.y);

    const homoaLayout = {
        title: 'HOMO of Acceptor (eV)',
        width: 1000,
        height: 800,
        xaxis: { title: 'Experiment HOMO of Acceptor (eV)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性質數據' },
        yaxis: { title: 'Prediction HOMO of Acceptor (eV)' },
        hovermode: 'closest',
        showlegend: false,
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 1,
            y: 0,
            xanchor: 'right',
            yanchor: 'bottom',
            text: `r = ${homoaCorrelation.toFixed(2)}<br>紅色圓點代表輸入材料, 綠色三角形= 預測值`,
            showarrow: false
        }],
        shapes: [
            {
                type: 'line',
                x0: -4.9,
                y0: -4.9,
                x1: -6.4,
                y1: -6.4,
                line: {
                    color: 'grey',
                    width: 2,
                    dash: 'dash'
                }
            }
        ]
    };

    const lumoaLayout = {
        title: 'LUMO of Acceptor (eV)',
        width: 1000,
        height: 800,
        xaxis: { title: 'Experiment LUMO of Acceptor (eV)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性質數據' },
        yaxis: { title: 'Prediction LUMO of Acceptor (eV)' },
        hovermode: 'closest',
        showlegend: false,
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 1,
            y: 0,
            xanchor: 'right',
            yanchor: 'bottom',
            text: `r = ${lumoaCorrelation.toFixed(2)}<br>紅色圓點代表輸入材料, 綠色三角形= 預測值`,
            showarrow: false
        }],
        shapes: [
            {
                type: 'line',
                x0: -3,
                y0: -3,
                x1: -4.5,
                y1: -4.5,
                line: {
                    color: 'grey',
                    width: 2,
                    dash: 'dash'
                }
            }
        ]
    };

    const homodLayout = {
        title: 'HOMO of Donor (eV)',
        width: 1000,
        height: 800,
        xaxis: { title: 'Experiment HOMO of Donor (eV)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性質數據' },
        yaxis: { title: 'Prediction HOMO of Donor (eV)' },
        hovermode: 'closest',
        showlegend: false,
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 1,
            y: 0,
            xanchor: 'right',
            yanchor: 'bottom',
            text: `r = ${homodCorrelation.toFixed(2)}<br>紅色圓點代表輸入材料, 綠色三角形= 預測值`,
            showarrow: false
        }],
        shapes: [
            {
                type: 'line',
                x0: -4.3,
                y0: -4,
                x1: -6.2,
                y1: -6.2,
                line: {
                    color: 'grey',
                    width: 2,
                    dash: 'dash'
                }
            }
        ]
    };

    const lumodLayout = {
        title: 'LUMO of Donor (eV)',
        width: 1000,
        height: 800,
        xaxis: { title: 'Experiment LUMO of Donor (eV)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性質數據' },
        yaxis: { title: 'Prediction LUMO of Donor (eV)' },
        hovermode: 'closest',
        showlegend: false,
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 1,
            y: 0,
            xanchor: 'right',
            yanchor: 'bottom',
            text: `r = ${lumodCorrelation.toFixed(2)}<br>紅色圓點代表輸入材料, 綠色三角形= 預測值`,
            showarrow: false
        }],
        shapes: [
            {
                type: 'line',
                x0: -2.3,
                y0: -2.3,
                x1: -4.3,
                y1: -4.3,
                line: {
                    color: 'grey',
                    width: 2,
                    dash: 'dash'
                }
            }
        ]
    };

    const bandgapAcceptorLayout = {
        title: 'Bandgap of Acceptor (eV)',
        width: 1000,
        height: 800,
        xaxis: { title: 'Experiment Bandgap of Acceptor (eV)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性質數據' },
        yaxis: { title: 'Prediction Bandgap of Acceptor (eV)' },
        hovermode: 'closest',
        showlegend: false,
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 1,
            y: 0,
            xanchor: 'right',
            yanchor: 'bottom',
            text: `r = ${bandgapAcceptorCorrelation.toFixed(2)}<br>紅色圓點代表輸入材料, 綠色三角形= 預測值`,
            showarrow: false
        }],
        shapes: [
            {
                type: 'line',
                x0: 3.3,
                y0: 3.3,
                x1: 1.1,
                y1: 1.1,
                line: {
                    color: 'grey',
                    width: 2,
                    dash: 'dash'
                }
            }
        ]
    };

    const bandgapDonorLayout = {
        title: 'Bandgap of Donor (eV)',
        width: 1000,
        height: 800,
        xaxis: { title: 'Experiment Bandgap of Donor (eV)<br>按下數據點，數據點將變為黃色，並可以觀看化學結構及性質數據' },
        yaxis: { title: 'Prediction Bandgap of Donor (eV)' },
        
        hovermode: 'closest',
        showlegend: false,
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 1,
            y: 0,
            xanchor: 'right',
            yanchor: 'bottom',
            text: `r = ${bandgapDonorCorrelation.toFixed(2)}<br>紅色圓點代表輸入材料, 綠色三角形= 預測值`,
            showarrow: false
        }],
        shapes: [
            {
                type: 'line',
                x0: 3.3,
                y0: 3.3,
                x1: 1.1,
                y1: 1.1,
                line: {
                    color: 'grey',
                    width: 2,
                    dash: 'dash'
                }
            }
        ]
    };
    var boxselect = {
        name: 'Box Select',
        icon: Plotly.Icons.lasso,
        click: function(gd) {
            // 開啟 Plotly 的矩形選擇模式
            Plotly.relayout(gd, { dragmode: 'select' });
    
            // 移除之前的綁定以避免重複事件
            gd.removeAllListeners('plotly_selected');
    
            // 綁定選擇事件
            gd.on('plotly_selected', function(eventData) {
                if (eventData && eventData.points.length > 0) {
                    // 收集所有被選中的數據點資訊
                    const selectedPoints = eventData.points.map(point => ({
                        x: point.x,
                        y: point.y,
                        label: point.text || ''  // 假設每個點有一個標籤屬性
                    }));
    
                    // 準備 CSV 資料，分別定義 Donor 和 Acceptor 列
                    const csvData = [["Donor", "Acceptor", "Experiment HOMO of Donor (eV)", "Prediction HOMO of Donor (eV)"]]; // 表頭
    
                    selectedPoints.forEach(point => {
                        // 將 Donor–Acceptor 標籤分隔為兩部分，並處理分隔符格式的穩定性
                        const [donor, acceptor] = point.label.includes("–") 
                            ? point.label.split("–") 
                            : [point.label, ""]; // 若格式不符，僅顯示Donor
    
                        // 將數據和分隔後的 Donor、Acceptor 添加到 CSV 數據中
                        csvData.push([donor.trim(), acceptor.trim(), point.x, point.y]);
                    });
    
                    // 匯出 CSV
                    exportToCSV(csvData, "selected_points.csv");
    
                    // 重新繪製圖表
                    Plotly.redraw(gd);
                }
            });
        }
    };

    
    
    
    
     // Plot each chart based on chartId
     if (chartId === null || chartId === 'chartHOMOAcceptor') {
        Plotly.newPlot('chartHOMOAcceptor', [homoaData], homoaLayout, {
            modeBarButtonsToRemove: ['zoom2d', 'hoverClosestCartesian', 'select2d', 'lasso2d', 'resetScale2d', 'hoverCompareCartesian', 'toggleSpikelines'],
            modeBarButtonsToAdd: [boxselect]
        });
    }

    if (chartId === null || chartId === 'chartLUMOAcceptor') {
        Plotly.newPlot('chartLUMOAcceptor', [lumoaData], lumoaLayout, {
            modeBarButtonsToRemove: ['zoom2d', 'hoverClosestCartesian', 'select2d', 'lasso2d', 'resetScale2d', 'hoverCompareCartesian', 'toggleSpikelines'],
            modeBarButtonsToAdd: [boxselect]
        });
    }

    if (chartId === null || chartId === 'chartHOMODonor') {
        Plotly.newPlot('chartHOMODonor', [homodData], homodLayout, {
            modeBarButtonsToRemove: ['zoom2d', 'hoverClosestCartesian', 'select2d', 'lasso2d', 'resetScale2d', 'hoverCompareCartesian', 'toggleSpikelines'],
            modeBarButtonsToAdd: [boxselect]
        });
    }

    if (chartId === null || chartId === 'chartLUMODonor') {
        Plotly.newPlot('chartLUMODonor', [lumodData], lumodLayout, {
            modeBarButtonsToRemove: ['zoom2d', 'hoverClosestCartesian', 'select2d', 'lasso2d', 'resetScale2d', 'hoverCompareCartesian', 'toggleSpikelines'],
            modeBarButtonsToAdd: [boxselect]
        });
    }

    if (chartId === null || chartId === 'chartBandgapAcceptor') {
        Plotly.newPlot('chartBandgapAcceptor', [bandgapAcceptorData], bandgapAcceptorLayout, {
            modeBarButtonsToRemove: ['zoom2d', 'hoverClosestCartesian', 'select2d', 'lasso2d', 'resetScale2d', 'hoverCompareCartesian', 'toggleSpikelines'],
            modeBarButtonsToAdd: [boxselect]
        });
    }

    if ((chartId === null || chartId === 'chartBandgapDonor')) {
        Plotly.newPlot('chartBandgapDonor', [bandgapDonorData], bandgapDonorLayout, {
            modeBarButtonsToRemove: ['zoom2d', 'hoverClosestCartesian', 'select2d', 'lasso2d', 'resetScale2d', 'hoverCompareCartesian', 'toggleSpikelines'],
            modeBarButtonsToAdd: [boxselect]
        });
    }


    document.getElementById('chartHOMOAcceptor').style.display = 'block';
    document.getElementById('chartLUMOAcceptor').style.display = 'block';
    document.getElementById('chartHOMODonor').style.display = 'block';
    document.getElementById('chartLUMODonor').style.display = 'block';
    document.getElementById('chartBandgapAcceptor').style.display = 'block';
    document.getElementById('chartBandgapDonor').style.display = 'block';

    addPlotlyClickEventForProperties('chartHOMOAcceptor', data, data1, 'tableHOMOAcceptor_click', 'spectrumHOMOAcceptor');
    addPlotlyClickEventForProperties('chartLUMOAcceptor', data, data1, 'tableLUMOAcceptor_click', 'spectrumLUMOAcceptor');
    addPlotlyClickEventForProperties('chartHOMODonor', data, data1, 'tableHOMODonor_click', 'spectrumHOMODonor');
    addPlotlyClickEventForProperties('chartLUMODonor', data, data1, 'tableLUMODonor_click', 'spectrumLUMODonor');
    addPlotlyClickEventForProperties('chartBandgapAcceptor', data, data1, 'tableBandgapAcceptor_click', 'spectrumBandgapAcceptor');
    addPlotlyClickEventForProperties('chartBandgapDonor', data, data1, 'tableBandgapDonor_click', 'spectrumBandgapDonor');


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














