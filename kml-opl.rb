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
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <link rel="stylesheet" href="/opl/theme/default/style.css" type="text/css">
      <link rel="stylesheet" href="style.css" type="text/css">
      <script type="text/javascript" src="https://www.google.com/jsapi"></script>
      <script src="http://maps.google.com/maps/api/js?v=3&amp;sensor=false"></script>
    </head>
    <body>
    <div id="map" class="largemap"></div>
    <script src="/opl/OpenLayers.js"></script>
    <script>
      var gcs = new OpenLayers.Projection("EPSG:4326");
      var merc = new OpenLayers.Projection("EPSG:900913");
      var map = new OpenLayers.Map("map",{projection:merc});

      var gg =  new OpenLayers.Layer.Google(
          "Google Hybrid",
          {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20,sphericalMercator: true}
      );

      var kml = new OpenLayers.Layer.Vector("KML", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        projection: gcs,
        protocol: new OpenLayers.Protocol.HTTP({
          url: "#{kml_url}",
          format: new OpenLayers.Format.KML({
            extractStyles: true, 
            extractAttributes: true,
            maxDepth: 2
          })
        })
      });
      kml.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
      })

      kml.events.register('loadend', kml, function(evt) {
        map.zoomToExtent(kml.getDataExtent());
        map.zoomOut();
      })

      var select = new OpenLayers.Control.SelectFeature(kml);
      map.addControl(select);
      select.activate();   

      map.addLayers([gg,kml]);

      function onPopupClose(evt) {
        select.unselectAll();
      }

      function onFeatureSelect(event) {
        var feature = event.feature;
        // Since KML is user-generated, do naive protection against
        // Javascript.
        var content = "<h2>"+feature.attributes.name + "</h2>" + feature.attributes.description;
        if (content.search("<script") != -1) {
          content = "Content contained Javascript! Escaped content below.<br>" + content.replace(/</g, "&lt;");
        }
        popup = new OpenLayers.Popup.FramedCloud("chicken", 
          feature.geometry.getBounds().getCenterLonLat(),
          new OpenLayers.Size(100,100),
          content,
          null, true, onPopupClose
        );
        feature.popup = popup;
        map.addPopup(popup);
      }

      function onFeatureUnselect(event) {
        var feature = event.feature;
        if(feature.popup) {
          map.removePopup(feature.popup);
          feature.popup.destroy();
          delete feature.popup;
        }
      }
    </script>
  </body>
</html>
EOF
