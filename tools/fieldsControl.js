//Fields Control Tools
function isXrmPageAvailable() {
    return (typeof Xrm !== 'undefined' && 
            typeof Xrm.Page !== 'undefined' && 
            Xrm.Page !== null);
}
window.adminPlusLogicalNamesActive = window.adminPlusLogicalNamesActive || false;
window.adminPlusOriginalOptionSets = window.adminPlusOriginalOptionSets || {};

// Logical names and display names
function renameTabsSectionsFields() {
    // Check if form
    if (!requireFormContext()) {
        return;
    }
    
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.tabs) {
            return;
        }
        
        if (window.adminPlusLogicalNamesActive) {
            restoreDisplayNames();
            return;
        }
        
        window.adminPlusOriginalOptionSets = {};
        // Show logical names
        var tabs = Xrm.Page.ui.tabs;
        if (tabs && typeof tabs.forEach === 'function') {
            tabs.forEach(function(tab) {
                try {
                    if (tab && typeof tab.getName === 'function' && typeof tab.getLabel === 'function' && typeof tab.setLabel === 'function') {
                        var tabName = tab.getName();
                        var currentLabel = tab.getLabel();                        
                        // Append logical name 
                        if (currentLabel && currentLabel.indexOf(' (' + tabName + ')') === -1) {
                            tab.setLabel(currentLabel + ' (' + tabName + ')');
                        }
                        
                        if (tab.sections && typeof tab.sections.forEach === 'function') {
                            tab.sections.forEach(function(section) {
                                try {
                                    if (section && typeof section.getName === 'function' && typeof section.getLabel === 'function' && typeof section.setLabel === 'function') {
                                        var sectionName = section.getName();
                                        var currentSectionLabel = section.getLabel();                                        
                                        // Append logical name
                                        if (currentSectionLabel && currentSectionLabel.indexOf(' (' + sectionName + ')') === -1) {
                                            section.setLabel(currentSectionLabel + ' (' + sectionName + ')');
                                        }
                                        
                                        if (section.controls && typeof section.controls.forEach === 'function') {
                                            section.controls.forEach(function(control) {
                                                renameControlAndStore(control);
                                            });
                                        }
                                    }
                                } catch (e) {                                    
                                }
                            });
                        }
                    }
                } catch (e) {                    
                }
            });
        }
        
        // Header fields
        renameHeaderFields();
        
        // All other controls
        renameAllControls();
        
        // Form components
        processAndRenameFieldsInFormComponents();
        
        // Navigation items
        renameNavigationItems();
        
        // Mark as active
        window.adminPlusLogicalNamesActive = true;
        
        // Click listeners to all labels for copy
        addCopyListenersToLabels();        
        
        if (typeof showToast === 'function') {
            showToast('Logical names are now displayed', 'success');
        }
    } catch (e) {
        console.error("AdminPlus: Error showing logical names", e);
        if (typeof showToast === 'function') {
            showToast('Error displaying logical names', 'error');
        }
    }   
}
// Restore original display names
function restoreDisplayNames() {
    try {
        // Restore tabs and sections
        if (Xrm.Page.ui.tabs && typeof Xrm.Page.ui.tabs.forEach === 'function') {
            Xrm.Page.ui.tabs.forEach(function(tab) {
                try {
                    if (tab && typeof tab.getName === 'function' && typeof tab.getLabel === 'function' && typeof tab.setLabel === 'function') {
                        var tabName = tab.getName();
                        var currentLabel = tab.getLabel();                                                
                        if (currentLabel) {
                            var pattern = ' (' + tabName + ')';
                            if (currentLabel.indexOf(pattern) !== -1) {
                                var originalLabel = currentLabel.replace(pattern, '');
                                tab.setLabel(originalLabel);
                            }
                        }
                        
                        if (tab.sections && typeof tab.sections.forEach === 'function') {
                            tab.sections.forEach(function(section) {
                                try {
                                    if (section && typeof section.getName === 'function' && typeof section.getLabel === 'function' && typeof section.setLabel === 'function') {
                                        var sectionName = section.getName();
                                        var currentSectionLabel = section.getLabel();              
                                        if (currentSectionLabel) {
                                            var sectionPattern = ' (' + sectionName + ')';
                                            if (currentSectionLabel.indexOf(sectionPattern) !== -1) {
                                                var originalSectionLabel = currentSectionLabel.replace(sectionPattern, '');
                                                section.setLabel(originalSectionLabel);
                                            }
                                        }                                        
                                        if (section.controls && typeof section.controls.forEach === 'function') {
                                            section.controls.forEach(function(control) {
                                                restoreControl(control);
                                            });
                                        }
                                    }
                                } catch (e) {
                                    
                                }
                            });
                        }
                    }
                } catch (e) {
                    
                }
            });
        }
        
        // Restore all other controls
        if (Xrm.Page.ui.controls && typeof Xrm.Page.ui.controls.get === 'function') {
            var allControls = Xrm.Page.ui.controls.get();
            if (allControls && typeof allControls.forEach === 'function') {
                allControls.forEach(function(control) {
                    try {
                        if (!control || typeof control.getName !== 'function') {
                            return;
                        }                        
                        var controlName = control.getName();                                                
                        if (typeof control.getLabel === 'function' && typeof control.setLabel === 'function') {
                            var currentLabel = control.getLabel();
                            if (currentLabel) {
                                var pattern = ' (' + controlName + ')';
                                if (currentLabel.indexOf(pattern) !== -1) {
                                    var originalLabel = currentLabel.replace(pattern, '');
                                    control.setLabel(originalLabel);
                                }
                            }
                        }                        
                        //Attribute controls
                        if (typeof control.getAttribute === 'function') {
                            restoreControl(control);
                        }
                    } catch (e) {
                        
                    }
                });
            }
        }        
        // Restore navigation items 
        if (Xrm.Page.ui.navigation && Xrm.Page.ui.navigation.items && typeof Xrm.Page.ui.navigation.items.get === 'function') {
            var navItems = Xrm.Page.ui.navigation.items.get();
            if (navItems && typeof navItems.forEach === 'function') {
                navItems.forEach(function(navItem) {
                    try {
                        if (navItem && typeof navItem.getId === 'function' && typeof navItem.getLabel === 'function' && typeof navItem.setLabel === 'function') {
                            var navId = navItem.getId();
                            var currentLabel = navItem.getLabel();                         
                            if (currentLabel) {
                                var pattern = ' (' + navId + ')';
                                if (currentLabel.indexOf(pattern) !== -1) {
                                    var originalLabel = currentLabel.replace(pattern, '');
                                    navItem.setLabel(originalLabel);
                                }
                            }
                        }
                    } catch (e) {
                        
                    }
                });
            }
        }
        
        // Mark as inactive
        window.adminPlusLogicalNamesActive = false;
        
        // Clear option set storage
        window.adminPlusOriginalOptionSets = {};
        
        // Toast
        if (typeof showToast === 'function') {
            showToast('Logical names cleared', 'success');
        }
    } catch (e) {
        console.error("AdminPlus: Error restoring display names", e);
        if (typeof showToast === 'function') {
            showToast('Error restoring display names', 'error');
        }
    }
}
// Rename control
function renameControlAndStore(control) {
    try {
        if (!control || typeof control.getAttribute !== 'function') {
            return;
        }
        var attribute = control.getAttribute();
        if (attribute && typeof attribute.getName === 'function') {
            var logicalName = attribute.getName();                        
            if (typeof control.getLabel === 'function' && typeof control.setLabel === 'function') {
                var currentLabel = control.getLabel();
                
                if (currentLabel && currentLabel.indexOf(' (' + logicalName + ')') === -1) {
                    control.setLabel(currentLabel + ' (' + logicalName + ')');
                }
            }            
            // Optionsets
            if (typeof control.getControlType === 'function' && control.getControlType() === "optionset") {
                storeAndUpdateOptionSetValues(control, logicalName);
            }
        }
    } catch (e) {
       
    }
}

// Restore control
function restoreControl(control) {
    try {
        if (!control || typeof control.getAttribute !== 'function') {
            return;
        }
        var attribute = control.getAttribute();
        if (attribute && typeof attribute.getName === 'function') {
            var logicalName = attribute.getName();         
            if (typeof control.getLabel === 'function' && typeof control.setLabel === 'function') {
                var currentLabel = control.getLabel();
                if (currentLabel) {                    
                    var pattern = ' (' + logicalName + ')';
                    if (currentLabel.indexOf(pattern) !== -1) {
                        var originalLabel = currentLabel.replace(pattern, '');
                        control.setLabel(originalLabel);
                    }
                }
            }            
            // Restore optionsets
            if (typeof control.getControlType === 'function' && control.getControlType() === "optionset") {
                restoreOptionSetValues(control, logicalName);
            }
        }
    } catch (e) {
        
    }
}

// Click listeners to all labels for copy
function addCopyListenersToLabels() {
    try {        
        setTimeout(function() {            
            var labels = document.querySelectorAll('label, .ms-Label, [data-id*="header"], h2, .nav-title');
            labels.forEach(function(label) {
                if (!label.dataset.adminplusCopyable) {
                    label.dataset.adminplusCopyable = 'true';
                    label.style.cursor = 'pointer';
                    label.title = 'Click to copy logical name';
                    
                    label.addEventListener('click', function(e) {
                        // Prevent copying
                        var target = e.target;
                        if (target.tagName === 'BUTTON' || 
                            target.tagName === 'I' || 
                            target.classList.contains('ms-Button') ||
                            target.classList.contains('ms-Icon') ||
                            target.closest('button') ||
                            target.closest('.ms-Button')) {
                            return;
                        }                        
                        if (window.adminPlusLogicalNamesActive) {
                            // Get text
                            var clickedElement = e.target;
                            var fullText = '';                            
                            if (clickedElement === this) {
                                // Get only the direct text content, not nested elements
                                fullText = Array.from(this.childNodes)
                                    .filter(function(node) { return node.nodeType === Node.TEXT_NODE; })
                                    .map(function(node) { return node.textContent; })
                                    .join('');
                                
                                // If no direct text, fall back to full text content
                                if (!fullText.trim()) {
                                    fullText = this.textContent || this.innerText;
                                }
                            } else {
                                // Child element, get text
                                fullText = clickedElement.textContent || clickedElement.innerText;
                            }                            
                            // Only logical name
                            var logicalName = '';
                            var match = fullText.match(/\(([^)]+)\)/);
                            if (match && match[1]) {
                                logicalName = match[1].trim();
                            }                            
                            if (logicalName) {
                                copyToClipboard(logicalName);
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        }
                    });
                }
            });
        }, 500);
    } catch (e) {
        
    }
}
// Show effect
function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                if (typeof showToast === 'function') {
                    showToast('Copied ✓', 'success');
                }
            }).catch(function() {
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    } catch (e) {
        fallbackCopyToClipboard(text);
    }
}
// Fallback copy
function fallbackCopyToClipboard(text) {
    try {
        var textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (typeof showToast === 'function') {
            showToast('Copied ✓', 'success');
        }
    } catch (e) {        
        
    }
}
function renameHeaderFields() {    
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }
        if (typeof Xrm.Page.ui.controls.get === 'function') {
            var headerControls = Xrm.Page.ui.controls.get(function(control) {
                try {
                    if (control && typeof control.getControlType === 'function') {
                        var controlType = control.getControlType();
                        return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
                    }
                } catch (e) {
                    return false;
                }
                return false;
            });            
            if (headerControls && typeof headerControls.forEach === 'function') {
                headerControls.forEach(renameControlAndStore);
            }
        }
    } catch (e) {        
    }
}
// Helper function
function renameAllControls() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }

        if (typeof Xrm.Page.ui.controls.get === 'function') {
            var allControls = Xrm.Page.ui.controls.get();
            if (allControls && typeof allControls.forEach === 'function') {
                allControls.forEach(function(control) {
                    try {
                        if (!control || typeof control.getControlType !== 'function' || typeof control.getName !== 'function') {
                            return;
                        }

                        var controlType = control.getControlType();
                        var controlName = control.getName();
                        
                        if (typeof control.setLabel !== 'function' || typeof control.getLabel !== 'function') {
                            return;
                        }
                        
                        var currentLabel = control.getLabel();                        
                        // Subgrids
                        if (controlType === "subgrid") {
                            if (currentLabel && currentLabel.indexOf(' (' + controlName + ')') === -1) {
                                control.setLabel(currentLabel + ' (' + controlName + ')');
                            }
                        }
                        // Iframes
                        else if (controlType === "iframe") {
                            if (currentLabel && currentLabel.indexOf(' (' + controlName + ')') === -1) {
                                control.setLabel(currentLabel + ' (' + controlName + ')');
                            }
                        }
                        // Webresources
                        else if (controlType === "webresource") {
                            if (currentLabel && currentLabel.indexOf(' (' + controlName + ')') === -1) {
                                control.setLabel(currentLabel + ' (' + controlName + ')');
                            }
                        }
                        // Quick views
                        else if (controlType === "quickform") {
                            if (currentLabel && currentLabel.indexOf(' (' + controlName + ')') === -1) {
                                control.setLabel(currentLabel + ' (' + controlName + ')');
                            }
                        }
                        // Timers/timelines
                        else if (controlType === "timer") {
                            if (currentLabel && currentLabel.indexOf(' (' + controlName + ')') === -1) {
                                control.setLabel(currentLabel + ' (' + controlName + ')');
                            }
                        }
                        // Other custom controls
                        else if (controlType === "customcontrol" || controlType === "customsubgrid") {
                            if (currentLabel && currentLabel.indexOf(' (' + controlName + ')') === -1) {
                                control.setLabel(currentLabel + ' (' + controlName + ')');
                            }
                        }
                        // Standard controls
                        else if (controlType === "standard" || controlType === "optionset" || controlType === "lookup") {
                            renameControlAndStore(control);
                        }
                    } catch (e) {
                        
                    }
                });
            }
        }
    } catch (e) {
        
    }
}

// Helper function
function renameNavigationItems() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.navigation) {
            return;
        }
        if (Xrm.Page.ui.navigation && typeof Xrm.Page.ui.navigation.items !== 'undefined') {
            if (typeof Xrm.Page.ui.navigation.items.get === 'function') {
                var navItems = Xrm.Page.ui.navigation.items.get();
                if (navItems && typeof navItems.forEach === 'function') {
                    navItems.forEach(function(navItem) {
                        try {
                            if (navItem && typeof navItem.getId === 'function' && typeof navItem.getLabel === 'function' && typeof navItem.setLabel === 'function') {
                                var navId = navItem.getId();
                                var currentLabel = navItem.getLabel();                                
                                if (currentLabel && currentLabel.indexOf(' (' + navId + ')') === -1) {
                                    navItem.setLabel(currentLabel + ' (' + navId + ')');
                                }
                            }
                        } catch (e) {
                            
                        }
                    });
                }
            }
        }
    } catch (e) {
        
    }
}

// Store original option set values and update
function storeAndUpdateOptionSetValues(control, logicalName) {
    try {
        if (!control || typeof control.getOptions !== 'function') {
            return;
        }

        var optionSetOptions = control.getOptions();        
        if (optionSetOptions && typeof optionSetOptions.forEach === 'function') {            
            window.adminPlusOriginalOptionSets[logicalName] = [];
            optionSetOptions.forEach(function(option) {
                if (option) {
                    window.adminPlusOriginalOptionSets[logicalName].push({
                        value: option.value,
                        text: option.text
                    });
                }
            });            
            optionSetOptions.forEach(function(option) {
                try {
                    if (option && option.text !== "" && typeof control.removeOption === 'function' && typeof control.addOption === 'function') {
                        var originalText = option.text.split("(").pop().split(")")[0];
                        var newText = option.value.toString() + " (" + originalText + ")";
                        
                        control.removeOption(option.value);
                        control.addOption({
                            value: option.value,
                            text: newText
                        }, option.value);
                    }
                } catch (e) {                    
                }
            });
        }
    } catch (e) {
        
    }
}

// Restore original option set values
function restoreOptionSetValues(control, logicalName) {
    try {
        if (!control || typeof control.clearOptions !== 'function' || typeof control.addOption !== 'function') {
            return;
        }
        if (window.adminPlusOriginalOptionSets[logicalName]) {
            var originalOptions = window.adminPlusOriginalOptionSets[logicalName];                        
            control.clearOptions();            
            // Restore original options
            originalOptions.forEach(function(option) {
                try {
                    control.addOption({
                        value: option.value,
                        text: option.text
                    }, option.value);
                } catch (e) {
                    
                }
            });
        }
    } catch (e) {
        
    }
}

function processAndRenameFieldsInFormComponents() { 
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }

        if (typeof Xrm.Page.ui.controls.forEach === 'function') {
            Xrm.Page.ui.controls.forEach(function(control) {
                try {
                    if (!control || typeof control.getControlType !== 'function') {
                        return;
                    }
                    if (control.getControlType() === "formcomponent") {
                        var formComponentControlName = control.getName();
                        if (typeof Xrm.Page.ui.controls.get === 'function') {
                            var formComponentControl = Xrm.Page.ui.controls.get(formComponentControlName);                            
                            if (formComponentControl && formComponentControl.data && formComponentControl.data.entity && formComponentControl.data.entity.attributes) {
                                var formComponentData = formComponentControl.data.entity.attributes;                                
                                if (typeof formComponentData.forEach === 'function') {
                                    formComponentData.forEach(function(attribute) {
                                        try {
                                            var logicalName = attribute._attributeName;
                                            if (typeof formComponentControl.getControl === 'function') {
                                                var formComponentFieldControl = formComponentControl.getControl(logicalName);
                                                if (formComponentFieldControl) {                                                   
                                                    if (typeof formComponentFieldControl.getLabel === 'function' && typeof formComponentFieldControl.setLabel === 'function') {
                                                        var currentLabel = formComponentFieldControl.getLabel();
                                                        if (currentLabel && currentLabel.indexOf(' (' + logicalName + ')') === -1) {
                                                            formComponentFieldControl.setLabel(currentLabel + ' (' + logicalName + ')');
                                                        }
                                                    }                                                    
                                                    // Store and update option set values
                                                    if (typeof formComponentFieldControl.getControlType === 'function' &&
                                                        formComponentFieldControl.getControlType() === "optionset") {
                                                        storeAndUpdateOptionSetValues(formComponentFieldControl, logicalName);
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                                                                        
                                        }
                                    });
                                }
                                
                                // Rename tabs and sections in form component
                                if (formComponentControl.ui && formComponentControl.ui.tabs && typeof formComponentControl.ui.tabs.forEach === 'function') {
                                    formComponentControl.ui.tabs.forEach(function(tab) {
                                        try {
                                            if (tab && typeof tab.getName === 'function' && typeof tab.getLabel === 'function' && typeof tab.setLabel === 'function') {
                                                var tabLogicalName = tab.getName();
                                                var currentTabLabel = tab.getLabel();                                                
                                                if (currentTabLabel && currentTabLabel.indexOf(' (' + tabLogicalName + ')') === -1) {
                                                    tab.setLabel(currentTabLabel + ' (' + tabLogicalName + ')');
                                                }
                                            }                                            
                                            if (tab.sections && typeof tab.sections.forEach === 'function') {
                                                tab.sections.forEach(function(section) {
                                                    try {
                                                        if (section && typeof section.getName === 'function' && typeof section.getLabel === 'function' && typeof section.setLabel === 'function') {
                                                            var sectionLogicalName = section.getName();
                                                            var currentSectionLabel = section.getLabel();                                                                                                                        
                                                            if (currentSectionLabel && currentSectionLabel.indexOf(' (' + sectionLogicalName + ')') === -1) {
                                                                section.setLabel(currentSectionLabel + ' (' + sectionLogicalName + ')');
                                                            }
                                                        }
                                                    } catch (e) {
                                                        
                                                    }
                                                });
                                            }
                                        } catch (e) {
                                            
                                        }
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    
                }
            });
        }
    } catch (e) {
        
    }
}
// Unlock all fields
function unlockAllFields() {
    // Check if form
    if (!requireFormContext()) {
        return;
    }    
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }
        var unlockedCount = 0;        
        // Unlock all controls
        if (typeof Xrm.Page.ui.controls.get === 'function') {
            var allControls = Xrm.Page.ui.controls.get();
            if (allControls && typeof allControls.forEach === 'function') {
                allControls.forEach(function(control) {
                    try {
                        if (!control || typeof control.setDisabled !== 'function' || typeof control.getControlType !== 'function') {
                            return;
                        }
                        var controlType = control.getControlType();                        
                        // Unlock fields, lookups, and optionsets
                        if (controlType === "standard" || controlType === "lookup" || 
                            controlType === "optionset" || controlType === "multiselectoptionset" ||
                            controlType === "boolean") {
                            control.setDisabled(false);
                            unlockedCount++;
                        }
                    } catch (e) {
                        
                    }
                });
            }
        }
        
        // Unlock fields in form components
        unlockFieldsInFormComponents();        
        unlockAllAttributes();                
        unlockBusinessProcessFlowFields();        
        unlockSubgrids();        
        // Toast
        if (typeof showToast === 'function') {
            showToast('All fields have been unlocked', 'success');
        }
    } catch (e) {
        console.error("AdminPlus: Error unlocking fields", e);
        if (typeof showToast === 'function') {
            showToast('Error unlocking fields', 'error');
        }
    }
}

// Helper function to unlock all attributes
function unlockAllAttributes() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.data || !Xrm.Page.data.entity || !Xrm.Page.data.entity.attributes) {
            return;
        }
        if (typeof Xrm.Page.data.entity.attributes.get === 'function') {
            var allAttributes = Xrm.Page.data.entity.attributes.get();
            if (allAttributes && typeof allAttributes.forEach === 'function') {
                allAttributes.forEach(function(attribute) {
                    try {
                        if (!attribute) return;                        
                        if (typeof attribute.setSubmitMode === 'function') {
                            attribute.setSubmitMode("always");
                        }                                                
                        if (typeof attribute.setRequiredLevel === 'function' && typeof attribute.getRequiredLevel === 'function') {
                            var currentLevel = attribute.getRequiredLevel();
                            if (currentLevel === "required") {
                                attribute.setRequiredLevel("none");
                            }
                        }
                    } catch (e) {
                        
                    }
                });
            }
        }
    } catch (e) {
        
    }
}

function unlockBusinessProcessFlowFields() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.data) {
            return;
        }
        var bpfUnlockedCount = 0;                
        if (typeof Xrm.Page.data.process !== 'undefined' && Xrm.Page.data.process) {
            try {
                var activeProcess = Xrm.Page.data.process;                                
                if (typeof activeProcess.getActiveStage === 'function') {
                    var activeStage = activeProcess.getActiveStage();
                    if (activeStage && typeof activeStage.getSteps === 'function') {                        
                        var steps = activeStage.getSteps();
                        if (steps && typeof steps.forEach === 'function') {
                            steps.forEach(function(step) {
                                try {
                                    if (!step || typeof step.getAttribute !== 'function') {
                                        return;
                                    }
                                    var stepAttribute = step.getAttribute();
                                    if (stepAttribute) {                                        
                                        if (stepAttribute.controls && typeof stepAttribute.controls.get === 'function') {
                                            var controls = stepAttribute.controls.get();
                                            if (controls && typeof controls.forEach === 'function') {
                                                controls.forEach(function(control) {
                                                    try {
                                                        if (control && typeof control.setDisabled === 'function') {
                                                            control.setDisabled(false);
                                                            bpfUnlockedCount++;
                                                        }
                                                    } catch (e) {
                                                        
                                                    }
                                                });
                                            }
                                        }                                        
                                        if (typeof stepAttribute.setRequiredLevel === 'function') {
                                            try {
                                                stepAttribute.setRequiredLevel("none");
                                            } catch (e) {
                                               
                                            }
                                        }
                                    }
                                } catch (e) {
                                    
                                }
                            });
                        }
                    }
                }
            } catch (e) {

            }
        }        
        // Unlock header fields
        unlockHeaderAreaFields();        
    } catch (e) {
        
    }
}

// Helper function to unlock header fields
function unlockHeaderAreaFields() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }
        var headerUnlockedCount = 0;                
        if (typeof Xrm.Page.ui.controls.get === 'function') {
            var allControls = Xrm.Page.ui.controls.get();
            if (allControls && typeof allControls.forEach === 'function') {
                allControls.forEach(function(control) {
                    try {
                        if (!control || typeof control.getName !== 'function') {
                            return;
                        }                        
                        var controlName = control.getName();                                                
                        var attribute = null;
                        if (typeof control.getAttribute === 'function') {
                            attribute = control.getAttribute();
                        }                                                
                        var isHeaderField = (
                            controlName.indexOf("header_") === 0 ||
                            controlName.indexOf("statuscode") !== -1 ||
                            controlName.indexOf("statecode") !== -1 ||
                            controlName.indexOf("ownerid") !== -1 ||
                            controlName.indexOf("modifiedon") !== -1 ||
                            controlName.indexOf("createdon") !== -1 ||
                            controlName.indexOf("modifiedby") !== -1 ||
                            controlName.indexOf("createdby") !== -1
                        );                                                
                        var isInHeaderVisually = false;
                        try {
                            if (typeof control.getParent === 'function') {
                                var parent = control.getParent();
                                if (parent && typeof parent.getName === 'function') {
                                    var parentName = parent.getName();
                                    isInHeaderVisually = (parentName === "header" || parentName.indexOf("header") !== -1);
                                }
                            }
                        } catch (e) {
                            
                        }
                        
                        // Force unlock if it's header field
                        if ((isHeaderField || isInHeaderVisually) && typeof control.setDisabled === 'function') {
                            control.setDisabled(false);
                            headerUnlockedCount++;                            
                            if (attribute) {
                                if (typeof attribute.setRequiredLevel === 'function') {
                                    try {
                                        attribute.setRequiredLevel("none");
                                    } catch (e) {                                        
                                    }
                                }                                
                                if (typeof attribute.setSubmitMode === 'function') {
                                    try {
                                        attribute.setSubmitMode("always");
                                    } catch (e) {
                                       
                                    }
                                }
                            }
                        }
                    } catch (e) {                        
                    }
                });
            }
        }        
        // Try to unlock ALL controls
        try {
            if (Xrm.Page.data && Xrm.Page.data.entity && Xrm.Page.data.entity.attributes && 
                typeof Xrm.Page.data.entity.attributes.get === 'function') {
                var allAttributes = Xrm.Page.data.entity.attributes.get();
                if (allAttributes && typeof allAttributes.forEach === 'function') {
                    allAttributes.forEach(function(attr) {
                        try {
                            if (!attr || !attr.controls) return;

                            if (typeof attr.controls.get === 'function') {
                                var attrControls = attr.controls.get();
                                if (attrControls && typeof attrControls.forEach === 'function') {
                                    attrControls.forEach(function(ctrl) {
                                        try {
                                            if (ctrl && typeof ctrl.setDisabled === 'function' && typeof ctrl.getDisabled === 'function') {
                                                var wasDisabled = ctrl.getDisabled();
                                                if (wasDisabled) {
                                                    ctrl.setDisabled(false);
                                                    if (!ctrl.getDisabled()) {
                                                        headerUnlockedCount++;
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            
                                        }
                                    });
                                }
                            }
                        } catch (e) {
                            
                        }
                    });
                }
            }
        } catch (e) {
            
        }
    } catch (e) {
        
    }
}

// Helper function to unlock subgrids
function unlockSubgrids() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }
        if (typeof Xrm.Page.ui.controls.get === 'function') {
            var allControls = Xrm.Page.ui.controls.get();
            if (allControls && typeof allControls.forEach === 'function') {
                allControls.forEach(function(control) {
                    try {
                        if (control && typeof control.getControlType === 'function' && control.getControlType() === "subgrid") {
                            if (typeof control.getGrid === 'function') {
                                var gridContext = control.getGrid();                                
                            }
                        }
                    } catch (e) {                        
                    }
                });
            }
        }
    } catch (e) {        
    }
}

// Show all hidden tabs, sections
function showAllTabsAndSections() {
    // Check if form
    if (!requireFormContext()) {
        return;
    }    
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui) {
            return;
        }
        // Show all hidden tabs and sections
        if (Xrm.Page.ui.tabs && typeof Xrm.Page.ui.tabs.forEach === 'function') {
            Xrm.Page.ui.tabs.forEach(function(tab) {
                try {
                    if (tab && typeof tab.getVisible === 'function' && typeof tab.setVisible === 'function') {
                        if (!tab.getVisible()) {
                            tab.setVisible(true);
                        }                        
                        if (tab.sections && typeof tab.sections.forEach === 'function') {
                            tab.sections.forEach(function(section) {
                                try {
                                    if (section && typeof section.getVisible === 'function' && typeof section.setVisible === 'function') {
                                        if (!section.getVisible()) {
                                            section.setVisible(true);
                                        }                                        
                                        if (section.controls && typeof section.controls.forEach === 'function') {
                                            section.controls.forEach(function(control) {
                                                try {
                                                    if (control && typeof control.getVisible === 'function' && typeof control.setVisible === 'function') {
                                                        if (!control.getVisible()) {
                                                            control.setVisible(true);
                                                        }
                                                    }
                                                } catch (e) {
                                                    
                                                }
                                            });
                                        }
                                    }
                                } catch (e) {
                                    
                                }
                            });
                        }
                    }
                } catch (e) {
                    
                }
            });
        }

        // Show all hidden controls
        if (Xrm.Page.ui.controls && typeof Xrm.Page.ui.controls.get === 'function') {
            var allControls = Xrm.Page.ui.controls.get();
            if (allControls && typeof allControls.forEach === 'function') {
                allControls.forEach(function(control) {
                    try {
                        if (control && typeof control.getVisible === 'function' && typeof control.setVisible === 'function') {
                            if (!control.getVisible()) {
                                control.setVisible(true);
                            }
                        }
                    } catch (e) {
                        
                    }
                });
            }
        }

        // Show hidden controls in form components
        showHiddenControlsInFormComponents();

        // Show hidden navigation items
        showHiddenNavigationItems();
        
        // Show Toast
        if (typeof showToast === 'function') {
            showToast('Hidden items are now visible', 'success');
        }
    } catch (e) {
        console.error("AdminPlus: Error showing hidden elements", e);
        if (typeof showToast === 'function') {
            showToast('Error showing hidden items', 'error');
        }
    }
}

// Helper function to show hidden controls in form components
function showHiddenControlsInFormComponents() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }
        if (typeof Xrm.Page.ui.controls.forEach === 'function') {
            Xrm.Page.ui.controls.forEach(function(control) {
                try {
                    if (control && typeof control.getControlType === 'function' && control.getControlType() === "formcomponent") {
                        var formComponentControlName = control.getName();
                        if (typeof Xrm.Page.ui.controls.get === 'function') {
                            var formComponentControl = Xrm.Page.ui.controls.get(formComponentControlName);
                            
                            if (formComponentControl && formComponentControl.ui) {                                
                                if (formComponentControl.ui.tabs && typeof formComponentControl.ui.tabs.forEach === 'function') {
                                    formComponentControl.ui.tabs.forEach(function(tab) {
                                        try {
                                            if (tab && typeof tab.getVisible === 'function' && typeof tab.setVisible === 'function' && !tab.getVisible()) {
                                                tab.setVisible(true);
                                            }                                            
                                            if (tab.sections && typeof tab.sections.forEach === 'function') {
                                                tab.sections.forEach(function(section) {
                                                    try {
                                                        if (section && typeof section.getVisible === 'function' && typeof section.setVisible === 'function' && !section.getVisible()) {
                                                            section.setVisible(true);
                                                        }                                                                                                                
                                                        if (section.controls && typeof section.controls.forEach === 'function') {
                                                            section.controls.forEach(function(sectionControl) {
                                                                try {
                                                                    if (sectionControl && typeof sectionControl.getVisible === 'function' && typeof sectionControl.setVisible === 'function' && !sectionControl.getVisible()) {
                                                                        sectionControl.setVisible(true);
                                                                    }
                                                                } catch (e) {
                                                                    
                                                                }
                                                            });
                                                        }
                                                    } catch (e) {
                                                        
                                                    }
                                                });
                                            }
                                        } catch (e) {
                                            
                                        }
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    
                }
            });
        }
    } catch (e) {
        
    }
}

// Helper function to show hidden navigation items 
function showHiddenNavigationItems() {
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.navigation) {
            return;
        }
        if (Xrm.Page.ui.navigation && typeof Xrm.Page.ui.navigation.items !== 'undefined') {
            if (typeof Xrm.Page.ui.navigation.items.get === 'function') {
                var navItems = Xrm.Page.ui.navigation.items.get();
                if (navItems && typeof navItems.forEach === 'function') {
                    navItems.forEach(function(navItem) {
                        try {
                            if (navItem && typeof navItem.getVisible === 'function' && typeof navItem.setVisible === 'function') {
                                if (!navItem.getVisible()) {
                                    navItem.setVisible(true);
                                }
                            }
                        } catch (e) {
                            
                        }
                    });
                }
            }
        }
    } catch (e) {
        
    }
}

// Helper function to unlock fields in form components
function unlockFieldsInFormComponents() { 
    try {
        if (!isXrmPageAvailable() || !Xrm.Page.ui || !Xrm.Page.ui.controls) {
            return;
        }
        if (typeof Xrm.Page.ui.controls.forEach === 'function') {
            Xrm.Page.ui.controls.forEach(function(control) {
                try {
                    if (control && typeof control.getControlType === 'function' && control.getControlType() === "formcomponent") {
                        var formComponentControlName = control.getName();
                        if (typeof Xrm.Page.ui.controls.get === 'function') {
                            var formComponentControl = Xrm.Page.ui.controls.get(formComponentControlName);                            
                            if (formComponentControl && formComponentControl.data && formComponentControl.data.entity && formComponentControl.data.entity.attributes) {
                                var formComponentData = formComponentControl.data.entity.attributes;                                
                                if (typeof formComponentData.forEach === 'function') {
                                    formComponentData.forEach(function(attribute) {
                                        try {
                                            var logicalName = attribute._attributeName;
                                            if (typeof formComponentControl.getControl === 'function') {
                                                var formComponentFieldControl = formComponentControl.getControl(logicalName);
                                                if (formComponentFieldControl && typeof formComponentFieldControl.setDisabled === 'function') {
                                                    formComponentFieldControl.setDisabled(false);
                                                }
                                            }
                                        } catch (e) {
                                            
                                        }
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    
                }
            });
        }
    } catch (e) {
        
    }
}
