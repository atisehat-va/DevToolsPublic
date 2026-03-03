// Command Checker
async function commandChecker() {
    try {        
        const urlParams = new URLSearchParams(window.location.search);
        const ribbonDebugEnabled = urlParams.get('ribbondebug') === 'true';        
        if (ribbonDebugEnabled) {
            if (typeof showToast === 'function') {
                showToast('Command Checker already enabled', 'info', 3000);
            }
            return;
        }        
        const currentUrl = window.location.href;
        const newUrl = currentUrl.includes('?') 
            ? currentUrl + '&ribbondebug=true' 
            : currentUrl + '?ribbondebug=true';        
        window.location.href = newUrl;        
    } catch (error) {
        console.error('Error enabling Command Checker:', error);
        if (typeof showToast === 'function') {
            showToast('Error enabling Command Checker', 'error');
        }
    }
}
