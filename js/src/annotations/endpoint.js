/*
 * All Endpoints need to have at least the following:
 * annotationsList - current list of OA Annotations
 * dfd - Deferred Object
 * init()
 * search(options, successCallback, errorCallback)
 * create(oaAnnotation, successCallback, errorCallback)
 * update(oaAnnotation, successCallback, errorCallback)
 * deleteAnnotation(annotationID, successCallback, errorCallback) (delete is a reserved word)
 * TODO:
 * read() //not currently used
 *
 * Optional, if endpoint is not OA compliant:
 * getAnnotationInOA(endpointAnnotation)
 * getAnnotationInEndpoint(oaAnnotation)
 */
(function($){

  $.Endpoint = function(options) {
	  var requestorIP;
    jQuery.extend(this, {
      dfd:             null,
      annotationsList: [],
      windowID:        null,
      eventEmitter:    null
    }, options);
	this.targetServer = location.protocol + '//' + (location.hostname.indexOf('hrch-webdev') > -1 ? 'hrch-webdev.hrc' : 'norman.hrc') + '.utexas.edu';
    this.init();
  };
  $.Endpoint.prototype = {
    init: function() {
		jQuery.get(this.targetServer + '/includes/verify.cfc?method=whoAmI').done(function(IPcheck){
			requestorIP = IPcheck.replace(/\"/g,'');
		});
    },
    search: function(options, successCallback, errorCallback) {
      var _this = this;
      jQuery.ajax({
        url: _this.targetServer + '/notDM/annotateCDM.cfc?method=getThem&targetCanvas=' + options.uri,
        type: 'GET',
        dataType: 'json',
        headers: { },
        data: { },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback(data);
          } else {
            for (var aL in _this.annotationsList){
				_this.annotationsList.pop();
			}
			jQuery.each(data, function(index, value) {
              _this.annotationsList.push(_this.getAnnotationInOA(value));
            });
            _this.dfd.resolve(true);
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
    deleteAnnotation: function(annotationID, successCallback, errorCallback) {
      var _this = this;
      jQuery.ajax({
        url: _this.targetServer + '/notDM/annotateCDM.cfc?method=killIt&targetID=' +annotationID,
        type: 'GET',
        dataType: 'json',
        headers: { },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback();
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
    update: function(oaAnnotation, successCallback, errorCallback) {
      var annotation = this.getAnnotationInEndpoint(oaAnnotation),
      _this = this;
      jQuery.ajax({
        url: _this.targetServer + '/notDM/annotateCDM.cfc?method=saveIt',
        type: 'POST',
        dataType: 'json',
        headers: { },
        data: JSON.stringify(annotation),
		processData: false,
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback(_this.getAnnotationInOA(data));
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
    create: function(oaAnnotation, successCallback, errorCallback) {
      var _this = this;
      jQuery.ajax({
        url: _this.targetServer + '/notDM/annotateCDM.cfc?method=saveIt',
        type: 'POST',
        dataType: 'json',
        headers: { },
        data: JSON.stringify(oaAnnotation),
		processData: false,
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback(_this.getAnnotationInOA(data));
          }
        },
        error: function(data) {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
    set: function(prop, value, options) {
      if (options) {
        this[options.parent][prop] = value;
      } else {
        this[prop] = value;
      }
    },
    getAnnotationInOA: function(annotation) {
		var annoPlus =  typeof annotation === "string" ? JSON.parse(annotation) : annotation;
		if (typeof annoPlus.endpoint === 'undefined'){
			annoPlus.endpoint = this;
		}
		annoPlus['@id'] = String(annoPlus['@id']);
		return annoPlus
    },
    getAnnotationInEndpoint: function(oaAnnotation) {
		if (typeof oaAnnotation.endpoint !== 'undefined'){
			delete oaAnnotation.endpoint;
		}
		oaAnnotation['@id'] = String(oaAnnotation['@id']);
		return oaAnnotation;
    },
    userAuthorize: function(action, annotation) {
      return requestorIP === annotation.annotatedBy.name ? true : false;
    }
  }
}(Mirador));
