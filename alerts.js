function updateOptionSetValues(control) {
	var optionSetOptions = control.getOptions();
	optionSetOptions.forEach(function(option) {
		if (option.text !== "") {
			// Extract the original text by removing the value part if it exists
			var originalText = option.text.split("(").pop().split(")")[0];
			
			// Combine the value and the original text
			var newText = option.value.toString() + " (" + originalText + ")";
			
			// Update the option
			control.removeOption(option.value);
			control.addOption({
				value: option.value,
				text: newText
			}, option.value);
		}
	});
}
