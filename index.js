var dbUrl = 'https://hmee-api.herokuapp.com';

//creates accordion with data from mickeys GET request
function displayMickeyData(data) {
  var mDisplay = '';
  var id;
  data.mickeys.forEach(function(item) {
    id = item.id;
    //turns boolean from item.conscious into yes/no string
    mDisplay += (
      `<h3 class="js-accordion__header">${id}: ${item.land_name} - ${item.attraction_name}</h3>
			<div class="js-accordion__panel content" id="${id}" data-id="${id}">
				<form>
          <div class="js-mickeys">
            <label for="park"><h4 class="mickey-display-inline">Park:</h4></label>
            <p class="park mickey-display-inline">${item.park_name}</p>
            <select name="park" title="park">
              <option value="none">Change Park</option>
							<option value="1">Disneyland</option>
              <option value="2">California Adventure</option>
              <option value="3">Downtown Disney</option>
            </select><br>
            <label for="land"><h4 class="mickey-display-inline">Land:</h4></label>
            <p class="land mickey-display-inline">${item.land_name}</p>
            <select name="land" title="land">
              <option value="none">Change Land</option>
            </select><br> 
            <label for="attraction"><h4 class="mickey-display-inline">Attraction:</h4></label>
            <p class="attraction mickey-display-inline">${item.attraction_name}</p>
            <select name="attraction" title="attraction">
              <option value="none">Change Attraction</option>
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
          <img src="${item.photo_url}" alt="photo of Mickey ${item.id}">
				</form>
				</div>`);
  });
  //adds accordion on initial page load
  if ($('.h-container').is(':empty')) {
    $('.h-container').html(mDisplay);
    $('#accordion').accordion({collapsible: true, active: 'none', heightStyle: 'content'});
  }
  //refreshes accordion if page if one is already there
  else {
    $('.h-container').append(mDisplay);
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
function listenForMickey() {
  $('form').submit(function(e) {
    e.preventDefault();

    //create new object to push to array
    var newEntry = {
      'description': $('input[name="description"]').val(),
      'hint': $('input[name="hint"]').val(),
      'photo_url': $('textarea[name="photo-url"]').val(),
      'park_id': $('select[name="park"]').value === 'none' ? null : parseInt($('select[name="park"]').val()),
      'land_id': $('select[name="land"]').value === 'none' ? null : parseInt($('select[name="land"]').val()),
      'attraction_id': $('select[name="attraction"]').value === 'none' ? null : parseInt($('select[name="attraction"]').val())
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
        return $('.js-mickeys').append(displayMickeyData(newPost));
      },
      dataType: 'json',
      contentType: 'application/json'
    });

  });
}

function freshParkOptions() {
  return `<option value="none">Change Park</option>
          <option value="1">Disneyland</option>
          <option value="2">California Adventure</option>
          <option value="3">Downtown Disney</option>`;
}

function freshLandOrAttractionOption(type) {
  var t = type === 'land' ? 'Land' : 'Attraction';
  return `<option value="none">Change ${t}</option>`;
}

//makes objects for PUT requests
function whenSubmitButtonIsClicked() {
  $('.h-container').on('click', '.edit', function(e) {
    e.preventDefault();
    var conscious;
    var consciousField;
    var form = $(this).parents('form');
    var park = form.children('.js-mickeys').find('select[name="park"]').val();
    var land = form.children('.js-mickeys').find('select[name="land"]').val();
    var attraction = form.children('.js-mickeys').find('select[name="attraction"]').val();
    var objectForMickey = {
      description: form.children('.js-mickeys').find('input#description').val(),
      hint: form.children('.js-mickeys').find('input#hint').val(),
      photo_url: form.children('.js-mickeys').find('input#photo-url').val(),
      park_id: park === 'none' ? park : parseInt(park),
      land_id: land === 'none' ? land : parseInt(land),
      attraction_id: attraction === 'none' ? attraction : parseInt(attraction)
    };
    updateMickey(objectForMickey, form.parents('div').attr('data-id'));

    //return everything to unedited state
    form.children('.js-mickeys').find('select[name="park"]').html(freshParkOptions());
    form.children('.js-mickeys').find('select[name="land"]').html(freshLandOrAttractionOption('land'));
    form.children('.js-mickeys').find('select[name="attraction"]').html(freshLandOrAttractionOption('attraction'));
    form.children('.js-mickeys').find('input#description').val('');
    form.children('.js-mickeys').find('input#hint').val('');
    form.children('.js-mickeys').find('input#photo-url').val('');
		
  });
}

function updateMickey(object, id) {
  var toUpdate = {};
  for (var item in object) {
    if (object[item] !== 'none' && object[item] !== '') {
      toUpdate[item] = object[item];
    }
  }
  if (Object.keys(toUpdate).length > 0) {
    //updates DOM with new data
    mUpdateDom(toUpdate);

    $.ajax({
      url: `${dbUrl}/mickeys/${id}`,
      method: 'PUT',
      data: JSON.stringify(toUpdate),
    	dataType: 'json', 
    	contentType: 'application/json'
    });
  }
}

//only run if a PUT request is being made
//TODO: Add park, land and attraction names
function mUpdateDom(object) {
  var target = $(`#${object.id}`).children('form');
  if (object.description) {
    target.children('.description').text(object.description);
    target.children('input').val('');
  }
  if (object.hint) {
    target.children('.hint').text(object.hint);
    target.children('input').val('');
  }
  if (object.photo_url) {
    target.children('.photo-url').text(object.photo_url);
    target.children('img').attr('src', object.photo_url);
    target.children('input').val('');
  }
}

function getAttractionsByLandForForm(landId, element) {
  var query = {
    url: `${dbUrl}/lands/${landId}/attractions`,
    type: 'GET',
    success: function(data) {
      var oHtml = '<option value="none">None</option>';
      data.attractions.forEach(function(attraction) {
        oHtml += `<option value="${attraction.id}">${attraction.name}</option>`;
      });
      element.html(oHtml);
    }
  };
  $.ajax(query);
}

function listenForLandChanges() {
  $('.js-form-lands').change(function() {
    getAttractionsByLandForForm(this.value, $('.js-form-attractions'));
  });
}

function getLandsByParkForForm(parkId, element) {
  var query = {
    url: `${dbUrl}/parks/${parkId}/lands`,
    type: 'GET',
    success: function(data) {
      var oHtml = '<option value="none">None</option>';
      $('.js-form-attractions').html(oHtml);
      data.lands.forEach(function(land) {
        oHtml += `<option value="${land.id}">${land.name}</option>`;
      });
      element.html(oHtml);
    }
  };
  $.ajax(query);
}

function listenForParkChanges() {
  $('.js-form-park').change(function() {
    getLandsByParkForForm(this.value, $('.js-form-lands'));
  });
}

function putRequestParkChangeListener() {
  $('.h-container').on('change', 'select[name="park"]', function() {
    getLandsByParkForForm(this.value, $(this).siblings('select[name="land"]'));
  });
}

function putRequestLandChangeListener() {
  $('.h-container').on('change', 'select[name="land"]', function() {
    getAttractionsByLandForForm(this.value, $(this).siblings('select[name="attraction"]'));
  });
}



$(function() {
  getMickeys(displayMickeyData);
  listenForParkChanges();
  listenForLandChanges();
  putRequestParkChangeListener();
  putRequestLandChangeListener();
  listenForMickey();
  whenSubmitButtonIsClicked();
});