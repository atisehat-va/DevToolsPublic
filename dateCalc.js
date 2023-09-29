function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            Date Calculator
        </div>        
        <div class="grid-container">
            <div class="grid-item" id="section-1"></div>
            <div class="grid-item" id="section-2"></div>
            <div class="grid-item" id="section-3"></div>
            <div class="grid-item" id="section-4"></div>
            <div class="grid-item" id="section-5"></div>
            <div class="grid-item" id="section-6"></div>
        </div>
        <style>
            .grid-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 15px;
                padding: 20px;
            }

            .grid-item {
                padding: 20px;
                background-color: #f1f1f1;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
