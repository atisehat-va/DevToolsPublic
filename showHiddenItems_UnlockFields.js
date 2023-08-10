function unlockAllFields() {
    closeIframe();
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && unlockAllFieldsBtnClickStatus) {
	showContent('alert', 'Unlock All Fields button has already been clicked!!');
        return;
    }
	var allControls = Xrm.Page.ui.controls.get();
	for (var i in allControls) {
		var control = allControls[i];
		if (control) {
			control.setDisabled(false);
		}
	}
    unlockAllFieldsBtnClickStatus = true;
    lastUpdatedFormId = currentFormId;
}

function showAllTabsAndSections() {
    closeIframe();
	debugger;
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && showAllTabsAndSectionsBtnClickStatus) {
	showContent('alert', 'Show (Tabs, Section & Fields) button has already been clicked!!1');
        //return;
    }
	Xrm.Page.ui.tabs.forEach(function(tab) {
		if (!tab.getVisible()) {
			tab.setVisible(true);			
		}
		tab.sections.forEach(function(section) {
			if (!section.getVisible()) {
				section.setVisible(true);
			}
			section.controls.forEach(function(control) {
				if (!control.getVisible()) {
					control.setVisible(true);
				}
			});
		});		
	});    
    showAllTabsAndSectionsBtnClickStatus = true;
    lastUpdatedFormId = currentFormId;
    
}
