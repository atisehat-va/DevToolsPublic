function openUrl(pageType) {
    let clientUrl = Xrm.Page.context.getClientUrl();
    if (pageType === "advanceFind") {       
        const timestamp = new Date().getTime();
        const windowName = "Advanced Find Classic " + timestamp;
        const advancedFindPath = '/main.aspx?pagetype=advancedfind';
        const advancedFindUrl = clientUrl + advancedFindPath;
        const windowOptions = "height=650,width=950,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
        window.open(advancedFindUrl, windowName, windowOptions);        
    }
}
