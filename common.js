function makePopupMovable(newContainer) {
	var pos1 = 0,	pos2 = 0, pos3 = 0, pos4 = 0;
	newContainer.onmousedown = function(e) {
		if (e.target.tagName.toLowerCase() === "input") {
			// If input element, return
			return;
		}
		dragMouseDown(e);
	};

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		newContainer.style.top = (newContainer.offsetTop - pos2) + "px";
		newContainer.style.left = (newContainer.offsetLeft - pos1) + "px";
	}

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
	}
}
