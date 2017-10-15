var dbUrl = 'https://hmee-api.herokuapp.com';

//creates accordion with data from hospitalizations GET request
function displayHospitalizationData(data) {
  var hDisplay = '';
  var id;
  data.mickeys.forEach(function(item) {
    id = item.id;
    //turns boolean from item.conscious into yes/no string
    var conscious = checkIfConscious(item);
    hDisplay += (
      `<h3 class="js-accordion__header">${item.land_id}</h3>
			<div class="js-accordion__panel content" id="${id}" data-id="${item.id}">
				<form>
					<div class="js-hospitalizations">
						<h4>Description</h4>
						<p class="description">${item.description}</p>
						<input type="text" for="description" id="description" placeholder="edit description"><br>						
						<label for="hint"><h4>Hint</h4></label>
						<p class="hint">${item.hint}</p>
						<input type="text" for="hint" id="hint" placeholder="edit hint"><br>				
						<label for="conscious"><h4>Conscious?</h4></label>
						<select name="conscious" title="conscious">
							<option value="yes" ${addSelected(item.conscious, true)}>yes</option>
							<option value="no" ${addSelected(item.conscious, false)}>no</option>
						</select>
						<p class="conscious" aria-hidden="true">${conscious}</p>
					</div>
					${createSubmitButton(item.id)}
				</form>
				</div>`);
  });
  //adds accordion on initial page load
  if ($('.h-container').is(':empty')) {
    $('.h-container').html(hDisplay);
    $('#accordion').accordion({collapsible: true, active: 'none', heightStyle: 'content'});
  }
  //refreshes accordion if page if one is already there
  else {
    $('.h-container').append(hDisplay);
    $('.h-container').accordion('refresh');
  }
}

function addSelected(c, bool) {
  //this adds the "selected" attribute to the correct option
  //under conscious
  var selected = 'selected';
  if (c === bool) {
    return selected;
  }
}

function checkIfConscious(item) {
  var conscious;
  if (item.conscious) {
    conscious = 'yes';
  } else {
    conscious = 'no';
  }
  return conscious;
}

//GET hopitalizations
function getHospitalizations(callback) {
  var query = {
    url: `${dbUrl}/mickeys`,
    type: 'GET',
    success: callback
  };
  $.ajax(query);
}

//this is being done as a function, since "patient" is presented in different forms in different
//areas that the function gets called
function createSubmitButton(i) {
  return `<button class="edit mdl-button mdl-js-button mdl-button--raised" type="submit">Submit all changes<span class="visuallyhidden"> for ${i}</span></button>`;
}

//pushes the new data to the hospitalization collection
//then adds that document to the hospitalization accordion
function listenForHospitalization() {
  $('form').submit(function(e) {
    e.preventDefault();

    //create new object to push to array
    var newEntry = {
      "patient": $('input[name="patient"]').val(),
      "condition": $('input[name="condition"]').val(),
      "latestUpdate": $('input[name="status"]').val()
    };
    if ($('input[name="conscious"]:checked').val() === 'yes') {
      newEntry.conscious = true;
    } else {
      newEntry.conscious = false;
    }

    //adds new object to hospitalization collection
    $.ajax({
      url: ('/hospitalizations'),
      type: 'POST',
      data: JSON.stringify(newEntry),
      success: function(data) {
        //update DOM with new item
        var newPost = {
          hospitalizations: [data]
        };
        return $('.js-hospitalizations').append(displayHospitalizationData(newPost));
      },
      dataType: 'json',
      contentType: 'application/json'
    });

  });
}

//makes objects for PUT requests
function whenSubmitButtonIsClicked() {
  $('.h-container').on('click', '.edit', function(e) {
    e.preventDefault();
    var conscious;
    var consciousField;
    var form = $(this).parents('form');
    var objectForHospitalizations = {
      id: form.parents('div').attr('data-id'),
      latestUpdate: form.children('.js-hospitalizations').find('input#status').val(),
      conscious: undefined
    };
    consciousField = form.children('.js-hospitalizations').find('select[name=conscious]').val();
    conscious = form.children('.js-hospitalizations').find('.conscious').text();
    //only adds conscious to object if user changed answer
    if (consciousField !== conscious) {
      consciousField = (consciousField === 'yes') ? true : false;
      objectForHospitalizations.conscious = consciousField;
    }
    updateHospitalization(objectForHospitalizations);
		
  });
}

function updateHospitalization(object) {
  var toUpdate = {};
  for (var item in object) {
    if (object[item] !== undefined && object[item] !== '') {
      toUpdate[item] = object[item];
    }
  }
  if (Object.keys(toUpdate).length > 1) {
    //updates DOM with new data
    hUpdateDom(toUpdate);

    $.ajax({
      url: `hospitalizations/${toUpdate.id}`,
      method: 'PUT',
      data: JSON.stringify(toUpdate),
    		dataType: 'json', 
    		contentType: 'application/json'
    });
  }
}

//only run if a PUT request is being made
function hUpdateDom(object) {
  var target = $(`#${object.id}`).children('form');
  if (object.latestUpdate) {
    target.children('.status').text(object.latestUpdate);
    target.children('input').val('');
  }
  if ('conscious' in object) {
    var conscious = checkIfConscious(object);
    target.children('.conscious').text(conscious);
  }
}

function displayAttractionOptions(data) {
	var oHtml = '<option value="none">None</option>';
	data.attractions.forEach(function(attraction) {
		oHtml += `<option value="${attraction.id}">${attraction.name}</option>`;
	});
	$('.js-form-attractions').html(oHtml);
}

function getAttractionsByLandForForm(landId, callback) {
  var query = {
    url: `${dbUrl}/lands/${landId}/attractions`,
    type: 'GET',
    success: callback
  };
  $.ajax(query);
}

function listenForLandChanges() {
	$('.js-form-lands').change(function() {
		getAttractionsByLandForForm(this.value, displayAttractionOptions);
	});
}

function displayLandOptions(data) {
	var oHtml = '<option value="none">None</option>';
	data.lands.forEach(function(land) {
		oHtml += `<option value="${land.id}">${land.name}</option>`;
	});
	$('.js-form-lands').html(oHtml);
}

function getLandsByParkForForm(parkId, callback) {
  var query = {
    url: `${dbUrl}/parks/${parkId}/lands`,
    type: 'GET',
    success: callback
  };
  $.ajax(query);
}

function listenForParkChanges() {
	$('.js-form-park').change(function() {
		getLandsByParkForForm(this.value, displayLandOptions);
	});
}



$(function() {
  getHospitalizations(displayHospitalizationData);
  listenForParkChanges();
  listenForLandChanges();
  listenForHospitalization();
  whenSubmitButtonIsClicked();
});