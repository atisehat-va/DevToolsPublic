/*
function getDirtyFields() {
  closeIframe();
  var attributes = Xrm.Page.data.entity.attributes.get();
  var dirtyAttributes = attributes.filter(function(attribute) {
    return attribute.getIsDirty();
  });  
    
  var dirtyFieldList = dirtyAttributes.map(function(attribute) {
    var displayName = attribute.controls.get()[0].getLabel();
    var logicalName = attribute.getName();
    return '<li>' + displayName + ' (' + logicalName + ')' + '</li>';
  }).join('');

  return '<ul>' + dirtyFieldList + '</ul>';
}

// Show dirty fields
function showDirtyFields() {
  var dirtyFieldsHtml = getDirtyFields();

  var popupContent = `
    <style>
      .dirty-fields-popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; width: 300px; padding: 20px; }
      .dirty-fields-popup h3 { color: #002050; margin-bottom: 10px; }
      .dirty-fields-popup button { display: block; width: 100%; padding: 10px; background-color: #002050; color: white; border: none; }
      .dirty-fields-popup ul { padding: 0; margin: 10px 0; list-style: none; }
      .dirty-fields-popup li { padding: 5px; font-size: 14px; }
    </style>
    <div class="dirty-fields-popup">
      <h3>Modified Fields</h3>
      ${dirtyFieldsHtml}
      <button onclick="closeDirtyFieldsPopup();">Close</button>
    </div>
  `;

  var popupDiv = document.createElement('div');
  popupDiv.innerHTML = popupContent;
  popupDiv.style.position = 'absolute';
  popupDiv.style.zIndex = '10001'; 
  popupDiv.style.left = '50%';
  popupDiv.style.top = '50%';
  popupDiv.style.transform = 'translate(-50%, -50%)';
  popupDiv.style.backgroundColor = 'white';
  
  document.body.appendChild(popupDiv);
  
  makePopupMovable(popupDiv);
} */

//NewCode
function showDirtyFields() {
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

            // Set the color of the label on the form to red
            if (control) {
                control.getLabelElement().style.color = 'red';
            }

            return '<div>' + (index + 1) + '. <strong>' + displayName + '</strong></div>' +
                   '<div style="margin-left: 40px;">&bull; <strong>Logical Name:</strong> ' + logicalName + '</div><br>';
        }).join('');

        html += '<div style="padding: 5px;">' + fieldList + '</div>';
    } else {
        html += '<div>No dirty fields found.</div>';
    }

    // Calling the showContent function with 'html' type
    showContent('html', html);
}
