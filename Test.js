var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

const baseUrl = 'https://atisehat-va.github.io/DevToolsPublic/';
function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = baseUrl + src;
  script.onload = callback;
  document.head.appendChild(script);
}

function loadCSS(href) {
  const link = document.createElement('link');
  link.href = baseUrl + href;
  link.rel = 'stylesheet';
  link.type = 'text/css';
  document.head.appendChild(link);
}

// Load scripts
loadScript('advanceFind_userProvision.js', () => console.log('Advanced find & User Provision loaded!'));
loadScript('entityInfo.js', () => console.log('EntityInfo and Field Logical Names loaded!'));
loadScript('fieldsControl.js', () => console.log('Fields Control loaded!'));
loadScript('showHiddenItems_UnlockFields.js', () => console.log('Show Hidden Items and Unlock Fields loaded!'));
loadScript('showDirtyFields.js', () => console.log('Show Modified Fields loaded!'));
loadScript('RestBuilder.js', () => console.log('Rest Builder loaded!'));
loadScript('copySecurity.js', () => console.log('Security loaded!'));
loadScript('copySecurity2.js', () => console.log('Security loaded!')); //Assign Security

// Load CSS
loadCSS('styles.css');

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
  var popupHtml = `     
    <div class="popup">
		<div class="container" id="container">
			<div class="button-container">
				<div class="dropdown-row">
				  <div class="dropdown">
					<button onclick="toggleDropdownMenu('dropdown-content-advanced-find');">Advanced Find</button>
					<div id="dropdown-content-advanced-find" class="dropdown-content">
					  <button onclick="openUrl('dev', 'advanceFind');">Advanced Find DEV</button>
					  <button onclick="openUrl('int', 'advanceFind');">Advanced Find INT</button>
					  <button onclick="openUrl('qa', 'advanceFind');">Advanced Find QA</button>
					  <button onclick="openUrl('preprod', 'advanceFind');">Advanced Find Pre-Prod</button>
					</div>
				  </div>
				  <div class="dropdown">
					  <button onclick="toggleDropdownMenu('dropdown-content');">User Provision</button>
					<div id="dropdown-content" class="dropdown-content">
					  <button onclick="openUrl('dev', 'userProvision');">User Provision DEV</button>
					  <button onclick="openUrl('int', 'userProvision');">User Provision INT</button>
					  <button onclick="openUrl('qa', 'userProvision')">User Provision QA</button>
					  <button onclick="openUrl('preprod', 'userProvision');">User Provision Pre-Prod</button>
					</div>
				  </div>
				</div>
    				<div class="button-row">
					<button onclick="closePopup(); securityUpdate();">Update Security</button>
     					<button onclick="closePopup(); securityUpdate2();">Update Security2</button>					
				</div>
				<div class="button-row">
					<button onclick="closePopup(); setTimeout(fetchEntityFields, 0);">Entity Info & Fields</button>
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
					<button onclick="closePopup();">Close</button>				
			</div>
            <div class="iframe-container" id="iframe-container">                
			<div id="popupContent" class="content"></div>
		</div>
	</div>
    </div>
  `;
  var popupDiv = document.createElement('div');
  popupDiv.id = 'MenuPopup';
  popupDiv.innerHTML = popupHtml;
  popupDiv.style.position = 'absolute';
  popupDiv.style.zIndex = '10000';
  popupDiv.style.left = '50%';
  popupDiv.style.top = '50%';
  popupDiv.style.transform = 'translate(-50%, -50%)';
  popupDiv.style.backgroundColor = 'white';  
  document.body.appendChild(popupDiv);
  
  makePopupMovable(popupDiv);
}

function closeIframe(url) { 
  var contentDiv = document.getElementById('popupContent');
  var containerDiv = document.getElementById('container');
  var iframeContainer = document.getElementById('iframe-container');
  
  contentDiv.style.display = 'none';
  iframeContainer.style.display = 'none';  
  //containerDiv.classList.remove('expanded');
  containerDiv.classList.remove('expanded-iframe');
  containerDiv.classList.remove('expanded-alert');
  containerDiv.classList.remove('expanded-html');
}

function makePopupMovable(popupDiv) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  popupDiv.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;    
    var iframeContainer = document.getElementById('iframe-container');
    if (iframeContainer.contains(e.target)) {
	return;
    }
    
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
    popupDiv.style.top = (popupDiv.offsetTop - pos2) + "px";
    popupDiv.style.left = (popupDiv.offsetLeft - pos1) + "px";
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
    var popupDiv = document.getElementById('MenuPopup');
    if (popupDiv) {
        popupDiv.remove();
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
//new
window.showDirtyFields = showDirtyFields;
window.closeDirtyFieldsPopup = closeDirtyFieldsPopup;
