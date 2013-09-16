Ext.require([
  'Ext.container.Viewport',
  'Ext.layout.container.Border',
  'GeoExt.tree.Panel',
  'Ext.tree.plugin.TreeViewDragDrop',
  'GeoExt.panel.Map',
  'GeoExt.tree.OverlayLayerContainer',
  'GeoExt.tree.BaseLayerContainer',
  'GeoExt.data.LayerTreeModel',
  'GeoExt.tree.View',
  'GeoExt.tree.Column',
  'GeoExt.ux.GoogleEarthPanel',
  'GeoExt.ux.GoogleEarthClick',
  
  // Add print Preview + Create PDF 05/08/2012
  'GeoExt.data.MapfishPrintProvider',
  'GeoExt.panel.PrintMap',
  
  // Add popup + Input Form 05/08/2012
  'GeoExt.window.Popup',
  'Ext.form.Panel',
  'Ext.layout.container.Column',
  'Ext.layout.container.Accordion',
  'Ext.layout.container.Border',
  'Ext.tab.Panel',
  'Ext.form.field.ComboBox',
  'Ext.form.field.Date',
  'Ext.form.field.HtmlEditor',
  
  // Add kml store
  'GeoExt.data.FeatureStore',
  'GeoExt.data.proxy.Protocol'

]);

Ext.application({
  name: 'Tree',
  launch: function() {
    // DSI location
    var center = new OpenLayers.LonLat(100.5657899,13.89071588);
    var dsi = center.transform(gcs,merc);
    
    var ctrl = new OpenLayers.Control.NavigationHistory();
    // Add Bing Map
    // API key for http://203.151.201.129/dsi
    var apiKey = "AnXErkelqCPb0UC5K-lCookgNa4-IwF1Cehgg9En9wcFz7iGblBxbZfm4484_qqK";
    
    OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";

    map = new OpenLayers.Map({
      projection: new OpenLayers.Projection("EPSG:900913"),
      displayProjection: new OpenLayers.Projection("EPSG:4326"),
      units: "m",
      maxResolution: 156543.0339,
      maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,20037508.34, 20037508.34),
      controls: [
        new OpenLayers.Control.PanZoomBar(),
        new OpenLayers.Control.MousePosition(),
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.LayerSwitcher(),
        new OpenLayers.Control.OverviewMap(),
        new OpenLayers.Control.ScaleLine({geodesic: true}),
        ctrl
      ]
    });
    
    map.events.register("click", map, function(e){
      var lonlat = map.getLonLatFromViewPortPx(e.xy).transform(merc, gcs);
      var activelayers = map.getLayersBy("visibility", true);
      for(i=0;i<activelayers.length;i++) {
        if (activelayers[i].name.search('เขต') != -1 || activelayers[i].name.search('ชายเลน') != -1)
        check_forest_info(activelayers[i].name, lonlat);
      }
    });
  
    map.events.register('changelayer', null, function(evt){
      if (evt.layer.name == 'Google Earth') {
      var o = Ext.getCmp('id_east');
      if (o.collapsed)
        o.expand();
      else
        o.collapse();
      }
    });
    
    // Create all objects declared in map_utils.js
    create_styles();
    create_layer_vectorLayer();
    create_layer_markers();
    create_layer_hili();
    
    //should WAIT until user click Add Custom Layer
    //create_layer_pointLayer();

    var toolbarItems = [], action;
    
    action = Ext.create('GeoExt.Action',{
      tooltip: 'กลับสู่แผนที่เริ่มต้น',
      iconCls: 'zoomfull',
      handler: function(){
        map.setCenter(dsi, 5);
      },
      allowDepress: false
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    
    toolbarItems.push("-");
  
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ZoomBox(),
      tooltip: 'ขยายขนาดภาพแผนที่ (กดปุ่ม Shift ค้างไว้จากนั้น Click Mouse ปุ่มซ้ายมือค้างไว้แล้วลากเป็นกรอบสี่เหลี่ยมได้)',
      map: map,
      iconCls: 'zoomin',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
       
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ZoomBox({
        out: true
      }),
      tooltip: 'ย่อขนาดภาพแผนที่ (กดปุ่ม Shift ค้างไว้จากนั้น Click Mouse ปุ่มซ้ายมือค้างไว้แล้วลากเป็นกรอบสี่เหลี่ยมได้)',
      map: map,
      iconCls: 'zoomout',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
       
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DragPan({
        isDefault: true
      }),
      tooltip: 'เลื่อนแผนที่ไปในทิศทางต่างๆ',
      map: map,
      iconCls: 'pan',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    toolbarItems.push("-");
    
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point),
      tooltip: 'วางจุดบนแผนที่',
      map: map,
      iconCls: 'drawpoint',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Path),
      tooltip: 'วาดเส้นตรงบนแผนที่',
      map: map,
      iconCls: 'drawline',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Polygon),
      tooltip: 'วาดรูปหลายเหลี่ยมบนแผนที่',
      map: map,
      iconCls: 'drawpolygon',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    toolbarItems.push("-");
    
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ModifyFeature(vectorLayer)
      ,id: 'ctrlModify'
      ,tooltip: 'แก้ไขจุดที่ปรากฏบนแผนที่ (ต้อง Click Mouse บนจุด/เส้น/รูปหลายเหลี่ยม เพื่อกำหนดสิ่งที่ต้องการก่อนทำการแก้ไข)'
      ,map: map
      ,iconCls: 'modifyfeature'
      ,toggleGroup: 'map'
      ,handler: function(){
        vectorzindex = vectorLayer.getZIndex();
        vectorLayer.setZIndex(999);
      }
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    
    action = Ext.create('GeoExt.Action', {
      control: new OpenLayers.Control.DeleteFeature(vectorLayer)
      ,tooltip: "ลบทีละรายการ จุด/เส้น/รูปหลายเหลี่ยม"
      ,map: map
      ,iconCls: "deletefeature"
      ,toggleGroup: "map"
      ,handler: function(){
        vectorzindex = vectorLayer.getZIndex();
        vectorLayer.setZIndex(999);
      }         
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    
    // Remove all features replace with DeleteFeature.js (1 at a time)
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.SelectFeature(vectorLayer),
      tooltip: 'ลบทุกรายการที่ปรากฏบนแผนที่',
      map: map,
      iconCls: 'deleteallfeature',
      toggleGroup: 'map',
      handler: function() {
        if (vectorLayer && vectorLayer.features)
          vectorLayer.removeFeatures(vectorLayer.features);
        if (kml && kml.features) {
          kml.removeFeatures(kml.features);
          map.removeLayer(kml);
        }
        vectorLayer.setZIndex(vectorzindex);
      },
      allowDepress: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    
    toolbarItems.push("-");  

    var show_gsv = function(feat) {
      lon = feat.geometry.x;
      lat = feat.geometry.y;
      var pt = new OpenLayers.LonLat(lon,lat);
      pt.transform(merc, gcs);
      lon = pt.lon;
      lat = pt.lat;
      var img_url = 'http://maps.googleapis.com/maps/api/streetview?size=400x400&location=' + lat + ',' + lon;
      img_url += '&sensor=false&key=AIzaSyBa-Aed1-QisFrEs2Vnc0f3hfu_fWgXIl4';
      var html = "<center><img src='" + img_url + "' /></center>";
      Ext.create("Ext.window.Window", {
        title: "Google Street View",
        width: 450,
        height: 450,
        layout: 'fit',
        closable: true,
        html: html
      }).show();
    }
            
    // Add Google Street View Control
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point, { 'featureAdded': show_gsv}),
      tooltip: 'แสดงภาพจาก Google Street View',
      map: map,
      iconCls: 'show_gsv',
      toggleGroup: 'map',
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    toolbarItems.push("-");

    // Add Input Form 05/08/2012
    action = Ext.create('GeoExt.Action', {
      iconCls: "i2"
      ,id: 'id_select_feat'
      ,control: frm_input_ctrl
      ,tooltip: 'แบบฟอร์มนำเข้าข้อมูลจากผู้ใช้งาน'
      ,map: map
      ,enableToggle: true
      ,toggleGroup: "map"
      ,allowDepress: true
      ,handler: function() {
        vectorzindex = vectorLayer.getZIndex();
        vectorLayer.setZIndex(999);   
        if (pointLayer && pointLayer.visibility == true)
          pointLayer.setVisibility(false);
      }
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    // Add Button Custom Layer (pointLayer) to map
    var pl_tta = "เพิ่มชั้นข้อมูลของผู้ใช้งาน";
    var pl_ttx = "ลบชั้นข้อมูลของผู้ใช้งาน";
    var btn_custom_layer = new Ext.Button({
      iconCls: 'add_layer'
      ,tooltip: pl_tta
      ,enableToggle: false
      ,pressed: false
      ,handler: function() {
        if (this.iconCls == 'add_layer') {
          if (pointLayer) { // just in case
            map.removeLayer(pointLayer);
            pointLayer = null;
          }
          create_layer_pointLayer();
          map.addLayer(pointLayer);
          this.setIconCls('del_layer');
          this.setTooltip(pl_ttx);
        } else {
          map.removeLayer(pointLayer);
          pointLayer = null;
          this.setIconCls('add_layer');
          this.setTooltip(pl_tta);
        }
      }
    });
    toolbarItems.push(btn_custom_layer);
 
    // Add button to delete a feature from pointLayer and kml table in dsi database
    var btn_del_feat = new Ext.Button({
      iconCls: 'del_feature_in_layer'
      ,tooltip: 'ลบข้อมูลออกจากฐานข้อมูล โดย click mouse ณ ตำแหน่งที่ต้องการลบ'
      ,enableToggle: true
      ,handler: function(toggled){
        if (toggled.pressed) {
          ctrl_popup_pointLayer.deactivate();
          del_feat_ctrl.activate();
        } else {
          ctrl_popup_pointLayer.activate();
          del_feat_ctrl.deactivate();
        }
      },
      toggleGroup: "map",
      pressed: false
    });
    toolbarItems.push(btn_del_feat);

    toolbarItems.push("-");

    // Measure Length control
    ctrl_measure_length = new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
      persist: true
      ,geodesic: true
      ,displaySystem: 'metric'      
      ,eventListeners: {
        measure: function(evt) {
          //evt.units --> 'km' , 'm'
          var unit = (evt.units == 'km') ? 'กิโลเมตร' : 'เมตร';
          
          Ext.Msg.show({
            title: 'Result'
            ,msg: "ระยะทางรวม ประมาณ " + numberWithCommas(evt.measure.toFixed(2)) + ' ' + unit
            ,buttons: Ext.Msg.OK
            ,icon: Ext.Msg.INFO
          });
        }
      }
    });
    map.addControl(ctrl_measure_length);
    
    var btn_measure_length = new Ext.Button({
      iconCls: 'measure_length',
      tooltip: "วัดระยะทาง",
      enableToggle: false,
      handler: function(toggled){
        if (toggled.pressed) {
          ctrl_measure_area.deactivate();
          ctrl_measure_length.activate();
        } else {
          ctrl_measure_length.deactivate();
        }
      },
      toggleGroup: "grp_measure",
      pressed: false
    });
    toolbarItems.push(btn_measure_length);
    
    // Measure Area control
    ctrl_measure_area = new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, {
      eventListeners: {
        measure: function(evt) {
          //evt.units --> 'km' , 'm'
          var unit = (evt.units == 'km') ? 'ตารางกิโลเมตร' : 'ตารางเมตร';
          
          Ext.Msg.show({
            title: 'Result'
            ,msg: "พื้นที่รวม ประมาณ " + numberWithCommas(evt.measure.toFixed(2)) + ' ' + unit
            ,buttons: Ext.Msg.OK
            ,icon: Ext.Msg.INFO
          });
        }
      }
    });
    map.addControl(ctrl_measure_area);
    
    var btn_measure_area = new Ext.Button({
      iconCls: 'measure_area',
      tooltip: "คำนวณพื้นที่",
      enableToggle: false,
      handler: function(toggled){
        if (toggled.pressed) {
          //alert('btn_area: active btn_length: deactivate');
          ctrl_measure_length.deactivate();
          ctrl_measure_area.activate();
        } else {
          ctrl_measure_area.deactivate();
        }
      },
      toggleGroup: "grp_measure",
      pressed: false
    });
    toolbarItems.push(btn_measure_area);
    
    // Add Lat/Long Button
    var llgrid = null;
    button = Ext.create('Ext.Button',{
      tooltip: 'แสดง Lat/Long Grid',
      iconCls: 'grid1',
      enableToggle: true,
      handler: function() {
        var g = c = map.getControlsByClass("OpenLayers.Control.Graticule");
        if (g.length == 1) { // Graticule (Lat/Long Grid) is displayed in map
          llgrid.destroy();
          llgrid = null;
        } else { // No Graticule (Lat/Long Grid)
          llgrid = new OpenLayers.Control.Graticule({
            layerName: 'Lat/Long Grid',
            displayInLayerSwitcher: false,
            hideInTree: true,
            lineSymbolizer: {
              strokeColor: "#FFFF7F",
              strokeWidth: 1,
              strokeOpacity: 0.5,
            },
            labelSymbolizer: {
              fontColor: "#FFFF00",
              fontWeight: "bold"
            }
          });
          map.addControl(llgrid);
        }
      }
    });
    toolbarItems.push(button);
    
    // Add UTM Button
    button = Ext.create('Ext.Button',{
      tooltip: 'แสดง UTM Grid',
      iconCls: 'grid2',
      enableToggle: true,
      handler: function() {
        //debugger;
        if (utmgrid.visibility == false)
          utmgrid.setVisibility(true);
        else
          utmgrid.setVisibility(false);
      }
    });
    toolbarItems.push(button);
    
    toolbarItems.push("-");
        
    action = Ext.create('GeoExt.Action',{
       tooltip: "Previous view",
       control: ctrl.previous,
       iconCls: 'back',
       disabled: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    
    action = Ext.create('GeoExt.Action',{
      tooltip: "Next view",
      control: ctrl.next,
      iconCls: 'next',
      disabled: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    toolbarItems.push("->");
    
    // Add print Preview + Print Action ( Create PDF ERROR!!! )
    var printDialog, printProvider;
    
    // The PrintProvider that connects us to the print service
    printProvider = Ext.create('GeoExt.data.MapfishPrintProvider', {
      method: "GET", // "POST" recommended for production use
      capabilities: printCapabilities, // provide url instead for lazy loading
      customParams: {
        mapTitle: "GeoExt Printing Demo",
        comment: "This demo shows how to use GeoExt.PrintMapPanel"
      }
    });
    var btn_print = new Ext.Button({
      iconCls: 'print_preview',
      tooltip: 'ดูภาพ Preview และพิมพ์แผนที่ (กรุณา Zoom แผนที่ตามความต้องการอีกครั้ง)',
      handler: function(){
        printDialog = Ext.create('Ext.Window', {
          title: "<font color='#FF7000'>Print Preview</font>",
          id: 'id_printDialog',
          layout: "fit",
          width: 400,
          autoHeight: true,
          items: [{
            xtype: "gx_printmappanel",
            id: 'id_preview',
            sourceMap: mapPanel,
            printProvider: printProvider
          }],
          bbar: [{
            iconCls: 'print',
            tooltip: 'Print Map',
            //handler: function(){ printDialog.items.get(0).print(); }
            //ERROR: when preesing this button -->
            handler: function(){
              $("#id_preview-body").printElement({printMode:'popup'});
              //$("#id_preview").printArea();
              return false;
            }
          },'->',{
            iconCls: 'close',
            tooltip: 'Close',
            handler: function(){
              Ext.getCmp('id_printDialog').close();
            }
          }]
        });
        printDialog.center();
        printDialog.show();
      }
    });
    toolbarItems.push(btn_print);
  
    var numicon = new Ext.form.ComboBox({
      width: 55
      ,id: 'id_icon_num'          
      ,emptyText: 'Icon'
      ,listConfig: {
        getInnerTpl: function() {
          // here you place the images in your combo
          var tpl = '<div>'+
                    '<img src="img/{icon}.png" align="center" width="16" height="16" /></div>';
          return tpl;
        }
      }
      ,store : new Ext.data.SimpleStore({
        // Add more layers in dropdown here

        data : [['x1', '1'],['x2','2'],['x3','3'],['x4','4'],['x5','5'],['x6','6'],['x7','7'],['x8','8'],['x9','9'],
['a001','aircraft-carrier'],['a002','airfield'],['a003','ambush'],['a004','anbchart'],
['a005','apc'],['a006','attack-helicopter'],['a007','audiodoc'],['b001','bodyguard'],
['b002','bomber'],['b003','book'],['b004','bridge'],['b005','building'],
['b006','building-ruined'],['c001','cargo-plane-fixed-wing'],['c002','cargo-plane-rotary-wing'],['c003','checkpoint'],
['c004','communications-center'],['c005','crater'],['d001','destroyer'],['d002','detonation'],
['d003','dump-truck'],['e001','explosion'],['f001','fighter'],['f002','fr-arson-fire'],
['f003','fr-assassination'],['f004','fr-black-list-location'],['f005','fr-bombing'],['f006','fr-booby-trap'],
['f007','fr-demonstration'],['f008','fr-drive-by-shooting'],['f009','fr-drug-operation'],['f010','fr-drug-vehicle'],
['f011','fr-extortion'],['f012','fr-graffiti'],['f013','fr-grey-list-location'],['f014','fr-hijacking-aircraft'],
['f015','fr-hijacking-boat'],['f016','fr-hijacking-vehicle'],['f017','fr-internal-security-force'],['f018','fr-kidnapping'],
['f019','fr-mine-laying'],['f020','fr-patrolling'],['f021','fr-poisoning'],['f022','fr-psyop'],
['f023','fr-psyop-house-to-house-propaganda'],['f024','fr-psyop-radio-and-tv-propaganda'],['f025','fr-psyop-written-propaganda'],['f026','fr-recruitment-coerced'],
['f027','fr-refugees'],['f028','fr-sniping'],['f029','fr-spy'],['f030','fr-vandalism-rape-looting-ransacking'],
['f031','fr-white-list-location'],['g001','garage'],['g002','guerrilla'],['g003','gun-emplacement'],
['h001','hand-grenade'],['h002','ho-arson-fire'],['h003','ho-assassination'],['h004','ho-black-list-location'],
['h005','ho-bombing'],['h006','ho-booby-trap'],['h007','ho-demonstration'],['h008','ho-drive-by-shooting'],
['h009','ho-drug-operation'],['h010','ho-drug-vehicle'],['h011','ho-extortion'],['h012','ho-graffiti'],
['h013','ho-grey-list-location'],['h014','ho-hijacking-aircraft'],['h015','ho-hijacking-boat'],['h016','ho-hijacking-vehicle'],
['h017','ho-internal-security-force'],['h018','ho-kidnapping'],['h019','ho-mine-laying'],['h020','ho-patrolling'],
['h021','ho-poisoning'],['h022','ho-psyop'],['h023','ho-psyop-house-to-house-propaganda'],['h024','ho-psyop-radio-and-tv-propaganda'],
['h025','ho-psyop-written-propaganda'],['h026','ho-recruitment-coerced'],['h027','ho-refugees'],['h028','ho-sniping'],
['h029','ho-spy'],['h030','ho-vandalism-rape-looting-ransacking'],['h031','ho-white-list-location'],['I001','Icon-Sample'],
['i001','ied'],['i002','insurgent'],['k001','kidnapper'],['m001','manpads'],
['m002','maritime'],['m003','mbrl'],['m004','mbt'],['m005','military-base'],
['m006','minefield'],['m007','moneybag'],['m008','mortar'],['n001','nato'],
['n002','ne-arson-fire'],['n003','ne-assassination'],['n004','ne-black-list-location'],['n005','ne-bombing'],
['n006','ne-booby-trap'],['n007','ne-demonstration'],['n008','ne-drive-by-shooting'],['n009','ne-drug-operation'],
['n010','ne-drug-vehicle'],['n011','ne-extortion'],['n012','ne-graffiti'],['n013','ne-grey-list-location'],
['n014','ne-hijacking-aircraft'],['n015','ne-hijacking-boat'],['n016','ne-hijacking-vehicle'],['n017','ne-internal-security-force'],
['n018','ne-kidnapping'],['n019','ne-mine-laying'],['n020','ne-patrolling'],['n021','ne-poisoning'],
['n022','ne-psyop'],['n023','ne-psyop-house-to-house-propaganda'],['n024','ne-psyop-radio-and-tv-propaganda'],['n025','ne-psyop-written-propaganda'],
['n026','ne-recruitment-coerced'],['n027','ne-refugees'],['n028','ne-sniping'],['n029','ne-spy'],
['n030','ne-vandalism-rape-looting-ransacking'],['n031','ne-white-list-location'],['o001','observation-tower'],['o002','opfor'],
['p001','patrol'],['p002','patrol-boat'],['p003','patrol-vehicle'],['p004','pow'],
['r001','radar-site'],['r002','road-block'],['r003','rocket-attack'],['r004','rpg'],
['s001','safe-house'],['s002','sfapmfb'],['s003','sfapmf'],['s004','sfapmff'],
['s005','sfapmha'],['s006','sfapmh'],['s007','sfapmhm'],['s008','sfapw'],
['s009','sfapwmsa'],['s010','sfapwms'],['s011','sfapwmss'],['s012','sffpg'],
['s013','sfgpucaa'],['s014','sfgpuca'],['s015','sfgpucd'],['s016','sfgpucec'],
['s017','sfgpucf'],['s018','sfgpucfrm'],['s019','sfgpucia'],['s020','sfgpuci'],
['s021','sfgpucigd'],['s022','sfgpucil'],['s023','sfgpucim'],['s024','sfgpucio'],
['s025','sfgpucis'],['s026','sfgpuciz'],['s027','sfgpucr'],['s028','sfgpucrva'],
['s029','sfgpucrx'],['s030','sfgpucvr'],['s031','sfgpucvu'],['s032','sfgpus'],
['s033','sfgpusmm'],['s034','sfgpuss'],['s035','sfgpusx'],['s036','sfgpuua'],
['s037','sfgpuuacr'],['s038','sfgpuulm'],['s039','sfgpuum'],['s040','sfgpuumc'],
['s041','sfgpuus'],['s042','sfspc'],['s043','sfups'],['s044','shapmfb'],
['s045','shapmf'],['s046','shapmff'],['s047','shapmha'],['s048','shapmh'],
['s049','shapmhm'],['s050','shapw'],['s051','shapwmsa'],['s052','shapwms'],
['s053','shapwmss'],['s054','shelter'],['s055','shfpg'],['s056','shgpucaa'],
['s057','shgpuca'],['s058','shgpucd'],['s059','shgpucec'],['s060','shgpucf'],
['s061','shgpucfrm'],['s062','shgpucia'],['s063','shgpuci'],['s064','shgpucigd'],
['s065','shgpucil'],['s066','shgpucim'],['s067','shgpucio'],['s068','shgpucis'],
['s069','shgpuciz'],['s070','shgpucr'],['s071','shgpucrva'],['s072','shgpucrx'],
['s073','shgpucvr'],['s074','shgpucvu'],['s075','shgpus'],['s076','shgpusmm'],
['s077','shgpuss'],['s078','shgpusx'],['s079','shgpuua'],['s080','shgpuuacr'],
['s081','shgpuulm'],['s082','shgpuum'],['s083','shgpuumc'],['s084','shgpuus'],
['s085','shspc'],['s086','shups'],['s087','snapmfb'],['s088','snapmf'],
['s089','snapmff'],['s090','snapmha'],['s091','snapmh'],['s092','snapmhm'],
['s093','snapw'],['s094','snapwmsa'],['s095','snapwms'],['s096','snapwmss'],
['s097','snfpg'],['s098','sngpucaa'],['s099','sngpuca'],['s100','sngpucd'],
['s101','sngpucec'],['s102','sngpucf'],['s103','sngpucfrm'],['s104','sngpucia'],
['s105','sngpuci'],['s106','sngpucigd'],['s107','sngpucil'],['s108','sngpucim'],
['s109','sngpucio'],['s110','sngpucis'],['s111','sngpuciz'],['s112','sngpucr'],
['s113','sngpucrva'],['s114','sngpucrx'],['s115','sngpucvr'],['s116','sngpucvu'],
['s117','sngpus'],['s118','sngpusmm'],['s119','sngpuss'],['s120','sngpusx'],
['s121','sngpuua'],['s122','sngpuuacr'],['s123','sngpuulm'],['s124','sngpuum'],
['s125','sngpuumc'],['s126','sngpuus'],['s127','sniper'],['s128','snspc'],
['s129','snups'],['s130','soldier'],['s131','spreadsheetdoc'],['s132','suapmfb'],
['s133','suapmf'],['s134','suapmff'],['s135','suapmha'],['s136','suapmh'],
['s137','suapmhm'],['s138','suapw'],['s139','suapwmsa'],['s140','suapwms'],
['s141','suapwmss'],['s142','submarine'],['s143','sufpg'],['s144','sugpucaa'],
['s145','sugpuca'],['s146','sugpucd'],['s147','sugpucec'],['s148','sugpucf'],
['s149','sugpucfrm'],['s150','sugpucia'],['s151','sugpuci'],['s152','sugpucigd'],
['s153','sugpucil'],['s154','sugpucim'],['s155','sugpucio'],['s156','sugpucis'],
['s157','sugpuciz'],['s158','sugpucr'],['s159','sugpucrva'],['s160','sugpucrx'],
['s161','sugpucvr'],['s162','sugpucvu'],['s163','sugpus'],['s164','sugpusmm'],
['s165','sugpuss'],['s166','sugpusx'],['s167','sugpuua'],['s168','sugpuuacr'],
['s169','sugpuulm'],['s170','sugpuum'],['s171','sugpuumc'],['s172','sugpuus'],
['s173','support-helicopter'],['s174','surveillance-aircraft-fixed-wing'],['s175','surveillance-aircraft-rotary-wing'],['s176','suspc'],
['s177','suups'],['t001','technical-support'],['t002','textchartviz'],['t003','trailer'],
['u001','uav'],['u002','un-arson-fire'],['u003','un-assassination'],['u004','un-black-list-location'],
['u005','un-bombing'],['u006','un-booby-trap'],['u007','un-demonstration'],['u008','un-drive-by-shooting'],
['u009','un-drug-operation'],['u010','un-drug-vehicle'],['u011','unexploded-ordnance'],['u012','un-extortion'],
['u013','un-graffiti'],['u014','un-grey-list-location'],['u015','un-hijacking-aircraft'],['u016','un-hijacking-boat'],
['u017','un-hijacking-vehicle'],['u018','un-internal-security-force'],['u019','un-kidnapping'],['u020','un-mine-laying'],
['u021','un-patrolling'],['u022','un-poisoning'],['u023','un-psyop'],['u024','un-psyop-house-to-house-propaganda'],
['u025','un-psyop-radio-and-tv-propaganda'],['u026','un-psyop-written-propaganda'],['u027','un-recruitment-coerced'],['u028','un-refugees'],
['u029','un-sniping'],['u030','un-spy'],['u031','un-vandalism-rape-looting-ransacking'],['u032','un-white-list-location'],
['u033','utility-vehicle'],['v001','videospool'],['w001','weapons-cache'],['w002','web-page'] ]

        ,id : 0
        ,fields : ['icon','text']
      })
      ,valueField : 'icon'
      ,displayField : 'text'
      ,triggerAction : 'all'
      ,editable : false
      ,name : 'icon_num'
      ,handler: function() {
        debugger;
        pointLayer.styleMap = styleMapNumber;
      }
    });    
    //toolbarItems.push(numicon);
    
    var utmgrid = new OpenLayers.Layer.WMS(
      "UTM Grid",
      "http://203.151.201.129/cgi-bin/mapserv",
      {
        map: '/ms603/map/wms-thai.map',
        layers: "utm_wgs",
        transparent: true
      },
      { isBaseLayer: false, visibility: false}
    );
    utmgrid.displayInLayerSwitcher = false;
    utmgrid.hideInTree = true;
    utmgrid.setVisibility(false);

    // Add Bing Map
    bing_road = new OpenLayers.Layer.Bing({
      name: "Bing Road",
      key: apiKey,
      type: "Road",
      iconCls: 'bing'
    });
    bing_road.isBaseLayer = true;

    bing_hybrid = new OpenLayers.Layer.Bing({
      name: "Bing Hybrid",
      key: apiKey,
      type: "AerialWithLabels",
      iconCls: 'bing'
    });
    bing_hybrid.isBaseLayer = true;

    bing_aerial = new OpenLayers.Layer.Bing({
      name: "Bing Aerial",
      key: apiKey,
      type: "Aerial",
      iconCls: 'bing'
    });
    bing_aerial.isBaseLayer = true;

    mapPanel = Ext.create('GeoExt.panel.Map', {
      border: true,
      region: "center",
      margins: '5 5 0 0',
      map: map,
      center: dsi,
      zoom: 6,
      layers: [
        new OpenLayers.Layer.WMS(
          "ป่าชายเลน ปี 2552",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'mangrove_2552', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "ป่าชายเลน ปี 2543",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'mangrove_2543', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "ป่าชายเลน ปี 2530",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'mangrove_2530', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "เขตป่าสงวน",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'rforest', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'rforest'}
        ),
        new OpenLayers.Layer.WMS(
          "เขตอุทยานแห่งชาติ",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'npark', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'npark'}
        ),
        new OpenLayers.Layer.WMS(
          "พื้นที่สปก.",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_22_spk', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "แหล่งแร่",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_14_mineral', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "ธรณีวิทยา",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_13_geology', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "หมู่บ้าน",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_06_muban', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'village', singleTile: true}
        ),
        new OpenLayers.Layer.WMS(
          "ตำบล",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_04_tambon', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'tambon'}
        ),
        new OpenLayers.Layer.WMS(
          "อำเภอ",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_03_amphoe', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'amphur'}
        ),
        new OpenLayers.Layer.WMS(
          "จังหวัด",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_02_province', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'changwat'}
        ),
        new OpenLayers.Layer.WMS(
          "ชั้นความสูง",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'contour', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'dem'}
        ),
        
        bing_road, bing_hybrid, bing_aerial,
        
        new OpenLayers.Layer.Google(
          "Google Hybrid",
          {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20,sphericalMercator: true, iconCls: 'google' }
        ),
        new OpenLayers.Layer.Google(
          "Google Physical",
          {type: google.maps.MapTypeId.TERRAIN,sphericalMercator: true, iconCls: 'google' }
        ),
        
        utmgrid,

        new OpenLayers.Layer.WMS(
          "UAV MSU",
          "http://203.151.201.129/cgi-bin/mapserv",
          {
            map: '/ms603/map/uav.map',
            layers: 'uav01',
            transparent: true
          },
          {isBaseLayer: false, gutter: 15}
        ),

        new OpenLayers.Layer.WMS(
          "UAV Tk",
          "http://203.151.201.129/cgi-bin/mapserv",
          {
            map: '/ms603/map/uav.map',
            layers: 'uav02',
            transparent: true
          },
          {isBaseLayer: false, gutter: 15}
        ),

        new OpenLayers.Layer.WMS(
          "UAV Flight",
          "http://203.151.201.129/cgi-bin/mapserv",
          {
            map: '/ms603/map/uav.map',
            layers: 'uav03',
            transparent: true
          },
          {isBaseLayer: false}
        ),


       /*
        new OpenLayers.Layer.Yahoo(
          "Yahoo Street",
          {sphericalMercator: true}
        ),
        new OpenLayers.Layer.Yahoo(
          "Yahoo Satellite",
          {'type': YAHOO_MAP_SAT, sphericalMercator: true}
        ),
        new OpenLayers.Layer.Yahoo(
          "Yahoo Hybrid",
          {'type': YAHOO_MAP_HYB, sphericalMercator: true}
        ),
        */
        
        hili,
        markers,
        vectorLayer
        
      ],
      dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        items: toolbarItems
      }]
    });
    
    overlay = Ext.create('GeoExt.tree.OverlayLayerContainer',{
      loader: {
        filter: function(record) {
          var layer = record.getLayer();
          if (layer.hideIntree || layer.displayInLayerSwitcher == false){
            return false;
          } else {
          return !(layer.displayInLayerSwitcher === true &&
            layer.isBaseLayer === true);
          }
        }
      }
    });
  
    store = Ext.create('Ext.data.TreeStore', {
      model: 'GeoExt.data.LayerTreeModel',
      root: {
        expanded: true,
        children: [
          {
            plugins: ['gx_baselayercontainer'],
            expanded: false,
            text: "Base Maps"
          }, {
            plugins: [overlay],
            expanded: true
          }
        ]
        //children: tree_child
      }
    });
    
    ///////////////////////////////////
    // TREE
    ///////////////////////////////////
    tree = Ext.create('GeoExt.tree.Panel', {
      border: true,
      title: "เลือกชั้นข้อมูล",
      width: 250,
      split: true,
      collapsible: true,
      autoScroll: true,
      store: store,
      rootVisible: true,
      lines: false
    });
    
    panel_west = Ext.create("Ext.Panel",{
      region: 'west',
      title: '<span class="logo"><font color="red">DSIMAP</font><br />กรมสอบสวนคดีพิเศษ</span>',
      width: 270,
      border: true,
      margins: '5 0 0 5',
      frame: false,
      split: true,
      layout: 'accordion',
      items: [
        tree,gps2,gps_utm,gps_utm_indian,searchquery,loadxls
      ],
      listeners: {
        render: {
          fn: function() {
            this.header.insert(0,{
              xtype: 'panel',
              html: '<img src="img/logo_dsi.png" width="50" height="65" />'
            });
          }
        }
      }
    });
    
    earth = Ext.create('Ext.Panel', {
      region: 'east'
      ,id: 'id_east'
      ,margins: '5 5 0 0'
      ,width: 400
      ,layout: 'fit'
      ,collapsible: true
      ,items: [
        {
          xtype: 'gxux_googleearthpanel'
          ,id: 'googleEarthPanelItem'
          ,map: map
          ,altitude: 50
          ,heading: 190
          ,tilt: 90
          ,range: 75
          ,streetViewControl: true
        }
      ]
    });
    
    Ext.create('Ext.Viewport', {
      layout: 'fit'
      ,hideBorders: true
      ,items: {
        layout: 'border'
        ,deferredRender: false
        //items: [mapPanel, panel_west, earth]
        ,items: [mapPanel, panel_west]
      }
    });
      
    // Set BaseLayer to bing_road
    map.setBaseLayer(bing_road);

    //INSERTUSERKML//
    create_layer_kml('/kml/admin-casetestDSII22.kml');    create_layer_kml('/kml/admin-casetest9.kml');    create_layer_kml('/kml/admin-casetestDSII234.kml');    create_layer_kml('/kml/admin-casetest4.kml');    create_layer_kml('/kml/admin-casetest_Demo.kml');    create_layer_kml('/kml/admin-casetest7.kml');    create_layer_kml('/kml/admin-casetest15.kml');    create_layer_kml('/kml/admin-casetest14.kml');    create_layer_kml('/kml/admin-casetest3.kml');    create_layer_kml('/kml/admin-casetest8.kml');    create_layer_kml('/kml/admin-casetest.kml');    create_layer_kml('/kml/admin-admin-testAAA.kml');    create_layer_kml('/kml/admin-casetest12.kml');    create_layer_kml('/kml/admin-casetest13.kml');    create_layer_kml('/kml/admin-caseI2.kml');    create_layer_kml('/kml/admin-casetestBeti.kml');    create_layer_kml('/kml/admin-casetestDSII2.kml');    create_layer_kml('/kml/admin-test1.kml');    create_layer_kml('/kml/admin-casetest10.kml');    create_layer_kml('/kml/admin-casetest2.kml');    create_layer_kml('/kml/admin-.kml');    create_layer_kml('/kml/admin-casetest1.kml');    create_layer_kml('/kml/admin-casetest5.kml');    create_layer_kml('/kml/admin-case0122.kml');    create_layer_kml('/kml/admin-casetest11.kml');    create_layer_kml('/kml/admin-admin-case01.kml');    create_layer_kml('/kml/admin-case01.kml');  }
});
