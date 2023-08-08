function openUrl(environment, pageType) {  
    var crmUrl;
    var clientUrl = Xrm.Page.context.getClientUrl();
    var windowName;
    var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
    var timestamp = new Date().getTime();    
    switch (environment) {
        case 'dev':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "dev$2");            
            break;
        case 'int':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "int$2");            
            break;
        case 'qa':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "qa$2");
            break;
        case 'preprod':
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "preprod$2");
            break;
        default:
            return;
    }
    if (pageType === "advanceFind") {
        var advancedFindPath = '/main.aspx?pagetype=advancedfind';
        var advancedFindUrl = crmUrl + advancedFindPath;        
        windowName = "Advanced Find Classic " + timestamp;        
        window.open(advancedFindUrl, windowName, windowOptions);
        toggleDropdownMenu('dropdown-content-advanced-find');
    } else if (pageType === "userProvision") {
        var entityName = "vhacrm_userprovision";
        var formUrl = crmUrl + "/main.aspx?etn=" + entityName + "&pagetype=entityrecord"; 
        showContent(formUrl);
        //window.open(formUrl, "New " + entityName + " Record", "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,titlebar=no,toolbar=no");
        toggleDropdownMenu('dropdown-content');       
    }
}