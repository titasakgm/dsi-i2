Ext.Loader.setConfig({
  enabled: true,
  disableCaching: false,
  paths: {
    GeoExt: "geoext2/src/GeoExt",
    Ext: "extjs4/src",
    "GeoExt.ux": "geoext_ux"
  }
});
// Global variables
//define variable for framed cloud
//disable the autosize for the purpose of our matrix
OpenLayers.Popup.FramedCloud.prototype.autoSize = false;
AutoSizeFramedCloud = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true
});
AutoSizeFramedCloudMinSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true,
  'minSize': new OpenLayers.Size(400, 400)
});
AutoSizeFramedCloudMaxSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true,
  'maxSize': new OpenLayers.Size(100, 100)
});
var gcs = new OpenLayers.Projection("EPSG:4326");
var merc = new OpenLayers.Projection("EPSG:900913");
var utm = new OpenLayers.Projection("EPSG:32647");
var indian = new OpenLayers.Projection("EPSG:24047");
// Revised codes
var map, mapPanel, tree, store;
var bing_road, bing_hybrid, bing_aerial;
var overlay, panel_west, ge;
var styles, create_styles;
var v_style, v_style_map, sym_lookup;
var create_layer_vectorLayer, vectorLayer, frm_input_ctrl, frm_input, popup_vectorLayer;
var create_layer_markers, marker, markers, popup_marker;
var create_layer_hili, hili;
var create_layer_pointLayer, pointLayer, ctrl_popup_pointLayer, popup_pointLayer, del_feat_ctrl;
var create_layer_kml, kml, select_kml;

var vectorzindex = 0;

google.load("earth", "1");
//////////////////////////////////////////////
// Utilty functions
//////////////////////////////////////////////
function info(title, msg) {
  Ext.Msg.show({
    title: title,
    msg: msg,
    minWidth: 200,
    modal: true,
    icon: Ext.Msg.INFO,
    buttons: Ext.Msg.OK
  });
};
create_styles = function () {
  // Modify drawpoint from default orange point
  styles = new OpenLayers.StyleMap({
    "default": new OpenLayers.Style(null, {
      rules: [
      new OpenLayers.Rule({
        symbolizer: {
          "Point": {
            pointRadius: 5,
            graphicName: "square",
            fillColor: "#EC940C",
            fillOpacity: 0.75,
            strokeWidth: 1,
            strokeOpacity: 1,
            strokeColor: "#3333aa"
          },
          "Line": {
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeColor: "#006600"
          },
          "Polygon": {
            strokeWidth: 2,
            strokeOpacity: 1,
            fillColor: "#6666aa",
            strokeColor: "#2222aa"
          }
        }
      })]
    }),
    "select": new OpenLayers.Style(null, {
      rules: [
      new OpenLayers.Rule({
        symbolizer: {
          "Point": {
            pointRadius: 5,
            graphicName: "square",
            fillColor: "#EC940C",
            fillOpacity: 0.25,
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeColor: "#0000ff"
          },
          "Line": {
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: "#0000ff"
          },
          "Polygon": {
            strokeWidth: 2,
            strokeOpacity: 1,
            fillColor: "#0000ff",
            strokeColor: "#0000ff"
          }
        }
      })]
    }),
    "temporary": new OpenLayers.Style(null, {
      rules: [
      new OpenLayers.Rule({
        symbolizer: {
          "Point": {
            graphicName: "square",
            pointRadius: 5,
            fillColor: "#EC940C",
            fillOpacity: 0.25,
            strokeWidth: 2,
            strokeColor: "#0000ff"
          },
          "Line": {
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: "#0000ff"
          },
          "Polygon": {
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeColor: "#0000ff",
            fillColor: "#0000ff"
          }
        }
      })]
    })
  });
}
create_layer_vectorLayer = function () {
  vectorLayer = new OpenLayers.Layer.Vector("vectorLayer", {
    displayInLayerSwitcher: true,
    hideIntree: true,
    styleMap: styles
  });

  // Add Popup: create popup on "featureselected" 05/08/2012
  vectorLayer.events.on({
    featureselected: function (e) {
      var chk = Ext.getCmp('id_select_feat').pressed;
      if (chk == false) return false;
      ///// DISABLE POPUP ==> else create_popup_vectorLayer(e.feature);
      else {
        create_iframe_for_i2(e.feature);
      }
    }
  });

  // Add iframe for i2 here

  function create_iframe_for_i2(feature) {

    debugger;

    new Ext.Window({
      title : "i2_iframe"
      ,width : 300
      ,height: 300
      ,layout : 'fit'
      ,items : [{
        xtype : "component"
        ,autoEl : {
          tag : "iframe"
          ,src : "http://www.cnn.com"
        }
      }]
      ,listeners: {
        'close': function(win){
          if (!vectorLayer.features)
            vectorLayer.setZIndex(vectorzindex);
        }
      }
    }).show();
  }

  // Add Popup: create select feature control 05/08/2012
  frm_input_ctrl = new OpenLayers.Control.SelectFeature(vectorLayer);

  function create_popup_vectorLayer(feature) {
    // convert from merc(900913) to gcs(4326)
    var feat = feature.clone();
    feat.geometry.transform(merc, gcs);
    var curr_loc = feat.geometry.toString();
    alert("Point Position: " + curr_loc);
    alert("To be call external script from I2");
    Ext.getCmp('id_location').setValue(curr_loc);

    if (!popup_vectorLayer) {
      popup_vectorLayer = Ext.create('GeoExt.window.Popup', {
        title: 'DSI Popup',
        id: 'id_popup',
        location: feature,
        width: 604,
        items: [frm_input],
        maximizable: true,
        collapsible: true,
        closeAction: 'hide',
        anchorPosition: 'auto'
      });
      // unselect feature when the popup is closed
      popup_vectorLayer.on({
        close: function () {
          if (OpenLayers.Util.indexOf(vectorLayer.selectedFeatures, this.feature) > -1) {
            frm_input_ctrl.unselect(this.feature);
          }
        }
      });
    }
    //popup_vectorLayer.center(); ERROR: popup has no method center ??
    popup_vectorLayer.show();
  }

  // Add Popup: define "create_popup_vectorLayer" function + Input Form
  frm_input = Ext.create('Ext.form.Panel', {
    title: 'Inner Tabs',
    id: 'id_frm_input',
    url: 'rb/process_input.rb',
    bodyStyle: 'padding:5px',
    width: 600,
    fieldDefaults: {
      labelAlign: 'top',
      msgTarget: 'side'
    },
    defaults: {
      anchor: '100%'
    },
    items: [{
      layout: 'column',
      border: false,
      items: [{
        columnWidth: .5,
        border: false,
        layout: 'anchor',
        defaultType: 'textfield',
        items: [{
          fieldLabel: 'First Name',
          name: 'first',
          anchor: '95%'
        }, {
          fieldLabel: 'Company',
          name: 'company',
          anchor: '95%'
        }]
      }, {
        columnWidth: .5,
        border: false,
        layout: 'anchor',
        defaultType: 'textfield',
        items: [{
          fieldLabel: 'Last Name',
          name: 'last',
          anchor: '95%'
        }, {
          fieldLabel: 'Email',
          name: 'email',
          vtype: 'email',
          anchor: '95%'
        }]
      }]
    }, {
      xtype: 'tabpanel',
      plain: true,
      activeTab: 0,
      height: 235,
      defaults: {
        bodyStyle: 'padding:10px'
      },
      items: [{
        title: 'Demo Input',
        defaults: {
          width: 200
        },
        items: [{
          xtype: 'textfield',
          fieldLabel: 'Title',
          name: 'name',
          allowBlank: false
          //CHECK!!!
          ,
          enableKeyEvents: true,
          listeners: {
            keyup: function () {
              Ext.getCmp('id_upload_title').setValue(this.value);
            }
          }
        }, {
          xtype: 'combo',
          fieldLabel: 'Select Layer',
          id: 'id_icon',
          listConfig: {
            getInnerTpl: function () {
              // here you place the images in your combo
              var tpl = '<div>' + '<img src="img/{icon}.png" align="left" width="16" height="16" >&nbsp;&nbsp;' + '{text}</div>';
              return tpl;
            }
          },
          store: new Ext.data.SimpleStore({
            // Add more layers in dropdown here
            data: [
              ['icon1', 'Layer 1'],
              ['icon2', 'Layer 2'],
              ['x1', 'Label 1'],
              ['x2', 'Label 2'],
              ['x3', 'Label 3'],
              ['x4', 'Label 4'],
              ['x5', 'Label 5'],
              ['x6', 'Label 6'],
              ['x7', 'Label 7'],
              ['x8', 'Label 8'],
              ['x9', 'Label 9'],
              ['a001', 'aircraft-carrier'],
              ['a002', 'airfield'],
              ['a003', 'ambush'],
              ['a004', 'anbchart'],
              ['a005', 'apc'],
              ['a006', 'attack-helicopter'],
              ['a007', 'audiodoc'],
              ['b001', 'bodyguard'],
              ['b002', 'bomber'],
              ['b003', 'book'],
              ['b004', 'bridge'],
              ['b005', 'building'],
              ['b006', 'building-ruined'],
              ['c001', 'cargo-plane-fixed-wing'],
              ['c002', 'cargo-plane-rotary-wing'],
              ['c003', 'checkpoint'],
              ['c004', 'communications-center'],
              ['c005', 'crater'],
              ['d001', 'destroyer'],
              ['d002', 'detonation'],
              ['d003', 'dump-truck'],
              ['e001', 'explosion'],
              ['f001', 'fighter'],
              ['f002', 'fr-arson-fire'],
              ['f003', 'fr-assassination'],
              ['f004', 'fr-black-list-location'],
              ['f005', 'fr-bombing'],
              ['f006', 'fr-booby-trap'],
              ['f007', 'fr-demonstration'],
              ['f008', 'fr-drive-by-shooting'],
              ['f009', 'fr-drug-operation'],
              ['f010', 'fr-drug-vehicle'],
              ['f011', 'fr-extortion'],
              ['f012', 'fr-graffiti'],
              ['f013', 'fr-grey-list-location'],
              ['f014', 'fr-hijacking-aircraft'],
              ['f015', 'fr-hijacking-boat'],
              ['f016', 'fr-hijacking-vehicle'],
              ['f017', 'fr-internal-security-force'],
              ['f018', 'fr-kidnapping'],
              ['f019', 'fr-mine-laying'],
              ['f020', 'fr-patrolling'],
              ['f021', 'fr-poisoning'],
              ['f022', 'fr-psyop'],
              ['f023', 'fr-psyop-house-to-house-propaganda'],
              ['f024', 'fr-psyop-radio-and-tv-propaganda'],
              ['f025', 'fr-psyop-written-propaganda'],
              ['f026', 'fr-recruitment-coerced'],
              ['f027', 'fr-refugees'],
              ['f028', 'fr-sniping'],
              ['f029', 'fr-spy'],
              ['f030', 'fr-vandalism-rape-looting-ransacking'],
              ['f031', 'fr-white-list-location'],
              ['g001', 'garage'],
              ['g002', 'guerrilla'],
              ['g003', 'gun-emplacement'],
              ['h001', 'hand-grenade'],
              ['h002', 'ho-arson-fire'],
              ['h003', 'ho-assassination'],
              ['h004', 'ho-black-list-location'],
              ['h005', 'ho-bombing'],
              ['h006', 'ho-booby-trap'],
              ['h007', 'ho-demonstration'],
              ['h008', 'ho-drive-by-shooting'],
              ['h009', 'ho-drug-operation'],
              ['h010', 'ho-drug-vehicle'],
              ['h011', 'ho-extortion'],
              ['h012', 'ho-graffiti'],
              ['h013', 'ho-grey-list-location'],
              ['h014', 'ho-hijacking-aircraft'],
              ['h015', 'ho-hijacking-boat'],
              ['h016', 'ho-hijacking-vehicle'],
              ['h017', 'ho-internal-security-force'],
              ['h018', 'ho-kidnapping'],
              ['h019', 'ho-mine-laying'],
              ['h020', 'ho-patrolling'],
              ['h021', 'ho-poisoning'],
              ['h022', 'ho-psyop'],
              ['h023', 'ho-psyop-house-to-house-propaganda'],
              ['h024', 'ho-psyop-radio-and-tv-propaganda'],
              ['h025', 'ho-psyop-written-propaganda'],
              ['h026', 'ho-recruitment-coerced'],
              ['h027', 'ho-refugees'],
              ['h028', 'ho-sniping'],
              ['h029', 'ho-spy'],
              ['h030', 'ho-vandalism-rape-looting-ransacking'],
              ['h031', 'ho-white-list-location'],
              ['I001', 'Icon-Sample'],
              ['i001', 'ied'],
              ['i002', 'insurgent'],
              ['k001', 'kidnapper'],
              ['m001', 'manpads'],
              ['m002', 'maritime'],
              ['m003', 'mbrl'],
              ['m004', 'mbt'],
              ['m005', 'military-base'],
              ['m006', 'minefield'],
              ['m007', 'moneybag'],
              ['m008', 'mortar'],
              ['n001', 'nato'],
              ['n002', 'ne-arson-fire'],
              ['n003', 'ne-assassination'],
              ['n004', 'ne-black-list-location'],
              ['n005', 'ne-bombing'],
              ['n006', 'ne-booby-trap'],
              ['n007', 'ne-demonstration'],
              ['n008', 'ne-drive-by-shooting'],
              ['n009', 'ne-drug-operation'],
              ['n010', 'ne-drug-vehicle'],
              ['n011', 'ne-extortion'],
              ['n012', 'ne-graffiti'],
              ['n013', 'ne-grey-list-location'],
              ['n014', 'ne-hijacking-aircraft'],
              ['n015', 'ne-hijacking-boat'],
              ['n016', 'ne-hijacking-vehicle'],
              ['n017', 'ne-internal-security-force'],
              ['n018', 'ne-kidnapping'],
              ['n019', 'ne-mine-laying'],
              ['n020', 'ne-patrolling'],
              ['n021', 'ne-poisoning'],
              ['n022', 'ne-psyop'],
              ['n023', 'ne-psyop-house-to-house-propaganda'],
              ['n024', 'ne-psyop-radio-and-tv-propaganda'],
              ['n025', 'ne-psyop-written-propaganda'],
              ['n026', 'ne-recruitment-coerced'],
              ['n027', 'ne-refugees'],
              ['n028', 'ne-sniping'],
              ['n029', 'ne-spy'],
              ['n030', 'ne-vandalism-rape-looting-ransacking'],
              ['n031', 'ne-white-list-location'],
              ['o001', 'observation-tower'],
              ['o002', 'opfor'],
              ['p001', 'patrol'],
              ['p002', 'patrol-boat'],
              ['p003', 'patrol-vehicle'],
              ['p004', 'pow'],
              ['r001', 'radar-site'],
              ['r002', 'road-block'],
              ['r003', 'rocket-attack'],
              ['r004', 'rpg'],
              ['s001', 'safe-house'],
              ['s002', 'sfapmfb'],
              ['s003', 'sfapmf'],
              ['s004', 'sfapmff'],
              ['s005', 'sfapmha'],
              ['s006', 'sfapmh'],
              ['s007', 'sfapmhm'],
              ['s008', 'sfapw'],
              ['s009', 'sfapwmsa'],
              ['s010', 'sfapwms'],
              ['s011', 'sfapwmss'],
              ['s012', 'sffpg'],
              ['s013', 'sfgpucaa'],
              ['s014', 'sfgpuca'],
              ['s015', 'sfgpucd'],
              ['s016', 'sfgpucec'],
              ['s017', 'sfgpucf'],
              ['s018', 'sfgpucfrm'],
              ['s019', 'sfgpucia'],
              ['s020', 'sfgpuci'],
              ['s021', 'sfgpucigd'],
              ['s022', 'sfgpucil'],
              ['s023', 'sfgpucim'],
              ['s024', 'sfgpucio'],
              ['s025', 'sfgpucis'],
              ['s026', 'sfgpuciz'],
              ['s027', 'sfgpucr'],
              ['s028', 'sfgpucrva'],
              ['s029', 'sfgpucrx'],
              ['s030', 'sfgpucvr'],
              ['s031', 'sfgpucvu'],
              ['s032', 'sfgpus'],
              ['s033', 'sfgpusmm'],
              ['s034', 'sfgpuss'],
              ['s035', 'sfgpusx'],
              ['s036', 'sfgpuua'],
              ['s037', 'sfgpuuacr'],
              ['s038', 'sfgpuulm'],
              ['s039', 'sfgpuum'],
              ['s040', 'sfgpuumc'],
              ['s041', 'sfgpuus'],
              ['s042', 'sfspc'],
              ['s043', 'sfups'],
              ['s044', 'shapmfb'],
              ['s045', 'shapmf'],
              ['s046', 'shapmff'],
              ['s047', 'shapmha'],
              ['s048', 'shapmh'],
              ['s049', 'shapmhm'],
              ['s050', 'shapw'],
              ['s051', 'shapwmsa'],
              ['s052', 'shapwms'],
              ['s053', 'shapwmss'],
              ['s054', 'shelter'],
              ['s055', 'shfpg'],
              ['s056', 'shgpucaa'],
              ['s057', 'shgpuca'],
              ['s058', 'shgpucd'],
              ['s059', 'shgpucec'],
              ['s060', 'shgpucf'],
              ['s061', 'shgpucfrm'],
              ['s062', 'shgpucia'],
              ['s063', 'shgpuci'],
              ['s064', 'shgpucigd'],
              ['s065', 'shgpucil'],
              ['s066', 'shgpucim'],
              ['s067', 'shgpucio'],
              ['s068', 'shgpucis'],
              ['s069', 'shgpuciz'],
              ['s070', 'shgpucr'],
              ['s071', 'shgpucrva'],
              ['s072', 'shgpucrx'],
              ['s073', 'shgpucvr'],
              ['s074', 'shgpucvu'],
              ['s075', 'shgpus'],
              ['s076', 'shgpusmm'],
              ['s077', 'shgpuss'],
              ['s078', 'shgpusx'],
              ['s079', 'shgpuua'],
              ['s080', 'shgpuuacr'],
              ['s081', 'shgpuulm'],
              ['s082', 'shgpuum'],
              ['s083', 'shgpuumc'],
              ['s084', 'shgpuus'],
              ['s085', 'shspc'],
              ['s086', 'shups'],
              ['s087', 'snapmfb'],
              ['s088', 'snapmf'],
              ['s089', 'snapmff'],
              ['s090', 'snapmha'],
              ['s091', 'snapmh'],
              ['s092', 'snapmhm'],
              ['s093', 'snapw'],
              ['s094', 'snapwmsa'],
              ['s095', 'snapwms'],
              ['s096', 'snapwmss'],
              ['s097', 'snfpg'],
              ['s098', 'sngpucaa'],
              ['s099', 'sngpuca'],
              ['s100', 'sngpucd'],
              ['s101', 'sngpucec'],
              ['s102', 'sngpucf'],
              ['s103', 'sngpucfrm'],
              ['s104', 'sngpucia'],
              ['s105', 'sngpuci'],
              ['s106', 'sngpucigd'],
              ['s107', 'sngpucil'],
              ['s108', 'sngpucim'],
              ['s109', 'sngpucio'],
              ['s110', 'sngpucis'],
              ['s111', 'sngpuciz'],
              ['s112', 'sngpucr'],
              ['s113', 'sngpucrva'],
              ['s114', 'sngpucrx'],
              ['s115', 'sngpucvr'],
              ['s116', 'sngpucvu'],
              ['s117', 'sngpus'],
              ['s118', 'sngpusmm'],
              ['s119', 'sngpuss'],
              ['s120', 'sngpusx'],
              ['s121', 'sngpuua'],
              ['s122', 'sngpuuacr'],
              ['s123', 'sngpuulm'],
              ['s124', 'sngpuum'],
              ['s125', 'sngpuumc'],
              ['s126', 'sngpuus'],
              ['s127', 'sniper'],
              ['s128', 'snspc'],
              ['s129', 'snups'],
              ['s130', 'soldier'],
              ['s131', 'spreadsheetdoc'],
              ['s132', 'suapmfb'],
              ['s133', 'suapmf'],
              ['s134', 'suapmff'],
              ['s135', 'suapmha'],
              ['s136', 'suapmh'],
              ['s137', 'suapmhm'],
              ['s138', 'suapw'],
              ['s139', 'suapwmsa'],
              ['s140', 'suapwms'],
              ['s141', 'suapwmss'],
              ['s142', 'submarine'],
              ['s143', 'sufpg'],
              ['s144', 'sugpucaa'],
              ['s145', 'sugpuca'],
              ['s146', 'sugpucd'],
              ['s147', 'sugpucec'],
              ['s148', 'sugpucf'],
              ['s149', 'sugpucfrm'],
              ['s150', 'sugpucia'],
              ['s151', 'sugpuci'],
              ['s152', 'sugpucigd'],
              ['s153', 'sugpucil'],
              ['s154', 'sugpucim'],
              ['s155', 'sugpucio'],
              ['s156', 'sugpucis'],
              ['s157', 'sugpuciz'],
              ['s158', 'sugpucr'],
              ['s159', 'sugpucrva'],
              ['s160', 'sugpucrx'],
              ['s161', 'sugpucvr'],
              ['s162', 'sugpucvu'],
              ['s163', 'sugpus'],
              ['s164', 'sugpusmm'],
              ['s165', 'sugpuss'],
              ['s166', 'sugpusx'],
              ['s167', 'sugpuua'],
              ['s168', 'sugpuuacr'],
              ['s169', 'sugpuulm'],
              ['s170', 'sugpuum'],
              ['s171', 'sugpuumc'],
              ['s172', 'sugpuus'],
              ['s173', 'support-helicopter'],
              ['s174', 'surveillance-aircraft-fixed-wing'],
              ['s175', 'surveillance-aircraft-rotary-wing'],
              ['s176', 'suspc'],
              ['s177', 'suups'],
              ['t001', 'technical-support'],
              ['t002', 'textchartviz'],
              ['t003', 'trailer'],
              ['u001', 'uav'],
              ['u002', 'un-arson-fire'],
              ['u003', 'un-assassination'],
              ['u004', 'un-black-list-location'],
              ['u005', 'un-bombing'],
              ['u006', 'un-booby-trap'],
              ['u007', 'un-demonstration'],
              ['u008', 'un-drive-by-shooting'],
              ['u009', 'un-drug-operation'],
              ['u010', 'un-drug-vehicle'],
              ['u011', 'unexploded-ordnance'],
              ['u012', 'un-extortion'],
              ['u013', 'un-graffiti'],
              ['u014', 'un-grey-list-location'],
              ['u015', 'un-hijacking-aircraft'],
              ['u016', 'un-hijacking-boat'],
              ['u017', 'un-hijacking-vehicle'],
              ['u018', 'un-internal-security-force'],
              ['u019', 'un-kidnapping'],
              ['u020', 'un-mine-laying'],
              ['u021', 'un-patrolling'],
              ['u022', 'un-poisoning'],
              ['u023', 'un-psyop'],
              ['u024', 'un-psyop-house-to-house-propaganda'],
              ['u025', 'un-psyop-radio-and-tv-propaganda'],
              ['u026', 'un-psyop-written-propaganda'],
              ['u027', 'un-recruitment-coerced'],
              ['u028', 'un-refugees'],
              ['u029', 'un-sniping'],
              ['u030', 'un-spy'],
              ['u031', 'un-vandalism-rape-looting-ransacking'],
              ['u032', 'un-white-list-location'],
              ['u033', 'utility-vehicle'],
              ['v001', 'videospool'],
              ['w001', 'weapons-cache'],
              ['w002', 'web-page']
            ],
            id: 0,
            fields: ['icon', 'text']
          }),
          valueField: 'icon',
          displayField: 'text',
          triggerAction: 'all',
          editable: false,
          name: 'icon'
        }, {
          xtype: 'textfield',
          fieldLabel: 'Description',
          name: 'description',
          allowBlank: false
        }, {
          xtype: 'textareafield',
          fieldLabel: 'Location',
          name: 'location',
          id: 'id_location',
          width: '100%',
          anchor: '100%'
        }]
      }, {
        xtype: 'form',
        title: 'Upload Photo',
        width: 500,
        frame: true,
        title: 'Upload photo',
        bodyPadding: '10 10 0',
        defaults: {
          anchor: '100%',
          xtype: 'textfield',
          msgTarget: 'side',
          labelWidth: 50
        },
        items: [{
          fieldLabel: 'Title',
          id: 'id_upload_title',
          name: 'upload_title',
          disabled: true
        }, {
          xtype: 'filefield',
          name: 'file',
          id: 'id_file',
          fieldLabel: 'Photo',
          labelWidth: 50,
          msgTarget: 'side',
          allowBlank: true,
          buttonText: '',
          buttonConfig: {
            iconCls: 'upload'
          }
        }, {
          fieldLabel: 'File saved',
          name: 'origname',
          id: 'id_origname'
        }, {
          xtype: 'hidden',
          name: 'imgname',
          id: 'id_imgname'
        }],
        buttons: [{
          text: 'Upload',
          handler: function () {
            var form = this.up('form').getForm();
            if (form.isValid()) {
              form.submit({
                url: 'rb/file-upload.rb',
                waitMsg: 'Uploading photo...'
                //,success: function(response, opts) { NOT WORKING ?!?!?
                ,
                success: function (fp, o) {
                  var data = Ext.decode(o.response.responseText);
                  var imgname = data.imgname;
                  var origname = data.origname;
                  Ext.getCmp('id_imgname').setValue(imgname);
                  Ext.getCmp('id_origname').setValue(origname);
                  info('Success', 'File ' + origname + ' has been uploaded!');
                }
              })
            }
          }
        }, {
          text: 'Reset',
          handler: function () {
            this.up('form').getForm().reset();
          }
        }]
      }, {
        cls: 'x-plain',
        title: 'WYSIWYG',
        layout: 'fit',
        items: {
          xtype: 'htmleditor',
          name: 'wysiwyg',
          fieldLabel: 'WYSIWYG'
        }
      }]
    }],
    buttons: [{
      text: 'Save',
      handler: function () {
        frm_input.getForm().submit({
          success: function (f, a) {
            Ext.Msg.show({
              title: 'Info',
              msg: '1 feature added!',
              buttons: Ext.Msg.OK,
              icon: Ext.Msg.INFO,
              fn: function (btn) {
                // Remove all features
                // Reset input form
                // Hide popup
                // Refresh pointLayer
                vectorLayer.removeAllFeatures();
                frm_input.getForm().reset();
                popup_vectorLayer.hide();
                // Update new feature in pointLayer ?? better solution ??
                if (pointLayer) {
                  map.removeLayer(pointLayer);
                  map.removeControl(ctrl_popup_pointLayer);
                  pointLayer = null;
                  ctrl_popup_pointLayer = null;
                }
                create_layer_pointLayer();
                map.addLayer(pointLayer);
                frm_input_ctrl.deactivate();
              }
            });
          },
          failure: function (f, a) {
            Ext.Msg.alert('Error', 'Failed!!');
          }
        })
      }
    }, {
      text: 'Cancel',
      handler: function () {
        var o = Ext.getCmp('id_location');
        // Remember current location
        var curr_loc = o.getValue();
        frm_input.getForm().reset();
        // Set current location back to form
        o.setValue(curr_loc);
      }
    }]
  });
}
create_layer_pointLayer = function () {
  // Blank style
  // v_style = new OpenLayers.Style({});
  var v_style = new OpenLayers.Style({
    'fillColor': '#ffffff',
    'fillOpacity': .8,
    'strokeColor': '#aa0000',
    'strokeWidth': 2,
    'pointRadius': 3
  });
  var v_style_map = new OpenLayers.StyleMap({
    'default': v_style
  });
  var sym_lookup = {
    'layer_1': {
      'backgroundGraphic': 'img/icon_marker_green.png',
      'backgroundWidth': 32,
      'backgroundHeight': 32,
      'backgroundYOffset': -32
    },
    'layer_2': {
      'backgroundGraphic': 'img/icon_marker_blue.png',
      'backgroundWidth': 32,
      'backgroundHeight': 32,
      'backgroundYOffset': -32
    },
    'layer_x1': {
      'backgroundGraphic': 'img/x1.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x2': {
      'backgroundGraphic': 'img/x2.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x3': {
      'backgroundGraphic': 'img/x3.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x4': {
      'backgroundGraphic': 'img/x4.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x5': {
      'backgroundGraphic': 'img/x5.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x6': {
      'backgroundGraphic': 'img/x6.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x7': {
      'backgroundGraphic': 'img/x7.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x8': {
      'backgroundGraphic': 'img/x8.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_x9': {
      'backgroundGraphic': 'img/x9.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_a001': {
      'backgroundGraphic': 'img/a001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_a002': {
      'backgroundGraphic': 'img/a002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_a003': {
      'backgroundGraphic': 'img/a003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_a004': {
      'backgroundGraphic': 'img/a004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_a005': {
      'backgroundGraphic': 'img/a005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_a006': {
      'backgroundGraphic': 'img/a006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_a007': {
      'backgroundGraphic': 'img/a007.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_b001': {
      'backgroundGraphic': 'img/b001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_b002': {
      'backgroundGraphic': 'img/b002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_b003': {
      'backgroundGraphic': 'img/b003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_b004': {
      'backgroundGraphic': 'img/b004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_b005': {
      'backgroundGraphic': 'img/b005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_b006': {
      'backgroundGraphic': 'img/b006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_c001': {
      'backgroundGraphic': 'img/c001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_c002': {
      'backgroundGraphic': 'img/c002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_c003': {
      'backgroundGraphic': 'img/c003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_c004': {
      'backgroundGraphic': 'img/c004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_c005': {
      'backgroundGraphic': 'img/c005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_d001': {
      'backgroundGraphic': 'img/d001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_d002': {
      'backgroundGraphic': 'img/d002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_d003': {
      'backgroundGraphic': 'img/d003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_e001': {
      'backgroundGraphic': 'img/e001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f001': {
      'backgroundGraphic': 'img/f001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f002': {
      'backgroundGraphic': 'img/f002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f003': {
      'backgroundGraphic': 'img/f003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f004': {
      'backgroundGraphic': 'img/f004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f005': {
      'backgroundGraphic': 'img/f005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f006': {
      'backgroundGraphic': 'img/f006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f007': {
      'backgroundGraphic': 'img/f007.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f008': {
      'backgroundGraphic': 'img/f008.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f009': {
      'backgroundGraphic': 'img/f009.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f010': {
      'backgroundGraphic': 'img/f010.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f011': {
      'backgroundGraphic': 'img/f011.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f012': {
      'backgroundGraphic': 'img/f012.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f013': {
      'backgroundGraphic': 'img/f013.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f014': {
      'backgroundGraphic': 'img/f014.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f015': {
      'backgroundGraphic': 'img/f015.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f016': {
      'backgroundGraphic': 'img/f016.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f017': {
      'backgroundGraphic': 'img/f017.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f018': {
      'backgroundGraphic': 'img/f018.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f019': {
      'backgroundGraphic': 'img/f019.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f020': {
      'backgroundGraphic': 'img/f020.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f021': {
      'backgroundGraphic': 'img/f021.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f022': {
      'backgroundGraphic': 'img/f022.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f023': {
      'backgroundGraphic': 'img/f023.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f024': {
      'backgroundGraphic': 'img/f024.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f025': {
      'backgroundGraphic': 'img/f025.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f026': {
      'backgroundGraphic': 'img/f026.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f027': {
      'backgroundGraphic': 'img/f027.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f028': {
      'backgroundGraphic': 'img/f028.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f029': {
      'backgroundGraphic': 'img/f029.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f030': {
      'backgroundGraphic': 'img/f030.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_f031': {
      'backgroundGraphic': 'img/f031.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_g001': {
      'backgroundGraphic': 'img/g001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_g002': {
      'backgroundGraphic': 'img/g002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_g003': {
      'backgroundGraphic': 'img/g003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h001': {
      'backgroundGraphic': 'img/h001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h002': {
      'backgroundGraphic': 'img/h002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h003': {
      'backgroundGraphic': 'img/h003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h004': {
      'backgroundGraphic': 'img/h004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h005': {
      'backgroundGraphic': 'img/h005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h006': {
      'backgroundGraphic': 'img/h006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h007': {
      'backgroundGraphic': 'img/h007.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h008': {
      'backgroundGraphic': 'img/h008.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h009': {
      'backgroundGraphic': 'img/h009.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h010': {
      'backgroundGraphic': 'img/h010.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h011': {
      'backgroundGraphic': 'img/h011.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h012': {
      'backgroundGraphic': 'img/h012.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h013': {
      'backgroundGraphic': 'img/h013.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h014': {
      'backgroundGraphic': 'img/h014.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h015': {
      'backgroundGraphic': 'img/h015.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h016': {
      'backgroundGraphic': 'img/h016.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h017': {
      'backgroundGraphic': 'img/h017.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h018': {
      'backgroundGraphic': 'img/h018.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h019': {
      'backgroundGraphic': 'img/h019.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h020': {
      'backgroundGraphic': 'img/h020.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h021': {
      'backgroundGraphic': 'img/h021.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h022': {
      'backgroundGraphic': 'img/h022.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h023': {
      'backgroundGraphic': 'img/h023.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h024': {
      'backgroundGraphic': 'img/h024.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h025': {
      'backgroundGraphic': 'img/h025.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h026': {
      'backgroundGraphic': 'img/h026.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h027': {
      'backgroundGraphic': 'img/h027.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h028': {
      'backgroundGraphic': 'img/h028.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h029': {
      'backgroundGraphic': 'img/h029.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h030': {
      'backgroundGraphic': 'img/h030.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_h031': {
      'backgroundGraphic': 'img/h031.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_I001': {
      'backgroundGraphic': 'img/I001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_i001': {
      'backgroundGraphic': 'img/i001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_i002': {
      'backgroundGraphic': 'img/i002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_k001': {
      'backgroundGraphic': 'img/k001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m001': {
      'backgroundGraphic': 'img/m001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m002': {
      'backgroundGraphic': 'img/m002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m003': {
      'backgroundGraphic': 'img/m003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m004': {
      'backgroundGraphic': 'img/m004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m005': {
      'backgroundGraphic': 'img/m005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m006': {
      'backgroundGraphic': 'img/m006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m007': {
      'backgroundGraphic': 'img/m007.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_m008': {
      'backgroundGraphic': 'img/m008.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n001': {
      'backgroundGraphic': 'img/n001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n002': {
      'backgroundGraphic': 'img/n002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n003': {
      'backgroundGraphic': 'img/n003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n004': {
      'backgroundGraphic': 'img/n004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n005': {
      'backgroundGraphic': 'img/n005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n006': {
      'backgroundGraphic': 'img/n006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n007': {
      'backgroundGraphic': 'img/n007.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n008': {
      'backgroundGraphic': 'img/n008.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n009': {
      'backgroundGraphic': 'img/n009.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n010': {
      'backgroundGraphic': 'img/n010.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n011': {
      'backgroundGraphic': 'img/n011.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n012': {
      'backgroundGraphic': 'img/n012.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n013': {
      'backgroundGraphic': 'img/n013.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n014': {
      'backgroundGraphic': 'img/n014.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n015': {
      'backgroundGraphic': 'img/n015.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n016': {
      'backgroundGraphic': 'img/n016.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n017': {
      'backgroundGraphic': 'img/n017.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n018': {
      'backgroundGraphic': 'img/n018.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n019': {
      'backgroundGraphic': 'img/n019.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n020': {
      'backgroundGraphic': 'img/n020.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n021': {
      'backgroundGraphic': 'img/n021.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n022': {
      'backgroundGraphic': 'img/n022.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n023': {
      'backgroundGraphic': 'img/n023.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n024': {
      'backgroundGraphic': 'img/n024.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n025': {
      'backgroundGraphic': 'img/n025.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n026': {
      'backgroundGraphic': 'img/n026.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n027': {
      'backgroundGraphic': 'img/n027.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n028': {
      'backgroundGraphic': 'img/n028.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n029': {
      'backgroundGraphic': 'img/n029.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n030': {
      'backgroundGraphic': 'img/n030.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_n031': {
      'backgroundGraphic': 'img/n031.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_o001': {
      'backgroundGraphic': 'img/o001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_o002': {
      'backgroundGraphic': 'img/o002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_p001': {
      'backgroundGraphic': 'img/p001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_p002': {
      'backgroundGraphic': 'img/p002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_p003': {
      'backgroundGraphic': 'img/p003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_p004': {
      'backgroundGraphic': 'img/p004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_r001': {
      'backgroundGraphic': 'img/r001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_r002': {
      'backgroundGraphic': 'img/r002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_r003': {
      'backgroundGraphic': 'img/r003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_r004': {
      'backgroundGraphic': 'img/r004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s001': {
      'backgroundGraphic': 'img/s001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s002': {
      'backgroundGraphic': 'img/s002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s003': {
      'backgroundGraphic': 'img/s003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s004': {
      'backgroundGraphic': 'img/s004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s005': {
      'backgroundGraphic': 'img/s005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s006': {
      'backgroundGraphic': 'img/s006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s007': {
      'backgroundGraphic': 'img/s007.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s008': {
      'backgroundGraphic': 'img/s008.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s009': {
      'backgroundGraphic': 'img/s009.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s010': {
      'backgroundGraphic': 'img/s010.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s011': {
      'backgroundGraphic': 'img/s011.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s012': {
      'backgroundGraphic': 'img/s012.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s013': {
      'backgroundGraphic': 'img/s013.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s014': {
      'backgroundGraphic': 'img/s014.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s015': {
      'backgroundGraphic': 'img/s015.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s016': {
      'backgroundGraphic': 'img/s016.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s017': {
      'backgroundGraphic': 'img/s017.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s018': {
      'backgroundGraphic': 'img/s018.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s019': {
      'backgroundGraphic': 'img/s019.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s020': {
      'backgroundGraphic': 'img/s020.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s021': {
      'backgroundGraphic': 'img/s021.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s022': {
      'backgroundGraphic': 'img/s022.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s023': {
      'backgroundGraphic': 'img/s023.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s024': {
      'backgroundGraphic': 'img/s024.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s025': {
      'backgroundGraphic': 'img/s025.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s026': {
      'backgroundGraphic': 'img/s026.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s027': {
      'backgroundGraphic': 'img/s027.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s028': {
      'backgroundGraphic': 'img/s028.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s029': {
      'backgroundGraphic': 'img/s029.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s030': {
      'backgroundGraphic': 'img/s030.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s031': {
      'backgroundGraphic': 'img/s031.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s032': {
      'backgroundGraphic': 'img/s032.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s033': {
      'backgroundGraphic': 'img/s033.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s034': {
      'backgroundGraphic': 'img/s034.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s035': {
      'backgroundGraphic': 'img/s035.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s036': {
      'backgroundGraphic': 'img/s036.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s037': {
      'backgroundGraphic': 'img/s037.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s038': {
      'backgroundGraphic': 'img/s038.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s039': {
      'backgroundGraphic': 'img/s039.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s040': {
      'backgroundGraphic': 'img/s040.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s041': {
      'backgroundGraphic': 'img/s041.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s042': {
      'backgroundGraphic': 'img/s042.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s043': {
      'backgroundGraphic': 'img/s043.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s044': {
      'backgroundGraphic': 'img/s044.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s045': {
      'backgroundGraphic': 'img/s045.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s046': {
      'backgroundGraphic': 'img/s046.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s047': {
      'backgroundGraphic': 'img/s047.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s048': {
      'backgroundGraphic': 'img/s048.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s049': {
      'backgroundGraphic': 'img/s049.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s050': {
      'backgroundGraphic': 'img/s050.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s051': {
      'backgroundGraphic': 'img/s051.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s052': {
      'backgroundGraphic': 'img/s052.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s053': {
      'backgroundGraphic': 'img/s053.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s054': {
      'backgroundGraphic': 'img/s054.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s055': {
      'backgroundGraphic': 'img/s055.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s056': {
      'backgroundGraphic': 'img/s056.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s057': {
      'backgroundGraphic': 'img/s057.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s058': {
      'backgroundGraphic': 'img/s058.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s059': {
      'backgroundGraphic': 'img/s059.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s060': {
      'backgroundGraphic': 'img/s060.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s061': {
      'backgroundGraphic': 'img/s061.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s062': {
      'backgroundGraphic': 'img/s062.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s063': {
      'backgroundGraphic': 'img/s063.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s064': {
      'backgroundGraphic': 'img/s064.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s065': {
      'backgroundGraphic': 'img/s065.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s066': {
      'backgroundGraphic': 'img/s066.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s067': {
      'backgroundGraphic': 'img/s067.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s068': {
      'backgroundGraphic': 'img/s068.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s069': {
      'backgroundGraphic': 'img/s069.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s070': {
      'backgroundGraphic': 'img/s070.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s071': {
      'backgroundGraphic': 'img/s071.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s072': {
      'backgroundGraphic': 'img/s072.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s073': {
      'backgroundGraphic': 'img/s073.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s074': {
      'backgroundGraphic': 'img/s074.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s075': {
      'backgroundGraphic': 'img/s075.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s076': {
      'backgroundGraphic': 'img/s076.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s077': {
      'backgroundGraphic': 'img/s077.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s078': {
      'backgroundGraphic': 'img/s078.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s079': {
      'backgroundGraphic': 'img/s079.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s080': {
      'backgroundGraphic': 'img/s080.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s081': {
      'backgroundGraphic': 'img/s081.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s082': {
      'backgroundGraphic': 'img/s082.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s083': {
      'backgroundGraphic': 'img/s083.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s084': {
      'backgroundGraphic': 'img/s084.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s085': {
      'backgroundGraphic': 'img/s085.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s086': {
      'backgroundGraphic': 'img/s086.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s087': {
      'backgroundGraphic': 'img/s087.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s088': {
      'backgroundGraphic': 'img/s088.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s089': {
      'backgroundGraphic': 'img/s089.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s090': {
      'backgroundGraphic': 'img/s090.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s091': {
      'backgroundGraphic': 'img/s091.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s092': {
      'backgroundGraphic': 'img/s092.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s093': {
      'backgroundGraphic': 'img/s093.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s094': {
      'backgroundGraphic': 'img/s094.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s095': {
      'backgroundGraphic': 'img/s095.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s096': {
      'backgroundGraphic': 'img/s096.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s097': {
      'backgroundGraphic': 'img/s097.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s098': {
      'backgroundGraphic': 'img/s098.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s099': {
      'backgroundGraphic': 'img/s099.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s100': {
      'backgroundGraphic': 'img/s100.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s101': {
      'backgroundGraphic': 'img/s101.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s102': {
      'backgroundGraphic': 'img/s102.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s103': {
      'backgroundGraphic': 'img/s103.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s104': {
      'backgroundGraphic': 'img/s104.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s105': {
      'backgroundGraphic': 'img/s105.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s106': {
      'backgroundGraphic': 'img/s106.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s107': {
      'backgroundGraphic': 'img/s107.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s108': {
      'backgroundGraphic': 'img/s108.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s109': {
      'backgroundGraphic': 'img/s109.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s110': {
      'backgroundGraphic': 'img/s110.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s111': {
      'backgroundGraphic': 'img/s111.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s112': {
      'backgroundGraphic': 'img/s112.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s113': {
      'backgroundGraphic': 'img/s113.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s114': {
      'backgroundGraphic': 'img/s114.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s115': {
      'backgroundGraphic': 'img/s115.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s116': {
      'backgroundGraphic': 'img/s116.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s117': {
      'backgroundGraphic': 'img/s117.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s118': {
      'backgroundGraphic': 'img/s118.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s119': {
      'backgroundGraphic': 'img/s119.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s120': {
      'backgroundGraphic': 'img/s120.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s121': {
      'backgroundGraphic': 'img/s121.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s122': {
      'backgroundGraphic': 'img/s122.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s123': {
      'backgroundGraphic': 'img/s123.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s124': {
      'backgroundGraphic': 'img/s124.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s125': {
      'backgroundGraphic': 'img/s125.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s126': {
      'backgroundGraphic': 'img/s126.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s127': {
      'backgroundGraphic': 'img/s127.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s128': {
      'backgroundGraphic': 'img/s128.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s129': {
      'backgroundGraphic': 'img/s129.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s130': {
      'backgroundGraphic': 'img/s130.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s131': {
      'backgroundGraphic': 'img/s131.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s132': {
      'backgroundGraphic': 'img/s132.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s133': {
      'backgroundGraphic': 'img/s133.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s134': {
      'backgroundGraphic': 'img/s134.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s135': {
      'backgroundGraphic': 'img/s135.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s136': {
      'backgroundGraphic': 'img/s136.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s137': {
      'backgroundGraphic': 'img/s137.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s138': {
      'backgroundGraphic': 'img/s138.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s139': {
      'backgroundGraphic': 'img/s139.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s140': {
      'backgroundGraphic': 'img/s140.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s141': {
      'backgroundGraphic': 'img/s141.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s142': {
      'backgroundGraphic': 'img/s142.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s143': {
      'backgroundGraphic': 'img/s143.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s144': {
      'backgroundGraphic': 'img/s144.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s145': {
      'backgroundGraphic': 'img/s145.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s146': {
      'backgroundGraphic': 'img/s146.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s147': {
      'backgroundGraphic': 'img/s147.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s148': {
      'backgroundGraphic': 'img/s148.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s149': {
      'backgroundGraphic': 'img/s149.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s150': {
      'backgroundGraphic': 'img/s150.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s151': {
      'backgroundGraphic': 'img/s151.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s152': {
      'backgroundGraphic': 'img/s152.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s153': {
      'backgroundGraphic': 'img/s153.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s154': {
      'backgroundGraphic': 'img/s154.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s155': {
      'backgroundGraphic': 'img/s155.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s156': {
      'backgroundGraphic': 'img/s156.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s157': {
      'backgroundGraphic': 'img/s157.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s158': {
      'backgroundGraphic': 'img/s158.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s159': {
      'backgroundGraphic': 'img/s159.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s160': {
      'backgroundGraphic': 'img/s160.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s161': {
      'backgroundGraphic': 'img/s161.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s162': {
      'backgroundGraphic': 'img/s162.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s163': {
      'backgroundGraphic': 'img/s163.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s164': {
      'backgroundGraphic': 'img/s164.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s165': {
      'backgroundGraphic': 'img/s165.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s166': {
      'backgroundGraphic': 'img/s166.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s167': {
      'backgroundGraphic': 'img/s167.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s168': {
      'backgroundGraphic': 'img/s168.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s169': {
      'backgroundGraphic': 'img/s169.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s170': {
      'backgroundGraphic': 'img/s170.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s171': {
      'backgroundGraphic': 'img/s171.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s172': {
      'backgroundGraphic': 'img/s172.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s173': {
      'backgroundGraphic': 'img/s173.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s174': {
      'backgroundGraphic': 'img/s174.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s175': {
      'backgroundGraphic': 'img/s175.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s176': {
      'backgroundGraphic': 'img/s176.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_s177': {
      'backgroundGraphic': 'img/s177.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_t001': {
      'backgroundGraphic': 'img/t001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_t002': {
      'backgroundGraphic': 'img/t002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_t003': {
      'backgroundGraphic': 'img/t003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u001': {
      'backgroundGraphic': 'img/u001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u002': {
      'backgroundGraphic': 'img/u002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u003': {
      'backgroundGraphic': 'img/u003.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u004': {
      'backgroundGraphic': 'img/u004.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u005': {
      'backgroundGraphic': 'img/u005.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u006': {
      'backgroundGraphic': 'img/u006.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u007': {
      'backgroundGraphic': 'img/u007.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u008': {
      'backgroundGraphic': 'img/u008.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u009': {
      'backgroundGraphic': 'img/u009.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u010': {
      'backgroundGraphic': 'img/u010.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u011': {
      'backgroundGraphic': 'img/u011.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u012': {
      'backgroundGraphic': 'img/u012.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u013': {
      'backgroundGraphic': 'img/u013.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u014': {
      'backgroundGraphic': 'img/u014.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u015': {
      'backgroundGraphic': 'img/u015.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u016': {
      'backgroundGraphic': 'img/u016.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u017': {
      'backgroundGraphic': 'img/u017.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u018': {
      'backgroundGraphic': 'img/u018.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u019': {
      'backgroundGraphic': 'img/u019.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u020': {
      'backgroundGraphic': 'img/u020.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u021': {
      'backgroundGraphic': 'img/u021.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u022': {
      'backgroundGraphic': 'img/u022.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u023': {
      'backgroundGraphic': 'img/u023.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u024': {
      'backgroundGraphic': 'img/u024.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u025': {
      'backgroundGraphic': 'img/u025.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u026': {
      'backgroundGraphic': 'img/u026.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u027': {
      'backgroundGraphic': 'img/u027.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u028': {
      'backgroundGraphic': 'img/u028.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u029': {
      'backgroundGraphic': 'img/u029.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u030': {
      'backgroundGraphic': 'img/u030.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u031': {
      'backgroundGraphic': 'img/u031.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u032': {
      'backgroundGraphic': 'img/u032.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_u033': {
      'backgroundGraphic': 'img/u033.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_v001': {
      'backgroundGraphic': 'img/v001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_w001': {
      'backgroundGraphic': 'img/w001.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    },
    'layer_w002': {
      'backgroundGraphic': 'img/w002.png',
      'backgroundWidth': 27,
      'backgroundHeight': 27,
      'backgroundYOffset': -27
    }
  };
  v_style_map.addUniqueValueRules('default', 'kmlname', sym_lookup);
  // Create pointLayer here
  // Load features from postgis
  // default featurePrefix for mapserver is "ms" BUT must specify in map file
  // projection gcs MUST be included to display features correctly
  pointLayer = new OpenLayers.Layer.Vector("Custom Layer", {
    projection: gcs,
    strategies: [new OpenLayers.Strategy.BBOX(), new OpenLayers.Strategy.Refresh()],
    protocol: new OpenLayers.Protocol.WFS({
      srsName: 'EPSG:4326',
      url: "http://127.0.0.1/cgi-bin/mapserv?map=/ms603/map/wfs-postgis.map&SERVICE=WFS&srsName=EPSG:4326",
      featureType: "kml",
      featurePrefix: "feature"
    }),
    styleMap: v_style_map
  });
  // Add popup when feature in pointLayer is clicked
  ctrl_popup_pointLayer = new OpenLayers.Control.SelectFeature(pointLayer, {
    hover: true,
    toggle: true,
    clickOut: false,
    multiple: false,
    box: false,
    eventListeners: {
      featurehighlighted: onPointFeatureSelect,
      featureunhighlighted: onPointFeatureUnselect
    }
  });
  map.addControl(ctrl_popup_pointLayer);
  ctrl_popup_pointLayer.activate();

  function onPointFeatureSelect(feat) {
    // Open framedCloud popup on feat
    sel_feat = feat;
    var lon = feat.feature.geometry.x;
    var lat = feat.feature.geometry.y;
    var lonlat = new OpenLayers.LonLat(lon, lat); // This is merc already!
    feature = feat.feature;
    var id = feature.attributes.id;
    var name = feature.attributes.name;
    var img = feature.attributes.imgname;
    var imgurl = "./photos/" + feature.attributes.imgname;
    var descr = feature.attributes.descr;
    // Will be displayed in popup on click at feature
    content = "<h2>" + name + "(id:" + id + ")</h2>";
    if (img) {
      content += "<img class='imgpopup' src='" + imgurl + "' />";
    }
    content += descr;
    popup_pointLayer = new OpenLayers.Popup.FramedCloud("chicken",
    feature.geometry.getBounds().getCenterLonLat(),
    new OpenLayers.Size(250, 180),
    content,
    null, true, onPointPopupClose);
    feature.popup = popup_pointLayer;
    // Force the popup to always open to the top-right
    popup_pointLayer.calculateRelativePosition = function () {
      return 'tr';
    };
    map.addPopup(popup_pointLayer);
  }

  function onPointFeatureUnselect(event) {
    var feature = event.feature;
    if (feature.popup) {
      map.removePopup(feature.popup);
      feature.popup.destroy();
      delete feature.popup;
    }
  }

  function onPointPopupClose(evt) {
    ctrl_popup_pointLayer.unselectAll();
  }
  // Delete Feature in pointLayer both in map and database
  var deleteFromDatabase = function (feature) {
    var id = feature.attributes.id;
    var name = feature.attributes.name;
    Ext.Ajax.request({
      url: 'rb/kml_delete.rb',
      params: {
        id: id
      },
      success: function (resp, opt) {
        info('Result', 'ลบรายการ ' + name + ' ออกจากฐานข้อมูลเรียบร้อยแล้ว');
      },
      failure: function (resp, opt) {
        Ext.Msg.alert('Warning', '');
      }
    });
  };
  var featureRemove = function (feature) {
    var question = "ต้องการลบ  " + feature.attributes.name + " ออกจากฐานข้อมูล ใช่หรือไม่ ?";
    Ext.Msg.confirm('Confirm', question, function (btn) {
      if (btn == 'yes') {
        pointLayer.removeFeatures(feature);
        //delete this feature from database
        deleteFromDatabase(feature);
      }
    })
  };
  var removeOptions = {
    clickout: true,
    onSelect: featureRemove,
    toggle: true,
    multiple: false,
    hover: false
  };
  del_feat_ctrl = new OpenLayers.Control.SelectFeature(pointLayer, removeOptions);
  map.addControl(del_feat_ctrl);
  // del_feat_ctrl is not activated yet
}
create_layer_markers = function () {
  markers = new OpenLayers.Layer.Markers("Markers", {
    displayInLayerSwitcher: true,
    hideIntree: true
  });
}
create_layer_hili = function () {
  hili = new OpenLayers.Layer.WMS("Hili", "http://203.151.201.129/cgi-bin/mapserv", {
    map: '/ms603/map/hili.map',
    layers: 'hili',
    'transparent': true
  }, {
    isBaseLayer: false,
    displayInLayerSwitcher: true,
    singleTile: true,
    ratio: 1,
    hideIntree: true
  });
  hili.setOpacity(0);
}
create_layer_kml = function (kmlname) {
  //debugger;
  var a = kmlname.split('/')[2];
  var name = a.split('.')[0];
  if (kml) kml = null;
  kml = new OpenLayers.Layer.Vector(name, {
    projection: map.displayProjection,
    strategies: [new OpenLayers.Strategy.Fixed()],
    protocol: new OpenLayers.Protocol.HTTP({
      url: kmlname,
      format: new OpenLayers.Format.KML({
        externalProjection: new OpenLayers.Projection("ESPG:4326"),
        internalProjection: new OpenLayers.Projection("ESPG:900913"),
        extractStyles: true,
        extractAttributes: true
      })
    })
  });
  map.addLayer(kml);
  select_kml = new OpenLayers.Control.SelectFeature(kml);
  kml.events.on({
    "featureselected": onFeatureSelectKml,
    "featureunselected": onFeatureUnselectKml
  });
  map.addControl(select_kml);
  select_kml.activate();

  function onPopupKmlClose(evt) {
    select_kml.unselectAll();
  }

  function onFeatureSelectKml(event) {
    var feature = event.feature;
    // Since KML is user-generated, do naive protection against
    // Javascript.
    var content = "<h2>" + feature.attributes.name + "</h2>" + feature.attributes.description;
    if (content.search("<script") != -1) {
      content = "Content contained Javascript! Escaped content below.<br>" + content.replace(/</g, "&lt;");
    }
    popupClass = AutoSizeFramedCloud;
    popup = new OpenLayers.Popup.FramedCloud("chicken",
    feature.geometry.getBounds().getCenterLonLat(),
    new OpenLayers.Size(100, 100),
    content,
    null, true, onPopupKmlClose);
    feature.popup = popup;
    map.addPopup(popup);
  }

  function onFeatureUnselectKml(event) {
    var feature = event.feature;
    if (feature.popup) {
      map.removePopup(feature.popup);
      feature.popup.destroy();
      delete feature.popup;
    }
  }
}
//////////////////////////////////////////////
// GPS
//////////////////////////////////////////////
function dms2dd(ddd, mm, ss) {
  var d = parseFloat(ddd);
  var m = parseFloat(mm) / 60.0;
  var s = parseFloat(ss) / 3600.0;
  return d + m + s;
}

function dd2dms(ll) {
  //debugger;
  var d1 = ll;
  var d2 = parseInt(d1 / 100 * 100);
  var d3 = d1 - d2;
  var d4 = d3 * 60;
  var d5 = parseInt(d4);
  var d6 = d4 - d5;
  var d7 = d6 * 60;
  var dms = [];
  dms[0] = d2;
  dms[1] = d5;
  dms[2] = d7.toFixed(2);
  return dms;
}

function setMarker(lon, lat, msg) {
  var lonLatMarker = new OpenLayers.LonLat(lon, lat).transform(gcs, merc);
  var feature = new OpenLayers.Feature(markers, lonLatMarker);
  feature.closeBox = true;
  feature.popupClass = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble, {
    maxSize: new OpenLayers.Size(120, 75)
  });
  feature.data.popupContentHTML = msg;
  feature.data.overflow = "hidden";
  var size = new OpenLayers.Size(64, 64);
  var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
  var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
  var marker = new OpenLayers.Marker(lonLatMarker, icon);
  marker.feature = feature;
  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    OpenLayers.Event.stop(evt);
  };
  markers.addMarker(marker);
  //map.events.register("click", feature, markerClick);
}

function addMarkers() {
  var ll, popupClass, popupContentHTML;
  //anchored bubble popup wide short text contents autosize closebox
  ll = new OpenLayers.LonLat(13, 100);
  popupClass = AutoSizeFramedCloud;
  popupContentHTML = '<div style="background-color:red;">Popup.FramedCloud<br>autosize - wide short text<br>closebox<br>' + samplePopupContentsHTML_WideShort + '</div>'
  addMarker(ll, popupClass, popupContentHTML, true);
}

function addMarker(ll, popupClass, popupContentHTML, closeBox, overflow) {
  var feature = new OpenLayers.Feature(markers, ll);
  feature.closeBox = closeBox;
  feature.popupClass = popupClass;
  feature.data.popupContentHTML = popupContentHTML;
  feature.data.overflow = (overflow) ? "auto" : "hidden";
  marker = feature.createMarker();
  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    currentPopup = this.popup;
    OpenLayers.Event.stop(evt);
  };
  marker.events.register("mousedown", feature, markerClick);
  markers.addMarker(marker);
}

function onFeatureSelect(feature) {
  selectedFeature = feature;
  popup_marker = new OpenLayers.Popup.FramedCloud("", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(100, 100), "<div style='padding:15px 5px 5px 10px;'>" + "<table style='font-size:13px;color:red'>" + "<tr>" + "<td width='40%'>Name</td>" + "<td width='5%'>:</td>" + "<td>" + feature.attributes.label + "</td>" + "</tr>" + "</table></div>", null, true, onMarkerPopupClose);
  feature.popup = popup_marker;
  map.addPopup(popup_marker);
}

function onMarkerPopupClose(evt) {
  frm_input_ctrl.unselectAll();
}

function onFeatureUnselect(feature) {
  map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}
var test_gps = function () {
  Ext.getCmp('londd').setValue(100);
  Ext.getCmp('lonmm').setValue(33);
  Ext.getCmp('lonss').setValue(57.9126);
  Ext.getCmp('latdd').setValue(13);
  Ext.getCmp('latmm').setValue(53);
  Ext.getCmp('latss').setValue(26.757);
}
var check_gps = function () {
  var lodd = Ext.getCmp('londd').getValue();
  var lomm = Ext.getCmp('lonmm').getValue();
  var loss = Ext.getCmp('lonss').getValue();
  var ladd = Ext.getCmp('latdd').getValue();
  var lamm = Ext.getCmp('latmm').getValue();
  var lass = Ext.getCmp('latss').getValue();
  report(lodd, lomm, loss, ladd, lamm, lass);
}
var report = function (lodd, lomm, loss, ladd, lamm, lass) {
  Ext.Ajax.request({
    url: 'rb/checkLonLat2.rb',
    params: {
      method: 'GET',
      lodd: lodd,
      lomm: lomm,
      loss: loss,
      ladd: ladd,
      lamm: lamm,
      lass: lass,
      format: 'json'
    },
    failure: function (response, opts) {
      alert("checkLonLat2 > failure");
      return false;
    },
    success: function (response, opts) {
      // var data = eval( '(' + response.responseText + ')' );
      // No response from IE
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;
      var p1 = new OpenLayers.LonLat(lon, lat);
      var p2 = p1.transform(gcs, merc);
      map.setCenter(p2, 14);
      var size = new OpenLayers.Size(48, 48);
      var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2, icon));
      info('Result', data.msg);
    }
  });
};
var gps = Ext.create("Ext.form.Panel", {
  title: 'ตำแหน่งพิกัด GPS',
  id: 'id_gps',
  frame: true,
  items: [{
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: 'textfield',
      id: 'londd',
      fieldLabel: 'Lon:DD',
      width: 50
    }, {
      xtype: 'textfield',
      id: 'lonmm',
      fieldLabel: 'Lon:MM',
      width: 50
    }, {
      xtype: 'textfield',
      id: 'lonss',
      fieldLabel: 'Lon:SS',
      width: 50
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'E'
    }]
  }, {
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: 'textfield',
      id: 'latdd',
      fieldLabel: 'Lat:DD',
      width: 50
    }, {
      xtype: 'textfield',
      id: 'latmm',
      fieldLabel: 'Lat:MM',
      width: 50
    }, {
      xtype: 'textfield',
      id: 'latss',
      fieldLabel: 'Lat:SS',
      width: 50
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'N'
    }]
  }, {
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: 'button',
      text: 'Check',
      handler: check_gps,
      width: 80
    }, {
      xtype: 'button',
      text: 'Clear',
      handler: function () {
        gps.getForm().reset();
        markers.clearMarkers();
      },
      width: 80
    }, {
      xtype: 'button',
      text: 'Test',
      handler: test_gps,
      width: 80
    }]
  }]
});
//////////////////////////////////////////////
// GPS2 support multiformat input
//////////////////////////////////////////////
var gps_format = 0;
var gps_tip = "รูปแบบค่าพิกัดที่สามารถเลือกใช้ได้ <br>";
gps_tip += "100.56578<br>";
gps_tip += "100 33 56.808<br>";
gps_tip += "100d 33m 56.808s<br>";
gps_tip += "100DD 33MM 56.808SS<br>";

function dms2dd(ddd, mm, ss) {
  var d = parseFloat(ddd);
  var m = parseFloat(mm) / 60.0;
  var s = parseFloat(ss) / 3600.0;
  return d + m + s;
}

function dd2dms(ll) {
  //debugger;
  var d1 = ll;
  var d2 = parseInt(d1 / 100 * 100);
  var d3 = d1 - d2;
  var d4 = d3 * 60;
  var d5 = parseInt(d4);
  var d6 = d4 - d5;
  var d7 = d6 * 60;
  var dms = [];
  dms[0] = d2;
  dms[1] = d5;
  dms[2] = d7.toFixed(2);
  return dms;
}

function setMarker(lon, lat, msg) {
  var lonLatMarker = new OpenLayers.LonLat(lon, lat).transform(gcs, merc);
  var feature = new OpenLayers.Feature(markers, lonLatMarker);
  feature.closeBox = true;
  feature.popupClass = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble, {
    maxSize: new OpenLayers.Size(120, 75)
  });
  feature.data.popupContentHTML = msg;
  feature.data.overflow = "hidden";
  var size = new OpenLayers.Size(64, 64);
  var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
  var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
  var marker = new OpenLayers.Marker(lonLatMarker, icon);
  marker.feature = feature;
  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    OpenLayers.Event.stop(evt);
  };
  markers.addMarker(marker);
  //map.events.register("click", feature, markerClick);
}

function addMarkers() {
  var ll, popupClass, popupContentHTML;
  //anchored bubble popup wide short text contents autosize closebox
  ll = new OpenLayers.LonLat(13, 100);
  popupClass = AutoSizeFramedCloud;
  popupContentHTML = '<div style="background-color:red;">Popup.FramedCloud<br>autosize - wide short text<br>closebox<br>' + samplePopupContentsHTML_WideShort + '</div>'
  addMarker(ll, popupClass, popupContentHTML, true);
}

function addMarker(ll, popupClass, popupContentHTML, closeBox, overflow) {
  var feature = new OpenLayers.Feature(markers, ll);
  feature.closeBox = closeBox;
  feature.popupClass = popupClass;
  feature.data.popupContentHTML = popupContentHTML;
  feature.data.overflow = (overflow) ? "auto" : "hidden";
  marker = feature.createMarker();
  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    currentPopup = this.popup;
    OpenLayers.Event.stop(evt);
  };
  marker.events.register("mousedown", feature, markerClick);
  markers.addMarker(marker);
}

function onFeatureSelect(feature) {
  selectedFeature = feature;
  popup_marker = new OpenLayers.Popup.FramedCloud("", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(100, 100), "<div style='padding:15px 5px 5px 10px;'>" + "<table style='font-size:13px;color:red'>" + "<tr>" + "<td width='40%'>Name</td>" + "<td width='5%'>:</td>" + "<td>" + feature.attributes.label + "</td>" + "</tr>" + "</table></div>", null, true, onMarkerPopupClose);
  feature.popup = popup_marker;
  map.addPopup(popup_marker);
}

function onMarkerPopupClose(evt) {
  frm_input_ctrl.unselectAll();
}

function onFeatureUnselect(feature) {
  map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}
var test_gps2 = function () {
  //gps_tip += "100.56578<br>";
  //gps_tip += "100 33 56.808<br>";
  //gps_tip += "100d 33m 56.808s<br>";
  //gps_tip += "100DD 33MM 56.808SS<br>";
  var gps_test_lon;
  var gps_test_lat;
  gps_format += 1
  if (gps_format == 1) {
    gps_test_lon = "100.56578";
    gps_test_lat = "13.89072";
  } else if (gps_format == 2) {
    gps_test_lon = "100 33 56.808";
    gps_test_lat = "13 53 26.592";
  } else if (gps_format == 3) {
    gps_test_lon = "100d 33m 56.808s";
    gps_test_lat = "13d 53m 26.592s";
  } else if (gps_format == 4) {
    gps_format = 0;
    gps_test_lon = "100DD 33MM 56.808SS";
    gps_test_lat = "13DD 53MM 26.592SS";
  }
  Ext.getCmp('gps_lon').setValue(gps_test_lon);
  Ext.getCmp('gps_lat').setValue(gps_test_lat);
}
//Add squeeze prototype
String.prototype.strip = function () {
  return this.replace(/^\s+|\s+$/g, '');
}
//Replace many white spaces to 1
//str.replace(/\s+/g, ' ')
//Combine both
//"  1    2    3   ".replace(/\s+/g, ' ').strip().split(/\s/g)
//["1", "2", "3"]
//Remove non-digits from string BUT left out decimal . 
//str.replace(/[A-Za-z$-]/g, "");
var gps_msg;
var check_gps2 = function () {
  var gps_lon = Ext.getCmp('gps_lon').getValue();
  var gps_lat = Ext.getCmp('gps_lat').getValue();
  var lon, lat;
  //Reformat gps_lon and gps_lat
  var lon_arr = gps_lon.replace(/\s+/g, ' ').strip().replace(/[A-Za-z$-]/g, "").split(/\s/g);
  var lat_arr = gps_lat.replace(/\s+/g, ' ').strip().replace(/[A-Za-z$-]/g, "").split(/\s/g);
  if (lon_arr.length == 1 && lat_arr.length == 1) //Decimal Degree
  {
    lon = lon_arr[0];
    lat = lat_arr[0];
    gps_msg = "พิกัด " + lon + " E " + lat + " N<br>";
  } else if (lon_arr.length == 3 && lat_arr.length == 3) //DD MM SS
  {
    lon = dms2dd(lon_arr[0], lon_arr[1], lon_arr[2]);
    lat = dms2dd(lat_arr[0], lat_arr[1], lat_arr[2]);
    gps_msg = "พิกัด " + lon_arr[0] + "&deg; " + lon_arr[1] + "&apos; " + lon_arr[2] + "&quot; E "
    gps_msg += lat_arr[0] + "&deg; " + lat_arr[1] + "&apos; " + lat_arr[2] + "&quot; N<br>"
  } else {
    alert("ข้อมูลที่บันทึกในช่อง Longitude และ/หรือ  Latitude ไม่ถูกต้อง");
    return false;
  }
  gps_report(lon, lat);
}
var gps_report = function (lon, lat) {
  Ext.Ajax.request({
    url: 'rb/checkLonLatDD.rb',
    params: {
      method: 'GET',
      lon: lon,
      lat: lat,
      format: 'json'
    },
    failure: function (response, opts) {
      alert("checkLonLatDD > failure");
      return false;
    },
    success: function (response, opts) {
      // var data = eval( '(' + response.responseText + ')' );
      // No response from IE
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;
      gps_msg += msg;
      var p1 = new OpenLayers.LonLat(lon, lat);
      var p2 = p1.transform(gcs, merc);
      map.setCenter(p2, 14);
      var size = new OpenLayers.Size(48, 48);
      var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2, icon));
      info('Result', gps_msg);
    }
  });
};
var gps2 = Ext.create("Ext.form.Panel", {
  title: 'ตำแหน่งพิกัด GPS',
  id: 'id_gps2',
  frame: true,
  items: [{
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: 'textfield',
      id: 'gps_lon',
      fieldLabel: 'Longitude',
      width: 150
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'E'
    }]
  }, {
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: 'textfield',
      id: 'gps_lat',
      fieldLabel: 'Latitude',
      width: 150
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'N'
    }]
  }, {
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: 'button',
      text: 'Check',
      handler: check_gps2,
      width: 80
    }, {
      xtype: 'button',
      text: 'Clear',
      handler: function () {
        gps2.getForm().reset();
        markers.clearMarkers();
      },
      width: 80
    }, {
      xtype: 'button',
      text: 'Test',
      tooltip: gps_tip,
      handler: test_gps2,
      width: 80
    }]
  }, {
    xtype: 'panel',
    border: false,
    items: [{
      html: '<center><font color="green">Click ที่ปุ่ม [Test]<br>เพื่อเปลี่ยนรูปแบบของ GPS<br>ที่สามารถใช้งานได้</font></center>'
    }]
  }]
});
//////////////////////////////////////////////
// UTM
//////////////////////////////////////////////
var check_gps_utm = function () {
  var utmn = Ext.getCmp('utmn').getValue();
  var utme = Ext.getCmp('utme').getValue();
  var zone47 = Ext.getCmp('zone47').checked;
  if (zone47 == true) zone = '47';
  else zone = '48';
  report_utm(utmn, utme, zone);
}
var report_utm = function (utmn, utme, zone) {
  Ext.Ajax.request({
    url: 'rb/checkUTM.rb',
    params: {
      method: 'GET',
      utmn: utmn,
      utme: utme,
      zone: zone,
      format: 'json'
    },
    failure: function (response, opts) {
      alert("checkUTM > failure");
      return false;
    },
    success: function (response, opts) {
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;
      var p1 = new OpenLayers.LonLat(lon, lat);
      var p2 = p1.transform(gcs, merc);
      map.setCenter(p2, 14);
      var size = new OpenLayers.Size(48, 48);
      var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2, icon));
      info('Result', data.msg);
    }
  });
};
var test_gps_utm = function () {
  if (Ext.getCmp('zone47').checked) {
    Ext.getCmp('utmn').setValue(1536195.1807);
    Ext.getCmp('utme').setValue(669189.2284);
  } else {
    Ext.getCmp('utmn').setValue(1540101.0761);
    Ext.getCmp('utme').setValue(20494.2993);
  }
}
var gps_utm = Ext.create("Ext.form.Panel", {
  id: 'id_gps_utm',
  frame: true,
  title: 'ตำแหน่งพิกัด GPS (UTM)',
  items: [{
    xtype: 'fieldcontainer',
    hideLabel: true,
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelAlign: 'top',
      margin: '0 5 0 0',
      labelWidth: 90,
      labelSeparator: ''
    },
    items: [{
      xtype: 'textfield',
      fieldLabel: 'Easting:Meters',
      id: 'utme'
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'E'
    }]
  }, {
    xtype: 'fieldcontainer',
    hideLabel: true,
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelAlign: 'top',
      margin: '0 5 0 0',
      labelWidth: 90,
      labelSeparator: ''
    },
    items: [{
      xtype: 'textfield',
      fieldLabel: 'Northing:Meters',
      id: 'utmn'
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'N'
    }]
  }, {
    xtype: 'fieldcontainer',
    hideLabel: true,
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelAlign: 'top',
      margin: '0 40 0 0',
      labelWidth: 90,
      labelSeparator: ''
    },
    items: [{
      xtype: 'radio',
      id: 'zone47',
      name: 'zone',
      fieldLabel: 'Zone 47',
      checked: true
    }, {
      xtype: 'radio',
      id: 'zone48',
      name: 'zone',
      fieldLabel: 'Zone 48'
    }]
  }, {
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: 'button',
      text: 'Check',
      handler: check_gps_utm,
      width: 80
    }, {
      xtype: 'button',
      text: 'Clear',
      handler: function () {
        gps_utm.getForm().reset();
        markers.clearMarkers();
      },
      width: 80
    }, {
      xtype: 'button',
      text: 'Test',
      handler: test_gps_utm,
      width: 80
    }]
  }]
});
var check_gps_utm = function () {
  var utmn = Ext.getCmp('utmn').getValue();
  var utme = Ext.getCmp('utme').getValue();
  var zone47 = Ext.getCmp('zone47').checked;
  if (zone47 == true) zone = '47';
  else zone = '48';
  report_utm(utmn, utme, zone);
}
var report_utm = function (utmn, utme, zone) {
  Ext.Ajax.request({
    url: 'rb/checkUTM.rb',
    params: {
      method: 'GET',
      utmn: utmn,
      utme: utme,
      zone: zone,
      format: 'json'
    },
    failure: function (response, opts) {
      alert('checkUTM > failure');
      return false;
    },
    success: function (response, opts) {
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;
      var p1 = new OpenLayers.LonLat(lon, lat);
      var p2 = p1.transform(gcs, merc);
      map.setCenter(p2, 14);
      var size = new OpenLayers.Size(48, 48);
      var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2, icon));
      info('Result', data.msg);
    }
  });
};
//////////////////////////////////////////////
// UTM INDIAN
//////////////////////////////////////////////
var check_gps_utm_indian = function () {
  var utmni = Ext.getCmp('utmni').getValue();
  var utmei = Ext.getCmp('utmei').getValue();
  var zone47i = Ext.getCmp('zone47i').checked;
  if (zone47i == true) zonei = '47';
  else zonei = '48';
  report_utm_indian(utmni, utmei, zonei);
}
var report_utm_indian = function (utmni, utmei, zonei) {
  Ext.Ajax.request({
    url: 'rb/checkUTMIndian.rb',
    params: {
      method: 'GET',
      utmn: utmni,
      utme: utmei,
      zone: zonei,
      format: 'json'
    },
    failure: function (response, opts) {
      alert('checkUTMIndian > failure');
      return false;
    },
    success: function (response, opts) {
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;
      var p1 = new OpenLayers.LonLat(lon, lat);
      var p2 = p1.transform(gcs, merc);
      map.setCenter(p2, 14);
      var size = new OpenLayers.Size(48, 48);
      var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2, icon));
      info('Result', data.msg);
    }
  });
};
var test_gps_utm_indian = function () {
  if (Ext.getCmp('zone47i').checked) {
    Ext.getCmp('utmni').setValue(1535891.7973);
    Ext.getCmp('utmei').setValue(669523.2828);
  } else {
    Ext.getCmp('utmni').setValue(1539787.7522);
    Ext.getCmp('utmei').setValue(20913.1788);
  }
}
var gps_utm_indian = Ext.create("Ext.form.Panel", {
  id: 'id_gps_utm_indian',
  frame: true,
  title: 'ตำแหน่งพิกัด GPS (UTM Indian 1975)',
  bodyStyle: 'padding:5px 5px 5px',
  items: [{
    xtype: 'fieldcontainer',
    hideLabel: true,
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelAlign: 'top',
      margin: '0 5 0 0',
      labelWidth: 90,
      labelSeparator: ''
    },
    items: [{
      xtype: 'textfield',
      fieldLabel: 'Easting:Meters',
      id: 'utmei'
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'E'
    }]
  }, {
    xtype: 'fieldcontainer',
    hideLabel: true,
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelAlign: 'top',
      margin: '0 5 0 0',
      labelWidth: 90,
      labelSeparator: ''
    },
    items: [{
      xtype: 'textfield',
      fieldLabel: 'Easting:Meters',
      id: 'utmni'
    }, {
      xtype: 'displayfield',
      fieldLabel: '&nbsp;',
      value: 'N'
    }]
  }, {
    xtype: 'fieldcontainer',
    hideLabel: true,
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelAlign: 'top',
      margin: '0 40 0 0',
      labelWidth: 90,
      labelSeparator: ''
    },
    items: [{
      xtype: 'radio',
      id: 'zone47i',
      name: 'zonei',
      fieldLabel: 'Zone 47',
      checked: true
    }, {
      xtype: 'radio',
      id: 'zone48i',
      name: 'zonei',
      fieldLabel: 'Zone 48'
    }]
  }, {
    xtype: 'fieldcontainer',
    layout: {
      type: 'hbox',
      padding: '5',
      pack: 'center'
    },
    fieldDefaults: {
      labelSeparator: '',
      labelAlign: 'top',
      margin: '0 5 0 0'
    },
    items: [{
      xtype: "button",
      text: 'Check',
      handler: check_gps_utm_indian,
      width: 80
    }, {
      xtype: "button",
      text: 'Clear',
      handler: function () {
        gps_utm_indian.getForm().reset();
        markers.clearMarkers();
      },
      width: 80
    }, {
      xtype: "button",
      text: 'Test',
      handler: test_gps_utm_indian,
      width: 80
    }]
  }]
});
//////////////////////////////////////////////
// SEARCH
//////////////////////////////////////////////
var search_query = function () {
  var query = Ext.getCmp('id_query').getValue();
  search(query);
}
var search = function (query) {
  Ext.Ajax.request({
    url: 'rb/search-googlex.rb',
    params: {
      method: 'GET',
      query: query,
      exact: 1
    },
    success: function (response, opts) {
      var data = Ext.decode(response.responseText);
      var gid = data.records[0].loc_gid;
      var text = data.records[0].loc_text;
      var table = data.records[0].loc_table;
      var lon = parseFloat(data.records[0].lon).toFixed(2);
      var lat = parseFloat(data.records[0].lat).toFixed(2);
      var zoom = 14;
      var p1 = new OpenLayers.LonLat(lon, lat);
      var p2 = p1.transform(gcs, merc);
      if (text) {
        map.setLayerIndex(markers, 0);
        map.setLayerIndex(hili, 0);
        if (text.indexOf("จ.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 8;
        } else if (text.indexOf("อ.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 10;
        } else if (text.indexOf("ต.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 12;
        } else {
          zoom = 14;
          map.setLayerIndex(markers, 99);
          setMarker(lon, lat, text);
        }
      }
      map.setCenter(p2, zoom);
      info('Result', text + '<br>lat:' + lat + ' lon:' + lon);
      if (text.search(/จ./) == 0 || text.search(/อ./) == 0 || text.search(/ต./) == 0 || text.search(/บ้าน/) == 0)
      {
        hili.setOpacity(.5);
        //addWKT(table, gid);
      }
    }
  });
};

function addWKT(table, gid) {
  var url = "rb/getPolygonWKT.rb?table=" + table + "&gid=" + gid;
  OpenLayers.loadURL(url, '', this, function (response) {
    geom = response.responseText;
    addWKTFeatures(geom);
  });
}

function addWKTFeatures(wktString) {
  wkt = new OpenLayers.Format.WKT();
  features = wkt.read(wktString);
  var bounds;
  if (features) {
    if (features.constructor != Array) {
      features = [features];
    }
    for (var i = 0; i < features.length; ++i) {
      if (!bounds) {
        bounds = features[i].geometry.getBounds();
        bounds = bounds.transform(gcs, merc);
      } else {
        bounds.extend(features[i].geometry.getBounds().transform(gcs, merc));
      }
    }
  }
  vectorLayer.removeAllFeatures();
  vectorLayer.addFeatures(features[0].geometry.transform(gcs, merc));
  map.zoomToExtent(bounds);
}
var myTextField = Ext.create("GeoExt.ux.QryComboBox", {
  id: 'id_query',
  fieldLabel: 'ค้นหา',
  labelSeparator: ':',
  labelWidth: 50,
  fieldStore: ['loc_table', 'loc_gid', 'loc_text'],
  hiddenField: ['loc_table', 'loc_gid'],
  displayField: 'loc_text',
  urlStore: 'rb/search-googlex.rb',
  width: '110',
  minListWidth: '300',
  anchor: '95%'
});
myTextField.on({
  'select': {
    fn: function () {
      Ext.getCmp("btn_search").enable();
    },
    scope: this
  }
});
myTextField.on("specialkey", specialKey, this);

function specialKey(field, e) {
  if (e.getKey() == e.RETURN || e.getKey() == e.ENTER) {
    search_query();
  }
}
var searchquery = Ext.create("Ext.form.Panel", {
  id: 'id_searchquery',
  labelAlign: 'left',
  align: 'center',
  frame: true,
  title: 'ค้นหาสถานที่',
  bodyStyle: 'padding:5px 5px 5px',
  width: 300,
  items: [{
    layout: 'form',
    labelWidth: 30,
    items: [myTextField],
    bodyCfg: {
      tag: 'center'
    },
    frame: true,
    buttons: [{
      text: 'Search',
      id: 'btn_search',
      handler: search_query,
      disabled: true
    }, {
      text: 'Clear',
      handler: function () {
        searchquery.getForm().reset();
        markers.clearMarkers();
        hili.setOpacity(0);
        Ext.getCmp('id_query').focus();
        Ext.getCmp('btn_search').disable();
      }
    }]
  }]
});
var loadxls = Ext.create("Ext.form.Panel", {
  id: 'id_loadxls',
  title: 'Upoad XLS (with Geom)',
  width: 500,
  frame: true,
  title: 'Upload XLS/KML',
  bodyPadding: '10 10 0',
  defaults: {
    anchor: '100%',
    xtype: 'textfield',
    msgTarget: 'side',
    labelWidth: 50
  },
  items: [{
    xtype: 'filefield',
    name: 'file',
    id: 'id_file_xls',
    fieldLabel: 'XLS/KML',
    labelWidth: 50,
    msgTarget: 'side',
    allowBlank: true,
    buttonText: '',
    buttonConfig: {
      iconCls: 'upload'
    }
  }],
  buttons: [{
    text: 'Upload',
    handler: function () {
      var form = this.up('form').getForm();
      if (form.isValid()) {
        form.submit({
          url: 'rb/file-upload-xls.rb',
          waitMsg: 'Uploading XLS...'
          //,success: function(response, opts) { NOT WORKING ?!?!?
          ,
          success: function (fp, o) {
            var data = Ext.decode(o.response.responseText);
            var kmlname = data.kmlname;
            create_layer_kml(kmlname);
          }
        })
      }
    }
  }, {
    text: 'Reset',
    handler: function () {
      this.up('form').getForm().reset();
    }
  }]
});

function numberWithCommas(x) {
  x = x.toString();
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
  x = x.replace(pattern, "$1,$2");
  return x;
}
var check_forest_info = function (layer, ll) {
  lon = ll.lon;
  lat = ll.lat;
  if (layer == 'เขตอุทยานแห่งชาติ') layer = 'national_park';
  else if (layer == 'เขตป่าสงวน') layer = 'reserve_forest';
  else if (layer == 'ป่าชายเลน ปี 2530') layer = 'mangrove_2530';
  else if (layer == 'ป่าชายเลน ปี 2543') layer = 'mangrove_2543';
  else if (layer == 'ป่าชายเลน ปี 2552') layer = 'mangrove_2552';
  Ext.Ajax.request({
    url: 'rb/check_forest_info.rb',
    params: {
      method: 'GET',
      layer: layer,
      lon: lon,
      lat: lat,
      format: 'json'
    },
    success: function (response, opts) {
      var data = Ext.decode(response.responseText);
      var lon = data.lon;
      var lat = data.lat;
      var msg = data.msg;
      var p1 = new OpenLayers.LonLat(lon, lat);
      var p2 = p1.transform(gcs, merc);
      if (msg != 'NA') info('Result', msg);
    },
    failure: function (response, opts) {
      alert('check forest info > failure');
      return false;
    }
  });
};

