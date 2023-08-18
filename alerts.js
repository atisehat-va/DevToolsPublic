function updateOptionSetValues(control) {
	var optionSetOptions = control.getOptions();
	optionSetOptions.forEach(function(option) {
		if (option.text !== "") {
			var newText = option.value.toString() + " (" + option.text + ")";
			control.removeOption(option.value);
			control.addOption({
				value: option.value,
				text: newText
			}, option.value);
		}
	});
}
