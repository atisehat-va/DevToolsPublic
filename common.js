//Make window movable
function makePopupMovable(newContainer) {
	console.log("MakePopupMovable");
	var pos1 = 0,	pos2 = 0, pos3 = 0, pos4 = 0;
	newContainer.onmousedown = function(e) {
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
//closeLoadingDialog
function closeLoadingDialog() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}

//LoadingDialog
function showLoadingDialog(message) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'loadingOverlay';

  // Create loading dialog box
  const loadingBox = document.createElement('div');
  loadingBox.className = 'loading-box';

  // Create spinner and text container
  const container = document.createElement('div');
  container.className = 'spinner-text-container';

  // Create spinner
  const spinner = document.createElement('div');
  spinner.className = 'spinner';

  // Create the loading message
  const loadingMessage = document.createElement('span');
  loadingMessage.textContent = message || 'Loading...';
  loadingMessage.className = 'loading-text';

  // Append spinner and loading message to container
  container.appendChild(spinner);
  container.appendChild(loadingMessage);

  // Append container to loading box
  loadingBox.appendChild(container);

  // Append loading box to overlay
  overlay.appendChild(loadingBox);

  // Append overlay to body
  document.body.appendChild(overlay);

  // Dynamic width calculation
  const padding = 20;
  const spinnerWidth = spinner.offsetWidth;
  const textWidth = loadingMessage.offsetWidth;
  loadingBox.style.width = `${spinnerWidth + textWidth + padding}px`;

  // CSS for overlay, loading box, and spinner
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
	
