(function($) {

  $.MetadataView = function(options) {

    jQuery.extend(this, {
      manifest:             null,
      element:              null,
      metadataTypes:        null,
      metadataListingCls:   'metadata-listing'
    }, options);

    this.init();
  };

  $.MetadataView.prototype = {

    init: function() {
      var _this = this,
          tplData = {
            metadataListingCls: this.metadataListingCls
          };

      _this.manifest = _this.manifest.jsonLd;
      this.metadataTypes = {};

      this.metadataTypes.details = _this.getMetadataDetails(_this.manifest);
      this.metadataTypes.rights = _this.getMetadataRights(_this.manifest);
      this.metadataTypes.links = _this.getMetadataLinks(_this.manifest);

      //vvvvv This is *not* how this should be done.
      jQuery.each(this.metadataTypes, function(metadataKey, metadataValues) {
        tplData[metadataKey] = [];

        jQuery.each(metadataValues, function(idx, itm) {
          if (typeof itm.value === 'object') {
            itm.value = _this.stringifyObject(itm.value);
          }

          if (typeof itm.value === 'string' && itm.value !== '') {
            tplData[metadataKey].push({
              identifier: itm.identifier || '',
              label: _this.extractLabelFromAttribute(itm.label),
              value: (metadataKey === 'links') ? itm.value : _this.addLinksToUris(itm.value)
            });
          }
        });
      });

      if (_this.manifest.logo) {
        var logo = '';
        if (typeof _this.manifest.logo === "string") {
          logo = _this.manifest.logo;
        } else if (typeof _this.manifest.logo['@id'] !== 'undefined') {
          logo = _this.manifest.logo['@id'];
        }
        tplData.logo = logo;
      }

      this.element = jQuery(this.template(tplData)).appendTo(this.appendTo);
      this.bindEvents();
    },

  // Base code from https://github.com/padolsey/prettyprint.js. Modified to fit Mirador needs
  stringifyObject: function(obj, nestingMargin) {
    var type = typeof obj,
        _this = this,
        str,
        first = true,
        increment = 15,
        delimiter = '<br/>';

    if (obj instanceof RegExp) {
      return '/' + obj.source + '/';
    }

    if (typeof nestingMargin === 'undefined') {
      nestingMargin = 0;
    }

    if (obj instanceof Array) {
      str = '[ ';
      jQuery.each(obj, function (i, item) {
        str += (i === 0 ? '' : ', ') + _this.stringifyObject(item, nestingMargin + increment);
      });
      return str + ' ]';
    }

    if (typeof obj === 'object' && obj['@type'] === 'sc:Collection') {
      var collectionUrl = obj['@id'];
      var collectionLabel = obj.label || collectionUrl;
      return '<a href="' + collectionUrl + '" target="_blank">' + collectionLabel + '</a>';
    } else if (typeof obj === 'object') {
      str = '<div style="margin-left:' +  nestingMargin + 'px">';
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          str += (first ? '' : delimiter) + i + ': ' + _this.stringifyObject(obj[i], nestingMargin + increment);
          first = false;
        }
      }

      return str + '</div>';
    }
    return obj.toString();
  },

  stringifyRelated: function(obj) {
    var _this = this,
        str,
        next,
        label,
        format;
    if (obj instanceof Array) {
      str = '';
      jQuery.each(obj, function (i, item) {
        next = _this.stringifyRelated(item);
        if (next !== '') str += (i === 0 ? '' : '<br/>') + next;
      });
      return str;
    }

    if (typeof obj === 'object' && '@id' in obj) {
      label = ('label' in obj)? obj.label : obj['@id'];
      format = ('format' in obj && obj.format !== 'text/html')? '(' + obj.format + ')' : '';
      return '<a href="' + obj['@id'] + '"  target="_blank">' + label + '</a> ' + format;
    }

    return _this.addLinksToUris(obj.toString());
  },

  getMetadataDetails: function(jsonLd) {
      var mdList = [
      { label: 'description',
        value: Mirador.JsonLd.getTextValue(jsonLd.description) || '' }
      ];
      if (jsonLd.metadata) {
        value = "";
        label = "";
        jQuery.each(jsonLd.metadata, function(index, item) {
          label = Mirador.JsonLd.getTextValue(item.label);
          value = Mirador.JsonLd.getTextValue(item.value);
          if (item.label != 'Source' && item.value.indexOf('http://norman.hrc.utexas.edu/fasearch/findingAid.cfm?eadid=') === -1){
          mdList.push({label: label, value: value});
          }
        });
      }
      return mdList;
    },

  getMetadataRights: function(jsonLd) {
    return [
      {
        identifier: 'license',
        label: i18next.t('license'),
        value: jsonLd.license || ''
      }, {
        identifier: 'attribution',
        label: i18next.t('attribution'),
        value: $.JsonLd.getTextValue(jsonLd.attribution) || ''
      }
    ];
  },

  getMetadataLinks: function(jsonLd) {
    var MDsource,
      MDFA1,
      MDFA2;
    if (jsonLd.metadata) {
    jQuery.each(jsonLd.metadata, function(index, item) {
      if (item.label === 'Source'){
        MDsource = item;
      } 
      if (item.value.indexOf('http://norman.hrc.utexas.edu/fasearch/findingAid.cfm?eadid=') != -1){
      if (typeof MDFA1 !== 'undefined'){
        MDFA2 = item;
      } else {
        MDFA1 = item;
      }
      }
    });
    }
    return [
    {label: 'Manifest', value: this.stringifyRelated(jsonLd['@id'] || '')},
    {label: i18next.t(typeof MDsource !== 'undefined' ? MDsource.label : ''), value: this.stringifyRelated(typeof MDsource !== 'undefined' ? MDsource.value : '' || '')},
    {label: i18next.t(typeof MDFA1 !== 'undefined' ? MDFA1.label : ''), value: this.stringifyRelated(typeof MDFA1 !== 'undefined' ? MDFA1.value : '' || '')},
    {label: i18next.t(typeof MDFA2 !== 'undefined' ? MDFA2.label : ''), value: this.stringifyRelated(typeof MDFA2 !== 'undefined' ? MDFA2.value : '' || '')},
    {label: i18next.t('related'), value: this.stringifyRelated(jsonLd.related || '')},
    {label: i18next.t('seeAlso'), value: this.stringifyRelated(jsonLd.seeAlso || '')},
    {label: i18next.t('within'),  value: this.stringifyRelated(jsonLd.within || '')}
    ];
  },

   getWithin: function(within) {
     if (typeof within === 'object' && within['@type'] === 'sc:Collection') {
      var collectionUrl = within['@id'];
      var collectionLabel = within.label || collectionUrl;
      return '<a href="' + collectionUrl + '" target="_blank">' + collectionLabel + '</a>';
     } else if (within instanceof Array) {
       return within.map(this.getWithin, this).join("<br/>");
     } else {
       return this.stringifyObject(within);
     }
   },

   extractLabelFromAttribute: function(attr) {
    var label = attr;

    label = label.replace(/^@/, '');
    label = label.replace(/\s{2,}/g, ' ');

    return label;
  },

    bindEvents: function() {
    },

    toggle: function(stateValue) {
        if (stateValue) {
            this.show();
        } else {
            this.hide();
        }
    },

    show: function() {
        var element = jQuery(this.element);
        if (this.panel) {
            element = element.parent();
        }
        element.show({effect: "slide", direction: "right", duration: 300, easing: "swing"});
    },

    hide: function() {
        var element = jQuery(this.element);
        if (this.panel) {
            element = element.parent();
        }
        element.hide({effect: "slide", direction: "right", duration: 300, easing: "swing"});
    },

    addLinksToUris: function(text) {
      // http://stackoverflow.com/questions/8188645/javascript-regex-to-match-a-url-in-a-field-of-text
      var regexUrl = /(http|ftp|https):\/\/[\w\-]+(\.[\w\-]+)+([\w.,@?\^=%&amp;:\/~+#\-]*[\w@?\^=%&amp;\/~+#\-])?/gi,
          textWithLinks = text,
          matches,
          parsedTextWithLinks;

      if (typeof text === 'string') {
        if (textWithLinks.indexOf('<a ') === -1) {
          matches = text.match(regexUrl);

          if (matches) {
            jQuery.each(matches, function(index, match) {
              textWithLinks = textWithLinks.replace(match, '<a href="' + match + '" target="_blank">' + match + '</a>');
            });
          }
        } else {
          parsedTextWithLinks = jQuery('<div />').append(textWithLinks);
          jQuery(parsedTextWithLinks[0]).find('a').attr('target', '_blank');
          textWithLinks = parsedTextWithLinks[0].innerHTML;
        }
      }

      return textWithLinks;
    },

    template: $.Handlebars.compile([
      '{{#if links}}',
        '<div class="sub-title">{{t "links"}}:</div>',
        '<div class="{{metadataListingCls}}">',
          '{{#each links}}',
          '<div class="metadata-item"><div class="metadata-label">{{label}}:</div><div class="metadata-value">{{{value}}}</div></div>',
          '{{/each}}',
        '</dl>',
      '{{/if}}',
      '<div class="sub-title">{{t "details"}}:</div>',
      '<div class="{{metadataListingCls}}">',
        '{{#each details}}',
        '<div class="metadata-item"><div class="metadata-label">{{label}}:</div><div class="metadata-value">{{{value}}}</div></div>',
        '{{/each}}',
      '</div>',
      '<div class="sub-title">{{t "rights"}}:</div>',
      '{{#if rights}}',
      '<div class="{{metadataListingCls}}">',
        '{{#each rights}}',
        '<div class="metadata-item"><div class="metadata-label">{{label}}:</div><div class="metadata-value">{{{value}}}</div></div>',
        '{{/each}}',
        '{{#if logo}}',
        '<div class="metadata-item"><div class="metadata-label">{{t "logo"}}:</div><img class="metadata-logo" src="{{logo}}"/></div>',
        '{{/if}}',
      '</div>',
      '{{else}}',
      '<div class="{{metadataListingCls}}">',
        '<div class="metadata-item"><div class="metadata-label">{{t "rightsStatus"}}:</div><div class="metadata-value">{{t "unspecified"}}</div></div>',
      '</div>',
      '{{/if}}'
    ].join(''),{noEscape:true});

  };

}(Mirador));
