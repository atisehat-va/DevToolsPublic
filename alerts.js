function updateOptionSetValues(control) {
    var optionSetOptions = control.getOptions();
    var updatedOptions = [];

    // Create the updated options array without modifying the original options
    optionSetOptions.forEach(function(option) {
        if (option.text.indexOf("(") === -1) { // Check if the text has not been updated before
            updatedOptions.push({
                value: option.value,
                text: option.value.toString() + " (" + option.text + ")"
            });
        } else {
            updatedOptions.push(option); // Keep the option as is if it was already updated
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
