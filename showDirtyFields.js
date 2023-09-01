/*function showDirtyFields() {
    var entity = Xrm.Page.data.entity;
    var attributes = entity.attributes.get();
    var dirtyFields = attributes.filter(function(attribute) {
        return attribute.getIsDirty();
    });

    var html = '<h2 style="text-align: center;"><strong>Dirty Fields</strong></h2>';

    if (dirtyFields.length > 0) {
        var fieldList = dirtyFields.map(function(attribute, index) {
            var logicalName = attribute.getName();
            var control = attribute.controls.get(0);
            var displayName = control ? control.getLabel() : logicalName;

            return '<div>' + (index + 1) + '. <strong>' + displayName + '</strong></div>' +
                   '<div style="margin-left: 40px;">&bull; <strong>Logical Name:</strong> ' + logicalName + '</div><br>';
        }).join('');

        html += '<div style="padding: 5px;">' + fieldList + '</div>';
    } else {
        html += '<div>No dirty fields found.</div>';
    }

    // Calling the showContent function with 'html' type
    showContent('html', html);
}*/

//new
const dirtyFieldsPopupCss = `
    .dirtyFieldsPopup { background-color: #f9f9f9; border: 3px solid #002050; border-radius: 20px; width: 40%; height: 50%; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }
    .dirtyFieldsPopup-header { position: relative; text-align: center; font-size: 18px; padding: 10px; background-color: #002050; color: #fff; border: none; padding: 10px; }
    .dirtyFieldsPopup-content { padding: 15px; height: 158%; }
    .back-button { position: absolute; top: 0; left: 0; width: 90px; cursor: pointer; background-color: #333; color: #fff; padding: 9px; border-bottom-right-radius: 15px; }
    .scrollable-section { height: 66%; overflow-y: auto; }
`;

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
    newContainer.className = 'dirtyFieldsPopup';    
    newContainer.style.position = 'fixed';
    newContainer.style.top = '50%';
    newContainer.style.left = '50%';
    newContainer.style.transform = 'translate(-50%, -50%)';

    newContainer.innerHTML = `
        <div class="dirtyFieldsPopup-header">
            <button class="back-button" id="back-button">Back</button>
            Dirty Fields Info
        </div>
        <style>${dirtyFieldsPopupCss}</style>
        <div class="dirtyFieldsPopup-content">
            ${html}
        </div>
    `;
    document.body.appendChild(newContainer);

    document.getElementById('back-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	});
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
