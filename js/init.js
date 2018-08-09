$(function doInit() {
	var targetServer = location.protocol + '//' + (location.hostname.indexOf('hrch-webdev') > -1 ? 'hrch-webdev.hrc' : 'norman.hrc') + '.utexas.edu',
		getParameterByName = function(keyName){
			var regexS = "[\\?&]"+keyName+"=([^&#]*)", 
				regex = new RegExp( regexS ),
				results = regex.exec(window.location.search);
		  if( results == null ){
			return "";
		  } else{
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		  }
		},
		collArr = [],
		preLoad = getParameterByName('preload') !== '' ? getParameterByName('preload') : true,
		req = location.pathname.split('/'),
		CdmColl = getParameterByName('coll') !== '' ? getParameterByName('coll') : '',
		man2load = getParameterByName('pointer') !== '' ? getParameterByName('pointer') : '',
		reqIX,
		can2load,
    page2load = getParameterByName('canvas') !== '' ? getParameterByName('canvas') : '';
  if (CdmColl === ''){
    for (reqIX in req){
      if (req[reqIX].indexOf('p15878coll') !== -1){
        CdmColl = req[reqIX];
        if (reqIX < req.length - 1){
          man2load = req[Number(reqIX) + 1];
          if (reqIX < req.length - 2){
            page2load = req[Number(reqIX) + 2];
          }
        }
        break;
      }
    }
  }
  if (CdmColl !== ''){
    $.get(targetServer + '/notDM/collectionManifestArray/' + CdmColl).done(function(collData,status){
      var collArrIX, collSplitTemp, manNumIX, trailingSlash = false,
        collUriArr = [], 
        manNumbers = [];
      Array.prototype.push.apply(collArr,collData);
      for (collArrIX in collArr){
        collUriArr.push(collArr[collArrIX].manifestUri)
      }
      if (collUriArr.indexOf('https://hrc.contentdm.oclc.org/digital/iiif-info/' + CdmColl + '/' + man2load + '/') === -1 && collUriArr.indexOf('https://hrc.contentdm.oclc.org/digital/iiif-info/' + CdmColl + '/' + man2load) === -1 && man2load !== ""){
        for (collArrIX in collArr){
          collSplitTemp = collArr[collArrIX].manifestUri.split('/');
          manNumbers.push(Number(collSplitTemp[collSplitTemp.indexOf(CdmColl) + 1]));
        }
        manNumbers.sort(function(a, b) {
          return a - b;
        });
        for (manNumIX in manNumbers){
          if(manNumbers[manNumIX] >= man2load){
            page2load = man2load;
            man2load = manNumbers[manNumIX].toString();
            break;
          }
        }
      }
      if (collUriArr.indexOf('https://hrc.contentdm.oclc.org/digital/iiif-info/' + CdmColl + '/' + man2load + '/') !== -1){
        trailingSlash = true;
      }
      if (man2load !== ""){
        $.get('https://hrc.contentdm.oclc.org/digital/iiif-info/' + CdmColl + '/' + man2load + (trailingSlash === true ? '/' : '')).always(function(testData,status){
          var canIX, canTemp;
          if (status !== 'success'){
            man2load = "";
          }
          if (typeof page2load !== 'undefined' && typeof testData.structures !== 'undefined' && typeof testData.structures[0] !== 'undefined' && page2load !== ''){
            for (canIX in testData.structures[0].canvases){
              canTemp = testData.structures[0].canvases[canIX];
              if (testData.structures[0].canvases[canIX].indexOf('https://cdm15878.contentdm.oclc.org/digital/iiif/'+ CdmColl + '/' + page2load + '/canvas/c') !== -1){
                can2load = testData.structures[0].canvases[canIX];
                break;
              }
            }
          }
          mira = man2load === "" ? Mirador({
            id: "viewer",
            layout: "1x1",
            data: collArr,
            buildPath: '/mirador/',
            i18nPath: 'locales/',
            imagesPath: 'images/',
            openManifestsPage: true,
            annotationEndpoint: { 
              name: "Comments", 
              module: "Endpoint" 
            },
            windowSettings: {
              sidePanel: true,
              sidePanelOptions: {
                toc: false,
                annotations: true
              },
              sidePanelVisible: true,
              canvasControls: {
                annotations: {
                  annotationLayer: false, 
                  annotationCreation: false,
                  annotationState: 'off'
                }
              }
            }
          }) : (typeof can2load !== 'undefined' ? Mirador({
            id: "viewer",
            layout: "1x1",
            data: collArr,
            buildPath: '/mirador/',
            i18nPath: 'locales/',
            imagesPath: 'images/',
            windowObjects: (preLoad === true && collData.length > 0) ? [{
              loadedManifest: man2load === "" ? collData[0].manifestUri : ('https://hrc.contentdm.oclc.org/digital/iiif-info/' + CdmColl + '/' + man2load + (trailingSlash === true ? '/' : '')),
              viewType: "ImageView",
              canvasID: can2load
            }] : [],
            annotationEndpoint: { 
              name: "Comments", 
              module: "Endpoint" 
            },
            windowSettings: {
              sidePanel: true,
              sidePanelOptions: {
                toc: false,
                annotations: true
              },
              sidePanelVisible: true,
              canvasControls: {
                annotations: {
                  annotationLayer: false, 
                  annotationCreation: false,
                  annotationState: 'off'
                }
              }
            }
          }) : Mirador({
            id: "viewer",
            layout: "1x1",
            data: collArr,
            buildPath: '/mirador/',
            i18nPath: 'locales/',
            imagesPath: 'images/',
            windowObjects: (preLoad === true && collData.length > 0) ? [{
              loadedManifest: man2load === "" ? collData[0].manifestUri : ('https://hrc.contentdm.oclc.org/digital/iiif-info/' + CdmColl + '/' + man2load + (trailingSlash === true ? '/' : '')),
              viewType: "ImageView"
            }] : [],
            annotationEndpoint: { 
              name: "Comments", 
              module: "Endpoint" 
            },
            windowSettings: {
              sidePanel: true,
              sidePanelOptions: {
                toc: false,
                annotations: true
              },
              sidePanelVisible: true,
              canvasControls: {
                annotations: {
                  annotationLayer: false, 
                  annotationCreation: false,
                  annotationState: 'off'
                }
              }
            }
          }));
          //mira.eventEmitter.debug = true;
        });
      } else {
        mira = Mirador({
          id: "viewer",
          layout: "1x1",
          data: collArr,
          buildPath: '/mirador/',
          i18nPath: 'locales/',
          imagesPath: 'images/',
          openManifestsPage: true,
          annotationEndpoint: { 
            name: "Comments", 
            module: "Endpoint" 
          },
          windowSettings: {
            sidePanel: true,
            sidePanelOptions: {
              toc: false,
              annotations: true
            },
            sidePanelVisible: true,
            canvasControls: {
              annotations: {
                annotationLayer: false, 
                annotationCreation: false,
                annotationState: 'off'
              }
            }
          }
        });
        //mira.eventEmitter.debug = true;
      }
    });
  }
});
