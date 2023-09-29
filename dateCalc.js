function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            Date Calculator
        </div>        
        <div class="grid-container">
            <div class="grid-item" id="section-1">1</div>
            <div class="grid-item" id="section-2">2</div>
            <div class="grid-item" id="section-3">3</div>
            <div class="grid-item" id="section-4">4</div>
            <div class="grid-item" id="section-5">5</div>
            <div class="grid-item" id="section-6">6</div>
        </div>
        <style>
            .grid-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 10px;
                width: 100%;
                border: 1px solid black;
            }

            .grid-item {
                border: 1px solid black;
                padding: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        </style>
    `;
    document.body.appendChild(newContainer);
    document.getElementById('commonback-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	});
    makePopupMovable(newContainer);
}
