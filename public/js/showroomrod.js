$(document).ready(function() {
	// ----------------------- Carlist Dynamic Filter for sell page ----------------------- //
	var carSelected = [];
	$.getJSON('carlist.json').done(function (data) {
		$.each(data, function(index,val) {
			carSelected[index]=val;
		});
		console.log(carSelected);
	});

	$('#make').change(function(event) {
		$select = $(this).val();
		$htmlOption='<option value="0">--- เลือกรุ่นรถ ---</option>';
		if($select != 0) {
			$.each(carSelected[$select], function(key,value) {
				$htmlOption += '<option value="' + value[0] + '">' + value[1] + '</option>';
			});
		}
		$('#model').html($htmlOption)
	});

	// ----------------------- Citylist Dynamic Filter for sell page ----------------------- //
	var citySelected = [];
	$.getJSON('citylist.json').done(function (data) {
		$.each(data, function(index,val) {
			citySelected[index]=val;
		});
		console.log(citySelected);
	});

	$('#locationProvince').change(function(event) {
		$select = $(this).val();
		$htmlOption='<option value="0">--- เลือกอำเภอ/เขต ---</option>';
		if($select != 0) {
			$.each(citySelected[$select], function(key,value) {
				$htmlOption += '<option value="' + value[0] + '">' + value[1] + '</option>';
			});
		}
		$('#locationDistrict').html($htmlOption)
	});
	
	// ----------------------- Button Filter for search bar of buy page----------------------- //
	$(".filter-button").click(function(){
		$(".side-search-menu").toggle()
	});

	// ----------------------- Fileupload custom----------------------- //
	// enable fileuploader plugin
	$('input[name="files"]').fileuploader({
		limit: 9,
		//maxSize: 9,
		//fileMaxSize: 1,
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
		changeInput: ' ',
		theme: 'thumbnails',
        enableApi: true,
		addMore: true,
		thumbnails: {
			box: '<div class="fileuploader-items">' +
                      '<ul class="fileuploader-items-list">' +
					      '<li class="fileuploader-thumbnails-input"><div class="fileuploader-thumbnails-input-inner">+</div></li>' +
                      '</ul>' +
                  '</div>',
			item: '<li class="fileuploader-item">' +
				       '<div class="fileuploader-item-inner">' +
                           '<div class="thumbnail-holder">${image}</div>' +
                           '<div class="actions-holder">' +
						   	   '<a class="fileuploader-action fileuploader-action-remove" title="${captions.remove}"><i class="remove"></i></a>' +
							   '<span class="fileuploader-action-popup"></span>' +
                           '</div>' +
                       	   '<div class="progress-holder">${progressBar}</div>' +
                       '</div>' +
                   '</li>',
			item2: '<li class="fileuploader-item">' +
				       '<div class="fileuploader-item-inner">' +
                           '<div class="thumbnail-holder">${image}</div>' +
                           '<div class="actions-holder">' +
                               '<a class="fileuploader-action fileuploader-action-remove" title="${captions.remove}"><i class="remove"></i></a>' +
							   '<span class="fileuploader-action-popup"></span>' +
                           '</div>' +
                       '</div>' +
                   '</li>',
			startImageRenderer: true,
			canvasImage: false,
			_selectors: {
				list: '.fileuploader-items-list',
				item: '.fileuploader-item',
				start: '.fileuploader-action-start',
				retry: '.fileuploader-action-retry',
				remove: '.fileuploader-action-remove'
			},
			onItemShow: function(item, listEl) {
				var plusInput = listEl.find('.fileuploader-thumbnails-input');
				
				plusInput.insertAfter(item.html);
				
				if(item.format == 'image') {
					item.html.find('.fileuploader-item-icon').hide();
				}
			}
		},
		afterRender: function(listEl, parentEl, newInputEl, inputEl) {
			var plusInput = listEl.find('.fileuploader-thumbnails-input'),
				api = $.fileuploader.getInstance(inputEl.get(0));
		
			plusInput.on('click', function() {
				api.open();
			});
		},
    });
});
