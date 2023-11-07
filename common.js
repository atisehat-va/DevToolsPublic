//CommonFetch
function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname,_businessunitid_value&$filter=(isdisabled eq false)').then(callback);
}
function fetchRolesForUser(userId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
}
function fetchTeamsForUser(userId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=teammembership_association($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
}
function fetchBusinessUnitName(userId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=businessunitid($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
}
function fetchBusinessUnits(callback) {
	Xrm.WebApi.retrieveMultipleRecords('businessunit', '?$select=businessunitid,name').then(callback);
}
function fetchTeams(callback) {
	Xrm.WebApi.retrieveMultipleRecords('team', '?$select=teamid,name&$expand=businessunitid($select=name)&$filter=(teamtype eq 0 or teamtype eq 1) and isdefault eq false').then(callback);
}
function fetchSecurityRoles(businessUnitId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('role', `?$select=roleid,name&$filter=_businessunitid_value eq ${businessUnitId}`).then(callback);
}

//Make window movable
function makePopupMovable(newContainer) {
   console.log("MakePopupMovable");
   var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;   
  
   var header = newContainer.querySelector('.commonPopup-header');   
   if (!header) {
       console.warn("Header element not found in the container");
       return;
   }   
   header.onmousedown = function(e) {
     if (e.target.tagName.toLowerCase() === "input") {			
	return;
     }
     dragMouseDown(e);
   };
   
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

//LoadingDialog
function showLoadingDialog(message) {  
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'loadingOverlay';
  document.body.appendChild(overlay);
  
  const loadingBox = document.createElement('div');
  loadingBox.className = 'loading-box';
  
  const container = document.createElement('div');
  container.className = 'spinner-text-container';
 
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  
  const loadingMessage = document.createElement('span');
  loadingMessage.textContent = message || 'Loading...';
  loadingMessage.className = 'loading-text';
  
  container.appendChild(spinner);
  container.appendChild(loadingMessage);  
  loadingBox.appendChild(container);
  overlay.appendChild(loadingBox);  
  document.body.appendChild(overlay);
  
  const padding = 20;
  const spinnerWidth = spinner.offsetWidth;
  const textWidth = loadingMessage.offsetWidth;
  loadingBox.style.width = `${spinnerWidth + textWidth + padding}px`;

  // CSS 
  const style = document.createElement('style');
  style.innerHTML = `
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .loading-box { width: 30%; max-width: 500px; background-color: white; padding: 20px; border-radius: 10px; text-align: center; overflow: hidden; }
    .spinner-text-container { display: flex; align-items: center; justify-content: center; }
    .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 25px; height: 25px; border-radius: 50%; border-left-color: #000; animation: spin 1s infinite linear; margin-right: 10px; }
    .loading-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 50px); }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  // Close the loading dialog after 20 seconds
  setTimeout(() => { closeLoadingDialog(); }, 20000);
}

//closeLoadingDialog
function closeLoadingDialog() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}

//AlertDialogBox 
function showCustomAlert(message) {  
  const overlay = document.createElement('div');  
  const alertBox = document.createElement('div');  
  const closeButton = document.createElement('span');
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  const messageParagraph = document.createElement('p');
  messageParagraph.textContent = message;
  
  alertBox.appendChild(closeButton);
  alertBox.appendChild(messageParagraph);
  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);
  
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    #overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    #alertBox {	position: relative; margin: 15% auto; padding: 20px; background-color: #fff; text-align: center; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
    #closeButton { position: absolute; top: 10px; right: 15px; font-size: 20px; cursor: pointer; }
    #messageParagraph { font-size: 16px; display: inline-block; }
  `;	
  
  overlay.appendChild(styleElement);  
  overlay.id = 'overlay';
  alertBox.id = 'alertBox';
  closeButton.id = 'closeButton';
  messageParagraph.id = 'messageParagraph';
  
  const messageWidth = messageParagraph.offsetWidth;
  const finalWidth = Math.max(messageWidth + 40, 400); // Ensure a minimum width of 400px
  alertBox.style.width = `${finalWidth}px`;
}

	
