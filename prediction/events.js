document.querySelectorAll('.drawBtn').forEach(button => {
    button.addEventListener('click', function() {
        var target = this.getAttribute('data-target');
        document.getElementById('editorWindow').setAttribute('data-target', target);
        document.getElementById('editorWindow').style.display = 'block';
    });
});
function renderSmiles(smiles, canvasId) {
    var smilesDrawer = new SmilesDrawer.Drawer({
        width: 450,
        height: 450
    });

    // 繪製 SMILES 結構
    SmilesDrawer.parse(smiles, function(tree) {
        smilesDrawer.draw(tree, document.getElementById(canvasId), 'light', false);
    }, function(err) {
        console.log('Error parsing SMILES: ', err);
    });
}
// 可以接收多組數據的函數
function renderSpectrumChartindatabase(spectrumDataSets, labels, chartId) {
    if (!Array.isArray(spectrumDataSets) || spectrumDataSets.length === 0) {
        console.error('Invalid spectrum data provided');
        return;
    }

    if (typeof chartId !== 'string' || !document.getElementById(chartId)) {
        console.error('Invalid chart ID provided');
        return;
    }

    // 預設標籤，若 labels 未提供完整對應名稱則使用這些
    const defaultLabels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction", "Acceptor OTM"];
    const finalLabels = (Array.isArray(labels) && labels.length >= spectrumDataSets.length)
        ? labels
        : defaultLabels.slice(0, spectrumDataSets.length);  // 確保 labels 長度匹配

    // 顏色配置，確保至少提供足夠的顏色
    const defaultColors = ["blue", "orange", "green", "red", "purple", "brown"];
    const colors = defaultColors.slice(0, spectrumDataSets.length);  // 限制顏色數量符合數據集

    // 產生曲線資料
    const traces = spectrumDataSets.map((spectrumData, idx) => {
        if (!Array.isArray(spectrumData)) {
            console.warn(`Skipping dataset at index ${idx} - not an array`);
            return null;
        }

        // 產生 X 軸波長範圍 (從 400nm 開始)
        const nmValues = Array.from({ length: spectrumData.length }, (_, index) => 400 + index);

        return {
            x: nmValues,
            y: spectrumData,
            type: 'scatter',
            mode: 'lines',
            name: finalLabels[idx],  // 確保圖例名稱一致
            line: { width: 2, color: colors[idx] }  // 設定線條顏色
        };
    }).filter(trace => trace !== null);  // 過濾掉無效數據

    if (traces.length === 0) {
        console.error('No valid datasets to plot');
        return;
    }

    // 動態計算 X 軸最大範圍
    const xMax = 400 + Math.max(...spectrumDataSets.map(d => d.length));

    // 設定圖表 Layout
    const layout = {
        title: '光譜',
        xaxis: {
            title: 'Wavelength (nm)',
            range: [400, xMax]
        },
        yaxis: {
            title: 'Absorbance',
            zeroline: false
        },
        showlegend: true // 確保圖例顯示，即使只有一組數據
    };

    // 繪製圖表
    Plotly.newPlot(chartId, traces, layout);
}



function renderSpectrumChart(spectrumData, labels, chartId) {
    // 确保 spectrumData 是一个数组，且每个子项都是数组
    if (!Array.isArray(spectrumData) || spectrumData.length === 0 || !Array.isArray(labels) || labels.length !== spectrumData.length) {
        console.error('Invalid spectrum data or labels provided');
        return;
    }

    // 获取波长范围（假设所有数据集的起始波长相同）
    const startWavelength = 400;
    const nmValues = Array.from({ length: spectrumData[0].length }, (_, index) => startWavelength + index);

    // 确保 chart 容器存在
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
        console.error(`Chart container with ID "${chartId}" not found.`);
        return;
    }

    // 构造 traces 数组
    const traces = spectrumData.map((data, index) => ({
        x: nmValues,
        y: data,
        type: 'scatter',
        mode: 'lines',
        name: labels[index], // 使用 labels 作为图例
        line: { width: 2 } // 可以根据需要自定义颜色
    }));

    // 定义 layout
    const layout = {
        title: '光譜',
        xaxis: {
            title: 'Wavelength (nm)',
            range: [Math.min(...nmValues), Math.max(...nmValues)]
        },
        yaxis: {
            title: 'Absorbance',
            zeroline: false
        },
        legend: {
            orientation: 'h', // 图例水平排列，可改为 'v' 变垂直排列
            x: 0.5,
            xanchor: 'center',
            y: 1.1
        }
    };

    // 绘制图表
    try {
        Plotly.newPlot(chartId, traces, layout);
    } catch (error) {
        console.error('Error rendering the spectrum chart:', error);
    }
}






document.getElementById('confirmButton').addEventListener('click', async function() {
    var target = document.getElementById('editorWindow').getAttribute('data-target');
    var chemObj = Kekule.Widget.getWidgetById('editor').getChemObj();
    var smiles = Kekule.IO.saveFormatData(chemObj, 'smi');
    
    if (smiles) {
        const iupacName = await convertSmilesToIupac(smiles);
        
        if (target === 'donor') {
            renderSmiles(smiles, 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
            document.getElementById('donorCanvas').setAttribute('data-smiles', smiles);
            
            if (iupacName) {
                document.getElementById('donorInput').value = iupacName; // 設置IUPAC名稱到donor輸入框
                document.getElementById('donorInput').style.color = 'black'; // 轉換成功時字體顏色為黑色
            } else {
                document.getElementById('donorInput').value = `${smiles}`; // 顯示無法轉換訊息和SMILES
                document.getElementById('donorInput').style.color = 'red'; // 無法轉換時字體變紅
            }
            
            
        } else if (target === 'acceptor') {
            renderSmiles(smiles, 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            document.getElementById('acceptorCanvas').setAttribute('data-smiles', smiles);
            
            if (iupacName) {
                document.getElementById('acceptorInput').value = iupacName; // 設置IUPAC名稱到acceptor輸入框
                document.getElementById('acceptorInput').style.color = 'black'; // 轉換成功時字體顏色為黑色
            } else {
                document.getElementById('acceptorInput').value = `${smiles}`; // 顯示無法轉換訊息和SMILES
                document.getElementById('acceptorInput').style.color = 'red'; // 無法轉換時字體變紅
            }
            
        }
        
        document.getElementById('editorWindow').style.display = 'none';
        document.getElementById('smilesDrawerContainer').style.display = 'flex';
        
    } else {
        alert('請先繪製化學結構再確認。');
    }
});








function resetResults() {
    document.getElementById('result').innerHTML = ''; // 清空結果容器
    document.getElementById('chartContainerPerformance').style.display = 'none';
    document.getElementById('chartContainerProperties').style.display = 'none';
    
}
function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布內容
    }
}






async function convertSmilesToIupac(smiles) {
    try {
        const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/property/IUPACName/JSON`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.PropertyTable && data.PropertyTable.Properties.length > 0) {
            return data.PropertyTable.Properties[0].IUPACName;
        } else {
            throw new Error('No IUPAC name found for the given SMILES.');
        }
    } catch (error) {
        console.error('Error converting SMILES to IUPAC:', error);
        return null;
    }
}

function findDonorSmiles(donorName) {
    // 先在 data 中搜尋
    let donorItem = data.find(item => item.Donor === donorName);

    // 如果 data 找不到，就在 data1 中搜尋（假設 data1 存在且結構相同）
    if (!donorItem && typeof data1 !== 'undefined') {
        donorItem = data1.find(item => item.Donor === donorName);
    }

    return donorItem ? donorItem['Donor SMILES'] : null;
}


function findAcceptorSmiles(acceptorName) {
    // 先在 data 中搜尋
    let acceptorItem = data.find(item => item.Acceptor === acceptorName);

    // 如果 data 找不到，就在 data1 中搜尋（假設 data1 存在且結構相同）
    if (!acceptorItem && typeof data1 !== 'undefined') {
        acceptorItem = data1.find(item => item.Acceptor === acceptorName);
    }

    return acceptorItem ? acceptorItem['Acceptor SMILES'] : null;
}



document.getElementById('closeEditorBtn').addEventListener('click', function() {
    document.getElementById('editorWindow').style.display = 'none';
});




// 檢查輸入是否為有效的 SMILES 格式
function isSmiles(input) {
    const smilesPattern = /^([BCOHNSPIFbcnosp\[\]@+\-\(\)=#\\\/0-9]+)$/;
    const isValid = smilesPattern.test(input);

    // 檢查字串長度，過短或過長的字串不應被視為 SMILES
    if (input.length < 5 ) {
        console.log(`Input: ${input} is too short `);
        return false;
    }



    console.log(`Input: ${input}, Is valid SMILES: ${isValid}`);
    return isValid;
}


// 綁定按鈕事件
document.getElementById('nameToStructureBtn').addEventListener('click', async function() {
    resetResults(); // 重置結果
    clearCanvas('donorCanvas');
    clearCanvas('acceptorCanvas');

    // 每次按下按鈕重新獲取 donorInput 和 acceptorInput 的值
    const donor = document.getElementById('donorInput').value.trim();
    const acceptor = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result'); // 顯示結果的元素

    // 清除之前的錯誤訊息
    resultElement.innerHTML = '';

    // 檢查是否至少輸入了 donor 或 acceptor
    if (!donor && !acceptor) {
        resultElement.innerHTML = '<p class="error">Please enter at least a donor or acceptor, or SMILES string</p>';
        return;
    }

    // 處理 Donor
    if (donor) {
        if (isSmiles(donor)) {
            await findStructureBySmiles(donor, 'donor'); // 當輸入為 SMILES 時
        } else {
            await findStructureByName(donor, 'donor'); // 當輸入為名稱時
        }
    }

    // 處理 Acceptor
    if (acceptor) {
        if (isSmiles(acceptor)) {
            await findStructureBySmiles(acceptor, 'acceptor'); // 當輸入為 SMILES 時
        } else {
            await findStructureByName(acceptor, 'acceptor'); // 當輸入為名稱時
        }
    }

    // 如果找到 Donor 或 Acceptor 的 SMILES，顯示繪製容器
    if ((donor && isSmiles(donor)) || (acceptor && isSmiles(acceptor))) {
        document.getElementById('smilesDrawerContainer').style.display = 'flex';
    }
});





// 定義 findStructureByName 函數來處理 Donor 或 Acceptor 的名稱輸入
async function findStructureByName(input, type) {
    const resultElement = document.getElementById('result'); // 顯示結果的元素
    const canvasId = type === 'donor' ? 'donorCanvas' : 'acceptorCanvas';
    const canvasLabelColor = type === 'donor' ? 'donorCanvas' : 'acceptorCanvas';

    let smiles;

    // 1. 先從數據庫查找名稱對應的 SMILES
    if (type === 'donor') {
        smiles = findDonorSmiles(input); // 從數據庫查找 Donor SMILES
    } else if (type === 'acceptor') {
        smiles = findAcceptorSmiles(input); // 從數據庫查找 Acceptor SMILES
    }

    // 2. 如果數據庫找不到，向 API 請求轉換名稱為 SMILES
    if (!smiles) {
        smiles = await convertNameToSmiles(input); // 調用 API 將名稱轉換為 SMILES
    }



    // 如果成功找到 SMILES，進行繪製
    if (smiles) {
        renderSmiles(smiles, canvasId); // 繪製 SMILES 結構
        changeCanvasLabelColor(canvasLabelColor, 'black'); // 成功，顏色設為黑色
    }
}
// 定義 findStructureBySmiles 函數來處理 Donor 或 Acceptor 的 SMILES 輸入
async function findStructureBySmiles(smiles, type) {
    const resultElement = document.getElementById('result'); // 顯示結果的元素
    const canvasId = type === 'donor' ? 'donorCanvas' : 'acceptorCanvas';
    const canvasLabelColor = type === 'donor' ? 'donorCanvas' : 'acceptorCanvas';

    // 檢查 SMILES 是否為有效的
    if (!smiles) {
        resultElement.innerHTML += `<p class="error">${type.charAt(0).toUpperCase() + type.slice(1)} input is invalid SMILES: ${smiles}</p>`;
        changeCanvasLabelColor(canvasLabelColor, 'red');
        return;
    }

    // 如果 SMILES 有效，繪製結構
    renderSmiles(smiles, canvasId); // 繪製 SMILES 結構
    changeCanvasLabelColor(canvasLabelColor, 'black'); // 成功，顏色設為黑色
}














// 使用PubChem API將名稱轉換為SMILES的函數
// 將多個 API 整合到一個函數中，依次嘗試轉換名稱為 SMILES
async function convertNameToSmiles(name) {
    // 定義第一個 API：CIR API
    async function convertWithCIR(name) {
        try {
            const response = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(name)}/smiles`);
            if (response.ok) {
                const smiles = await response.text();
                return smiles.trim();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error with CIR API:', error);
            return null;
        }
    }

    // 定義第二個 API：PubChem API
    async function convertWithPubChem(name) {
        try {
            const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES/JSON`);
            const data = await response.json();
            if (data.PropertyTable && data.PropertyTable.Properties && data.PropertyTable.Properties.length > 0) {
                return data.PropertyTable.Properties[0].CanonicalSMILES;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error with PubChem API:', error);
            return null;
        }
    }

    // 定義第三個 API：OPSIN API
    async function convertWithOPSIN(name) {
        try {
            const response = await fetch(`https://opsin.ch.cam.ac.uk/opsin/${encodeURIComponent(name)}.smi`);
            if (response.ok) {
                const smiles = await response.text();
                return smiles.trim();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error with OPSIN API:', error);
            return null;
        }
    }

    // 依次嘗試各個 API
    let smiles = await convertWithCIR(name); // 首先嘗試 CIR API
    if (!smiles) {
        smiles = await convertWithPubChem(name); // 如果 CIR API 失敗，嘗試 PubChem API
    }
    if (!smiles) {
        smiles = await convertWithOPSIN(name); // 如果 PubChem API 也失敗，嘗試 OPSIN API
    }

    return smiles; // 返回找到的 SMILES，若未找到則為 null
}


// 定義過濾函數，找到 donor 和 acceptor 的 SMILES 並進行篩選
function filterMatchingItems(data, donorName, acceptorName) {
    // 找到 donorName 對應的 Donor SMILES
    const donor = data.find(item => item.Donor === donorName);
    const donorSmiles = donor ? donor["Donor SMILES"] : null;

    // 找到 acceptorName 對應的 Acceptor SMILES
    const acceptor = data.find(item => item.Acceptor === acceptorName);
    const acceptorSmiles = acceptor ? acceptor["Acceptor SMILES"] : null;

    // 如果找不到其中一個 SMILES，回傳空陣列
    if (!donorSmiles || !acceptorSmiles) {
        console.warn("無法找到對應的 Donor 或 Acceptor 的 SMILES。");
        return [];
    }

    // 使用 SMILES 進行篩選並回傳結果
    return data.filter(item =>
        item['Donor SMILES'] === donorSmiles && item['Acceptor SMILES'] === acceptorSmiles
    );
}
function filterMatchingSmilesItems(data, donorSmiles, acceptorSmiles) {
    return data.filter(item => 
        item['Donor SMILES'] === donorSmiles && item['Acceptor SMILES'] === acceptorSmiles
    );
}
function findMatchingForDonorNameAndAcceptorSmiles(donorName, acceptorSmiles, data) {
    const matchingItems = data.filter(item => 
        item.Donor === donorName && item['Acceptor SMILES'] === acceptorSmiles
    );

    if (matchingItems.length > 0) {
        console.log('匹配的 Donor Name 和 Acceptor SMILES:', matchingItems);
    } else {
        console.log('找不到匹配的 Donor Name 和 Acceptor SMILES');
    }

    return matchingItems;
}

function findMatchingForDonorSmilesAndAcceptorName(donorSmiles, acceptorName, data) {
    const matchingItems = data.filter(item => 
        item['Donor SMILES'] === donorSmiles && item.Acceptor === acceptorName
    );

    if (matchingItems.length > 0) {
        console.log('匹配的 Donor SMILES 和 Acceptor Name:', matchingItems);
    } else {
        console.log('找不到匹配的 Donor SMILES 和 Acceptor Name');
    }

    return matchingItems;
}





// 綁定 properties 按鈕事件
document.getElementById('propertiesButton').addEventListener('click', async function () {
    resetResults(); // 重置結果
    clearCanvas('donorCanvas');
    clearCanvas('acceptorCanvas');

    const donor = document.getElementById('donorInput').value.trim();
    const acceptor = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result'); // 顯示結果的元素

    // 清除之前的錯誤訊息
    resultElement.innerHTML = '';

    // 檢查是否至少輸入了 donor 或 acceptor
    if (!donor && !acceptor) {
        resultElement.innerHTML = '<p class="error">Please enter at least a donor or acceptor, or SMILES string</p>';
        return;
    }

    try {
        if (donor && acceptor) {
            if (isSmiles(donor) && isSmiles(acceptor)) {
                // 如果 Donor 和 Acceptor 都是 SMILES
                await findPropertiesBySmiles(donor, 'donor');
                await findPropertiesBySmiles(acceptor, 'acceptor');
            } else if (!isSmiles(donor) && !isSmiles(acceptor)) {
                // 如果 Donor 和 Acceptor 都是名稱
                await findPropertiesByName(donor, 'donor');
                await findPropertiesByName(acceptor, 'acceptor');
            } else{
                await findPropertiesByMixInput(donor, acceptor);
            }
        } else if (donor&&!acceptor) {
            // 當只有 Donor
            if (isSmiles(donor)) {
                await findPropertiesBySmiles(donor, 'donor');
            } else {
                await findPropertiesByName(donor, 'donor');
            }
        } else if (!donor&&acceptor) {
            // 當只有 Acceptor
            if (isSmiles(acceptor)) {
                await findPropertiesBySmiles(acceptor, 'acceptor');
            } else {
                await findPropertiesByName(acceptor, 'acceptor');
            }
        }

        // 如果成功處理 Donor 或 Acceptor，顯示繪製容器
        document.getElementById('smilesDrawerContainer').style.display = 'flex';

    } catch (error) {
        console.error("Error processing donor/acceptor:", error);
        resultElement.innerHTML = `<p class="error">An error occurred: ${error.message}</p>`;
    }
});




async function findPropertiesByName() {
    resetResults(); // 重置结果
    clearCanvas('donorCanvas');
    clearCanvas('acceptorCanvas');

    const donor = document.getElementById('donorInput').value.trim();
    const acceptor = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result'); // 显示结果的元素

    // 检查输入是否为空
    if (!donor && !acceptor) {
        resultElement.innerHTML = '<p class="error">请输入至少一个捐赠者或受赠者的名称。</p>';
        return;
    }

    // 查找数据库中的 Donor 和 Acceptor 项目
    const donorItem = donor ? data.find(item => item.Donor === donor) : null;
    const acceptorItem = acceptor ? data.find(item => item.Acceptor === acceptor) : null;

    // 查找光谱数据库中的 Donor 和 Acceptor 光谱数据
    const donorSpectrumItem = donor ? data1.find(item => item.Donor === donor) : null;
    const acceptorSpectrumItem = acceptor ? data1.find(item => item.Acceptor === acceptor) : null;

    // 根据捐赠者和受赠者的存在状态，处理25种情况
    if (donorItem && donorSpectrumItem && acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
            const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction", "Acceptor OTM"];
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線

            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');

            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, acceptorSpectrumDataPred, acceptorSpectrumDataOTM], 
                labels, 
                "donorChart"
            );
            

            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);

            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理情況1時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }

    // 情況2：捐贈者存在於主數據庫和光譜數據庫中，受贈者僅存在於主數據庫中
    } else if (donorItem && donorSpectrumItem && acceptorItem && !acceptorSpectrumItem && donor && acceptor) {
        try {
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
            const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線
    
            // 繪製 Donor 和 Acceptor 的 SMILES 圖
            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
    
            // 獲取 Acceptor 預測光譜數據
            const spectrumResponse = await fetchSpectrumPredictionData(null, acceptorItem['Acceptor SMILES']);
    
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
    
            // 繪製光譜圖表
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction"];
            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, spectrumData1],
                labels,
                "donorChart"
            );
    
            // 填充 Donor 和 Acceptor 屬性表格
            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);
    
            // 繪製屬性圖表
            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理情況2時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    


    // 情況3：捐贈者存在於主數據庫和光譜數據庫中，受贈者僅存在於光譜數據庫中
    } else if (donorItem && donorSpectrumItem && !acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
            const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線

            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');

            renderSmiles(acceptorSpectrumItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction", "Acceptor OTM"];
            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, acceptorSpectrumDataPred, acceptorSpectrumDataOTM], 
                labels, 
                "donorChart"
            );


            const predictionData = await fetchPropertiesPredictionData(donorItem['Donor SMILES'], acceptorSpectrumItem['Acceptor SMILES']);
            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);

            plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
            plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
            plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');

            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理情況3時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }

    // 情況4：捐贈者存在於主數據庫和光譜數據庫中，受贈者不存在於任何數據庫中
    } else if (donorItem && donorSpectrumItem && !acceptorItem && !acceptorSpectrumItem&&donor && acceptor) {
        try {
            // 1. 渲染捐贈者的 SMILES 結構圖
            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
                        // 2. 嘗試將受贈者名稱轉換為 SMILES
            const acceptorSmiles = await convertNameToSmiles(acceptor);
            if (!acceptorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                return;
            }

            // 3. 渲染受贈者的 SMILES 結構圖
            renderSmiles(acceptorSmiles, 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線



            // 4. 渲染捐贈者的光譜圖表
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
			const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            

            // 獲取 Acceptor 預測光譜數據
            const spectrumResponse = await fetchSpectrumPredictionData(null, acceptorSmiles);
                
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

            // 繪製光譜圖表
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction"];
            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, spectrumData1],
                labels,
                "donorChart"
            );

            const predictionData = await fetchPropertiesPredictionData(donorItem['Donor SMILES'], acceptorSmiles);
            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);

            plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
            plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
            plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');

            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理情況4時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }

    // 情況5：捐贈者僅存在於主數據庫中，受贈者存在於主數據庫和光譜數據庫中
    } else if (donorItem && !donorSpectrumItem && acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {
            // 1. 渲染捐贈者的 SMILES 結構圖
            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
            

            // 2. 渲染受贈者的 SMILES 結構圖
            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線

            // 3. 嘗試抓取捐贈者的光譜預測數據
            const spectrumResponse = await fetchSpectrumPredictionData(donorItem['Donor SMILES'], null);
            if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據


            // 4. 渲染受贈者的光譜圖表
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
            const labels = ["Donor Prediction", ,"Acceptor OTM", "Acceptor Prediction"];
            renderSpectrumChartindatabase([spectrumData1,, acceptorSpectrumDataOTM,acceptorSpectrumDataPred], labels, "donorChart");
            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);

            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理情況5時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    // 情況6：捐贈者僅存在於主數據庫中，受贈者存在於光譜數據庫中
    } else if (donorItem && !donorSpectrumItem && !acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {
            // 1. 渲染捐贈者的 SMILES 結構圖
            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');

            // 3. 渲染受贈者的 SMILES 結構圖
            renderSmiles(acceptorSpectrumItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線

            // 3. 嘗試抓取捐贈者的光譜預測數據
            const spectrumResponse = await fetchSpectrumPredictionData(donorItem['Donor SMILES'], null);
            if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據

            // 5. 渲染受贈者的光譜圖表
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
            const labels = ["Donor Prediction", ,"Acceptor OTM", "Acceptor Prediction"];
            renderSpectrumChartindatabase([spectrumData1,, acceptorSpectrumDataOTM,acceptorSpectrumDataPred], labels, "donorChart");
            const predictionData = await fetchPropertiesPredictionData(donorItem['Donor SMILES'], acceptorSpectrumItem['Acceptor SMILES']);
            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);

            plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
            plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
            plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');

            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理情況6時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }

    } else if (donorItem && !donorSpectrumItem && acceptorItem && !acceptorSpectrumItem&&donor && acceptor) {
        try {
            // 7. 渲染捐贈者的 SMILES 結構圖
            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');

            // 2. 渲染受贈者的 SMILES 結構圖
            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線
            // 3. 嘗試抓取捐贈者的光譜預測數據
            const spectrumResponse = await fetchSpectrumPredictionData(donorItem['Donor SMILES'], acceptorItem['Acceptor SMILES']);
            if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
            const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
            const labels = ["Donor Prediction", ,"Acceptor Prediction", ];
            renderSpectrumChartindatabase([spectrumData1,,spectrumData2,], labels, "donorChart");
            

            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);

            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理情況X時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    } else if (donorItem && !donorSpectrumItem && !acceptorItem && !acceptorSpectrumItem&&donor && acceptor) {
        try {
            // 8. 渲染捐贈者的 SMILES 結構圖
            renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線

            // 2. 嘗試將受贈者名稱轉換為 SMILES
            const acceptorSmiles = await convertNameToSmiles(acceptor);
            if (!acceptorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                return;
            }

            // 3. 渲染受贈者的 SMILES 結構圖
            renderSmiles(acceptorSmiles, 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');

            const spectrumResponse = await fetchSpectrumPredictionData(donorItem['Donor SMILES'], acceptorSmiles);
    
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
            const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
            const labels = ["Donor Prediction", ,"Acceptor Prediction", ];
            renderSpectrumChartindatabase([spectrumData1,,spectrumData2,], labels, "donorChart");


            const predictionData = await fetchPropertiesPredictionData(donorItem['Donor SMILES'], acceptorSmiles);
            document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
            document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);

            plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
            plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
            plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');

            document.getElementById('chartContainerProperties').style.display = 'block';

        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    } else if (!donorItem && donorSpectrumItem && acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {

            // 9. 渲染 Donor 的 SMILES 結構圖
            renderSmiles(donorSpectrumItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');

            // 4. 渲染 Acceptor 的 SMILES 結構圖
            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
			const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction"];
            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, acceptorSpectrumDataPred,acceptorSpectrumDataOTM],
                labels,
                "donorChart"
            );


            const predictionData = await fetchPropertiesPredictionData(donorSpectrumItem['Donor SMILES'], acceptorItem['Acceptor SMILES']);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);
            document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);

            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
    
            
            plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
            plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
            plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
    
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    } else if (!donorItem && donorSpectrumItem && acceptorItem && !acceptorSpectrumItem&&donor && acceptor) {
        try {

            // 10. 渲染 Donor 的 SMILES 結構圖
            renderSmiles(donorSpectrumItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');

            // 4. 渲染 Acceptor 的 SMILES 結構圖
            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線

            // 5. 渲染 Donor 的光譜圖表
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
			const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            
            const spectrumResponse = await fetchSpectrumPredictionData(null, acceptorItem['Acceptor SMILES']);
    
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
            // 繪製光譜圖表
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction"];
            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, spectrumData1],
                labels,
                "donorChart"
            );



            const predictionData = await fetchPropertiesPredictionData(donorSpectrumItem['Donor SMILES'], acceptorItem['Acceptor SMILES']);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);
            document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);

            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
    
            
            plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
            plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
            plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
    
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    } else if (!donorItem && donorSpectrumItem && !acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {


            // 11. 渲染 Donor 的 SMILES 結構圖
            renderSmiles(donorSpectrumItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');

            // 4. 渲染 Acceptor 的 SMILES 結構圖
            renderSmiles(acceptorSpectrumItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線

            // 5. 渲染 Donor 的光譜圖表
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
			const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            
            // 6. 渲染 Acceptor 的光譜圖表
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
            // 繪製光譜圖表
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction","Acceptor OTM"];
            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, acceptorSpectrumDataPred,acceptorSpectrumDataOTM],
                labels,
                "donorChart"
            );
            
            const predictionData = await fetchPropertiesPredictionData(donorSpectrumItem['Donor SMILES'], acceptorSpectrumItem['Acceptor SMILES']);

            if (predictionData) {
                document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);
                document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
                plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
    
                plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
                plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
                plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
                plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
                plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
                document.getElementById('chartContainerProperties').style.display = 'block';
            } else {
                resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
            }
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    } else if (!donorItem && donorSpectrumItem && !acceptorItem && !acceptorSpectrumItem&&donor && acceptor) {
        try {

            // 12. 渲染 Donor 的 SMILES 結構圖
            renderSmiles(donorSpectrumItem['Donor SMILES'], 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線
            // 2. 嘗試將受贈者名稱轉換為 SMILES
            const acceptorSmiles = await convertNameToSmiles(acceptor);
            if (!acceptorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                return;
            }
            renderSmiles(acceptorSmiles, 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');

            // 5. 渲染 Donor 的光譜圖表
            const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
			const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
            

            // 獲取 Acceptor 預測光譜數據
            const spectrumResponse = await fetchSpectrumPredictionData(null, acceptorSmiles);
                
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
            // 繪製光譜圖表
            const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction"];
            renderSpectrumChartindatabase(
                [donorSpectrumDataPred, donorSpectrumDataOTM, spectrumData1],
                labels,
                "donorChart"
            );
            

            const predictionData = await fetchPropertiesPredictionData(donorSpectrumItem['Donor SMILES'], acceptorSmiles);

            if (predictionData) {
                document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);
                document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
                plotPropertyGraphs(data, donorSpectrumItem['Donor SMILES'], acceptorSmiles, 'both', false, null);
    
                plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
                plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
                plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
                plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
                plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
                document.getElementById('chartContainerProperties').style.display = 'block';
            } else {
                resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
            }
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    // 條件：!donorItem && !donorSpectrumItem && acceptorItem && acceptorSpectrumItem
    } else if (!donorItem && !donorSpectrumItem && acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線
                            // 2. 嘗試將受贈者名稱轉換為 SMILES
            
            const donorSmiles = await convertNameToSmiles(donor);
            if (!donorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                return;
            }
            // 3. 渲染 Donor 的 SMILES 結構圖
            renderSmiles(donorSmiles, 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');


            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');

            // 3. 渲染 Acceptor 的光譜圖表
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
            // 獲取 Acceptor 預測光譜數據
            const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);
    
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
            // 繪製光譜圖表
            const labels = ["Donor Prediction",,"Acceptor Prediction","Acceptor OTM"];
            renderSpectrumChartindatabase(
                [spectrumData1,,acceptorSpectrumDataPred,acceptorSpectrumDataOTM],
                labels,
                "donorChart"
            );



            const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorItem['Acceptor SMILES']);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);
            document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);

            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
    
            
            plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
            plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
            plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
    
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    } else if (!donorItem && !donorSpectrumItem && acceptorItem && !acceptorSpectrumItem&&donor && acceptor) {
        try {
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線
            // 2. 嘗試將受贈者名稱轉換為 SMILES
            const donorSmiles = await convertNameToSmiles(donor);
            if (!donorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                return;
            }
            renderSmiles(donorSmiles, 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');


            // 3. 渲染 Acceptor 的 SMILES 結構圖
            renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');

            // 獲取 Acceptor 預測光譜數據
            const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorItem["Acceptor SMILES"]);
    
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
            const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
            // 繪製光譜圖表
            const labels = ["Donor Prediction",,"Acceptor Prediction",];
            renderSpectrumChartindatabase(
                [spectrumData1,,spectrumData2,],
                labels,
                "donorChart"
            );

            const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorItem['Acceptor SMILES']);
            document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);
            document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);

            plotPropertyGraphs(data, donor, acceptor, 'both', false, null);
    
            
            plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
            plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
            plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
    
            document.getElementById('chartContainerProperties').style.display = 'block';
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
// 條件：!donorItem && !donorSpectrumItem && !acceptorItem && acceptorSpectrumItem
    } else if (!donorItem && !donorSpectrumItem && !acceptorItem && acceptorSpectrumItem&&donor && acceptor) {
        try {
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線
                            // 2. 嘗試將受贈者名稱轉換為 SMILES
            const donorSmiles = await convertNameToSmiles(donor);
            if (!donorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                return;
            }
            renderSmiles(donorSmiles, 'donorCanvas');

            changeCanvasLabelColor('donorCanvas', 'black');


            // 3. 渲染 Acceptor 的 SMILES 結構圖
            renderSmiles(acceptorSpectrumItem['Acceptor SMILES'], 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');

            // 4. 渲染 Acceptor 的光譜圖表
            const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
            const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);

            const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles, null);
    
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據

            // 繪製光譜圖表
            const labels = ["Donor Prediction",, "Acceptor Prediction", "Acceptor OTM"];
            renderSpectrumChartindatabase(
                [spectrumData1,,acceptorSpectrumDataPred,acceptorSpectrumDataOTM],
                labels,
                "donorChart"
            );


            const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorSpectrumItem['Acceptor SMILES']);

            if (predictionData) {
                document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);
                document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
                plotPropertyGraphs(data, donorSmiles, acceptorSpectrumItem['Acceptor SMILES'], 'both', false, null);
    
                plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
                plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
                plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
                plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
                plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
                document.getElementById('chartContainerProperties').style.display = 'block';
            } else {
                resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
            }
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    
    
    } else if (!donorItem && !donorSpectrumItem && !acceptorItem && !acceptorSpectrumItem&&donor && acceptor) {
        try {
            const separator = document.getElementById('separator');
            separator.style.display = 'block'; // 顯示分隔線


            // 2. 嘗試將 Donor 名稱轉換為 SMILES
            const donorSmiles = await convertNameToSmiles(donor);
            if (!donorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将捐赠者名称转换为 SMILES。</p>';
                return;
            }

            // 3. 嘗試將 Acceptor 名稱轉換為 SMILES
            const acceptorSmiles = await convertNameToSmiles(acceptor);
            if (!acceptorSmiles) {
                resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                return;
            }

            // 4. 渲染 Donor 的 SMILES 結構圖
            renderSmiles(donorSmiles, 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');

            // 5. 渲染 Acceptor 的 SMILES 結構圖
            renderSmiles(acceptorSmiles, 'acceptorCanvas');
                        changeCanvasLabelColor('acceptorCanvas', 'black');
            // 獲取 Acceptor 預測光譜數據
            const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles, acceptorSmiles);
                
            // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
            if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                console.error("Invalid spectrum data received:", spectrumResponse);
                return;
            }
            const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
            const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

            // 繪製光譜圖表
            const labels = ["Donor Prediction", , "Acceptor Prediction",];
            renderSpectrumChartindatabase(
                [spectrumData1, , spectrumData2,],
                labels,
                "donorChart"
            );

            const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorSmiles);

            if (predictionData) {
                document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);
                document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
                plotPropertyGraphs(data, donorSmiles, acceptorSmiles, 'both', false, null);
    
                plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
                plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
                plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
                plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
                plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
                document.getElementById('chartContainerProperties').style.display = 'block';
            } else {
                resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
            }
        } catch (error) {
            console.error('處理此條件時出錯：', error);
            document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
        }
    }else if (donor && !acceptor&&donorItem && donorSpectrumItem&& !acceptorItem && !acceptorSpectrumItem) {
            try {
                // 1. 渲染捐贈者的 SMILES 結構圖
                renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
                changeCanvasLabelColor('donorCanvas', 'black');



                // 3. 渲染捐贈者的光譜圖表
                const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
			    const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
                renderSpectrumChartindatabase([donorSpectrumDataPred, donorSpectrumDataOTM], donorSpectrumItem, "donorChart");

                document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
                plotPropertyGraphs(data, donor, null, 'donor', false);
        

                document.getElementById('tableHOMOAcceptor').style.display = 'none';
                document.getElementById('chartHOMOAcceptor').style.display = 'none';
                document.getElementById('chartLUMOAcceptor').style.display = 'none';
                document.getElementById('chartBandgapAcceptor').style.display = 'none';
                document.getElementById('chartContainerProperties').style.display = 'block';
            } catch (error) {
                console.error('處理情況7時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }

        // 情況8：捐贈者僅存在於主數據庫中，受贈者存在於主數據庫和光譜數據庫中
    } else if (donor && !acceptor&&donorItem && !donorSpectrumItem&& !acceptorItem && !acceptorSpectrumItem) {
            try {
                // 1. 渲染捐贈者的 SMILES 結構圖
                renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
                changeCanvasLabelColor('donorCanvas', 'black');


                const spectrumResponse = await fetchSpectrumPredictionData(donorItem["Donor SMILES"], null);
    
                // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
                if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                    console.error("Invalid spectrum data received:", spectrumResponse);
                    return;
                }
                const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        

                    // 繪製光譜圖表
                renderSpectrumChartindatabase(
                    [spectrumData1], // 只有一組數據
                    ["Donor Prediction"],     // 自訂標籤
                    "donorChart"
                );

                document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donor, data);
                plotPropertyGraphs(data, donor, null, 'donor', false);
        

                document.getElementById('tableHOMOAcceptor').style.display = 'none';
                document.getElementById('chartHOMOAcceptor').style.display = 'none';
                document.getElementById('chartLUMOAcceptor').style.display = 'none';
                document.getElementById('chartBandgapAcceptor').style.display = 'none';
                document.getElementById('chartContainerProperties').style.display = 'block';
            } catch (error) {
                console.error('處理情況8時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }

        // 情況9：捐贈者僅存在於主數據庫中，受贈者存在於光譜數據庫中
    } else if (donor && !acceptor&&!donorItem && donorSpectrumItem&& !acceptorItem && !acceptorSpectrumItem) {
            try {

                renderSmiles(donorSpectrumItem['Donor SMILES'], 'donorCanvas');
                changeCanvasLabelColor('donorCanvas', 'black');
                              
                const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
			    const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
                renderSpectrumChartindatabase([donorSpectrumDataPred, donorSpectrumDataOTM], donorSpectrumItem, "donorChart");


                const predictionData = await fetchPropertiesPredictionData(donorSpectrumItem['Donor SMILES']);
                document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);
                plotPropertyGraphs(data, donor, null, 'donor', false);
        

                document.getElementById('tableHOMOAcceptor').style.display = 'none';
                document.getElementById('chartHOMOAcceptor').style.display = 'none';
                document.getElementById('chartLUMOAcceptor').style.display = 'none';
                document.getElementById('chartBandgapAcceptor').style.display = 'none';
                document.getElementById('chartContainerProperties').style.display = 'block';
                plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
                plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
                plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                document.getElementById('chartContainerProperties').style.display = 'block';

            } catch (error) {
                console.error('處理情況9時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }
    }else if (donor && !acceptor&&!donorItem && !donorSpectrumItem&& !acceptorItem && !acceptorSpectrumItem) {
            try {
                                // 2. 嘗試將受贈者名稱轉換為 SMILES
                const donorSmiles = await convertNameToSmiles(donor);
                if (!donorSmiles) {
                    resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                    return;
                }
                // 1. 渲染捐贈者的 SMILES 結構圖
                renderSmiles(donorSmiles, 'donorCanvas');
                changeCanvasLabelColor('donorCanvas', 'black');
                              
                const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles, null);
    
                // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
                if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
                    console.error("Invalid spectrum data received:", spectrumResponse);
                    return;
                }
                const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        

                    // 繪製光譜圖表
                renderSpectrumChartindatabase(
                    [spectrumData1], // 只有一組數據
                    ["Donor Prediction"],     // 自訂標籤
                    "donorChart"
                );
                const predictionData = await fetchPropertiesPredictionData(donorSmiles);
                document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donor);
                plotPropertyGraphs(data, donor, null, 'donor', false);


        

                document.getElementById('tableHOMOAcceptor').style.display = 'none';
                document.getElementById('chartHOMOAcceptor').style.display = 'none';
                document.getElementById('chartLUMOAcceptor').style.display = 'none';
                document.getElementById('chartBandgapAcceptor').style.display = 'none';
                plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
                plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
                plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                document.getElementById('chartContainerProperties').style.display = 'block';

            } catch (error) {
                console.error('處理情況9時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }

    } else if (!donor && acceptor&&!donorItem && !donorSpectrumItem&&acceptorItem &&acceptorSpectrumItem) {
            try {
                // 渲染受贈者的 SMILES 結構圖
                renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
                changeCanvasLabelColor('acceptorCanvas', 'black');



                const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
                const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
                const labels = [, , "Acceptor Prediction","Acceptor OTM"];
                renderSpectrumChartindatabase(
                    [, ,acceptorSpectrumDataPred,acceptorSpectrumDataOTM],
                    labels,
                    "donorChart"
                );

                document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);
                plotPropertyGraphs(data, null, acceptor, 'acceptor', false);
        
                document.getElementById('tableHOMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
                document.getElementById('tableLUMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
                document.getElementById('chartHOMODonor').style.display = 'none';
                document.getElementById('chartLUMODonor').style.display = 'none';
                document.getElementById('tableBandgapDonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('chartBandgapDonor').style.display = 'none';            
                document.getElementById('chartContainerProperties').style.display = 'block';        
                document.getElementById('chartContainerProperties').style.display = 'block';
            } catch (error) {
                console.error('處理情況10時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }

        // 情況11：捐贈者不存在，受贈者僅存在於光譜數據庫中
        } else if ( !donor && acceptor&&!donorItem && !donorSpectrumItem&&!acceptorItem && acceptorSpectrumItem) {
            try {


                // 渲染受贈者的 SMILES 結構圖
                renderSmiles(acceptorSpectrumItem['Acceptor SMILES'], 'acceptorCanvas');
                changeCanvasLabelColor('acceptorCanvas', 'black');



                // 渲染受贈者的光譜圖表
                const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
                const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
                const labels = [, , "Acceptor Prediction","Acceptor OTM"];
                renderSpectrumChartindatabase(
                    [, ,acceptorSpectrumDataPred,acceptorSpectrumDataOTM],
                    labels,
                    "donorChart"
                );
                const predictionData = await fetchPropertiesPredictionData(null, acceptorSpectrumItem['Acceptor SMILES']);
                document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
                plotPropertyGraphs(data, null, acceptor, 'acceptor', false);
        

                document.getElementById('tableHOMODonor').style.display = 'none';
                plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
                plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
                plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
                document.getElementById('tableHOMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
                document.getElementById('tableLUMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
                document.getElementById('chartHOMODonor').style.display = 'none';
                document.getElementById('chartLUMODonor').style.display = 'none';
                document.getElementById('tableBandgapDonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('chartBandgapDonor').style.display = 'none';            
                document.getElementById('chartContainerProperties').style.display = 'block';
            } catch (error) {
                console.error('處理情況11時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }

        // 情況12：捐贈者不存在，受贈者存在於主數據庫和光譜數據庫中，但 SMILES 轉換失敗
        } else if (!donor && acceptor&&!donorItem && !donorSpectrumItem&&acceptorItem && !acceptorSpectrumItem) {
            try {


                // 渲染受贈者的 SMILES 結構圖
                renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
                changeCanvasLabelColor('acceptorCanvas', 'black');



                // 嘗試抓取受贈者的光譜預測數據
                const spectrumResponse = await fetchSpectrumPredictionData(null, acceptorItem["Acceptor SMILES"]);
    
                // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
                if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                    console.error("Invalid spectrum data received:", spectrumResponse);
                    return;
                }
                const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
        

                    // 繪製光譜圖表
                renderSpectrumChartindatabase(
                    [spectrumData1], // 只有一組數據
                    ["Acceptor Prediction"],     // 自訂標籤
                    "donorChart"
                );

                document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptor, data);
                plotPropertyGraphs(data, null, acceptor, 'acceptor', false);
        
        

                document.getElementById('tableHOMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
                document.getElementById('tableLUMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
                document.getElementById('chartHOMODonor').style.display = 'none';
                document.getElementById('chartLUMODonor').style.display = 'none';
                document.getElementById('tableBandgapDonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('chartBandgapDonor').style.display = 'none';            
                document.getElementById('chartContainerProperties').style.display = 'block';
            } catch (error) {
                console.error('處理情況12時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }
        } else if (!donor && acceptor&&!donorItem && !donorSpectrumItem&&!acceptorItem && !acceptorSpectrumItem) {
            try {
                const acceptorSmiles = await convertNameToSmiles(acceptor);
                if (!acceptorSmiles) {
                    resultElement.innerHTML = '<p class="error">无法将受赠者名称转换为 SMILES。</p>';
                    return;
                }

                // 渲染受贈者的 SMILES 結構圖
                renderSmiles(acceptorSmiles, 'acceptorCanvas');
                changeCanvasLabelColor('acceptorCanvas', 'black');



                const spectrumResponse = await fetchSpectrumPredictionData(null, acceptorSmiles);
    
                // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
                if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
                    console.error("Invalid spectrum data received:", spectrumResponse);
                    return;
                }
                const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據
        

                    // 繪製光譜圖表
                renderSpectrumChartindatabase(
                    [spectrumData1], // 只有一組數據
                    ["Acceptor Prediction"],     // 自訂標籤
                    "donorChart"
                );

                const predictionData = await fetchPropertiesPredictionData(null, acceptorSmiles);
                document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptor);
                plotPropertyGraphs(data, null, acceptor, 'acceptor', false);
                plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
                plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
                plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
        

                document.getElementById('tableHOMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
                document.getElementById('tableLUMODonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
                document.getElementById('chartHOMODonor').style.display = 'none';
                document.getElementById('chartLUMODonor').style.display = 'none';
                document.getElementById('tableBandgapDonor').style.display = 'none';
                document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
                document.getElementById('chartBandgapDonor').style.display = 'none';            
                document.getElementById('chartContainerProperties').style.display = 'block';
            } catch (error) {
                console.error('處理情況12時出錯：', error);
                document.getElementById('result').innerHTML = '<p class="error">處理您的請求時發生錯誤。請稍後再試。</p>';
            }

    }}




async function findPropertiesBySmiles() {
    resetResults(); // 重置結果
    clearCanvas('donorCanvas');
    clearCanvas('acceptorCanvas');

    const donorSmiles = document.getElementById('donorInput').value.trim();
    const acceptorSmiles = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result'); // 顯示結果的元素
    // **🟢 Log: 確認接收到的 Donor 和 Acceptor**
    console.log(`📥 接收到的輸入值: Donor = "${donorSmiles}", Acceptor = "${acceptorSmiles}"`);

    // 檢查輸入是否為空
    if (!donorSmiles && !acceptorSmiles) {
        resultElement.innerHTML = '<p class="error">Please enter at least donor or acceptor SMILES</p>';
        return;
    }

    // 查找數據庫中的 Donor 和 Acceptor 項目
    const donorItem = donorSmiles ? data.find(item => item['Donor SMILES'] === donorSmiles) : null;
    const acceptorItem = acceptorSmiles ? data.find(item => item['Acceptor SMILES'] === acceptorSmiles) : null;
    
    const donorSpectrumItem = donorSmiles ? data1.find(item => item['Donor SMILES'] === donorSmiles) : null;
    const acceptorSpectrumItem = acceptorSmiles ? data1.find(item => item['Acceptor SMILES'] === acceptorSmiles) : null;

    // 情境 1: Donor在主數據庫中、在光譜數據庫中，Acceptor在主數據庫中、在光譜數據庫中
    if (donorItem && donorSpectrumItem && acceptorItem && acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        // 渲染 Donor 和 Acceptor 的光譜圖表
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
        const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction", "Acceptor OTM"];


        renderSpectrumChartindatabase(
            [donorSpectrumDataPred, donorSpectrumDataOTM, acceptorSpectrumDataPred, acceptorSpectrumDataOTM], 
            labels, 
            "donorChart"
        );

        
        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);

        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 1-1: Donor在主數據庫中、不在光譜數據庫中，Acceptor在主數據庫中、在光譜數據庫中
    else if (donorItem && !donorSpectrumItem && acceptorItem && acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }
        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction", "Acceptor prediction", "Acceptor OTM"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,acceptorSpectrumDataPred,acceptorSpectrumDataOTM], labels, "donorChart");




        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 1-2: Donor在主數據庫中、在光譜數據庫中，Acceptor在主數據庫中、不在光譜數據庫中
    else if (donorItem && donorSpectrumItem && acceptorItem && !acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }
        const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([donorSpectrumDataPred,donorSpectrumDataOTM,spectrumData1], labels, "donorChart");

        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 1-3: Donor在主數據庫中、不在光譜數據庫中，Acceptor在主數據庫中、不在光譜數據庫中
    else if (donorItem && !donorSpectrumItem && acceptorItem && !acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }
        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");

        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 2-1: Donor在主數據庫中、在光譜數據庫中，Acceptor不在主數據庫中、不在光譜數據庫中
    else if (donorItem && !acceptorItem && donorSmiles && acceptorSmiles && donorSpectrumItem && !acceptorSpectrumItem) {
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction","Donor OTM","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([donorSpectrumDataPred,donorSpectrumDataOTM,spectrumData2], labels, "donorChart");
        
        

        const predictionData = await fetchPropertiesPredictionData(donorItem['Donor SMILES'], acceptorSmiles);
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorSmiles, 'both',false,null);
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }    
    // 情境 2-3: Donor 在主數據庫中但不在光譜數據庫中，Acceptor 不在主數據庫中也不在光譜數據庫中
    else if (donorItem && !acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");


        const predictionData = await fetchPropertiesPredictionData(null, acceptorSmiles);
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorSmiles, 'both',false,null);
        
        // 繪製水平箭頭
        
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }    
    // 情境 3-2: Donor 不在主數據庫中但不在光譜數據庫中，Acceptor 在主數據庫中也在光譜數據庫中
    else if (!donorItem && acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && acceptorSpectrumItem) {
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據


        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction","Acceptor OTM"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,acceptorSpectrumDataPred,acceptorSpectrumDataOTM], labels, "donorChart");
        

        const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorItem['Acceptor SMILES']);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, acceptorItem['Acceptor'], 'both');
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 3-3: Donor 不在主數據庫中但不在光譜數據庫中，Acceptor 在主數據庫中也不在光譜數據庫中
    else if (!donorItem && acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據


        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");

        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorItem['Acceptor SMILES']);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, acceptorItem['Acceptor'], 'both',false,null);
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                    
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 3-3: Donor 不在主數據庫中但不在光譜數據庫中，Acceptor 在主數據庫中也不在光譜數據庫中
    else if (!donorItem && !acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據


        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");

        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorSmiles);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, acceptorSmiles, 'both',false,null);
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');            
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 5: 只輸入 Donor，且 Donor 在主數據庫和光譜數據庫中
    else if (donorItem && !acceptorSmiles && !acceptorItem && donorSmiles && donorSpectrumItem && !acceptorSpectrumItem) {
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        renderSpectrumChartindatabase([donorSpectrumDataPred, donorSpectrumDataOTM], donorSpectrumItem, "donorChart");
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        plotPropertyGraphs(data, donorItem['Donor'], null, 'donor');
        changeCanvasLabelColor('donorCanvas', 'black');
        
        // 隱藏 Acceptor 相關元素
        document.getElementById('tableHOMOAcceptor').style.display = 'none';
        document.getElementById('chartHOMOAcceptor').style.display = 'none';
        document.getElementById('chartLUMOAcceptor').style.display = 'none';
        document.getElementById('chartBandgapAcceptor').style.display = 'none';
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 5-1: 只輸入 Donor，且 Donor 在主數據庫中但不在光譜數據庫中
    else if (donorItem && !acceptorSmiles && !acceptorItem && donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Donor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");

        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        
        // 渲染 SMILES 結構圖
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], null, 'donor');
        changeCanvasLabelColor('donorCanvas', 'black');
        
        // 隱藏 Acceptor 相關元素
        document.getElementById('tableHOMOAcceptor').style.display = 'none';
        document.getElementById('chartHOMOAcceptor').style.display = 'none';
        document.getElementById('chartLUMOAcceptor').style.display = 'none';
        document.getElementById('chartBandgapAcceptor').style.display = 'none';
        
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 5-1: 只輸入 Donor，且 Donor 在主數據庫中但不在光譜數據庫中
    else if (!donorItem && !acceptorSmiles && !acceptorItem && donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Donor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");

        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(donorSmiles, null);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        // 渲染 SMILES 結構圖
        renderSmiles(donorSmiles, 'donorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, null, 'donor');
        changeCanvasLabelColor('donorCanvas', 'black');
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
        
        // 隱藏 Acceptor 相關元素
        document.getElementById('tableHOMOAcceptor').style.display = 'none';
        document.getElementById('chartHOMOAcceptor').style.display = 'none';
        document.getElementById('chartLUMOAcceptor').style.display = 'none';
        document.getElementById('chartBandgapAcceptor').style.display = 'none';
        
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 6: 只輸入 Acceptor，且 Acceptor 在主數據庫和光譜數據庫中
    else if (!donorItem && acceptorSmiles && acceptorItem && !donorSmiles && !donorSpectrumItem && acceptorSpectrumItem) {
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);


        renderSpectrumChartindatabase([acceptorSpectrumDataPred, acceptorSpectrumDataOTM], acceptorSpectrumItem, "acceptorChart");
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        plotPropertyGraphs(data, null, acceptorItem['Acceptor'], 'acceptor');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        
        // 隱藏 Donor 相關元素
        document.getElementById('tableHOMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
        document.getElementById('tableLUMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
        document.getElementById('chartHOMODonor').style.display = 'none';
        document.getElementById('chartLUMODonor').style.display = 'none';
        document.getElementById('tableBandgapDonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('chartBandgapDonor').style.display = 'none';            
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 6-1: 只輸入 Acceptor，且 Acceptor 在主數據庫中但不在光譜數據庫中
    else if (!donorItem && acceptorSmiles && acceptorItem && !donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");

        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        plotPropertyGraphs(data, null, acceptorItem['Acceptor'], 'acceptor');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        
        // 隱藏 Donor 相關元素
        document.getElementById('tableHOMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
        document.getElementById('tableLUMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
        document.getElementById('chartHOMODonor').style.display = 'none';
        document.getElementById('chartLUMODonor').style.display = 'none';
        document.getElementById('tableBandgapDonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('chartBandgapDonor').style.display = 'none';            
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 6-3: 只輸入 Acceptor，且 Acceptor 不在主數據庫中且不在光譜數據庫中
    else if (!donorItem && acceptorSmiles && !acceptorItem && !donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");
        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(null, acceptorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, null, acceptorSmiles, 'acceptor');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
        // 隱藏 Donor 相關元素
        document.getElementById('tableHOMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
        document.getElementById('tableLUMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
        document.getElementById('chartHOMODonor').style.display = 'none';
        document.getElementById('chartLUMODonor').style.display = 'none';
        document.getElementById('tableBandgapDonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('chartBandgapDonor').style.display = 'none';            
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 如果發生未知情況
    resultElement.innerHTML = '<p class="error">Unexpected error occurred.</p>';
}

async function findPropertiesformixinput(donor, acceptor) {
    let donorSmiles = donor;
    let acceptorSmiles = acceptor;

    // 檢查輸入是否為空
    if (!donorSmiles && !acceptorSmiles) {
        resultElement.innerHTML = '<p class="error">Please enter at least donor or acceptor SMILES</p>';
        return;
    }

    // 查找數據庫中的 Donor 和 Acceptor 項目
    const donorItem = donorSmiles ? data.find(item => item['Donor SMILES'] === donorSmiles) : null;
    const acceptorItem = acceptorSmiles ? data.find(item => item['Acceptor SMILES'] === acceptorSmiles) : null;
    
    const donorSpectrumItem = donorSmiles ? data1.find(item => item['Donor SMILES'] === donorSmiles) : null;
    const acceptorSpectrumItem = acceptorSmiles ? data1.find(item => item['Acceptor SMILES'] === acceptorSmiles) : null;

    // 情境 1: Donor在主數據庫中、在光譜數據庫中，Acceptor在主數據庫中、在光譜數據庫中
    if (donorItem && donorSpectrumItem && acceptorItem && acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        // 渲染 Donor 和 Acceptor 的光譜圖表
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
        const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction", "Acceptor OTM"];


        renderSpectrumChartindatabase(
            [donorSpectrumDataPred, donorSpectrumDataOTM, acceptorSpectrumDataPred, acceptorSpectrumDataOTM], 
            labels, 
            "donorChart"
        );

        
        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);

        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 1-1: Donor在主數據庫中、不在光譜數據庫中，Acceptor在主數據庫中、在光譜數據庫中
    else if (donorItem && !donorSpectrumItem && acceptorItem && acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }
        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction", "Acceptor prediction", "Acceptor OTM"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,acceptorSpectrumDataPred,acceptorSpectrumDataOTM], labels, "donorChart");




        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 1-2: Donor在主數據庫中、在光譜數據庫中，Acceptor在主數據庫中、不在光譜數據庫中
    else if (donorItem && donorSpectrumItem && acceptorItem && !acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }
        const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction", "Donor OTM", "Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([donorSpectrumDataPred,donorSpectrumDataOTM,spectrumData1], labels, "donorChart");

        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 1-3: Donor在主數據庫中、不在光譜數據庫中，Acceptor在主數據庫中、不在光譜數據庫中
    else if (donorItem && !donorSpectrumItem && acceptorItem && !acceptorSpectrumItem && donorSmiles && acceptorSmiles) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }
        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");

        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorItem['Acceptor'], 'both',false,null);
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 2-1: Donor在主數據庫中、在光譜數據庫中，Acceptor不在主數據庫中、不在光譜數據庫中
    else if (donorItem && !acceptorItem && donorSmiles && acceptorSmiles && donorSpectrumItem && !acceptorSpectrumItem) {
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction","Donor OTM","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([donorSpectrumDataPred,donorSpectrumDataOTM,spectrumData2], labels, "donorChart");
        
        

        const predictionData = await fetchPropertiesPredictionData(donorItem['Donor SMILES'], acceptorSmiles);
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorSmiles, 'both',false,null);
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }    
    // 情境 2-3: Donor 在主數據庫中但不在光譜數據庫中，Acceptor 不在主數據庫中也不在光譜數據庫中
    else if (donorItem && !acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據

        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");


        const predictionData = await fetchPropertiesPredictionData(null, acceptorSmiles);
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], acceptorSmiles, 'both',false,null);
        
        // 繪製水平箭頭
        
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }    
    // 情境 3-2: Donor 不在主數據庫中但不在光譜數據庫中，Acceptor 在主數據庫中也在光譜數據庫中
    else if (!donorItem && acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && acceptorSpectrumItem) {
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據


        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction","Acceptor OTM"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,acceptorSpectrumDataPred,acceptorSpectrumDataOTM], labels, "donorChart");
        

        const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorItem['Acceptor SMILES']);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, acceptorItem['Acceptor'], 'both');
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 3-3: Donor 不在主數據庫中但不在光譜數據庫中，Acceptor 在主數據庫中也不在光譜數據庫中
    else if (!donorItem && acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據


        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");

        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorItem['Acceptor SMILES']);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, acceptorItem['Acceptor'], 'both',false,null);
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
                    
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 3-3: Donor 不在主數據庫中但不在光譜數據庫中，Acceptor 在主數據庫中也不在光譜數據庫中
    else if (!donorItem && !acceptorItem && donorSmiles && acceptorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        const separator = document.getElementById('separator');
        separator.style.display = 'block'; // 顯示分隔線
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據
        const spectrumData2 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據


        // 繪製光譜圖表
        const labels = ["Donor Prediction","Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1,spectrumData2], labels, "donorChart");

        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(donorSmiles, acceptorSmiles);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        changeCanvasLabelColor('donorCanvas', 'black');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        renderSmiles(donorSmiles, 'donorCanvas');
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, acceptorSmiles, 'both',false,null);
        
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');            
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 5: 只輸入 Donor，且 Donor 在主數據庫和光譜數據庫中
    else if (donorItem && !acceptorSmiles && !acceptorItem && donorSmiles && donorSpectrumItem && !acceptorSpectrumItem) {
        const donorSpectrumDataPred = donorSpectrumItem.IntensityPred.split(',').map(Number);
        const donorSpectrumDataOTM = donorSpectrumItem.IntensityOTM.split(',').map(Number);
        renderSpectrumChartindatabase([donorSpectrumDataPred, donorSpectrumDataOTM], donorSpectrumItem, "donorChart");
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        plotPropertyGraphs(data, donorItem['Donor'], null, 'donor');
        changeCanvasLabelColor('donorCanvas', 'black');
        
        // 隱藏 Acceptor 相關元素
        document.getElementById('tableHOMOAcceptor').style.display = 'none';
        document.getElementById('chartHOMOAcceptor').style.display = 'none';
        document.getElementById('chartLUMOAcceptor').style.display = 'none';
        document.getElementById('chartBandgapAcceptor').style.display = 'none';
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 5-1: 只輸入 Donor，且 Donor 在主數據庫中但不在光譜數據庫中
    else if (donorItem && !acceptorSmiles && !acceptorItem && donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Donor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");

        // 渲染屬性表格
        document.getElementById('tableHOMODonor').innerHTML = createDonorPropertiesTable(donorItem['Donor'], data);
        
        // 渲染 SMILES 結構圖
        renderSmiles(donorItem['Donor SMILES'], 'donorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorItem['Donor'], null, 'donor');
        changeCanvasLabelColor('donorCanvas', 'black');
        
        // 隱藏 Acceptor 相關元素
        document.getElementById('tableHOMOAcceptor').style.display = 'none';
        document.getElementById('chartHOMOAcceptor').style.display = 'none';
        document.getElementById('chartLUMOAcceptor').style.display = 'none';
        document.getElementById('chartBandgapAcceptor').style.display = 'none';
        
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }
    // 情境 5-1: 只輸入 Donor，且 Donor 在主數據庫中但不在光譜數據庫中
    else if (!donorItem && !acceptorSmiles && !acceptorItem && donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(donorSmiles,null);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.donorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.donorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Donor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");

        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(donorSmiles, null);
        document.getElementById('tableHOMODonor').innerHTML = generatePredictionTable(predictionData, 'donor', donorSmiles);
        // 渲染 SMILES 結構圖
        renderSmiles(donorSmiles, 'donorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, donorSmiles, null, 'donor');
        changeCanvasLabelColor('donorCanvas', 'black');
        // 繪製水平箭頭
        plotHorizontalArrow('chartHOMODonor', predictionData['HOMO of Donor (eV).1'], 'Donor HOMO Prediction');
        plotHorizontalArrow('chartLUMODonor', predictionData['LUMO of Donor (eV).1'], 'Donor LUMO Prediction');
        plotHorizontalArrow('chartBandgapDonor', predictionData['Bandgap of Donor (eV).1'], 'Donor Bandgap Prediction');
        
        // 隱藏 Acceptor 相關元素
        document.getElementById('tableHOMOAcceptor').style.display = 'none';
        document.getElementById('chartHOMOAcceptor').style.display = 'none';
        document.getElementById('chartLUMOAcceptor').style.display = 'none';
        document.getElementById('chartBandgapAcceptor').style.display = 'none';
        
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 6: 只輸入 Acceptor，且 Acceptor 在主數據庫和光譜數據庫中
    else if (!donorItem && acceptorSmiles && acceptorItem && !donorSmiles && !donorSpectrumItem && acceptorSpectrumItem) {
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        const acceptorSpectrumDataPred = acceptorSpectrumItem.IntensityPred.split(',').map(Number);
        const acceptorSpectrumDataOTM = acceptorSpectrumItem.IntensityOTM.split(',').map(Number);


        renderSpectrumChartindatabase([acceptorSpectrumDataPred, acceptorSpectrumDataOTM], acceptorSpectrumItem, "acceptorChart");
        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        plotPropertyGraphs(data, null, acceptorItem['Acceptor'], 'acceptor');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        
        // 隱藏 Donor 相關元素
        document.getElementById('tableHOMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
        document.getElementById('tableLUMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
        document.getElementById('chartHOMODonor').style.display = 'none';
        document.getElementById('chartLUMODonor').style.display = 'none';
        document.getElementById('tableBandgapDonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('chartBandgapDonor').style.display = 'none';            
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 6-1: 只輸入 Acceptor，且 Acceptor 在主數據庫中但不在光譜數據庫中
    else if (!donorItem && acceptorSmiles && acceptorItem && !donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        document.getElementById('tableHOMOAcceptor').innerHTML = createAcceptorPropertiesTable(acceptorItem['Acceptor'], data);
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");

        renderSmiles(acceptorItem['Acceptor SMILES'], 'acceptorCanvas');
        plotPropertyGraphs(data, null, acceptorItem['Acceptor'], 'acceptor');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        
        // 隱藏 Donor 相關元素
        document.getElementById('tableHOMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
        document.getElementById('tableLUMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
        document.getElementById('chartHOMODonor').style.display = 'none';
        document.getElementById('chartLUMODonor').style.display = 'none';
        document.getElementById('tableBandgapDonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('chartBandgapDonor').style.display = 'none';            
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 情境 6-3: 只輸入 Acceptor，且 Acceptor 不在主數據庫中且不在光譜數據庫中
    else if (!donorItem && acceptorSmiles && !acceptorItem && !donorSmiles && !donorSpectrumItem && !acceptorSpectrumItem) {
        // 獲取 Acceptor 預測光譜數據
        const spectrumResponse = await fetchSpectrumPredictionData(null,acceptorSmiles);

        // 確保 spectrumResponse 是有效的對象，並提取 Acceptor 光譜數據
        if (!spectrumResponse || !Array.isArray(spectrumResponse.acceptorResult)) {
            console.error("Invalid spectrum data received:", spectrumResponse);
            return;
        }

        const spectrumData1 = spectrumResponse.acceptorResult; // 提取 acceptor 光譜數據



        // 繪製光譜圖表
        const labels = ["Acceptor Prediction"];
        // 調用函數，將數據繪製到 id 為 "spectrumChart" 的 div 上
        renderSpectrumChartindatabase([spectrumData1], labels, "donorChart");
        // 獲取屬性預測數據
        const predictionData = await fetchPropertiesPredictionData(null, acceptorSmiles);
        document.getElementById('tableHOMOAcceptor').innerHTML = generatePredictionTable(predictionData, 'acceptor', acceptorSmiles);
        
        // 渲染 SMILES 結構圖
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        
        // 繪製圖形
        plotPropertyGraphs(data, null, acceptorSmiles, 'acceptor');
        changeCanvasLabelColor('acceptorCanvas', 'black');
        plotHorizontalArrow('chartHOMOAcceptor', predictionData['HOMO of Acceptor (eV).1'], 'Acceptor HOMO Prediction');
        plotHorizontalArrow('chartLUMOAcceptor', predictionData['LUMO of Acceptor (eV).1'], 'Acceptor LUMO Prediction');
        plotHorizontalArrow('chartBandgapAcceptor', predictionData['Bandgap of Acceptor (eV).1'], 'Acceptor Bandgap Prediction');
        // 隱藏 Donor 相關元素
        document.getElementById('tableHOMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasHOMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasHOMODonor').style.display = 'none';
        document.getElementById('tableLUMODonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasLUMODonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasLUMODonor').style.display = 'none';
        document.getElementById('chartHOMODonor').style.display = 'none';
        document.getElementById('chartLUMODonor').style.display = 'none';
        document.getElementById('tableBandgapDonor').style.display = 'none';
        document.getElementById('clickedDonorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('clickedAcceptorCanvasBandgapDonor').style.display = 'none';
        document.getElementById('chartBandgapDonor').style.display = 'none';            
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }

    // 如果發生未知情況
    resultElement.innerHTML = '<p class="error">Unexpected error occurred.</p>';
}

async function findPropertiesByMixInput(donor, acceptor) {
    resetResults(); // 重置结果
    clearCanvas('donorCanvas');
    clearCanvas('acceptorCanvas');

    donor = document.getElementById('donorInput').value.trim();
    acceptor = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result'); // 显示结果的元素

    // 检查输入是否为空
    if (!donor && !acceptor) {
        resultElement.innerHTML = '<p class="error">请输入至少一个捐赠者或受赠者的名称。</p>';
        return;
    }

    let donorSmiles = donor && isSmiles(donor) ? donor : null;
    let acceptorSmiles = acceptor && isSmiles(acceptor) ? acceptor : null;

    // **處理 Donor**
    if (donor && !isSmiles(donor)) {
        console.log(`🔍 Donor 名稱輸入: ${donor}`);
        donorSmiles = findDonorSmiles(donor) || await convertNameToSmiles(donor);
        console.log(`🟢 轉換後 Donor SMILES: ${donorSmiles}`);

        if (!donorSmiles) {
            document.getElementById('result').innerHTML = `<p class="error">无法将 Donor "${donor}" 转换为 SMILES。</p>`;
            return;
        }
    }

    // **處理 Acceptor**
    if (acceptor && !isSmiles(acceptor)) {
        console.log(`🔍 Acceptor 名稱輸入: ${acceptor}`);
        acceptorSmiles = findAcceptorSmiles(acceptor) || await convertNameToSmiles(acceptor);
        console.log(`🟢 轉換後 Acceptor SMILES: ${acceptorSmiles}`);

        if (!acceptorSmiles) {
            document.getElementById('result').innerHTML = `<p class="error">无法将 Acceptor "${acceptor}" 转换为 SMILES。</p>`;
            return;
        }
    }

    // **最終確認並傳送給 findPropertiesBySmiles**
    console.log(`🚀 送給 findPropertiesBySmiles() 的值: Donor SMILES = ${donorSmiles}, Acceptor SMILES = ${acceptorSmiles}`);

    if (donorSmiles && acceptorSmiles) {
        console.log(`🔹 調用 findPropertiesBySmiles() - Donor: ${donorSmiles}, Acceptor: ${acceptorSmiles}`);
        findPropertiesformixinput(donorSmiles, acceptorSmiles);
    } else if (donorSmiles) {
        // 先檢查 Acceptor 是否需要轉換
        if (!acceptorSmiles && acceptor) {
            console.log(`🔍 Acceptor 名稱輸入: ${acceptor}`);
            acceptorSmiles = findAcceptorSmiles(acceptor) || await convertNameToSmiles(acceptor);
            console.log(`🟢 轉換後 Acceptor SMILES: ${acceptorSmiles}`);
            
            if (!acceptorSmiles) {
                document.getElementById('result').innerHTML = `<p class="error">无法将 Acceptor "${acceptor}" 转换为 SMILES。</p>`;
                return;
            }
        }
        console.log(`🔹 調用 findPropertiesBySmiles() - Donor: ${donorSmiles}, Acceptor: ${acceptorSmiles}`);
        findPropertiesformixinput(donorSmiles, acceptorSmiles);
    } else if (acceptorSmiles) {
        console.log(`🔹 調用 findPropertiesBySmiles() - Acceptor: ${acceptorSmiles}`);
        findPropertiesformixinput(donor, acceptorSmiles);
    } else {
        console.log(`❌ 無法轉換 Donor 和 Acceptor 為 SMILES`);
        document.getElementById('result').innerHTML = `<p class="error">无法转换 Donor 和 Acceptor 至 SMILES。</p>`;
    }
    
}












    



// 根據 Donor SMILES 查找對應的名稱
function findDonorNameBySmiles(smiles) {
    const donorItem = data.find(item => item['Donor SMILES'] === smiles);
    return donorItem ? donorItem['Donor'] : null; // 如果找到，返回捐贈者名稱，否則返回 null
}

// 根據 Acceptor SMILES 查找對應的名稱
function findAcceptorNameBySmiles(smiles) {
    const acceptorItem = data.find(item => item['Acceptor SMILES'] === smiles);
    return acceptorItem ? acceptorItem['Acceptor'] : null; // 如果找到，返回受贈者名稱，否則返回 null
}











async function fetchPropertiesPredictionData(donorSmiles = null, acceptorSmiles = null) {
    try {
        const bodyData = {};
        if (donorSmiles) bodyData.donorsmiles = donorSmiles;
        if (acceptorSmiles) bodyData.acceptorsmiles = acceptorSmiles;

        const response = await fetch('https://polymer-ml-platform-server.site/properties_predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            const data = await response.json();
            const result = {};

            if (data.donor_homo !== undefined) result['HOMO of Donor (eV).1'] = data.donor_homo;
            if (data.donor_lumo !== undefined) result['LUMO of Donor (eV).1'] = data.donor_lumo;
            if (data.donor_bandgap !== undefined) result['Bandgap of Donor (eV).1'] = data.donor_bandgap;
            if (data.acceptor_homo !== undefined) result['HOMO of Acceptor (eV).1'] = data.acceptor_homo;
            if (data.acceptor_lumo !== undefined) result['LUMO of Acceptor (eV).1'] = data.acceptor_lumo;
            if (data.acceptor_bandgap !== undefined) result['Bandgap of Acceptor (eV).1'] = data.acceptor_bandgap;

            return result;
        } else {
            console.error('Failed to fetch properties prediction data');
            return null;
        }
    } catch (error) {
        console.error('Error fetching properties prediction data:', error);
        return null;
    }
}
async function fetchSpectrumPredictionData(donorSmiles = null, acceptorSmiles = null) {
    try {
        const bodyData = {};
        if (donorSmiles) bodyData.donorsmiles = donorSmiles;
        if (acceptorSmiles) bodyData.acceptorsmiles = acceptorSmiles;

        // 查看請求的 bodyData
        console.log('Request body:', bodyData);

        const response = await fetch('https://polymer-ml-platform-server.site/spectrum_predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        // 查看返回的 response 狀態
        console.log('Response status:', response.status);

        if (response.ok) {
            const data = await response.json();

            // 查看返回的完整數據
            console.log('Full response data:', data);

            const donorResult = data.donor_value || [];
            const acceptorResult = data.acceptor_value || [];

            // 查看提取出的 donor 和 acceptor 數據
            console.log('Donor result:', donorResult);
            console.log('Acceptor result:', acceptorResult);

            // 只返回光谱数据，而不渲染
            return { donorResult, acceptorResult };
        } else {
            console.error('Failed to fetch spectrum prediction data');
            return null;
        }
    } catch (error) {
        console.error('Error fetching spectrum prediction data:', error);
        return null;
    }
}


// 綁定 performance 按鈕事件
document.getElementById('performanceButton').addEventListener('click', async function() {
    resetResults(); // 重置結果
    clearCanvas('donorCanvas');
    clearCanvas('acceptorCanvas');

    const donor = document.getElementById('donorInput').value.trim();
    const acceptor = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result'); // 顯示結果的元素

    // 清除之前的錯誤訊息
    resultElement.innerHTML = '';

    // 檢查是否至少輸入了 donor 或 acceptor
    if (!donor && !acceptor) {
        resultElement.innerHTML = '<p class="error">Please enter at least a donor or acceptor, or SMILES string</p>';
        return;
    }

    // 處理 Donor 和 Acceptor 的不同組合情況
    if (donor && acceptor) {
        if (isSmiles(donor) && isSmiles(acceptor)) {
            // Donor 和 Acceptor 都是 SMILES，呼叫 findPerformanceBySmiles
            await findPerformanceBySmiles(donor, acceptor);
        } else if (!isSmiles(donor) && !isSmiles(acceptor)) {
            // Donor 和 Acceptor 都是名稱，呼叫 findPerformanceByName
            await findPerformanceByName(donor, acceptor);
        } else {
            // Donor 和 Acceptor 混合輸入，呼叫 findPerformanceByNameAndSmiles
            await findPerformanceByNameAndSmiles(donor, acceptor);
        }
    } else if (donor) {
        // 只有 Donor，判斷是否為 SMILES 或名稱
        if (isSmiles(donor)) {
            await findPerformanceBySmiles(donor, 'donor');
        } else {
            await findPerformanceByName(donor, 'donor');
        }
    } else if (acceptor) {
        // 只有 Acceptor，判斷是否為 SMILES 或名稱
        if (isSmiles(acceptor)) {
            await findPerformanceBySmiles(acceptor, 'acceptor');
        } else {
            await findPerformanceByName(acceptor, 'acceptor');
        }
    }

    // 如果找到 Donor 或 Acceptor 的 SMILES，顯示繪製容器
    if (donor || acceptor) {
        document.getElementById('smilesDrawerContainer').style.display = 'flex';
    }
});




async function findPerformanceByName() {
    // 重置結果並清空畫布
    resetResults(); 
    clearCanvas('donorCanvas'); 
    clearCanvas('acceptorCanvas'); 

    // 從輸入框中獲取捐贈者和受贈者的名稱
    const donor = document.getElementById('donorInput').value.trim();
    const acceptor = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result');

    // 如果捐贈者和受贈者名稱都為空，顯示錯誤信息
    if (!donor && !acceptor) {
        resultElement.innerHTML = '<p class="error">Please enter at least donor or acceptor</p>';
        return;
    }

    // 從數據中查找對應的 SMILES
    let donorSmiles = findDonorSmiles(donor);
    let acceptorSmiles = findAcceptorSmiles(acceptor);
    
    // 如果未找到 Donor SMILES，使用 API 將名稱轉換為 SMILES 並繪圖
    if (!donorSmiles && donor) {
        donorSmiles = await convertNameToSmiles(donor);
        console.log(`Donor SMILES from API: ${donorSmiles}`);
        if (donorSmiles) {
            renderSmiles(donorSmiles.trim(), 'donorCanvas');
            changeCanvasLabelColor('donorCanvas', 'black');
        }
    } else if (donorSmiles) {
        renderSmiles(donorSmiles.trim(), 'donorCanvas');
        changeCanvasLabelColor('donorCanvas', 'black');
    }

    // 如果未找到 Acceptor SMILES，使用 API 將名稱轉換為 SMILES 並繪圖
    if (!acceptorSmiles && acceptor) {
        acceptorSmiles = await convertNameToSmiles(acceptor);
        console.log(`Acceptor SMILES from API: ${acceptorSmiles}`);
        if (acceptorSmiles) {
            renderSmiles(acceptorSmiles.trim(), 'acceptorCanvas');
            changeCanvasLabelColor('acceptorCanvas', 'black');
        }
    } else if (acceptorSmiles) {
        renderSmiles(acceptorSmiles.trim(), 'acceptorCanvas');
        changeCanvasLabelColor('acceptorCanvas', 'black');
    }

    // 如果仍然未能獲取 SMILES，顯示錯誤信息
    if (!donorSmiles && !acceptorSmiles) {
        resultElement.innerHTML = '<p class="error">SMILES not found for the given Donor or Acceptor</p>';
        return;
    }

    // 顯示化學結構繪製容器
    document.getElementById('smilesDrawerContainer').style.display = 'flex'; 
    document.getElementById('chartContainerProperties').style.display = 'none'; 

    // 使用 filterMatchingItems 過濾出匹配項目
    const matchingItems = filterMatchingItems(data, donor, acceptor);

    // 判斷 donor 和 acceptor 是否存在於數據庫中
    const donorItem = donor ? data.find(item => item.Donor === donor) : null;
    const acceptorItem = acceptor ? data.find(item => item.Acceptor === acceptor) : null;

    // 獲取預測數據並傳遞給後端
    const predictionData = await fetchPerformancePredictionData(donorSmiles, acceptorSmiles);

    // 確認預測數據是否正確接收
    if (predictionData) {
        console.log('Performance Prediction Data:', predictionData); // 檢查 API 返回的預測數據
    } else {
        console.error('Failed to fetch performance prediction data.'); // 顯示錯誤信息
    }

    // 根據不同情況顯示結果
    if (matchingItems.length > 0) {
        // 情況 1: Donor 和 Acceptor 都在數據庫中
        document.getElementById('tablePCE').innerHTML = createDonorandAcceptorPerformanceTable(donor, acceptor, data);
        plotGraphs(data, donor, acceptor);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (matchingItems.length === 0 && donor && acceptor) {
        // 情況 2: Donor 和 Acceptor 都不在數據庫中
        if (predictionData) {
            document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donor} / ${acceptor} 的性能數據`);
            plotGraphs(data, donor, acceptor);
            plotHorizontalArrows(predictionData);
            document.getElementById('chartContainerPerformance').style.display = 'block';
        } else {
            resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
        }
    } else if (donor && donorItem && !acceptor) {
        // 情況 3: Donor 存在於數據庫中，且 Acceptor 未輸入
        resultElement.innerHTML = 'Donor 存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, donor, null);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (acceptor && acceptorItem && !donor) {
        // 情況 4: Acceptor 存在於數據庫中，且 Donor 未輸入
        resultElement.innerHTML = 'Acceptor 存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, null, acceptor);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (donor && donorItem && acceptor && !acceptorItem) {
        // 情況 5: Donor 在數據庫中，且 Acceptor 不存在於數據庫中
        if (predictionData) {
            document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donor} / ${acceptor} 的性能數據`);
            plotGraphs(data, donor, acceptor);
            plotHorizontalArrows(predictionData);
            document.getElementById('chartContainerPerformance').style.display = 'block';
        } else {
            resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
        }
    } else if (acceptor && acceptorItem && donor && !donorItem) {
        // 情況 6: Acceptor 在數據庫中，且 Donor 不存在於數據庫中
        if (predictionData) {
            document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donor} / ${acceptor} 的性能數據`);
            plotGraphs(data, donor, acceptor);
            plotHorizontalArrows(predictionData);
            document.getElementById('chartContainerPerformance').style.display = 'block';
        } else {
            resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
        }
    } else if (donor && !donorItem && !acceptor) {
        // 情況 7: Donor 不存在於數據庫中，且 Acceptor 未輸入
        resultElement.innerHTML = 'Donor 不存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, donor, null);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (acceptor && !acceptorItem && !donor) {
        // 情況 8: Acceptor 不存在於數據庫中，且 Donor 未輸入
        resultElement.innerHTML = 'Acceptor 不存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, null, acceptor);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    }
}
async function findPerformanceBySmiles() {
    // 重置結果並清空畫布
    resetResults(); 
    clearCanvas('donorCanvas'); 
    clearCanvas('acceptorCanvas'); 

    // 從輸入框中獲取捐贈者和受贈者的 SMILES
    const donorSmiles = document.getElementById('donorInput').value.trim();
    const acceptorSmiles = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result');

    // 如果捐贈者和受贈者 SMILES 都為空，顯示錯誤信息
    if (!donorSmiles && !acceptorSmiles) {
        console.log("情況 0: 沒有輸入 Donor 和 Acceptor");
        resultElement.innerHTML = '<p class="error">請至少輸入 Donor 或 Acceptor</p>';
        return;
    }

    console.log("輸入的 Donor SMILES:", donorSmiles);
    console.log("輸入的 Acceptor SMILES:", acceptorSmiles);

    // 渲染 Donor 和 Acceptor 的 SMILES 結構（如果有）
    if (donorSmiles) {
        renderSmiles(donorSmiles, 'donorCanvas');
        changeCanvasLabelColor('donorCanvas', 'black');
    }

    if (acceptorSmiles) {
        renderSmiles(acceptorSmiles, 'acceptorCanvas');
        changeCanvasLabelColor('acceptorCanvas', 'black');
    }

    // 顯示化學結構繪製容器
    document.getElementById('smilesDrawerContainer').style.display = 'flex'; 
    document.getElementById('chartContainerProperties').style.display = 'none'; 

    // 使用 filterMatchingItems 過濾出匹配項目
    const matchingItems = filterMatchingSmilesItems(data, donorSmiles, acceptorSmiles);

    // 判斷 donor 和 acceptor 是否存在於數據庫中
    const donorSmilesItem = donorSmiles ? data.find(item => item['Donor SMILES'] === donorSmiles) : null;
    const acceptorSmilesItem = acceptorSmiles ? data.find(item => item['Acceptor SMILES'] === acceptorSmiles) : null;

    console.log("匹配的 Donor 項目:", donorSmilesItem);
    console.log("匹配的 Acceptor 項目:", acceptorSmilesItem);

    // 獲取預測數據並傳遞給後端
    const predictionData = await fetchPerformancePredictionData(donorSmiles, acceptorSmiles);

    // 確認預測數據是否正確接收
    if (predictionData) {
        console.log('Performance Prediction Data:', predictionData); // 檢查 API 返回的預測數據
    } else {
        console.error('無法獲取性能預測數據。'); // 顯示錯誤信息
    }

    // 根據不同情況顯示結果
    if (donorSmilesItem && acceptorSmilesItem) {
        console.log("情況 1: Donor 和 Acceptor 都在數據庫中");
        document.getElementById('tablePCE').innerHTML = createDonorandAcceptorPerformanceTable(donorSmilesItem, acceptorSmilesItem, data);
        plotGraphs(data, donorSmiles, acceptorSmiles);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (!donorSmilesItem && !acceptorSmilesItem && donorSmiles && acceptorSmiles) {
        console.log("情況 2: Donor 和 Acceptor 都不在數據庫中");
        if (predictionData) {
            document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorSmiles} / ${acceptorSmiles} 的性能數據`);
            plotGraphs(data, donorSmiles, acceptorSmiles);
            plotHorizontalArrows(predictionData);
            document.getElementById('chartContainerPerformance').style.display = 'block';
        } else {
            resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
        }
    } else if (donorSmilesItem && !acceptorSmiles) {
        console.log("情況 3: Donor 存在於數據庫中，且 Acceptor 未輸入");
        resultElement.innerHTML = 'Donor 存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, donorSmiles, null);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (acceptorSmilesItem && !donorSmiles) {
        console.log("情況 4: Acceptor 存在於數據庫中，且 Donor 未輸入");
        resultElement.innerHTML = 'Acceptor 存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, null, acceptorSmiles);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (donorSmilesItem && acceptorSmiles && !acceptorSmilesItem) {
        console.log("情況 5: Donor 在數據庫中，且 Acceptor 不存在於數據庫中");
        if (predictionData) {
            document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorSmiles} / ${acceptorSmiles} 的性能數據`);
            plotGraphs(data, donorSmiles, acceptorSmiles);
            plotHorizontalArrows(predictionData);
            document.getElementById('chartContainerPerformance').style.display = 'block';
        } else {
            resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
        }
    } else if (acceptorSmilesItem && donorSmiles && !donorSmilesItem) {
        console.log("情況 6: Acceptor 在數據庫中，且 Donor 不存在於數據庫中");
        if (predictionData) {
            document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorSmiles} / ${acceptorSmiles} 的性能數據`);
            plotGraphs(data, donorSmiles, acceptorSmiles);
            plotHorizontalArrows(predictionData);
            document.getElementById('chartContainerPerformance').style.display = 'block';
        } else {
            resultElement.innerHTML = '沒有找到匹配的數據，也無法計算。';
        }
    } else if (donorSmiles && !donorSmilesItem && !acceptorSmiles) {
        console.log("情況 7: Donor 不存在於數據庫中，且 Acceptor 未輸入");
        resultElement.innerHTML = 'Donor 不存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, donorSmiles, null);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (acceptorSmiles && !acceptorSmilesItem && !donorSmiles) {
        console.log("情況 8: Acceptor 不存在於數據庫中，且 Donor 未輸入");
        resultElement.innerHTML = 'Acceptor 不存在於數據庫中，顯示相關分布圖。';
        plotGraphs(data, null, acceptorSmiles);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    }
}








async function findPerformanceByNameAndSmiles() {
    // 重置結果並清空畫布
    resetResults();
    clearCanvas('donorCanvas');
    clearCanvas('acceptorCanvas');

    // 從輸入框中獲取 Donor 名稱或 SMILES 和 Acceptor 名稱或 SMILES
    const donorInput = document.getElementById('donorInput').value.trim();
    const acceptorInput = document.getElementById('acceptorInput').value.trim();
    const resultElement = document.getElementById('result');

    // 初始化變數
    let donorSmiles = null;
    let acceptorSmiles = null;
    let donorSmilesItem = null;
    let donorItem = null;
    let acceptorSmilesItem = null;
    let acceptorItem = null;
    let convertedDonorSmiles = null;  // 存儲 Donor 名稱轉換後的 SMILES
    let convertedAcceptorSmiles = null;  // 存儲 Acceptor 名稱轉換後的 SMILES

    // 判斷 Donor 是名稱還是 SMILES
    if (isSmiles(donorInput)) {
        donorSmiles = donorInput;
        donorSmilesItem = data.find(item => item['Donor SMILES'] === donorSmiles);  // 基於 SMILES 查找 Donor
        if (donorSmilesItem) {
            console.log(`Donor SMILES found in database: ${donorSmiles}`);
        } else {
            console.log(`Donor SMILES not found in database: ${donorSmiles}`);
        }
    } else {
        convertedDonorSmiles = await convertNameToSmiles(donorInput);  // 使用 convertNameToSmiles 轉換 Donor 名稱
        donorItem = data.find(item => item.Donor === donorInput);  // 基於名稱查找 Donor
        if (donorItem) {
            console.log(`Donor name found in database: ${donorInput}`);
            donorSmiles = convertedDonorSmiles;  // 將轉換後的 SMILES 賦值給 donorSmiles
        } else {
            console.log(`Donor name not found in database: ${donorInput}`);
            donorSmiles = convertedDonorSmiles;  // 名稱不在數據庫中，使用轉換後的 SMILES
        }
    }

    // 判斷 Acceptor 是名稱還是 SMILES
    if (isSmiles(acceptorInput)) {
        acceptorSmiles = acceptorInput;
        acceptorSmilesItem = data.find(item => item['Acceptor SMILES'] === acceptorSmiles);  // 基於 SMILES 查找 Acceptor
        if (acceptorSmilesItem) {
            console.log(`Acceptor SMILES found in database: ${acceptorSmiles}`);
        } else {
            console.log(`Acceptor SMILES not found in database: ${acceptorSmiles}`);
        }
    } else {
        convertedAcceptorSmiles = await convertNameToSmiles(acceptorInput);  // 使用 convertNameToSmiles 轉換 Acceptor 名稱
        acceptorItem = data.find(item => item.Acceptor === acceptorInput);  // 基於名稱查找 Acceptor
        if (acceptorItem) {
            console.log(`Acceptor name found in database: ${acceptorInput}`);
            acceptorSmiles = convertedAcceptorSmiles;  // 將轉換後的 SMILES 賦值給 acceptorSmiles
        } else {
            console.log(`Acceptor name not found in database: ${acceptorInput}`);
            acceptorSmiles = convertedAcceptorSmiles;  // 名稱不在數據庫中，使用轉換後的 SMILES
        }
    }

    // 渲染 Donor 和 Acceptor 的 SMILES 結構（如果有）
    if (donorSmiles) {
        renderSmiles(donorSmiles.trim(), 'donorCanvas');
        changeCanvasLabelColor('donorCanvas', 'black');
    }

    if (acceptorSmiles) {
        renderSmiles(acceptorSmiles.trim(), 'acceptorCanvas');
        changeCanvasLabelColor('acceptorCanvas', 'black');
    }

    // 顯示化學結構繪製容器
    document.getElementById('smilesDrawerContainer').style.display = 'flex';
    document.getElementById('chartContainerProperties').style.display = 'none';

    const matchingItemforDonorNameAndAcceptorSmiles = findMatchingForDonorNameAndAcceptorSmiles(donorInput, acceptorInput, data);
    const matchingItemforDonorSmilesAndAcceptorName = findMatchingForDonorSmilesAndAcceptorName(donorInput, acceptorInput, data);
    // 獲取預測數據並傳遞給後端
    const predictionData = await fetchPerformancePredictionData(donorSmiles, acceptorSmiles);
    
    // 確認預測數據是否正確接收
    if (!predictionData) {
        resultElement.innerHTML = '<p class="error">Failed to fetch performance prediction data.</p>';
        return;
    }

    // 根據不同情況顯示結果
    if (donorSmilesItem && acceptorItem&&matchingItemforDonorSmilesAndAcceptorName.length>0) {
        // 情況 1: Donor SMILES 和 Acceptor 名稱都在數據庫中
        console.log("情況 1: Donor SMILES 和 Acceptor 名稱都在數據庫中");
        document.getElementById('tablePCE').innerHTML = createDonorandAcceptorPerformanceTable(donorSmilesItem, acceptorItem, data);
        plotGraphs(data, donorSmiles, acceptorInput);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (donorItem && acceptorSmilesItem&&matchingItemforDonorNameAndAcceptorSmiles.length>0) {
        // 情況 2: Donor 名稱和 Acceptor SMILES 都在數據庫中
        console.log("情況 2: Donor 名稱和 Acceptor SMILES 都在數據庫中");
        document.getElementById('tablePCE').innerHTML = createDonorandAcceptorPerformanceTable(donorItem, acceptorSmilesItem, data);
        plotGraphs(data, donorInput, acceptorSmiles);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (donorSmilesItem && !acceptorItem&&convertedAcceptorSmiles) {
        // 情況 3: Donor SMILES 在數據庫中，Acceptor 名稱不在數據庫中
        console.log("情況 3: Donor SMILES 在數據庫中，Acceptor 名稱不在數據庫中");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorSmiles} / ${acceptorInput} 的性能數據`);
        plotGraphs(data, donorSmiles, null);
        plotHorizontalArrows(predictionData);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (donorItem && !acceptorSmilesItem) {
        // 情況 4: Donor 名稱在數據庫中，Acceptor SMILES 不在數據庫中
        console.log("情況 4: Donor 名稱在數據庫中，Acceptor SMILES 不在數據庫中");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorInput} / ${acceptorSmiles} 的性能數據`);
        plotGraphs(data, donorInput, null);
        plotHorizontalArrows(predictionData);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (!donorSmilesItem && acceptorItem && donorSmiles&&!donorItem) {
        // 情況 5: Donor SMILES 不在數據庫中，Acceptor 名稱在數據庫中（Donor 已通過 convertNameToSmiles 轉換）
        console.log("情況 5: Donor SMILES 不在數據庫中，Acceptor 名稱在數據庫中");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorSmiles} / ${acceptorInput} 的性能數據`);
        plotGraphs(data, convertedDonorSmiles, acceptorInput);
        plotHorizontalArrows(predictionData);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (!donorItem && acceptorSmilesItem && convertedDonorSmiles) {
        // 情況 6: Donor 名稱不在數據庫中，Acceptor SMILES 在數據庫中（Acceptor 已通過 convertNameToSmiles 轉換）
        console.log("情況 6: Donor 名稱不在數據庫中，Acceptor SMILES 在數據庫中");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorInput} / ${acceptorSmiles} 的性能數據`);
        plotGraphs(data, donorInput, acceptorSmiles);
        plotHorizontalArrows(predictionData);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (!donorSmilesItem && !acceptorItem && convertedAcceptorSmiles) {
        // 情況 7: Donor SMILES 和 Acceptor 名稱都不在數據庫中（均已通過 convertNameToSmiles 轉換）
        console.log("情況 7: Donor SMILES 和 Acceptor 名稱都不在數據庫中");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorSmiles} / ${acceptorInput} 的性能數據`);
        plotGraphs(data, convertedDonorSmiles, convertedAcceptorSmiles);
        plotHorizontalArrows(predictionData);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (!donorItem && !acceptorSmilesItem && convertedDonorSmiles ) {
        // 情況 8: Donor 名稱和 Acceptor SMILES 都不在數據庫中（均已通過 convertNameToSmiles 轉換）
        console.log("情況 8: Donor 名稱和 Acceptor SMILES 都不在數據庫中");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorInput} / ${acceptorSmiles} 的性能數據`);
        plotGraphs(data, convertedDonorSmiles, convertedAcceptorSmiles);
        plotHorizontalArrows(predictionData);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    } else if (donorSmilesItem && acceptorItem&&matchingItemforDonorSmilesAndAcceptorName.length==0) {
        // 情況 9: Donor SMILES 和 Acceptor 名稱都在數據庫中，但組合不在
        console.log("情況9: Donor SMILES 和 Acceptor 名稱都在數據庫中，但組合不在");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorSmiles} / ${acceptorInput} 的性能數據`);
        plotGraphs(data, donorSmiles, acceptorInput);
        document.getElementById('chartContainerPerformance').style.display = 'block';

    } else if (donorItem && acceptorSmilesItem&&matchingItemforDonorNameAndAcceptorSmiles.length==0) {
        // 情況 10: Donor 名稱和 Acceptor SMILES 都在數據庫中，但組合不在
        console.log("情況10: Donor 名稱和 Acceptor SMILES 都在數據庫中，但組合不在");
        document.getElementById('tablePCE').innerHTML = createPredictionOnlyTable(predictionData, `${donorInput} / ${acceptorSmiles} 的性能數據`);
        plotGraphs(data, donorInput, acceptorSmiles);
        document.getElementById('chartContainerPerformance').style.display = 'block';
    }
  



}









async function fetchPerformancePredictionData(donorSmiles = null, acceptorSmiles = null) {
    try {
        const bodyData = {};
        if (donorSmiles) bodyData.donorsmiles = donorSmiles;
        if (acceptorSmiles) bodyData.acceptorsmiles = acceptorSmiles;

        const response = await fetch('https://polymer-ml-platform-server.site/performance_predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            const data = await response.json();
            const result = {};
            if (data.pce !== undefined) result['PCE (%).1'] = data.pce;
            if (data.voc !== undefined) result['Voc (V).1'] = data.voc;
            if (data.jsc !== undefined) result['Jsc (mAcm-2).1'] = data.jsc;
            if (data.ff !== undefined) result['FF.1'] = data.ff;
            return result;
        } else {
            console.error('Failed to fetch performance prediction data');
            return null;
        }
    } catch (error) {
        console.error('Error fetching performance prediction data:', error);
        return null;
    }
}















function plotHorizontalArrows(predictionData) {
    plotHorizontalArrow('chartPCE', predictionData['PCE (%).1'], 'PCE Prediction');
    plotHorizontalArrow('chartVoc', predictionData['Voc (V).1'], 'Voc Prediction');
    plotHorizontalArrow('chartJsc', predictionData['Jsc (mAcm-2).1'], 'Jsc Prediction');
    plotHorizontalArrow('chartFF', predictionData['FF.1'], 'FF Prediction');
}




function plotPredictionTable(predictionData, label) {
    // Here implement logic to display prediction values in a table.
    // Example logic to render a prediction table
    const table = `<table>
        <tr><th>${label} Prediction</th></tr>
        <tr><td>${predictionData['PCE (%).1'] || 'N/A'}</td></tr>
        <tr><td>${predictionData['Voc (V).1'] || 'N/A'}</td></tr>
        <tr><td>${predictionData['Jsc (mAcm-2).1'] || 'N/A'}</td></tr>
        <tr><td>${predictionData['FF.1'] || 'N/A'}</td></tr>
    </table>`;
    document.getElementById('tablePrediction').innerHTML = table;
}


function plotGraphsWithError(data, donor, acceptor) {
    // 這個函數用於在顯示圖表時添加誤差
    plotGraphs(data, donor, acceptor);
    plotErrorBars('chartPCE', data, 'PCE');
    plotErrorBars('chartVoc', data, 'Voc');
    plotErrorBars('chartJsc', data, 'Jsc');
    plotErrorBars('chartFF', data, 'FF');
}




















function plotHorizontalArrow(chartId, value, name) {
    const chart = document.getElementById(chartId);
    if (chart) {
        Plotly.addTraces(chart, {
            x: [value],
            y: [value],
            mode: 'markers+text',
            marker: {
                size: 10,
                symbol: 'triangle-up', // 使用向上的三角形作為標記
                color: 'green'
            },
            text: name,
            textposition: 'top center',
            showlegend: false
        });
    }
}



function addPlotlyClickEventForProperties(chartId, data, data1, tableId, spectrumContainerId) {
    
    const chartElement = document.getElementById(chartId);

    if (chartElement) {
        chartElement.on('plotly_click', function (eventData) {
            const point = eventData.points[0];
            const label = point.text;

            // 清除容器內容
            document.getElementById(tableId).innerHTML = '';
            document.getElementById(spectrumContainerId).innerHTML = '';

            // 拆分 Donor 和 Acceptor 名稱
            const [donor, acceptor] = label.split('–');
            const item = data.find(d => d.Donor === donor && d.Acceptor === acceptor);

            if (item) {
                // 查找光谱数据库中的 Donor 和 Acceptor 光谱数据
                const donorSmiles = item['Donor SMILES'];
                const acceptorSmiles = item['Acceptor SMILES'];
                const donorCanvasId = `clickedDonorCanvas${chartId.split('chart')[1]}`;
                const acceptorCanvasId = `clickedAcceptorCanvas${chartId.split('chart')[1]}`;

            
                // 渲染 Donor 和 Acceptor 的化學結構
                if (donorSmiles) {
                    renderSmiles(donorSmiles, donorCanvasId);
                    changeCanvasLabelColor(donorCanvasId, 'black');
                }
                if (acceptorSmiles) {
                    renderSmiles(acceptorSmiles, acceptorCanvasId);
                    changeCanvasLabelColor(acceptorCanvasId, 'black');
                }
                // 1. 更新屬性表格
                const donorTableHtml = createDonorPropertiesTable(donor, data);
                const acceptorTableHtml = createAcceptorPropertiesTable(acceptor, data);
                const tableHtml = `<div>${donorTableHtml}</div><div>${acceptorTableHtml}</div>`;
                document.getElementById(tableId).innerHTML = tableHtml;
                document.getElementById(tableId).style.display = 'block';

                // 2. 定義匹配的光譜項目
                const donorSpectrumItem = data1.find(d => d.Donor === donor);
                const acceptorSpectrumItem = data1.find(d => d.Acceptor === acceptor);

                // 3. 安全獲取光譜數據
                const donorSpectrumPred = donorSpectrumItem?.IntensityPred
                    ? donorSpectrumItem.IntensityPred.split(',').map(Number)
                    : null;
                const donorSpectrumOTM = donorSpectrumItem?.IntensityOTM
                    ? donorSpectrumItem.IntensityOTM.split(',').map(Number)
                    : null;
                const acceptorSpectrumPred = acceptorSpectrumItem?.IntensityPred
                    ? acceptorSpectrumItem.IntensityPred.split(',').map(Number)
                    : null;
                const acceptorSpectrumOTM = acceptorSpectrumItem?.IntensityOTM
                    ? acceptorSpectrumItem.IntensityOTM.split(',').map(Number)
                    : null;

                // 4. 構造數據集與標籤
                const spectrumDataSets = [
                    donorSpectrumPred,
                    donorSpectrumOTM,
                    acceptorSpectrumPred,
                    acceptorSpectrumOTM
                ].filter(data => data); // 過濾掉不存在的數據

                const labels = [
                    donorSpectrumPred ? 'Donor Prediction' : null,
                    donorSpectrumOTM ? 'Donor OTM' : null,
                    acceptorSpectrumPred ? 'Acceptor Prediction' : null,
                    acceptorSpectrumOTM ? 'Acceptor OTM' : null
                ].filter(label => label); // 過濾掉不存在的標籤

                // 5. 渲染光譜數據
                if (spectrumDataSets.length > 0) {
                    renderSpectrumChartindatabase(spectrumDataSets, labels, spectrumContainerId);
                } else {
                    console.warn(`未找到光譜數據: Donor=${donor}, Acceptor=${acceptor}`);
                    document.getElementById(spectrumContainerId).innerHTML = '<p>無光譜數據可顯示</p>';
                }
            } else {
                // 如果主數據中也找不到對應項目，提示用戶
                console.warn(`未找到匹配的項目: Donor=${donor}, Acceptor=${acceptor}`);
                document.getElementById(tableId).innerHTML = '<p>未找到對應屬性數據</p>';
                document.getElementById(spectrumContainerId).innerHTML = '<p>無光譜數據可顯示</p>';
            }

            // 6. 高亮顯示點擊的數據點
            highlightClickedPoint(chartId, point.pointIndex, tableId, spectrumContainerId);
        });
    } else {
        console.error(`未能找到圖表元素，chartId: ${chartId}`);
    }
}















function addPlotlyClickEventForPerformance(chartId, data, tableId) {
    const chartElement = document.getElementById(chartId);

    if (chartElement) {
        chartElement.on('plotly_click', function(eventData) {
            const point = eventData.points[0];
            const pointIndex = point.pointIndex; // 获取点击点的索引
            const label = point.text;

            // 檢查是否成功獲取 label
            if (!label) {
                console.error(`未能從點擊事件中獲取標籤 (label)，chartId: ${chartId}`);
                return;
            }

            // 拆分 donor 和 acceptor 名稱
            const [donor, acceptor] = label.split('–');
            const item = data.find(d => d.Donor === donor && d.Acceptor === acceptor);

            // 檢查是否成功找到匹配的項目
            if (!item) {
                console.error(`未能在數據中找到匹配項目，Donor: ${donor}, Acceptor: ${acceptor}`);
                return;
            }

            const donorSmiles = item['Donor SMILES'];
            const acceptorSmiles = item['Acceptor SMILES'];
            const donorCanvasId = `clickedDonorCanvas${chartId.split('chart')[1]}`;
            const acceptorCanvasId = `clickedAcceptorCanvas${chartId.split('chart')[1]}`;

            // 渲染 Donor SMILES
            if (donorSmiles) {
                console.log('渲染 Donor SMILES:', donorSmiles);
                renderSmiles(donorSmiles, donorCanvasId);
                changeCanvasLabelColor(donorCanvasId, 'black');
            } else {
                console.warn(`Donor SMILES 不存在，Donor: ${donor}`);
            }

            // 渲染 Acceptor SMILES
            if (acceptorSmiles) {
                console.log('渲染 Acceptor SMILES:', acceptorSmiles);
                renderSmiles(acceptorSmiles, acceptorCanvasId);
                changeCanvasLabelColor(acceptorCanvasId, 'black');
            } else {
                console.warn(`Acceptor SMILES 不存在，Acceptor: ${acceptor}`);
            }

            // 生成性能表格
            const tableHtml = createDonorandAcceptorPerformanceTable(donor, acceptor, data);
            const tableElement = document.getElementById(tableId);

            // 檢查是否成功找到表格元素
            if (tableElement) {
                tableElement.innerHTML = tableHtml;
                tableElement.style.display = 'block';
            } else {
                console.error(`未能找到表格元素，tableId: ${tableId}`);
            }

            // 在执行完其他逻辑后，再调用 highlightClickedPoint
            highlightClickedPoint(chartId, pointIndex);
        });
    } else {
        console.error(`未能找到圖表元素，chartId: ${chartId}`);
    }
}














const editor = new Kekule.Editor.Composer(document.getElementById('editor'));
editor.setChemObj(Kekule.ChemStructureUtils.generateNewStructFragment());

function changeCanvasLabelColor(canvasId, color) {
    const canvasLabel = document.querySelector(`#${canvasId} + .canvas-label`);
    if (canvasLabel) {
        canvasLabel.style.color = color;
    }
}
