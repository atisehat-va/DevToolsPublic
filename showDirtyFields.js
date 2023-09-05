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
        <div class="dirtyFieldsPopup-content">
            ${html}
        </div>
    `;
    document.body.appendChild(newContainer);

    document.getElementById('back-button').addEventListener('click', function() {
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

function makePopupMovable(newContainer) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  newContainer.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;    
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    newContainer.style.top = (newContainer.offsetTop - pos2) + "px";
    newContainer.style.left = (newContainer.offsetLeft - pos1) + "px";
  }


    function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
