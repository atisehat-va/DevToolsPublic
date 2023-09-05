async function fetchEntityFields() {
    const entityName = Xrm.Page.data.entity.getEntityName();
    const recordId = Xrm.Page.data.entity.getId();
    const cleanRecordId = recordId.replace(/[{}]/g, "").toLowerCase();
    const url = `${Xrm.Page.context.getClientUrl()}/api/data/v9.1/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,AttributeType,DisplayName`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const results = await response.json();
            const fieldListHtml = generateFieldListHtml(results.value);
            const popupHtml = generatePopupHtml(entityName, cleanRecordId, fieldListHtml);
            appendPopupToBody(popupHtml);
        } else {            
            alert(`Error: ${response.statusText}`);
        }
    } catch (error) {
        console.log(`Error: ${error}`);
        alert(`Error: ${error}`);
    }
}
const entityInfoPopupCss = `
    .entityInfoPopup { background-color: #f9f9f9; border: 3px solid #002050; border-radius: 20px; width: 40%; height: 50%; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }
    .section { padding: 15px; border-right: 0px solid #ccc; overflow-y: scroll; }
    .content-section { text-align: left; height: 100%; width: 100%; }
    .entityInfoPopup-row { display: flex; height: 100%; }
    .entityInfoPopup-header { position: relative; text-align: center; font-size: 18px; padding: 10px; background-color: #002050; color: #fff; border: none;}
    .scrollable-section { height: 66%; overflow-y: auto; }
    .back-button { position: absolute; top: 0; left: 0; width: 90px; cursor: pointer; background-color: #333; color: #fff; padding: 10px; border-top-left-radius: 20px; border-bottom-right-radius: 15px; }
`;
function generateFieldListHtml(fields) {
    return fields
        .filter(field => field.AttributeType !== 'Virtual' && field.DisplayName && field.DisplayName.UserLocalizedLabel && field.DisplayName.UserLocalizedLabel.Label)
        .map((field, index) => `
            <div>${index + 1}. <strong>${field.DisplayName.UserLocalizedLabel.Label}</strong>
                <div style="margin-left: 20px;">
                    <div>Name: ${field.LogicalName}</div>
                    <div>Type: ${field.AttributeType}</div>
                </div>
            </div>
        `)
        .join('');
}
function generatePopupHtml(entityName, cleanRecordId, fieldListHtml) {
     return `        
        <h2 style="text-align: left;">Entity: ${entityName}</h2>
        <h2 style="text-align: left;">Record ID: ${cleanRecordId}</h2>
        <h2 style="text-align: left;">Fields:</h2>
        <br>
        <div class="scrollable-section" style="padding: 5px; columns: 2; -webkit-columns: 2; -moz-columns: 2;">
            ${fieldListHtml}
        </div>
    `;
}
function appendPopupToBody(html, clearPrevious = false) {
	if (clearPrevious) {
        	const existingPopups = document.querySelectorAll('.entityInfoPopup');
        	existingPopups.forEach(popup => popup.remove());
    	}    
	var newContainer = document.createElement('div');	  	
	newContainer.className = 'entityInfoPopup';	
	newContainer.style.position = 'fixed';  		
	newContainer.style.top = '50%';
	newContainer.style.left = '50%';
	newContainer.style.transform = 'translate(-50%, -50%)'; 
		
	newContainer.innerHTML = `
	    <div class="entityInfoPopup-header">
                <button class="back-button" id="back-button">Back</button>
     		Entity & Fields Info
            </div>	    
	    <style>${entityInfoPopupCss}</style>
	    <div class="entityInfoPopup-row">
	        <div class="section content-section" id="section1">
	            ${html}
	        </div>
	    </div>
	`;
	document.body.appendChild(newContainer);

	document.getElementById('back-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	});
	makePopupMovable(newContainer);
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
