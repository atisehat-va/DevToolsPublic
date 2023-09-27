var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

const baseUrl = 'https://atisehat-va.github.io/DevToolsPublic/';

function loadCSS(href) {
  const link = document.createElement('link');
  link.href = baseUrl + href;
  link.rel = 'stylesheet';
  link.type = 'text/css';
  document.head.appendChild(link); 
}

// Load CSS
loadCSS('styles.css');

function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = baseUrl + src;
  script.onload = callback;
  document.head.appendChild(script);
}

// Load scripts
loadScript('common.js', () => console.log('commonJS loaded!')); 
loadScript('advanceFind_userProvision.js', () => console.log('Advanced find & User Provision loaded!'));
loadScript('entityInfo.js', () => console.log('EntityInfo and Field Logical Names loaded!'));
loadScript('fieldsControl.js', () => console.log('Fields Control loaded!'));
loadScript('showHiddenItems_UnlockFields.js', () => console.log('Show Hidden Items and Unlock Fields loaded!'));
loadScript('showDirtyFields.js', () => console.log('Show Modified Fields loaded!'));
loadScript('RestBuilder.js', () => console.log('Rest Builder loaded!'));
loadScript('copySecurity1.js', () => console.log('Security loaded!'));
loadScript('assignUserSecurity.js', () => console.log('Security loaded!')); //Assign Security
loadScript('security1.js', () => console.log('Security loaded!'));

function openPopup() {
  closeSubPopups();
  var isAdmin = false;
  var userName = Xrm.Utility.getGlobalContext().userSettings.userName;
  var roles = Xrm.Utility.getGlobalContext().userSettings.roles;  
  for (var i = 0; i< roles.getLength(); i++) {
    var role = roles.get(i);
    if (role.name == "System Administrator") {
        isAdmin = true;
        break;
    }
  }  
  if (!isAdmin && userName !== "Adrian Solis") {
    Xrm.Navigation.openAlertDialog({ text: "You do not have permission to execute this action."});
    return;    
  }

//check if User provision table exist
 checkIfEntityExists('vhacrm_userprovision', function(entityExists) {
    	var userProvisionButton = entityExists ? '<button onclick="closePopup(); openUrl(\'userProvision\');">User Provision Tool</button>' : '';
	 
	  var popupHtml = `  
	    <style>       
	        .popup { position: fixed; left: 50%; top: 50%; background-color: #f9f9f9; border: 1px solid #888; border-radius: 10px; box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.2); transform: translate(-50%, -50%); max-height: 80vh; overflow-y: auto; width: 420px; }	 	
		.button-container { padding: 20px; width: 380px; }
  		.popup button { display: block; width: 100%; margin-bottom: 10px; padding: 10px; background-color: #102e55; color: white; border: none; border-radius: 20px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); }
    		.popup button:hover { background-color: #3c6690; transform: translateY(-2px); box-shadow: 0 7px 20px rgba(0, 0, 0, 0.25); }
      		.popup button:active { transform: translateY(0); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); }		
		.button-row { display: flex; justify-content: space-between; flex-direction: row; width: 100%; }
		.button-row button { width: calc(50% - 5px); }
		.dropdown button { width: 100%; }
		.button-row .full-width { width: 100%; }
		.dropdown-row { display: flex; justify-content: space-between; flex-direction: row; width: 100%; }
		.dropdown { position: relative; display: inline-block; width: calc(50% - 5px); }
		.dropdown-content { display: none; position: absolute; min-width: 100%; z-index: 1; }
		.dropdown-content button { display: block; background-color: white; color: black; padding: 10px; text-align: center; border: none; width: 100%; }
  		.popup button.close-btn { margin-top: 10px; font-size: 15px; }
	    </style>
	    <div class="popup">
     		<div class="commonPopup-header">	            
	            Admin Plus
	        </div> 
	    	<div class="button-container">
		  <div class="dropdown-row">
		    <div class="dropdown">
                      <button onclick="closePopup(); openUrl('advanceFind');">Advanced Find Classic</button>		      
		    </div>
		    <div class="dropdown">
		      <button onclick="toggleDropdownMenu('dropdown-content');">Update Security</button>
		      <div id="dropdown-content" class="dropdown-content">		        
			${userProvisionButton}
		         <button onclick="closePopup(); securityUpdate();">Copy User Security</button>
		    <button onclick="closePopup(); securityUpdate2();">Assign User Security</button>	                		        
		      </div>
		    </div>
		  </div>		  
		  <div class="button-row">
		    <button onclick="closePopup(); setTimeout(fetchEntityFields, 0);">Show Entity Info</button>
		    <button onclick="renameTabsSectionsFields();">Show Logical Names</button>
		  </div>
		  <div class="button-row">
		    <button onclick="showAllTabsAndSections();">Show Hidden Items</button>
		    <button onclick="unlockAllFields();">Unlock All Fields</button>
		  </div>
		  <div class="button-row">
		    <button onclick="closePopup(); showDirtyFields();">Show Modified Fields</button>
		    <button onclick="openRestBuilder(getOrgUrl());">Open REST Builder</button>
		  </div>
		    <button onclick="closePopup();" class="close-btn">Close</button>
		</div>
	        <div id="popupContent" class="content"></div>	
	   </div>
	  `;	  
	  var newContainer = document.createElement('div');
	  newContainer.id = 'MenuPopup';
	  newContainer.innerHTML = popupHtml;
	  newContainer.style.position = 'fixed';  
	  newContainer.style.left = '50%';
	  newContainer.style.top = '50%';
	  newContainer.style.transform = 'translate(-50%, -50%)';  
	  document.body.appendChild(newContainer);
	  
	  makePopupMovable(newContainer);
	});
}

function checkIfEntityExists(entityLogicalName, callback) {
  var clientURL = Xrm.Page.context.getClientUrl();
  var req = new XMLHttpRequest();
  req.open("GET", `${clientURL}/api/data/v9.0/EntityDefinitions(LogicalName='${entityLogicalName}')`, true);
  req.setRequestHeader("OData-MaxVersion", "4.0");
  req.setRequestHeader("OData-Version", "4.0");
  req.setRequestHeader("Accept", "application/json");
  req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  req.onreadystatechange = function () {
    if (this.readyState === 4) {
      req.onreadystatechange = null;
      if (this.status === 200) {        
        callback(true);
      } else if (this.status === 404) {
        console.log("User Provision Entity does not exist");
        callback(false);
      } else {
        console.log(this.statusText);
      }
    }
  };
  req.send();
}

function closeIframe(url) { 
  var contentDiv = document.getElementById('popupContent');  
  contentDiv.style.display = 'none';  
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

function toggleDropdownMenu(dropdownId) {
  var dropdownContent = document.getElementById(dropdownId);
  if (dropdownContent.style.display === 'block') {
    dropdownContent.style.display = 'none';
  } else {
    dropdownContent.style.display = 'block';
  }
}

function closePopup() {
    closeIframe();    
    // Remove MenuPopup if it exists
    var newContainer = document.getElementById('MenuPopup');
    if (newContainer) {
        newContainer.remove();
    }
    closeSubPopups();
}

function closeSubPopups() { 
    const popupClasses = ['.entityInfoPopup', '.dirtyFieldsPopup', '.securityPopup'];    
    popupClasses.forEach((popupClass) => {
        const popup = document.querySelector(popupClass);
        if (popup) {
            popup.remove();
        }
    });
}

function closeDirtyFieldsPopup() {
  var popup = document.querySelector('.dirty-fields-popup');
  if (popup) {
    popup.remove();
  }
} 

window.fetchEntityFields = fetchEntityFields;
window.unlockAllFields = unlockAllFields;
window.showAllTabsAndSections = showAllTabsAndSections;
window.renameTabsSectionsFields = renameTabsSectionsFields;
window.toggleDropdownMenu = toggleDropdownMenu;
window.closePopup = closePopup;
window.openUrl = openUrl;
window.showDirtyFields = showDirtyFields;
window.closeDirtyFieldsPopup = closeDirtyFieldsPopup;
