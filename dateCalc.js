function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.style.display = 'flex';
    newContainer.style.flexDirection = 'column';
    newContainer.innerHTML = `
         <div class="commonPopup-header">Copy User Security</div>
	    		  <button class="commonback-button" id="commonback-button">Back</button>		  
			  <div class="securityPopup-row">
			    <div class="commonSection details-section-row" id="section1">
			      <h3>calendar</h3>			      			      
			    </div>       
			    <div class="commonSection details-section-row" id="section2">
			      <h3>Calculation Settings</h3>			      			      
			    </div>
			  </div>
     
			  <div id="sectionsRow1" class="securityPopup-row">
			    <div class="commonSection details-section-row" id="section3">
			      <h3>Business Unit & Teams</h3>			      
			    </div>       
			    <div class="commonSection details-section-row" id="section5">
			      <h3>Business Unit & Teams2</h3>			      
			    </div>
			  </div>
     
			  <div id="sectionsRow2" class="securityPopup-row">
			    <div class="commonSection details-section-row" id="section4">
			      <h3>Security Roles</h3>			      
			    </div>
			    <div class="commonSection details-section-row" id="section6">
			      <h3>Security Roles2</h3>			      
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
