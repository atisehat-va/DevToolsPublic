function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.style.display = 'flex';
    newContainer.style.flexDirection = 'column';
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            Date Calculator
        </div>
        <div class="sections-container">
            <div class="section-side">
                <div class="section" id="section-1"></div>
                <div class="section" id="section-2"></div>
                <div class="section" id="section-3"></div>
            </div>
            <div class="vertical-divider"></div>
            <div class="section-side">
                <div class="section" id="section-4"></div>
                <div class="section" id="section-5"></div>
                <div class="section" id="section-6"></div>
            </div>
        </div>
        <style>
            .sections-container {
                display: flex;
                flex-grow: 1;
                align-items: stretch;
            }
            .section-side {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .section {
                flex: 1;
                padding: 20px;
                margin: 5px;
            }
            .vertical-divider {
                width: 2px;
                background-color: #000;
                margin: 0 5px;
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
