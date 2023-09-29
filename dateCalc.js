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
        <div class="securityPopup-row">
            <div class="commonSection" id="section1">Section 1</div>
            <div class="vertical-divider"></div>
            <div class="commonSection" id="section2">Section 2</div>
        </div>
        <div class="securityPopup-row">
            <div class="commonSection" id="section3">Section 3</div>
            <div class="vertical-divider"></div>
            <div class="commonSection" id="section4">Section 4</div>
        </div>
        <div class="securityPopup-row">
            <div class="commonSection" id="section5">Section 5</div>
            <div class="vertical-divider"></div>
            <div class="commonSection" id="section6">Section 6</div>
        </div>
        <div class="submit-button-container">
            <button id="submitButton">Submit</button>
        </div>
        <style>
            .securityPopup-row {
                display: flex;
                flex-grow: 1;
                align-items: center;
            }
            
            .commonSection {
                flex: 1;
                padding: 20px;
            }

            .vertical-divider {
                width: 5px; /* Make the divider a bit thicker */
                background-color: #E0E0E0; /* A lighter color for the divider */
                margin: 15% 2%; /* Shorten its length and add some space on the sides */
                border-radius: 2.5px;
            }

            .submit-button-container {
                padding: 20px;
                display: flex;
                justify-content: center;
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
