#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'

c = CGI::new
kml_url = c['url']

print <<EOF
Content-type: text/html

<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

  <link rel="stylesheet" href="/leaflet/style.css" type="text/css">
  <link rel="stylesheet" href="/leaflet/leaflet.css" />
  <script src="/leaflet/leaflet-src.js"></script>
  <script src="/leaflet/jquery-1.7.2.min.js"></script>
  <script src="http://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>
  <script src="/leaflet/layer/tile/Google.js"></script>
  <script src="/leaflet/layer/vector/KML.js"></script>

  <!-- plugin nice layerswitcher -->
  <link rel="stylesheet" href="/leaflet/leaflet.minimaplayerswitcher/dist/leaflet.minimaplayerswitcher.css" />
  <script src="/leaflet/leaflet.minimaplayerswitcher/src/Leaflet.minimaplayerswitcher.js"></script>
  <script src="/leaflet/leaflet.minimaplayerswitcher/src/Control.MiniMapLayerSwitcher.js"></script>


</head>
<body>
  <div id="map" style="largemap"></div>
  <script type="text/javascript">
    var map = L.map('map', {
      zoom: 16
    });

    // Google layer from plugins
    var gg = new L.Google('HYBRID');
        
    // add an OpenStreetMap tile layer
    var osm = L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
      attribution: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> | Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    });

    // KML layer
    var kml = new L.KML("#{kml_url}", {async: true});
    kml.on("loaded", function(e){
      map.fitBounds(e.target.getBounds());
      //map.zoomOut();
    });
    map.addLayer(kml);

    //map.locate({
    //  setView: true
    //});

    L.control.miniMapLayerSwitcher({
      'Google': gg,
      'OpenStreetMap': osm
    },{
      position: 'bottomleft',
      miniMapHeight: 60,
      miniMapWidth: 60
    }).addTo(map);

    L.control.scale().addTo(map);
  </script>
</body>
</html>
EOF

