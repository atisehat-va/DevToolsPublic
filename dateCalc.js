function appendDirtyFieldsPopupToBody(html) {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            Date Calculator
        </div>        
        <div class="dirtyFieldsPopup-content">
            ${html}
        </div>
    `;
    document.body.appendChild(newContainer);
    document.getElementById('commonback-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	});
    makePopupMovable(newContainer);
}

function dateCalc() {       
    const popupHtml = `        
        <div class="scrollable-section" style="padding: 10px; columns: 2; -webkit-columns: 2; -moz-columns: 2;">
            ${dirtyFieldsHtml}
        </div>
    `;

    appendDirtyFieldsPopupToBody(popupHtml);
}
