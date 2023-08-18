function showDirtyFields() {
    var entity = Xrm.Page.data.entity;
    var attributes = entity.attributes.get();
    var dirtyFields = attributes.filter(function(attribute) {
        return attribute.getIsDirty();
    });

    var html = '<h2 style="text-align: center;"><strong>Dirty Fields</strong></h2>';

    if (dirtyFields.length > 0) {
        var fieldList = dirtyFields.map(function(attribute, index) {
            var logicalName = attribute.getName();
            var control = attribute.controls.get(0);
            var displayName = control ? control.getLabel() : logicalName;

            return '<div>' + (index + 1) + '. <strong>' + displayName + '</strong></div>' +
                   '<div style="margin-left: 40px;">&bull; <strong>Logical Name:</strong> ' + logicalName + '</div><br>';
        }).join('');

        html += '<div style="padding: 5px;">' + fieldList + '</div>';
    } else {
        html += '<div>No dirty fields found.</div>';
    }

    // Calling the showContent function with 'html' type
    showContent('html', html);
}
