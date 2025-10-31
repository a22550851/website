let composer = null;

document.querySelectorAll('.drawBtn').forEach(button => {
  button.addEventListener('click', function() {
    const target = this.getAttribute('data-target');
    const win = document.getElementById('editorWindow');
    win.setAttribute('data-target', target);
    win.style.display = 'block';

    // 初始化 Kekule Composer
    if (!composer) {
      const host = document.getElementById('editor');
      composer = new Kekule.Editor.Composer(host);
      composer.setPredefinedSetting('fullFunc'); // 工具完整
      composer.setAllowCreateNewDoc(true);
      composer.newDocument();
    } else {
      composer.newDocument(); // 清空畫布
    }
  });
});

// Close 按鈕
document.getElementById('closeEditorBtn')?.addEventListener('click', () => {
  document.getElementById('editorWindow').style.display = 'none';
});

document.getElementById('confirmButton').addEventListener('click', async function() {
    var target = document.getElementById('editorWindow').getAttribute('data-target');
    var chemObj = Kekule.Widget.getWidgetById('editor').getChemObj();
    var smiles = Kekule.IO.saveFormatData(chemObj, 'smi');
    
    if (smiles) {
        const iupacName = await convertSmilesToIupac(smiles);
        
        if (target === 'material') {
            renderSmiles(smiles, 'materialCanvas');
            changeCanvasLabelColor('materialCanvas', 'black');
            document.getElementById('materialCanvas').setAttribute('data-smiles', smiles);
            
            if (iupacName) {
                document.getElementById('materialInput').value = iupacName; // 設置IUPAC名稱到donor輸入框
                document.getElementById('materialInput').style.color = 'black'; // 轉換成功時字體顏色為黑色
            } else {
                document.getElementById('materialInput').value = `${smiles}`; // 顯示無法轉換訊息和SMILES
                document.getElementById('materialInput').style.color = 'red'; // 無法轉換時字體變紅
            }
            
            
        }
        
        document.getElementById('editorWindow').style.display = 'none';
        document.getElementById('smilesDrawerContainer').style.display = 'flex';
        
    } else {
        alert('請先繪製化學結構再確認。');
    }
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

function findMaterialSmiles(materialName) {
    // 先在 data 中搜尋
    let materialItem = data.find(item => item.emitter === materialName);

    return materialItem ? materialItem['smiles'] : null;
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
    clearCanvas('materialCanvas');


    // 每次按下按鈕重新獲取 donorInput 和 acceptorInput 的值
    const material = document.getElementById('materialInput').value.trim();
    const resultElement = document.getElementById('result'); // 顯示結果的元素

    // 清除之前的錯誤訊息
    resultElement.innerHTML = '';

    // 檢查是否至少輸入了 donor 或 acceptor
    if (!material) {
        resultElement.innerHTML = '<p class="error">Please enter at least a material, or SMILES string</p>';
        return;
    }

    // 處理 Donor
    if (material) {
        if (isSmiles(material)) {
            await findStructureBySmiles(material, 'material'); // 當輸入為 SMILES 時
        } else {
            await findStructureByName(material, 'material'); // 當輸入為名稱時
        }
    }

    

    // 如果找到 Donor 或 Acceptor 的 SMILES，顯示繪製容器
    if ((material && isSmiles(material))) {
        document.getElementById('smilesDrawerContainer').style.display = 'flex';
    }
});





// 定義 findStructureByName 函數來處理 Donor 或 Acceptor 的名稱輸入
async function findStructureByName(input) {
  const resultElement = document.getElementById('result'); 
  const canvasId = 'materialCanvas'; 
  const canvasLabel = document.querySelector('#smilesDrawerContainer .canvas-label'); 

  // 每次查詢先清掉結果
  if (resultElement) resultElement.innerHTML = '';

  if (!input || typeof input !== 'string') {
    if (resultElement) resultElement.innerHTML = `<p class="error">❌ 輸入無效: ${input}</p>`;
    if (canvasLabel) canvasLabel.style.color = 'red';
    return;
  }

  let smiles = null;

  try {
    // 1. 先從本地資料庫查找
    smiles = findMaterialSmiles(input);

    // 2. 如果沒找到，再呼叫 API
    if (!smiles) {
      smiles = await convertNameToSmiles(input);
    }

    // 3. 判斷結果
    if (smiles) {
      renderSmiles(smiles, canvasId); 
      if (canvasLabel) canvasLabel.style.color = 'black';
      
    } else {
      if (resultElement) resultElement.innerHTML = `<p class="error">❌ 找不到對應的 SMILES (${input})</p>`;
      
    }
  } catch (err) {
    if (resultElement) resultElement.innerHTML = `<p class="error">⚠️ 查詢失敗: ${err.message || err}</p>`;
    if (canvasLabel) canvasLabel.style.color = 'red';
  }
}

// 定義 findStructureBySmiles 函數來處理 Donor 或 Acceptor 的 SMILES 輸入
function findStructureBySmiles(smiles) {
    const resultElement = document.getElementById('result'); 
    const canvasId = 'materialCanvas'; 
    const canvasLabel = document.querySelector('#smilesDrawerContainer .canvas-label'); 

    // 檢查 SMILES 是否為有效的
    if (!smiles) {
        resultElement.innerHTML = `<p class="error">Invalid SMILES: ${smiles}</p>`;
        canvasLabel.style.color = 'red';
        return;
    }

    // 如果 SMILES 有效，繪製結構
    renderSmiles(smiles, canvasId);
    canvasLabel.style.color = 'black';
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








document.getElementById('Button').addEventListener('click', async function () { 
  resetResults?.();               // 若函數存在就呼叫
  clearCanvas?.('materialCanvas');

  const material = document.getElementById('materialInput').value.trim();
  const resultElement = document.getElementById('result');

  // 清掉舊錯誤訊息
  resultElement.innerHTML = '';

  // 檢查輸入
  if (!material) {
    resultElement.innerHTML = '<p class="error">Please enter a material name or SMILES string</p>';
    return;
  }

  try {
    if (isSmiles(material)) {
      // SMILES 路徑
      await findPropertiesBySmiles(material);
    } else {
      // 名稱路徑
      await findPropertiesByName(material);
    }

    // 成功處理後顯示繪製容器
    document.getElementById('smilesDrawerContainer').style.display = 'flex';

  } catch (err) {
    console.error('Error processing material:', err);
    resultElement.innerHTML = `<p class="error">An error occurred: ${err?.message || err}</p>`;
  }
});





async function findPropertiesByName() {
    resetResults(); // 重置結果
    clearCanvas('materialCanvas');
 

    const material = document.getElementById('materialInput').value.trim();
    
    const resultElement = document.getElementById('result'); // 顯示結果的元素

    
    // 查找數據庫中的 Donor 和 Acceptor 項目
    const materialItem = material ? data.find(item => item.emitter === material) : null;
    // 根据捐赠者和受赠者的存在状态，处理25种情况
    if (materialItem&&material) {
        console.log('[findPropertiesByName] Found item:', materialItem);
        document.getElementById('tablePLQY').innerHTML = createMaterialPropertiesTable(materialItem);

        plotPLQY_EQE(data, {
        plqyId: 'chartPLQY',
        eqeId:  'chartEQE',
        tableIdPLQY: 'tablePLQY_click',
        canvasIdPLQY: 'clickedMaterialCanvasPLQY',
        tableIdEQE: 'tableEQE_click',
        canvasIdEQE: 'clickedMaterialCanvasEQE',
        titleIdPLQY: 'titlePLQY', // ← 新增
        titleIdEQE:  'titleEQE',  // ← 新增
        highlight: [materialItem.emitter]
        });
        changeCanvasLabelColor('materialCanvas', 'black');
        renderSmiles(materialItem.smiles, 'materialCanvas');
                // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        
        return;

    }else if (!materialItem && material) {
  const materialSmiles = await convertNameToSmiles(material);
  const predictionData = await fetchPropertiesPredictionData(materialSmiles);
  document.getElementById('tablePLQY').innerHTML = createPredictedPropertiesTable(predictionData,materialSmiles);

  // 先畫「整個資料庫分布」
  plotPLQY_EQE(data, {
    plqyId: 'chartPLQY',
    eqeId:  'chartEQE',
    tableIdPLQY: 'tablePLQY_click',
    canvasIdPLQY: 'clickedMaterialCanvasPLQY',
    tableIdEQE: 'tableEQE_click',
    canvasIdEQE: 'clickedMaterialCanvasEQE',
    titleIdPLQY: 'titlePLQY',
    titleIdEQE:  'titleEQE'
  });

  // 再把新材料（Pred=Exp）疊加為紅點
  overlayPredPoint(material /*顯示名*/, {
    plqyPred: Number(predictionData?.['plqy.1'] ?? predictionData?.plqyPred ?? predictionData?.plqy),
    eqePred:  Number(predictionData?.['EQE.1']  ?? predictionData?.eqePred  ?? predictionData?.EQE),
    smiles: materialSmiles
  }, {
    plqyId: 'chartPLQY',
    eqeId:  'chartEQE',
    titleIdPLQY: 'titlePLQY',
    tableIdPLQY: 'tablePLQY_click',
    canvasIdPLQY: 'clickedMaterialCanvasPLQY',
    titleIdEQE: 'titleEQE',
    tableIdEQE: 'tableEQE_click',
    canvasIdEQE: 'clickedMaterialCanvasEQE',
    onRenderStructure: (smiles, canvasId) => {
      if (typeof renderSmiles === 'function' && smiles && canvasId) {
        renderSmiles(smiles, canvasId);
      }
    }
  });

  // 顯示容器 & 左側 SMILES
  document.getElementById('chartContainerProperties').style.display = 'block';
  changeCanvasLabelColor('materialCanvas', 'red');
  renderSmiles(materialSmiles, 'materialCanvas');
  return;
}


    }





async function findPropertiesBySmiles() {
    resetResults(); // 重置結果
    clearCanvas('materialCanvas');
 

    const materialSmiles = document.getElementById('materialInput').value.trim();
    
    const resultElement = document.getElementById('result'); // 顯示結果的元素
   



    // 查找數據庫中的 Donor 和 Acceptor 項目
    const materialItem = materialSmiles ? data.find(item => item.smiles === materialSmiles) : null;
    

    // 情境 1: Donor在主數據庫中、在光譜數據庫中，Acceptor在主數據庫中、在光譜數據庫中
    if (materialItem) {

        

        
        document.getElementById('tablePLQY').innerHTML = createMaterialPropertiesTable(materialItem);
        console.log(typeof data["plqy.1"]);  // 看是否是 "number"
        plotPLQY_EQE(data, {
        plqyId: 'chartPLQY',
        eqeId:  'chartEQE',
        tableIdPLQY: 'tablePLQY_click',
        canvasIdPLQY: 'clickedMaterialCanvasPLQY',
        tableIdEQE: 'tableEQE_click',
        canvasIdEQE: 'clickedMaterialCanvasEQE',
        titleIdPLQY: 'titlePLQY', // ← 新增
        titleIdEQE:  'titleEQE',  // ← 新增
        highlight: [materialItem.emitter]
        });





    
        changeCanvasLabelColor('materialCanvas', 'black');
        renderSmiles(materialItem.smiles, 'materialCanvas');
        
       
        
        // 顯示屬性圖表容器
        document.getElementById('chartContainerProperties').style.display = 'block';
        
        return;
    }
    // 情境 6-3: 只輸入 Acceptor，且 Acceptor 不在主數據庫中且不在光譜數據庫中
    else if (!materialItem) {

        const predictionData = await fetchPropertiesPredictionData(materialSmiles);
        document.getElementById('tablePLQY').innerHTML = createPredictedPropertiesTable(predictionData,materialSmiles);
        // 先畫「整個資料庫分布」
  plotPLQY_EQE(data, {
    plqyId: 'chartPLQY',
    eqeId:  'chartEQE',
    tableIdPLQY: 'tablePLQY_click',
    canvasIdPLQY: 'clickedMaterialCanvasPLQY',
    tableIdEQE: 'tableEQE_click',
    canvasIdEQE: 'clickedMaterialCanvasEQE',
    titleIdPLQY: 'titlePLQY',
    titleIdEQE:  'titleEQE'
  });

  // 再把新材料（Pred=Exp）疊加為紅點
  overlayPredPoint(materialSmiles /*顯示名*/, {
    plqyPred: Number(predictionData?.['plqy.1'] ?? predictionData?.plqyPred ?? predictionData?.plqy),
    eqePred:  Number(predictionData?.['EQE.1']  ?? predictionData?.eqePred  ?? predictionData?.EQE),
    smiles: materialSmiles
  }, {
    plqyId: 'chartPLQY',
    eqeId:  'chartEQE',
    titleIdPLQY: 'titlePLQY',
    tableIdPLQY: 'tablePLQY_click',
    canvasIdPLQY: 'clickedMaterialCanvasPLQY',
    titleIdEQE: 'titleEQE',
    tableIdEQE: 'tableEQE_click',
    canvasIdEQE: 'clickedMaterialCanvasEQE',
    onRenderStructure: (smiles, canvasId) => {
      if (typeof renderSmiles === 'function' && smiles && canvasId) {
        renderSmiles(smiles, canvasId);
      }
    }
  });

        
        changeCanvasLabelColor('materialCanvas', 'red');
        renderSmiles(materialSmiles, 'materialCanvas');
        
        
        document.getElementById('chartContainerProperties').style.display = 'block';
        return;
    }


}














    






async function fetchPropertiesPredictionData(emitter_smiles = null) { 
  try {
    const bodyData = {};
    if (emitter_smiles) bodyData.emitter_smiles = emitter_smiles;

    const response = await fetch('http://192.168.7.64:90/properties_predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      console.error('Failed to fetch prediction data');
      return null;
    }

    const data = await response.json();
    const result = {};

    // 這裡改成跟表格函數一樣的 key
    if (data.plqy !== undefined) result['plqy.1'] = data.plqy;
    if (data.eqe  !== undefined) result['EQE.1'] = data.eqe;

    return result;

  } catch (error) {
    console.error('Error fetching prediction data:', error);
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
