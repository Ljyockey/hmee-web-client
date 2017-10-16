var dbUrl = 'https://hmee-api.herokuapp.com';

//creates accordion with data from mickeys GET request
function displayMickeyData(data) {
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
            <label for="park"><h4>Park:</h4></label>
            <p>${item.park_name}</p>
            <select name="park" title="park">
              <option value="none">Change Park</option>
							<option value="1">Disneyland</option>
              <option value="2">California Adventure</option>
              <option value="3">Downtown Disney</option>
            </select>
            <label for="land"><h4>Land:</h4></label>
            <p>${item.land_name}</p>
            <select name="land" title="land">
              <option value="${item.land_id}">${item.land_id}</option>
            </select> 
            <label for="attraction"><h4>Attraction:</h4></label>
            <p>${item.attraction_name}</p>
            <select name="attraction" title="attraction">
              <option value="${item.attraction_id}">${item.attraction_id}</option>
            </select>                        
						<h4>Description</h4>
						<p class="description">${item.description}</p>
						<input type="text" for="description" id="description" placeholder="edit description"><br>						
						<label for="hint"><h4>Hint</h4></label>
						<p class="hint">${item.hint}</p>
            <input type="text" for="hint" id="hint" placeholder="edit hint"><br>	
						<label for="photo-url"><h4>Photo URL</h4></label>
						<p class="photo-url">${item.photo_url}</p>
						<input type="text" for="photo-url" id="photo-url" placeholder="edit photo URL"><br>            			
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

function addSelected(parkId, n) {
  //this adds the "selected" attribute to the correct option
  //under park/land/attraction
  var selected = 'selected';
  if (parkId === n) {
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

//GET mickeys
function getMickeys(callback) {
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
      "description": $('input[name="description"]').val(),
      "hint": $('input[name="hint"]').val(),
      "photo_url": $('textarea[name="photo-url"]').val(),
      "park_id": $('select[name="park"]').value === 'none' ? null : parseInt($('select[name="park"]').val()),
      "land_id": $('select[name="land"]').value === 'none' ? null : parseInt($('select[name="land"]').val()),
      "attraction_id": $('select[name="attraction"]').value === 'none' ? null : parseInt($('select[name="attraction"]').val())
    };

    //adds new object to hospitalization collection
    $.ajax({
      url: (`${dbUrl}/mickeys`),
      type: 'POST',
      data: JSON.stringify(newEntry),
      success: function(data) {
        //update DOM with new item
        var newPost = {
          mickeys: [data.mickey]
        };
        return $('.js-hospitalizations').append(displayMickeyData(newPost));
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
  $('.js-form-attractions').html(oHtml);
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
  getMickeys(displayMickeyData);
  listenForParkChanges();
  listenForLandChanges();
  listenForHospitalization();
  whenSubmitButtonIsClicked();
});