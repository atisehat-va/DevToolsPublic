function updateOptionSetValues(control) {    
    var optionSetOptions = control.getOptions();        
    var updatedOptions = [];
    
    // Iterate through the existing options and prepare the updated options
    optionSetOptions.forEach(function(option) {
        if (option.text !== "") {
            updatedOptions.push({
                value: option.value,
                text: option.value.toString() + " (" + option.text + ")"
            });
        }
    });

    // Clear the existing options
    optionSetOptions.forEach(function(option) {
        control.removeOption(option.value);
    });

    // Add the updated options
    updatedOptions.forEach(function(option) {
        control.addOption(option, option.value);
    });
}

function renameControlAndUpdateOptionSet(control) {
    var attribute = control.getAttribute();
    if (attribute !== null) {
        var logicalName = attribute.getName();
        control.setLabel(logicalName);
        if (control.getControlType() === "optionset") {
            updateOptionSetValues(control);            
        }
    }
}
