//UI Helper Functions

/** 
 * @returns {boolean} True if on a form page, false otherwise
 */
function isFormContext() {
    try {
        if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data || !Xrm.Page.data.entity) {
            return false;
        }        
        const entityName = Xrm.Page.data.entity.getEntityName();
        const recordId = Xrm.Page.data.entity.getId();        
        return !!(entityName && recordId);
    } catch (error) {
        return false;
    }
}

/** 
 * @param {string} toolName 
 * @returns {boolean} True if valid form context, false otherwise
 */
function requireFormContext(toolName) {
    if (!isFormContext()) {
        const message = 'This action can only be used on a form. Please navigate to a form and try again.';
        
        if (typeof showToast === 'function') {
            showToast(message, 'warning', 3000);
        } else {
            alert(message);
        }
        return false;
    }
    return true;
}

//Make window movable
function makePopupMovable(newContainer) {   
   var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;  
   var header = newContainer.querySelector('.commonPopup-header');   
   if (!header) {
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

  // Close the loading dialog
  setTimeout(() => { closeLoadingDialog(); }, 20000);
}

//closeLoadingDialog
function closeLoadingDialog() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}
const hideLoadingDialog = closeLoadingDialog;
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
  const finalWidth = Math.max(messageWidth + 40, 400); 
  alertBox.style.width = `${finalWidth}px`;
}

// Shared back button handler
function attachBackButton(container, callback) {
  const backButton = container.querySelector('#commonback-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      container.remove();
      if (callback) callback();
      else if (typeof openPopup === 'function') openPopup();
    });
  }
}

// Generic search filter for lists
function setupSearchFilter(searchInputId, targetClassSuffix) {
  const searchInput = document.getElementById(searchInputId);
  if (!searchInput) return;
  
  searchInput.oninput = function() {
    const searchValue = this.value.toLowerCase().trim();
    
    // If empty search, show all
    if (!searchValue) {
      document.querySelectorAll(`.${targetClassSuffix}`).forEach(el => {
        el.style.display = 'block';
      });
      return;
    }
    
    // Split search into words for flexible matching
    const searchWords = searchValue.split(/\s+/).filter(word => word.length > 0);
    
    document.querySelectorAll(`.${targetClassSuffix}`).forEach(el => {
      const searchText = (el.dataset.searchText || el.textContent).toLowerCase();
      
      // Check if all search words are found in the text (in any order)
      const allWordsFound = searchWords.every(word => searchText.includes(word));
      
      el.style.display = allWordsFound ? 'block' : 'none';
    });
  };
}

// Sort array of entities by property
function sortByProperty(array, property) {
  if (!array || !Array.isArray(array)) return array;
  return array.sort((a, b) => {
    const valA = a[property] || "";
    const valB = b[property] || "";
    return valA.localeCompare(valB);
  });
}

/** 
 * @param {string} message 
 * @param {string} type 
 * @param {number} duration 
 */
function showToast(message, type, duration) {    
    type = type || 'success';
    duration = duration || 1500;
    
    // Remove existing toasts
    var existingToast = document.getElementById('adminplus-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Toast container
    var toast = document.createElement('div');
    toast.id = 'adminplus-toast';
    toast.className = 'adminplus-toast adminplus-toast-' + type;
    
    // Create icon based on type
    var icon = document.createElement('span');
    icon.className = 'adminplus-toast-icon';
    
    var iconMap = {
        'success': '✓',
        'info': 'ℹ',
        'warning': '⚠',
        'error': '✕'
    };
    icon.textContent = iconMap[type] || '✓';
    
    // Create message
    var messageSpan = document.createElement('span');
    messageSpan.className = 'adminplus-toast-message';
    messageSpan.textContent = message;
    
    // Assemble toast
    toast.appendChild(icon);
    toast.appendChild(messageSpan);
    
    // Add styles if not present
    if (!document.getElementById('adminplus-toast-styles')) {
        var style = document.createElement('style');
        style.id = 'adminplus-toast-styles';
        style.innerHTML = `
            .adminplus-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                font-size: 15px;
                width: fit-content;
                max-width: 500px;
                animation: adminplus-toast-in 0.3s ease-out;
            }            
            .adminplus-toast.adminplus-toast-out {
                animation: adminplus-toast-out 0.3s ease-in;
            }            
            .adminplus-toast-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                font-size: 16px;
                font-weight: bold;
                flex-shrink: 0;
            }            
            .adminplus-toast-message {
                color: #333;
                line-height: 1.4;
            }            
            /* Success */
            .adminplus-toast-success {
                border-left: 4px solid #10b981;
                border-right: 4px solid #10b981;
            }            
            .adminplus-toast-success .adminplus-toast-icon {
                background-color: #d1fae5;
                color: #10b981;
            }            
            /* Info */
            .adminplus-toast-info {
                border-left: 4px solid #3b82f6;
                border-right: 4px solid #3b82f6;
            }            
            .adminplus-toast-info .adminplus-toast-icon {
                background-color: #dbeafe;
                color: #3b82f6;
            }            
            /* Warning */
            .adminplus-toast-warning {
                border-left: 4px solid #f59e0b;
                border-right: 4px solid #f59e0b;
            }            
            .adminplus-toast-warning .adminplus-toast-icon {
                background-color: #fef3c7;
                color: #f59e0b;
            }            
            /* Error */
            .adminplus-toast-error {
                border-left: 4px solid #ef4444;
                border-right: 4px solid #ef4444;
            }            
            .adminplus-toast-error .adminplus-toast-icon {
                background-color: #fee2e2;
                color: #ef4444;
            }            
            /* Animations */
            @keyframes adminplus-toast-in {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }            
            @keyframes adminplus-toast-out {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }    
    document.body.appendChild(toast);    
    setTimeout(function() {
        toast.classList.add('adminplus-toast-out');
        setTimeout(function() {
            if (toast && toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// Export functions globally
window.isFormContext = isFormContext;
window.requireFormContext = requireFormContext;
window.makePopupMovable = makePopupMovable;
window.showLoadingDialog = showLoadingDialog;
window.hideLoadingDialog = hideLoadingDialog;
window.showToast = showToast;
