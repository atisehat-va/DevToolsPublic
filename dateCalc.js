function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.style.display = 'flex';
    newContainer.style.flexDirection = 'column';
    newContainer.innerHTML = `
         <div class="commonPopup-header">Copy User Security</div>
	  <button class="commonback-button" id="commonback-button">Back</button>
   
	  <div class="securityPopup-row">
	    <div class="calcDate-section-row1" id="section1">
	      <h3>Calendar Info</h3>			      			      
	    </div>     
	  </div> 
      	
	  <div class="securityPopup-row">
	    <div class="commonSection details-section-row" id="section2">
	      <h3>Calendar 1</h3>			      			      
	    </div>       
	    <div class="commonSection details-section-row" id="section3">
	      <h3>Calendar 2</h3>			      			      
	    </div>
	  </div>  	  

	  <div class="submit-button-container">
	    <button id="submitButton">Submit</button>
	  </div>
    `;	
    document.body.appendChild(newContainer);
    document.getElementById('commonback-button').addEventListener('click', function() {
        newContainer.remove();
        openPopup();  
    });
    makePopupMovable(newContainer);
}
