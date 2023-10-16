function generateDirtyFieldsHtml(dirtyFields) {
    if (dirtyFields.length > 0) {
        return dirtyFields.map((attribute, index) => {
            const logicalName = attribute.getName();
            const control = attribute.controls.get(0);
            const displayName = control ? control.getLabel() : logicalName;
            return `
                <div>${index + 1}. <strong>${displayName}</strong>
                    <div style="margin-left: 40px;">&bull; <strong>Logical Name:</strong> ${logicalName}</div>
                </div>
                <br>
            `;
        }).join('');
    } else {
        return '<div>No dirty fields found.</div>';
    }
}

function appendDirtyFieldsPopupToBody(html) {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            Dirty Fields Info
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

function showDirtyFields() {
    const entity = Xrm.Page.data.entity;
    const attributes = entity.attributes.get();
    const dirtyFields = attributes.filter(attribute => attribute.getIsDirty());
    const dirtyFieldsHtml = generateDirtyFieldsHtml(dirtyFields);
    const popupHtml = `
        <h2 style="text-align: left;"><strong>Dirty Fields:</strong></h2>
        <div class="scrollable-section" style="padding: 10px; columns: 2; -webkit-columns: 2; -moz-columns: 2;">
            ${dirtyFieldsHtml}
        </div>
    `;
    appendDirtyFieldsPopupToBody(popupHtml);
}
