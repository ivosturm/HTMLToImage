/*

    HTML To Image
    ========================

    @file      : HTMLToImage.js
    @version   : 1.0
    @author    : Ivo Sturm
    @date      : 12-11-2016
    @copyright : First Consulting
    @license   : free

    Documentation
    ========================
    With this widget it is possible to convert a specific HTML element on the page or the full page to an image. This image can either be downloaded or stored in the database.
	If the widget is placed in a context and the image entity + XPath Constraint are properly set, the image will be stored in the database, properly associated to the context object.
	
	The download and save buttons will be attached in the DOM tree to the widget itself.
	
	Releases
	========================
	v1.0 initial release.

*/

require({
    packages: 
	[
	{ name: 'html2canvas_HTML', location: '../../widgets/HTMLToImage/lib', main: 'html2canvas_HTML'}
	]

},[
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
	"dojo/on",
	"mxui/dom",
	"dojo/dom",
	"html2canvas_HTML",
	"dojo/domReady!"
], function (declare, _WidgetBase,  domStyle, domConstruct, dojoArray, lang,on,dom,dojoDom) {
    "use strict";

    return declare("HTMLToImage.widget.HTMLToImage", [_WidgetBase], {

        _handle: null,
        _contextObj: null,
        htmlObject: null,
		imageEntity: null,
		targetClassName: "",
		fileName: "",
		savable: true,
		downloadable: true,
		fullPage: false,
		scaleFactorDownload: 2,
		constraint: "",
		buttonsCreated: false,
		fileGuid			: "",
		_progressID: null,
		htmlObjectHeight: 0,
		htmlObjectWidth: 0,
		bgcolor: "#F9F9F9",

        postCreate: function () {
			this.buttonsCreated = false;
			if (this.consoleLogging){
				console.log(this.id + ".postCreate");
				console.log(this.id + "widget contents: ");
				console.dir(this);
			}
			this.fileGuid = "";
			this._createButtons();
        },

        update: function (obj, callback) {
			if (this.consoleLogging){
				console.log(this.id + ".update");
				console.log(this.id + ": buttons created: " + this.buttonsCreated);
			}
            this._contextObj = obj;
            this._resetSubscriptions();		
		
			callback();

        },
        _resetSubscriptions: function () {
			if (this.consoleLogging){
				console.log(this.id + "._resetSubscriptions");
			}

            if (this._handle) {
				if (this.consoleLogging){
					console.log(this.id + "._resetSubscriptions unsubscribe");
				}
                mx.data.unsubscribe(this._handle);
                this._handle = null;
            }

            if (this._contextObj) {
				if (this.consoleLogging){
					console.log(this.id + "._resetSubscriptions subscribe to: " + this._contextObj.getGuid());
				}

                this._handle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._createButtons();
                    })
                });
            }
            else if (this.imageEntity){
                this._handle = mx.data.subscribe({
                    entity: this.imageEntity,
                    callback: lang.hitch(this, function (entity) {
                        this._createButtons();
                    })
                });

            }
        },

		_createButtons: function(){
			console.log("buttons created: " + this.buttonsCreated);
			if (!this.buttonsCreated){
				if (this.consoleLogging){
					console.log(this.id + "._createButtons");
				}		
			  if (this.downloadable){
					var btnOptions = {
						"class" : "html-download mx-button btn",
						"type" : "button",
						"style" : "margin: 2px"
					};
					var spanOptions = {
						"class" : "glyphicon glyphicon-download"
					}

					var span = dom.create("span",spanOptions);
					var downloadBtn = dom.create("button", btnOptions, span);
					downloadBtn.appendChild(document.createTextNode(this.downloadBtnText));

					on(downloadBtn, "click", lang.hitch(this, function (e) {
						
						var targetElement = this.getHTMLObject();										
						var options = this.getOptions(this.htmlObjectWidth,this.htmlObjectHeight);
												
						html2canvas_HTML(targetElement,options).then(lang.hitch(this,function(canvas) {

								var dataUrl= canvas.toDataURL("image/png",1);
								
								var a = document.createElement('a');
									// toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
								a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
								a.download = this.fileName + ".jpg";
								a.click();
									
								this.hideProgress();

								})
						)

					}));
					// add the button outside the this.domNode, otherwise it would be included in the downloaded picture.
					this.domNode.appendChild(downloadBtn);
					this.buttonsCreated = true;

			  }
			  if (this.savable){
					if (this.constraint != "" && this.imageEntity != null){

						var btnSaveOptions = {
							"class" : "html-save mx-button btn",
							"type" : "button",
							"style" : "margin: 2px"
						};
						var spanSaveOptions = {
							"class" : "glyphicon glyphicon-ok"
						}

						var spanSave = dom.create("span",spanSaveOptions);
						var saveBtn = dom.create("button", btnSaveOptions, spanSave);
						saveBtn.appendChild(document.createTextNode(this.saveBtnText));

						on(saveBtn, "click", lang.hitch(this, function (e) {
														
							var targetElement = this.getHTMLObject();					
							var options = this.getOptions(this.htmlObjectWidth,this.htmlObjectHeight);
													
							html2canvas_HTML(targetElement,options).then(lang.hitch(this,function(canvas) {

								var dataUrl= canvas.toDataURL("image/png",1);
								var fileBlob = this._b64toBlob(dataUrl.replace("data:image/png;base64,", ""), "image/jpeg");

								this._saveFile(fileBlob);
									
							}));

						}));
						
						// add the button outside the this.domNode, otherwise it would be included in the downloaded picture.
						this.domNode.appendChild(saveBtn);
						this.buttonsCreated = true;
					} else {
						alert(this.id + "\n\nIf savable is set to true, both the constraint and imageEntity need to be set in the widget settings!\n\nPlease check the widget settings!");
					}
			  } 
			} 
		},
		_b64toBlob : function(b64Data, contentType, sliceSize) {
			if (this.consoleLogging){
				console.log(this.id + "._b64toBlob");
			}	
			
		  contentType = contentType || '';
		  sliceSize = sliceSize || 512;

		  var byteCharacters = atob(b64Data);
		  var byteArrays = [];

		  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
			  byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		  }

		  var blob = new Blob(byteArrays, {type: contentType});
		  return blob;
		},
		_saveFile : function(fileBlob){
			if (this.consoleLogging){
				console.log(this.id + "._saveFile");
			}	
			
			mx.data.create({
				entity: this.imageEntity,
				callback: lang.hitch(this,function(obj) {
					this.fileGuid = obj.getGuid();
					if (this.consoleLogging){
						console.log("Object created on server");
					}
					
					if (this._contextObj){
						var endOfAssociationIndex = this.constraint.indexOf("/");
						var referenceAdded = obj.addReference(this.constraint.substring(1,endOfAssociationIndex), this._contextObj.getGuid());
						if (this.consoleLogging){
							console.log("Association: " + this.constraint.substring(1,endOfAssociationIndex) + " ,contextguid: " + this._contextObj.getGuid() + "newFileobjectguid: " + this.fileGuid);
						}
					}
					obj.set("Name",this.fileName);
					mx.data.commit({
						mxobj: obj,
						callback: lang.hitch(this,function() {
							if (this.consoleLogging){
								console.log(this.id + ": Object committed");
							}
						}),
						error: lang.hitch(this,function(e) {
							this.hideProgress();
							alert(this.id + ": Error occurred attempting to commit: " + e);						
						})
					});

					if (this.fileGuid !== ""){
						mx.data.saveDocument(this.fileGuid, this.fileName + ".jpg", { width: 180, height: 180 }, fileBlob, function() {
							// success
						}, lang.hitch(this,function(e) {
							alert(this.id + ": Error occurred attempting to save document: " + e);
							this.hideProgress();
						}));
					}
					
				}),
				error: lang.hitch(this,function(e) {
					this.hideProgress();
					if (this.consoleLogging){
						console.log("an error occured: " + e);
					}

				})
			});
			this.hideProgress();
		},
		getHTMLObject : function(){
			this._progressID = mx.ui.showProgress(this.message);
			if (this.fullPage){
				var body = document.body;
				this.htmlObject = body;		
				this.htmlObjectWidth = this.htmlObject.getBoundingClientRect().width;	
			}
			else {
				this.htmlObject = document.getElementsByClassName(this.targetClassName)[0];	
				this.htmlObjectWidth = this.htmlObject.offsetWidth;				
			}
			if (this.consoleLogging){
				console.log(this.id + 'htmlObject for image:');
				console.dir(this.htmlObject);
			}
			if (this.htmlObject) {
				var allNodes = this.htmlObject.getElementsByTagName("*");
				var maxHeight = 0;
				for (var j = 0; j < allNodes.length;  j++) {
					var thisH = allNodes[j].clientHeight;
					if (thisH > maxHeight) { 
						maxHeight = thisH; 
						if (this.consoleLogging){
							console.log(this.id + "maxHeight of htmlObject:" + maxHeight);
						}
					}
				}
  
				this.htmlObjectHeight = maxHeight;

				return this.htmlObject;
				
			} else {			
				alert(this.id + "\n\nNo HTML element found based on the CSS Class set in the widget.\n\nPlease check the widget settings!");
				return null;
			}
		},
		getOptions : function(useWidth,useHeight){
			if (this.consoleLoggin){
				console.log(this.id + "htmlObject width: " + useWidth + " ,height: " + useHeight);
			}
			return {
				width: useWidth,
				height: useHeight,
				background: this.bgColor,
				logging: this.consoleLogging,
				useCORS: this.useCORS,
				letterRendering: this.letterRendering,
				//proxy: serverjs,
				allowTaint:this.allowTaint,
				timeout: this.timeout
			};
		},
		hideProgress : function(){
			if (this._progressID) {
				mx.ui.hideProgress(this._progressID);
				this._progressID = null;
			}
		},
		uninitialize : function(){
			this.hideProgress();
		}
		
	})
	
});

require(["HTMLToImage/widget/HTMLToImage"]);
