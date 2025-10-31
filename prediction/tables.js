// 確保在表格生成函數中使用的字段名稱與返回的數據一致
function createPredictionOnlyTable(data, materialName = '') {
    return `
        <div class="table-container">
            ${materialName ? `<h3 style="text-align: left;">${materialName}</h3>` : ''}
            <table style="border: 1px solid black; border-collapse: collapse; width: 100%;">
                <tr>
                    <th style="border: 1px solid black; padding: 8px;">參數</th>
                    <th style="border: 1px solid black; padding: 8px;">預測值</th>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 8px;">PCE (%)</td>
                    <td style="border: 1px solid black; padding: 8px;">${data['PCE (%).1']}</td> <!-- 這裡可能需要改成 data.pce -->
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 8px;">Jsc (mAcm-2)</td>
                    <td style="border: 1px solid black; padding: 8px;">${data['Jsc (mAcm-2).1']}</td> <!-- 改成 data.jsc -->
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 8px;">Voc (V)</td>
                    <td style="border: 1px solid black; padding: 8px;">${data['Voc (V).1']}</td> <!-- 改成 data.voc -->
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 8px;">FF</td>
                    <td style="border: 1px solid black; padding: 8px;">${data['FF.1']}</td> <!-- 改成 data.ff -->
                </tr>
            </table>
        </div>
    `;
}



// 定義函數來取得對應 metric 的值
function getValuesForDonorAndAcceptor(donorName, acceptorName, metric, data) {
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

    // 使用 SMILES 進行篩選，並取得對應 metric 的值
    const matchedItems = data.filter(item =>
        item['Donor SMILES'] === donorSmiles && item['Acceptor SMILES'] === acceptorSmiles
    );

    // 回傳所有符合條件的 metric 值
    const values = matchedItems.map(item => item[metric]);

    return values;
}
function calculateMeanAndStdDevForDonorAndAcceptor(donorName, acceptorName, data) {
    // 定義要計算的性能指標
    const metrics = ['PCE (%)', 'Jsc (mAcm-2)', 'Voc (V)', 'FF'];
    let results = {};

    // 對每個性能指標進行計算
    metrics.forEach(metric => {
        // 使用 getValuesForDonorAndAcceptor 函數提取數據
        const values = getValuesForDonorAndAcceptor(donorName, acceptorName, metric, data);

        if (values.length === 0) {
            results[metric] = { mean: 'N/A', stdDev: 'N/A' };
        } else {
            // 計算平均值
            const mean = (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

            // 計算標準差
            const stdDev = Math.sqrt(values.map(value => Math.pow(value - mean, 2)).reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

            // 存儲結果
            results[metric] = { mean, stdDev };
        }
    });

    return results;
}
// 定義 calculateError 函數
function calculateError(mean, predicted) {
    if (!mean || !predicted) {
        return 'N/A';
    }
    const error = ((predicted - mean) / mean) * 100;
    return error.toFixed(2);
}



function createDonorandAcceptorPerformanceTable(donor, acceptor, data) {
    let donorName, acceptorName;
    let donorSmilesItem = null;
    let acceptorSmilesItem = null;

    // 處理 Donor 輸入：如果是對象且包含 SMILES，則視為數據項目，否則視為名稱
    if (typeof donor === 'object' && donor !== null && donor['Donor SMILES']) {
        donorSmilesItem = donor;
        donorName = donorSmilesItem['Donor'];
    } else {
        // 如果是名稱，嘗試查找對應的數據項目
        donorName = donor;
        donorSmilesItem = data.find(item => item['Donor'] === donor);
    }

    // 處理 Acceptor 輸入：如果是對象且包含 SMILES，則視為數據項目，否則視為名稱
    if (typeof acceptor === 'object' && acceptor !== null && acceptor['Acceptor SMILES']) {
        acceptorSmilesItem = acceptor;
        acceptorName = acceptorSmilesItem['Acceptor'];
    } else {
        // 如果是名稱，嘗試查找對應的數據項目
        acceptorName = acceptor;
        acceptorSmilesItem = data.find(item => item['Acceptor'] === acceptor);
    }

    // 計算平均值和標準差
    const results = calculateMeanAndStdDevForDonorAndAcceptor(donorName, acceptorName, data);

    let tableHtml = '';
    const tableStyle = 'border: 1px solid black; border-collapse: collapse; width: 100%;';
    const thStyle = 'border: 1px solid black; padding: 8px; background-color: #f2f2f2; text-align: center;';
    const tdStyle = 'border: 1px solid black; padding: 8px; text-align: center;';

    tableHtml += `<h3>${donorName} / ${acceptorName} 的性能數據</h3>`;
    tableHtml += `<table style="${tableStyle}">`;
    tableHtml += `<tr><th style="${thStyle}">參數</th><th style="${thStyle}">實驗平均值 ± 標準差</th><th style="${thStyle}">預測值</th><th style="${thStyle}">誤差</th></tr>`;

    Object.entries(results).forEach(([metric, stats]) => {
        let predictedValue = 'N/A';

        // 根據不同情況查找預測值
        if (donorSmilesItem && acceptorSmilesItem) {
            // 如果有 SMILES 數據項目，基於 SMILES 查找預測值
            predictedValue = data.find(item => item['Donor SMILES'] === donorSmilesItem['Donor SMILES'] && item['Acceptor SMILES'] === acceptorSmilesItem['Acceptor SMILES'])[`${metric}.1`];
        } else if (donorName && acceptorSmilesItem) {
            // 如果 Donor 是名稱，Acceptor 是 SMILES 項目
            predictedValue = data.find(item => item['Donor'] === donorName && item['Acceptor SMILES'] === acceptorSmilesItem['Acceptor SMILES'])[`${metric}.1`];
        } else if (donorSmilesItem && acceptorName) {
            // 如果 Donor 是 SMILES 項目，Acceptor 是名稱
            predictedValue = data.find(item => item['Donor SMILES'] === donorSmilesItem['Donor SMILES'] && item['Acceptor'] === acceptorName)[`${metric}.1`];
        } else if (donorName && acceptorName) {
            // 如果 Donor 和 Acceptor 都是名稱
            predictedValue = data.find(item => item['Donor'] === donorName && item['Acceptor'] === acceptorName)[`${metric}.1`];
        }

        const formattedPredictedValue = predictedValue !== 'N/A' ? Number(predictedValue).toPrecision(3) : 'N/A';
        const error = calculateError(stats.mean, predictedValue);

        tableHtml += `<tr><td style="${tdStyle}">${metric}</td><td style="${tdStyle}">${stats.mean} ± ${stats.stdDev}</td><td style="${tdStyle}">${formattedPredictedValue}</td><td style="${tdStyle}">${error}%</td></tr>`;
    });

    tableHtml += '</table>';
    return tableHtml;
}

function generatePredictionTable(data, type, materialName = '') {
    let propertiesTable = `
        <div class="table-container">
            <table style="border: 1px solid black; border-collapse: collapse; width: 100%;">
                <tr>
                    <th style="border: 1px solid black; padding: 8px;">參數</th>
                    <th style="border: 1px solid black; padding: 8px;">預測值</th>
                </tr>
    `;
    
    // 如果 type 是 'donor' 或 'both'，顯示 Donor 的屬性
    if (type === 'donor' || type === 'both') {
        propertiesTable += `
            <tr>
                <td style="border: 1px solid black; padding: 8px;">HOMO of Donor (eV)</td>
                <td style="border: 1px solid black; padding: 8px;">${Number(data['HOMO of Donor (eV).1']).toPrecision(3)}</td>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">LUMO of Donor (eV)</td>
                <td style="border: 1px solid black; padding: 8px;">${Number(data['LUMO of Donor (eV).1']).toPrecision(3)}</td>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">Bandgap of Donor (eV)</td>
                <td style="border: 1px solid black; padding: 8px;">${Number(data['Bandgap of Donor (eV).1']).toPrecision(3)}</td>
            </tr>
        `;
    }
    
    // 如果 type 是 'acceptor' 或 'both'，顯示 Acceptor 的屬性
    if (type === 'acceptor' || type === 'both') {
        propertiesTable += `
            <tr>
                <td style="border: 1px solid black; padding: 8px;">HOMO of Acceptor (eV)</td>
                <td style="border: 1px solid black; padding: 8px;">${Number(data['HOMO of Acceptor (eV).1']).toPrecision(3)}</td>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">LUMO of Acceptor (eV)</td>
                <td style="border: 1px solid black; padding: 8px;">${Number(data['LUMO of Acceptor (eV).1']).toPrecision(3)}</td>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">Bandgap of Acceptor (eV)</td>
                <td style="border: 1px solid black; padding: 8px;">${Number(data['Bandgap of Acceptor (eV).1']).toPrecision(3)}</td>
            </tr>
        `;
    }

    propertiesTable += '</table></div>';
    
    // 根據 type 顯示 Donor 或 Acceptor 性質的標題
    if (materialName) {
        if (type === 'donor') {
            return `<h3>${materialName} 的 Donor 性質</h3>${propertiesTable}`;
        } else if (type === 'acceptor') {
            return `<h3>${materialName} 的 Acceptor 性質</h3>${propertiesTable}`;
        } else {
            return `<h3>${materialName} 的 Donor 和 Acceptor 性質</h3>${propertiesTable}`;
        }
    }

    return propertiesTable;
}





function getValuesForDonor(donorName, metric, data) {
    // 找到與 donorName 對應的 Donor SMILES
    const donorSmilesItem = data.find(item => item.Donor === donorName);

    // 如果沒有找到對應的供體，返回空陣列
    if (!donorSmilesItem) {
        return [];
    }

    const donorSmiles = donorSmilesItem['Donor SMILES'];

    // 使用 Donor SMILES 過濾出所有與該 SMILES 匹配的項目
    const matchedItems = data.filter(item => item['Donor SMILES'] === donorSmiles);

    // 提取所有匹配項目的指定性能指標的值
    const values = matchedItems.map(item => item[metric]);

    return values;
}

function calculateMeanAndStdDevForDonor(donorName, data) {
    // 定義要計算的性質指標
    const metrics = ['HOMO of Donor (eV)', 'LUMO of Donor (eV)', 'Bandgap of Donor (eV)'];
    let results = {};

    // 對每個性質指標進行計算
    metrics.forEach(metric => {
        // 使用 getValuesForDonor 函數提取數據
        const values = getValuesForDonor(donorName, metric, data);

        if (values.length === 0) {
            results[metric] = { mean: 'N/A', stdDev: 'N/A' };
        } else {
            // 計算平均值
            const mean = (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

            // 計算標準差
            const stdDev = Math.sqrt(values.map(value => Math.pow(value - mean, 2)).reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

            // 存儲結果
            results[metric] = { mean, stdDev };
        }
    });

    return results;
}

function getValuesForAcceptor(acceptorName, metric, data) {
    // 找到與 acceptorName 對應的 Acceptor SMILES
    const acceptorSmilesItem = data.find(item => item.Acceptor === acceptorName);

    // 如果沒有找到對應的受體，返回空陣列
    if (!acceptorSmilesItem) {
        return [];
    }

    const acceptorSmiles = acceptorSmilesItem['Acceptor SMILES'];

    // 使用 Acceptor SMILES 過濾出所有與該 SMILES 匹配的項目
    const matchedItems = data.filter(item => item['Acceptor SMILES'] === acceptorSmiles);

    // 提取所有匹配項目的指定性能指標的值
    const values = matchedItems.map(item => item[metric]);

    return values;
}

function calculateMeanAndStdDevForAcceptor(acceptorName, data) {
    // 定義要計算的性質指標
    const metrics = ['HOMO of Acceptor (eV)', 'LUMO of Acceptor (eV)', 'Bandgap of Acceptor (eV)'];
    let results = {};

    // 對每個性質指標進行計算
    metrics.forEach(metric => {
        // 使用 getValuesForAcceptor 函數提取數據
        const values = getValuesForAcceptor(acceptorName, metric, data);

        if (values.length === 0) {
            results[metric] = { mean: 'N/A', stdDev: 'N/A' };
        } else {
            // 計算平均值
            const mean = (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

            // 計算標準差
            const stdDev = Math.sqrt(values.map(value => Math.pow(value - mean, 2)).reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

            // 存儲結果
            results[metric] = { mean, stdDev };
        }
    });

    return results;
}
function createDonorPropertiesTable(donorName, data) {
    const results = calculateMeanAndStdDevForDonor(donorName, data);

    let tableHtml = '';
    const tableStyle = 'border: 1px solid black; border-collapse: collapse; width: 100%;';
    const thStyle = 'border: 1px solid black; padding: 8px; background-color: #f2f2f2; text-align: center;';
    const tdStyle = 'border: 1px solid black; padding: 8px; text-align: center;';

    tableHtml += `<h3>${donorName} 的 Donor 性質</h3>`;
    tableHtml += `<table style="${tableStyle}">`;
    tableHtml += `<tr><th style="${thStyle}">參數</th><th style="${thStyle}">實驗平均值 ± 標準差</th><th style="${thStyle}">預測值</th><th style="${thStyle}">誤差</th></tr>`;

    Object.entries(results).forEach(([metric, stats]) => {
        const predictedValue = data.find(item => item.Donor === donorName)[`${metric}.1`];
        const formattedPredictedValue = predictedValue.toPrecision(3);  // 格式化為三位有效數字
        const error = calculateError(stats.mean, predictedValue);

        tableHtml += `<tr><td style="${tdStyle}">${metric}</td><td style="${tdStyle}">${stats.mean} ± ${stats.stdDev}</td><td style="${tdStyle}">${formattedPredictedValue}</td><td style="${tdStyle}">${error}%</td></tr>`;
    });

    tableHtml += '</table>';
    return tableHtml;
}


function createAcceptorPropertiesTable(acceptorName, data) {
    const results = calculateMeanAndStdDevForAcceptor(acceptorName, data);

    let tableHtml = '';
    const tableStyle = 'border: 1px solid black; border-collapse: collapse; width: 100%;';
    const thStyle = 'border: 1px solid black; padding: 8px; background-color: #f2f2f2; text-align: center;';
    const tdStyle = 'border: 1px solid black; padding: 8px; text-align: center;';

    tableHtml += `<h3>${acceptorName} 的 Acceptor 性質</h3>`;
    tableHtml += `<table style="${tableStyle}">`;
    tableHtml += `<tr><th style="${thStyle}">參數</th><th style="${thStyle}">實驗平均值 ± 標準差</th><th style="${thStyle}">預測值</th><th style="${thStyle}">誤差</th></tr>`;

    Object.entries(results).forEach(([metric, stats]) => {
        const predictedValue = data.find(item => item.Acceptor === acceptorName)[`${metric}.1`];
        const formattedPredictedValue = predictedValue.toPrecision(3);  // 格式化為三位有效數字
        const error = calculateError(stats.mean, predictedValue);

        tableHtml += `<tr><td style="${tdStyle}">${metric}</td><td style="${tdStyle}">${stats.mean} ± ${stats.stdDev}</td><td style="${tdStyle}">${formattedPredictedValue}</td><td style="${tdStyle}">${error}%</td></tr>`;
    });

    tableHtml += '</table>';
    return tableHtml;
}



