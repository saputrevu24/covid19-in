(function ($) {

	$.fn.choropleth_map = function(data, metadata){

		return this.each(function() {

      var $el = jQuery( this );

			var map, gjLayerDist, gjLayerStates;

      // CREATE ELEMENTS ON THE FLY
      function createElements(){

        var $loader = jQuery( document.createElement( 'div' ) );
        $loader.addClass('spinner-grow');
				$loader.attr('role', 'status');
        $loader.html( '<span class="sr-only">Loading...</span>' );
        $loader.appendTo( $el );

        var $map = jQuery( document.createElement( 'div' ) );
        $map.attr('id', 'map');
        $map.appendTo( $el );

				var $legend = jQuery( document.createElement( 'div' ) );
        //$legend.attr('id', 'legend');
				$legend.html('<h5>Map Key:</h5><p><span class="key-item" style="background-color:#feebe2"></span> No cases reported</p><p><span class="key-item" style="background-color:#fbb4b9"></span> Less than 5 cases</p><p><span class="key-item" style="background-color:#f768a1"></span> Between 5 and 10 cases</p><p><span class="key-item" style="background-color:#c51b8a"></span> Between 10 and 15</p><p><span class="key-item" style="background-color:#7a0177"></span> More than 15</p>');
        $legend.appendTo('#legend');

				$("#timestamp").empty().append(metadata[0]["Value"]);

				//NATIONAL LEVEL TOTALS
				var totals = [0,0,0,0]
				for (var i = 0; i < data.length; i++){
					totals[0] = totals[0] + Number(data[i]["Confirmed Cases"]);
					totals[1] = totals[1] + Number(data[i]["Discharged"]);
					totals[2] = totals[2] + Number(data[i]["Deaths"]);
					totals[3] = totals[3] + Number(data[i]["Active"]);
				}
				$('#tot_conf').empty().append(totals[0]);
				$('#tot_disch').empty().append(totals[1]);
				$('#tot_death').empty().append(totals[2]);
				$('#tot_act').empty().append(totals[3]);

				//MODAL INFO
				$('#abt-modal').click( function () {
					$("#infoModalLabel").empty().append("About this Map");
					$(".modal-body").empty().append('<p>This map is an attempt at tracking CoVid-19 cases in India at the district level. The source of this data is news reports, and the official <a href="http://www.mohfw.gov.in/" target="_blank">numbers from MoHFW</a> are used as a reference. The <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vRlSCAn1nS4h9n9Fp25iuOsH54RfMUjj3xX5CZqjGUqYCVXgwgtJojuqVeqekazs2TkSJ95Jwplo7lL/pubhtml#" target="_blank">data is compiled here</a>.</p><p>The map uses official district boundaries from the ArcGIS REST Services provided by the National Informatics Centre, <a href="https://webgis1.nic.in/publishing/rest/services/bharatmaps" target="_blank">hosted here</a>.</p>');
				});
				$('#ct-modal').click( function () {
					$("#infoModalLabel").empty().append("Contribute to this Map");
					$(".modal-body").empty().append('<p>If you are familiar with Leaflet and jQuery, check out the <a href="https://github.com/guneetnarula/covid19-in" target="_blank">git repo</a> and contribute</p><p>If you are a journalist or someone carefully tracking news, you can help maintain the data. See the <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vRlSCAn1nS4h9n9Fp25iuOsH54RfMUjj3xX5CZqjGUqYCVXgwgtJojuqVeqekazs2TkSJ95Jwplo7lL/pubhtml#" target="_blank"">readme sheet here</a>.</p>');
				});
				$('#st-modal').click( function () {
					$("#infoModalLabel").empty().append("State Level Data");
					$(".modal-body").empty().append(stateData());
				});
      }



      function drawMap(){
				//console.log(data);

        // HIDE THE LOADER
        $el.find('.spinner-grow').hide();

				//SETUP BASEMAP
				map = L.map('map').setView( [22.27, 80.37], 5 );

        //var hybUrl='https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ3VuZWV0bmFydWxhIiwiYSI6IldYQUNyd0UifQ.EtQC56soqWJ-KBQqHwcpuw';
        var hybUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        var hybAttrib = 'Map data © <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors & <a href="http://datameet.org" target="_blank">Data{Meet}</a>';
        var hyb = new L.TileLayer(hybUrl, {minZoom: 3, maxZoom: 12, attribution: hybAttrib, opacity:1}).addTo(map);

        //---------------ADD DISTRICT BOUNDARIES

			  //var gjLayerDist = L.geoJson( geodist, { style: styledist, onEachFeature: onEachDist } );
        //gjLayerDist.addTo(map);
				gjLayerDist = L.esri.featureLayer({
					url:"https://webgis1.nic.in/publishing/rest/services/bharatmaps/admin2019/MapServer/7",
					useCors: false,
					simplifyFactor: 0.1,
					style: styledist,
					onEachFeature: onEachDist
				}).addTo(map);
				gjLayerDist.bringToFront();

        //---------------ADD STATE BOUNDARIES

        //var gjLayerStates = L.geoJson( geoStates, { style: statelines } );
        //gjLayerStates.addTo(map);

				//gjLayerStates = L.esri.featureLayer({
        	//url: "https://webgis1.nic.in/publishing/rest/services/bharatmaps/admin2019/MapServer/6",
					//useCors: false,
					//simplifyFactor: 0.1,
					//style: stylestate
      	//}).addTo(map);
				//gjLayerStates.bringToBack();
      }
			//END OF drawMap



			function popContent( feature ) {
        //FOR DISTRICT POP UPS ON CLICK
				for(var i = 0; i < data.length; i++) {
					if (data[i]["District"] == feature.properties["dtname"]) {
        		return '<h4>'+feature.properties["dtname"]+', '+feature.properties["stname"]+'</h4><hr><p>Confirmed Cases: <b>'+data[i]["Confirmed Cases"]+'</b> out of '+counter("State",feature) +' in the state</p><p>Discharged/Recovered: '+data[i]["Discharged"]+'</p><p>Deaths: '+data[i]["Deaths"]+'</p><p>Active Cases: '+data[i]["Active"]+'</p><hr><small>'+data[i]["Notes"]+'</small>';
					}
					else if ( i == data.length-1) return '<h4>'+feature.properties["dtname"]+', '+feature.properties["stname"]+'</h4><hr><p>No cases reported</p>';

				}
      }
			//-----------------------------

			function stylestate( feature ) {
        //STATE STYLES - CURRENTLY NOT USING THIS

				//var c_count = counter("State", feature);
				return {
					fillColor: false,
          weight: 1,
          opacity: 1,
          color: 'black',
          fillOpacity: 0
        };
      }

			function styledist( feature ) {
        //DISTRICTS STYLES - CHOROPLETH COLORS BASED ON RANGE ONLY
        var color = "#feebe2";

				var c_count = counter("District", feature);

				if (c_count > 15) color = "#7a0177";
				else if (c_count > 10 && c_count <= 15 ) color = "#c51b8a";
				else if (c_count > 5 && c_count <= 10) color = "#f768a1";
				else if (c_count >= 1 && c_count <= 5) color = "#fbb4b9";
				else {color = "#feebe2";}

				return {
          fillColor: color,
          weight: 1,
          opacity: 0.7,
          color: 'black',
          dashArray: '1',
          fillOpacity: 0.9
        };
      }

			function counter(level, feature){
				//CASE COUNTER FOR STATES
				var count = 0;

				if (level == "District") var property = "dtname";
				else var property = "stname"; //this will change if states layer is activated

				for (var i = 0;i<data.length;i++){
          if (data[i][level] == feature.properties[property]) {
						count = count + Number(data[i]["Confirmed Cases"]);
					}
        }

				return count;
			}

      function onEachDist( feature, layer ) {
        //CONNECTING TOOLTIP AND POPUPS TO DISTRICTS
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
        });
				layer.on('click', function(e, feature){
					zoomToFeature(e);
					console.log(feature);
				});
        layer.bindTooltip( feature.properties["dtname"] + ', ' + feature.properties["stname"], {
          direction : 'auto',
          className : 'statelabel',
          permanent : false,
          sticky    : true
        } );
        layer.bindPopup(popContent(feature), {maxWidth:700});

      }

      function highlightFeature(e) {
        //DISTRICT HIGHLIGHT ON MOUSEOVER
        var layer = e.target;

        layer.setStyle( {
          weight: 3,
          color: 'violet',
          opacity: 0.9
        } );
        if ( !L.Browser.ie && !L.Browser.opera ) {
          layer.bringToFront();
        }
      }

      function resetHighlight(e) {
          //RESET HIGHLIGHT ON MOUSEOUT
          var layer = e.target;
          layer.setStyle({
            weight: 1,
            color: 'black',
            opacity: 0.7
          });
      }

      function zoomToFeature(e) {
				//ZOOM TO DISTRICT ON CLICK
        map.fitBounds(e.target.getBounds(), {maxZoom:12});
      }

			//STATE COUNTS FOR MODAL
			function stateData(){
				var s_totals = [];
				var flag = 0;

				for ( var i = 0; i < data.length; i++ ){
					flag = 0; //CHECKS IF ARRAY ALREADY HAS STATE
					s_totals.forEach( function(state){
						if(state.name == data[i]["State"]) flag = 1;
					});

					if (flag == 0) {
						var totals = allCounts("State", data[i]["State"]);
						s_totals.push({name:data[i]["State"],cc:totals[0],di:totals[1],de:totals[2],ac:totals[3]});
					}
				}

				s_totals.sort((a,b) => b.cc - a.cc); //SORT BY CONFIRMED CASES
				//console.log(s_totals);
				var stateHTML = "<table><tbody><tr><th>State</th><th>Confirmed Cases</th><th>Discharged/Recovered</th><th>Deaths</th><th>Active Cases</th></tr>";
				s_totals.forEach( function(state) {
					stateHTML = stateHTML + '<tr><td>'+state.name+'</td><td>'+state.cc+'</td><td>'+state.di+'</td><td>'+state.de+'</td><td>'+state.ac+'</td></tr>';
				});
				stateHTML = stateHTML + '</tbody></table>';

				return stateHTML;
			}

			function allCounts(level, name) {
				var totals = [0,0,0,0];
				for ( var i = 0; i < data.length; i++ ){
					if (data[i][level] == name) {
						totals[0] = totals[0] + Number(data[i]["Confirmed Cases"]);
						totals[1] = totals[1] + Number(data[i]["Discharged"]);
						totals[2] = totals[2] + Number(data[i]["Deaths"]);
						totals[3] = totals[3] + Number(data[i]["Active"]);
					}
				}
				return totals;
			}

      // INITIALIZE FUNCTION
      function init(){

        // CREATE ALL THE DOM ELEMENTS FIRST
        createElements();

        // RENDER THE MAP IN THE CORRECT DOM
        drawMap();
      }

      init();

    });
  };
}(jQuery));

jQuery(document).ready(function(){

	Tabletop.init( { key: "1AL1cj_33m3D7JkT-_wPB7LPJAqIfV2Y5XVMui7nczy4", callback: getdata, simpleSheet: false } );

	function getdata(d, tabletop) {
		var data, metadata = [];
		data = tabletop.sheets("raw").elements;
		metadata = tabletop.sheets("readme").elements;
		console.log(metadata);
		jQuery( '[data-behaviour~=choropleth-map]' ).choropleth_map(data, metadata);
	}

});
