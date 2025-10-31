function renderSmiles(smiles, canvasId, title, materialName) {
    var canvas = document.getElementById(canvasId);
    
    if (canvas) {
        // 顯示畫布
        canvas.style.display = 'inline-block';

        // 設置畫布大小，確保與CSS一致
        canvas.width = 450;  // 設置更大的寬度
        canvas.height = 450; // 設置更大的高度

        var smilesDrawer = new SmilesDrawer.Drawer({
            width: 450,  // 與畫布寬度一致
            height: 450  // 與畫布高度一致
        });

        SmilesDrawer.parse(smiles, function(tree) {
            // 渲染化學結構
            smilesDrawer.draw(tree, canvas, 'light', false);

            var ctx = canvas.getContext('2d');
            ctx.font = '28px Arial'; // 調整字體大小
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // 在畫布左上角繪製標題
            ctx.fillText(title, 10, 10);

            // 在畫布右上角繪製材料名稱
            ctx.textAlign = 'right';  // 將文本對齊設置為右對齊
            ctx.fillText(materialName, canvas.width - 10, 10);

        }, function(err) {
            console.log('Error parsing SMILES: ', err);
        });
    } else {
        console.error(`No canvas element with ID '${canvasId}' found.`);
    }
}








function changeCanvasLabelColor(canvasId, color) {
    const canvasLabel = document.querySelector(`#${canvasId} + .canvas-label`);
    if (canvasLabel) {
        canvasLabel.style.color = color;
    }
}