		var CLversion = window.CLdocversion + '-1.0';
		var CLGlobalStateList = {}
		
		var generalIDcntr  = 0;
		var checkboxIDcntr = 0;
		var usectrlsafetyforlbl = false; 
		var usectrlsafetyformulti = true;


		if (!Number.MAX_SAFE_INTEGER) {
			Number.MAX_SAFE_INTEGER = 9007199254740991; // Math.pow(2, 53) - 1;
		}

		document.addEventListener('DOMContentLoaded', function() {
		   processIntoChecklist('#frmChecklist');
		}, false);
		
        function CloneSettingsObj(originsettings) {
            var clonedsettings = Object.assign({}, originsettings)

            clonedsettings.opt = Object.assign({}, originsettings.opt)
            clonedsettings.lastid = Object.assign({}, originsettings.lastid)

            return clonedsettings
        }

		function createDefaultSettings(rootelem) {
			return createDefaultSettings2(rootelem)
		}

        function createDefaultSettings1(rootelem) { // inherit
        	return {
					opt: {
						inheritUserID: true,
						inheritAutoID: false,
						prefixAutoID: "C",
						seperatorSubID: "_",
						applyInheritanceOnUserID: true,
						applyInheritanceOnAutoID: true,
						autoIDMinLength: 3,
						addhlvl:3,
						addhforleafs:false,
						ignoreduplicateIDs:false, // only safe for export tree generation

					},
					lastid: {
						id: $(rootelem).attr('id'),
						autoID: false,
						userID: (((rootelem == undefined) || (rootelem == null) || (rootelem == "")) ? false : ($(rootelem).attr('id') != undefined)),
						idelem: rootelem,
						inherited: false,
					},
					rootelement: rootelem,
					cbbaseID: undefined,
					lvl: 0,
				};
        }        

        function createDefaultSettings2(rootelem) { // no id inheritance
        	return {
					opt: {
						inheritUserID: true,
						inheritAutoID: false,
						prefixAutoID: "C",
						seperatorSubID: "_",
						applyInheritanceOnUserID: false,
						applyInheritanceOnAutoID: false,
						autoIDMinLength: 3,
						addhlvl:3,
						addhforleafs:false,
						ignoreduplicateIDs:false, // only safe for export tree generation

					},
					lastid: {
						id: $(rootelem).attr('id'),
						autoID: false,
						userID: (((rootelem == undefined) || (rootelem == null) || (rootelem == "")) ? false : ($(rootelem).attr('id') != undefined)),
						idelem: rootelem,
						inherited: false,
					},
					rootelement: rootelem,
					cbbaseID: undefined,
					lvl: 0,
				};
        }


        function setupAskPageLeave() {
        	window.addEventListener("beforeunload", function(e){
			  //myfun();
			  CLGlobalStateList = getCBArray("sai") // update to last state (might have missed a load event with no change afterwards)
			  performAutosave()
			  //e.preventDefault(); return 'Are you sure you want to leave this page? Unsaved checkbox state will be lost.';
			});
        }

		function processIntoChecklist(rootselector, settingsobj) {
            
            if (window.processIntoChecklistCalled == 1) {
            	console.log('processIntoChecklist: duplicate call aborted.')
            	return;
            } else {
                window.processIntoChecklistCalled = 1;	
            }

            if (settingsobj == undefined) {
				console.log("processIntoChecklist: no settings param, using defaults."); 
				var settingsobj = createDefaultSettings(undefined)
			}

			var prepareDOMforExport = true;
			if (prepareDOMforExport) {
				var settingsobj_export = CloneSettingsObj(settingsobj);
                settingsobj_export.opt.ignoreduplicateIDs = true;
                finalizeChecklistIDs(rootselector, settingsobj_export)
                //return;
			}
			

			var rootelem = $(rootselector);
			if (rootelem.length < 1) {
				console.log("processIntoChecklist: root selector does not match: length 0 found. aborting."); 
				return
			} 

			

            var settingsobj_orig = CloneSettingsObj(settingsobj);

			var checklists = rootelem.children().filter('div')
			if (checklists.length < 1) {
				console.log("processIntoChecklist: checklists div selector does not match: length 0 found. aborting."); 
				return
			}

			for (var i=0; i<checklists.length; i++) {
				var checklist = checklists[i]; 
                

                var settingsobj_sub = CloneSettingsObj(settingsobj);
				
                settingsobj_orig

				settingsobj_sub.lvl++
				processIntoChecklistWorker(checklist, settingsobj_sub);
			}
			
			var h1els = $('#frmChecklist h1');
			for (var h = 0; h < h1els.length;h++)  {
				var h1el = h1els[h]
			    if ($(h1el).siblings().filter('ol').css('display') == "none") {
					var tgltxt = '+'
				} else {
					var tgltxt = '-'
				}	
				$(h1el).after('<a class="toplnk" onClick="subsetchecked(event,this,true)" title="Check all child items (use with Ctrl or Shift to use)">C</a> <a class="toplnk" onClick="subsetchecked(event,this,false)" title="Uncheck all child items (use with Ctrl or Shift to use)">U</a> <a class="toplnk" onClick="findFirstOLChildUnchecked(event,this)">&lt?&gt;</a> <span onClick="nexttoggle(event, this)" class="toggler">'+tgltxt+'</span>')
			}
			
			var settingsobj_sub = CloneSettingsObj(settingsobj);

			appendImportExportForm(settingsobj_sub);

			var settingsobj_sub = CloneSettingsObj(settingsobj);

			setupNotes(settingsobj_sub);
			setupLinks(settingsobj_sub);

            if ($('#frmChecklist div.stickybar').length == 0) {
			    $('#frmChecklist').prepend('<div class="stickybar"></div>')
            }

			performAutorestore(settingsobj)
			setupAutosave(settingsobj_sub)
			setupAskPageLeave()

			console.log("processIntoChecklist: Done."); 
		}

		function processIntoChecklistWorker(checklist, settingsobj) {
			
			var cl = $(checklist);
			var ols = cl.children().filter('ol');

            var settingsobj_parent = CloneSettingsObj(settingsobj)

			for (var i=0; i<ols.length; i++) {
				var ol = ols[i];
				ol = $(ol);
				initElementID(ol)
				
				var lis = ol.children().filter('li');
                
                

				for (var j=0; j<lis.length; j++) {
					var li = lis[j]
					li = $(li)

					settingsobj = CloneSettingsObj(settingsobj_parent) // restore to parent since inheritance works downwards and not for siblings

					settingsobj = initCheckitemID(li, settingsobj);
                    var cbbaseID = settingsobj.cbbaseID

					var cntSubs = li.children().filter('ol').length;
					var hasSubs = (cntSubs > 0);
					
					//var debug_txt = document.getElementById(li.attr("id")).firstChild;
					//debug_txt = ((debug_txt.innerText != undefined)?debug_txt.innerText:debug_txt);
					//debug_txt = ((debug_txt.nodeValue != undefined)?debug_txt.nodeValue:debug_txt);

                    if (hasSubs) {
                    	li.addClass('tgl');
                    	var tgltxt = '&minus;'

                    	var licontents =  li.contents();
                    	var checkitem = licontents.not('ol'); // get the contents that are there already, excluding lower level list/items
                    	//li.prepend('<label for="'+cbbaseID+'"></label>'); // add a label

                        if ($(li).children().filter('ol').css('display') == "none") {
							var tgltxt = '+'
						} 
						
						
                        li.prepend('<a name="'+'goto_'+cbbaseID+'"></a> <a class="toplnk" onClick="gototop(event,this)">Top</a> <a class="toplnk" onClick="gotoparent(event,this)" title="go to parent item">Parent</a> <a class="toplnk" onClick="subsetchecked(event,this,true)" title="Check mark item + child items (use with Ctrl or Shift to use)">C</a> <a class="toplnk" onClick="subsetchecked(event,this,false)" title="Uncheck item + child items (use with Ctrl or Shift to use)">U</a> <a class="toplnk" onClick="findFirstOLChildUnchecked(event,this)" title="Find first unchecked child">&lt?&gt;</a> <span onClick="nexttoggle(event, this)" class="toggler">'+tgltxt+'</span>'); // add auxhilliary items for UI functions
                        li.prepend('<a class="usrntgl" data-for="'+cbbaseID+'" title="User notes">N</a>')

                    	var lbl = document.createElement('label'); // create a label for the ckeckbox we will create later...
                    	lbl = $(lbl);
                    	
                    	lbl.on('click', onClickCtrlSafety); // onClick behaviour only with shift or ctrl
                        
                    	lbl.attr('for', cbbaseID);
                    	li.prepend(lbl);

                        var hasheading = ($(licontents).filter('h1,h2,h3,h4,h5,h6').length > 0)
                        if (((settingsobj.lvl+1) <= settingsobj.opt.addhlvl) && (!hasheading)) { // does not have heading and settings tell us to add one
                            var hlvl = 'h'+(settingsobj.lvl+1).toString()
                            var hx = document.createElement(hlvl); // create a heading
                    	    hx = $(hx);

                            lbl.prepend(hx)
                    	    var inserinto = hx

                    	    //if ((settingsobj.lastid.userID == true) && (debug_txt != undefined) && (debug_txt != "")) console.log('<a href="#goto_'+cbbaseID+'">'+debug_txt.trim()+'</a> ')
                        } else {
                        	var inserinto = lbl

                        	//if ((settingsobj.lastid.userID == true) && (debug_txt != undefined) && (debug_txt != "")) console.log('<a href="#goto_'+cbbaseID+'">'+debug_txt.trim()+'</a> ')
                        }
                    	
                    	//lbl.prepend(checkitem); // re-insert the contents into the newly created label
                    	for (var k=licontents.length-1; k>-1;k--) { // workaround: jquery will not prepend text objects
                    		var licont = licontents[k];
                    		var licont0 = $(licont);
                    		if (licont0.hasClass("note")) { 
                    		    //console.log("note found")
                    		}
                    		if ((licont0.prop == undefined) || ( (licont0.prop("tagName") != "OL") && (licont0.hasClass("note") == false) ) ) {
                    			inserinto.prepend(licont0)
                    		}
                    		
                    	}
                    	
                    	li.prepend('<input type="checkbox" class="checklistbox" id="'+cbbaseID+'" name="'+cbbaseID+'" value="1" data-note="">'); // add the checkbox
                    	
                    	//lbl.prepend('<b>child?!</b>');
                    	checkitem.length

                    	// update settingsobj
                        var settingsobj_sub = CloneSettingsObj(settingsobj)


					    // go deeper recursively:
						settingsobj_sub.lvl++
					    processIntoChecklistWorker(li, settingsobj_sub) // go to the nexut lower level (recursively)
					} else {
						var licontents =  li.contents();
						var checkitem = li.contents().not('ol'); // get the contents that are there already, excluding lower level list/items
						
						li.prepend('<a name="'+'goto_'+cbbaseID+'"></a>'); // add auxhilliary items for UI functions

						li.prepend('<a class="usrntgl" data-for="'+cbbaseID+'" title="User notes">N</a>')
               
                    	lbl = document.createElement('label'); // create a label for the ckeckbox we will create later...
                    	lbl = $(lbl);
                        
						lbl.on('click', onClickCtrlSafety); // onClick behaviour only with shift or ctrl
                        
                    	lbl.attr('for', cbbaseID);
                    	li.prepend(lbl);
                    	
                    	var hasheading = ($(licontents).filter('h1,h2,h3,h4,h5,h6').length > 0)
                        if (((settingsobj.lvl+1) <= settingsobj.opt.addhlvl) && (!hasheading) && (settingsobj.opt.addhforleafs)) { // does not have heading and settings tell us to add one
                            var hlvl = 'h'+(settingsobj.lvl+1).toString()
                            var hx = document.createElement(hlvl); // create a heading
                    	    hx = $(hx);

                            lbl.prepend(hx)
                    	    var inserinto = hx
                        } else {
                        	var inserinto = lbl
                        }
                    	
                    	//lbl.prepend(checkitem); // re-insert the contents into the newly created label
                    	for (var k=licontents.length-1; k>-1;k--) { // workaround: jquery will not prepend text objects
                    		var licont = licontents[k];
                    		var licont0 = $(licont);
                    		if (licont0.hasClass("note")) { 
                    		    //console.log("note found")
                    		}
                    		if ((licont0.prop == undefined) || ( (licont0.prop("tagName") != "OL") && (licont0.hasClass("note") == false) ) ) {
                    			inserinto.prepend(licont0)
                    		}
                    		
                    	}
                    	
                    	
                    	li.prepend('<input type="checkbox" class="checklistbox" id="'+cbbaseID+'" name="'+cbbaseID+'" value="1" data-note="">'); // add the checkbox
					}

					



				}
			}
		}

		function isEmptyObj(obj) {
			for(var key in obj) {
				if(obj.hasOwnProperty(key))
					return false;
			}
			return true;
		}

		function saveToLocalStorageUser() {
			if (true || (CLGlobalStateList == undefined) || (isEmptyObj(CLGlobalStateList))) { // always force update here to prevent flaws from event updates to cause problems
				console.log('saveToLocalStorageUser: Initializing CLGlobalStateList')
				CLGlobalStateList = getCBArray("sai") // init
			}

			window.localStorage.setItem("CLGlobalStateListUser",JSON.stringify(CLGlobalStateList))
			window.localStorage.setItem("CLversionUser",CLversion)

			console.log('saveToLocalStorageUser: State saved.')

			var stats = checkStatisticsWorker(CLGlobalStateList)
			alert('Saving complete: \n'+stats.msg)

		}
		function restoreFromLocalStorageUser() {
            var cbarr = JSON.parse(window.localStorage.getItem("CLGlobalStateListUser"))
			var ver   = window.localStorage.getItem("CLversionUser")

			if (cbarr == null || ver == null) {
				console.log('restoreFromLocalStorageUser: no data in localStorage. Nothing to restore.')
				alert("Nothing in userspace of local storage.")
				return false;
			}

			if (ver != CLversion) {
				if (!window.confirm("Saved version is of version "+ver+" ("+cbarr['CLversion']+") but current document is version "+CLversion+". Saved state may differ from what is being loaded. Proceed?")) {
					console.log("restoreFromLocalStorageUser: version '"+ver+"' of stored data in localStorage differs from document version '"+CLversion+"'. Cannot restore safely. Aborting restore as requested.")
					return false
				} else {
					console.log("restoreFromLocalStorageUser: version '"+ver+"' of stored data in localStorage differs from document version '"+CLversion+"'. Cannot restore safely. Continuing restore anyways as requested.")
				}
			}

            CLGlobalStateList = cbarr;

			delete cbarr['CLversion']; // remove the version field, which should not be restored.
			restoreCBArray(cbarr, 'la'); // load all states

            console.log("restoreFromLocalStorageUser: Restore successfully completed.");

            var stats = checkStatisticsWorker(cbarr)
			alert('Restore complete: \n'+stats.msg)
            
			return true;
		}
		function clearLocalStorageUser() {
			if (!window.confirm("Clear local storage USER data? This cannot be undone. Unloaded states will be lost. Continue with deletion?")) { return; }

            window.localStorage.removeItem("CLGlobalStateListUser")
			window.localStorage.removeItem("CLversionUser")
			console.log("clearLocalStorageUser: Done.");
		}
		function clearAutosave() {
			if (!window.confirm("Clear local storage autosave data? This cannot be undone. Unloaded states will be lost. Continue with deletion?")) { return; }

            window.localStorage.removeItem("CLGlobalStateListAuto")
			window.localStorage.removeItem("CLversionAuto")
			console.log("clearAutosave: Done.");
		}

		function clearLocalStorageAll() {
			if (!window.confirm("Clear ALL local storage data? This cannot be undone. Unloaded states will be lost. Continue with deletion?")) { return; }
			
            window.localStorage.clear()
			console.log("clearLocalStorageAll: Done.");
		}

		function performAutorestore(settingsobj) {
			var cbarr = JSON.parse(window.localStorage.getItem("CLGlobalStateListAuto"))
			var ver   = window.localStorage.getItem("CLversionAuto")

			if (cbarr == null || ver == null) {
				console.log('performAutorestore: no data in localStorage. Nothing to restore.')
				return false;
			}

			if (ver != CLversion) {
				console.log("performAutorestore: version '"+ver+"' of stored data in localStorage differs from document version '"+CLversion+"'. Cannot restore safely. Aborting restore.")
				return false;
			}


            CLGlobalStateList = cbarr;

			delete cbarr['CLversion']; // remove the version field, which should not be restored.
			restoreCBArray(cbarr, 'la'); // load all states

            console.log("performAutorestore: Restore successfully completed.");
			return true;

		}

		

		function setupAutosave(settingsobj) {
            var onChecklistChange = function(event) {
            	//console.log('onChange '+event.target.type)
				if ((event.target.tagName == "INPUT") && (event.target.type.toLowerCase() == "checkbox") && (event.target.id != "") ) {
					//console.log('Changed CB '+event.target.id+"="+event.target.checked)

					if ((CLGlobalStateList == undefined) || (isEmptyObj(CLGlobalStateList))) {
						console.log('Initializing CLGlobalStateList on change of '+event.target.id+"="+event.target.checked)
						CLGlobalStateList = getCBArray("sai") // init
					}
					
					CLGlobalStateList[String(event.target.id)].state = getCBStateInt(event.target)
					CLGlobalStateList[String(event.target.id)].note  = getCBNote(event.target)

					performAutosave();

					//console.log('Autosave on CB change of '+event.target.id+"="+event.target.checked)

				}
				 
			}

			//document.getElementById("frmChecklist").addEventListener("click", onChecklistChange, false);
			document.getElementById("frmChecklist").addEventListener("change", onChecklistChange, false);

		}

		function performAutosave() {
			window.localStorage.setItem("CLGlobalStateListAuto",JSON.stringify(CLGlobalStateList))
			window.localStorage.setItem("CLversionAuto",CLversion)
		}


		function setupNotes() {
            // usernotes

            //usrntgl

			// checkitem text explanation notes
			for (el of document.querySelectorAll("ol > li > div.note, ol > li > span.note")) {
				expand_element = document.createElement("button");
				expand_element.classList.add("expandButton");

				var Nlinks = el.querySelectorAll("a").length;
				var button_text = "Additional info [+] ";
				if(Nlinks > 0) {
					if(Nlinks == 1) {
						button_text += " (1 link)";
					}
					else {
						button_text += " (" + Nlinks.toString() + " links)";
					}
				}

				expand_element.innerText = button_text;

				el.parentNode.insertBefore(expand_element, el);
				el.style.display = "none";
			}

			document.getElementById("frmChecklist").addEventListener("change", function(event) {
				 if (event.target.classList.contains("usernote")) {
				 	userNoteOnChange(event);
				 }
			});
			document.getElementById("frmChecklist").addEventListener("keyup", function(event) {
				 if (event.target.classList.contains("usernote")) {
				 	userNoteOnChange(event);
				 }
			});
			document.getElementById("frmChecklist").addEventListener("click", function(event) {
				if (event.target.classList.contains("expandButton")) {
					var explanation_div = event.target.parentElement.querySelector("div.note,span.note");
					if (explanation_div != null && explanation_div != undefined) {
						var minussig = '\u2212' // &minus;
						if(explanation_div.style.display == "none") {
							explanation_div.style.display = "block";
							event.target.innerText = event.target.innerText.replace("[+]","["+minussig+"]");
						}
						else {
							explanation_div.style.display = "none";
							event.target.innerText = event.target.innerText.replace("["+minussig+"]","[+]");
						}
					}
					event.preventDefault();
					event.stopPropagation();
				} else if (event.target.classList.contains("usernote") && (event.target.tagName.toUpperCase() == "BUTTON")) {
					
					userNoteOnBtnClick(event);

				} else if (event.target.classList.contains("usrntgl") || event.target.classList.contains("usrntglfilled")) {
					var notefor = event.target.dataset.for;
					console.log("toggling note for="+notefor)

					var usrnote = document.getElementById(notefor).dataset.note;
					console.log("  note for='"+notefor+"' has note='"+usrnote+"'.")

					var fsid = ("usrnote_"+notefor);
					var dvid = ("usrnote_cont_"+notefor);

					if (document.getElementById(fsid) == null) { // create new edit form 

						var dv = document.createElement("div");
						dv.id = dvid;
						dv.classList.add("usernote");

						var fs = document.createElement("fieldset");
						fs.id = fsid
						fs.classList.add("usernote");
						var lg = document.createElement("legend");
						var lgt = document.createTextNode("Remark for "+notefor+":"); 
						var nt = document.createElement("textarea");
						nt.id = "usrnote_txt_"+notefor
						nt.dataset.for = notefor;
						nt.classList.add("usernote");
						nt.value = usrnote;
						var lbl = document.createElement("label");
						lbl.for = nt.id;
						lbl.classList.add("usernote");
						var lblt = document.createTextNode("Note:"); 

						var btnnotesave = document.createElement("button");
						btnnotesave.id = "usrnote_btnsave_"+notefor
						btnnotesave.dataset.for = notefor;
						btnnotesave.classList.add("usernote");
						btnnotesave.dataset.action = "save";
						var btnnotesave_txt = document.createTextNode("Save"); 

						var btnnoteapply = document.createElement("button");
						btnnoteapply.id = "usrnote_btnsave_"+notefor
						btnnoteapply.dataset.for = notefor;
						btnnoteapply.classList.add("usernote");
						btnnoteapply.dataset.action = "apply";
						btnnoteapply.disabled = true;
						var btnnoteapply_txt = document.createTextNode("Apply"); 

						var btnnoteclose = document.createElement("button");
						btnnoteclose.id = "usrnote_btnclose_"+notefor
						btnnoteclose.dataset.for = notefor;
						btnnoteclose.classList.add("usernote");
						btnnoteclose.dataset.action = "close";
						var btnnoteclose_txt = document.createTextNode("Cancel"); 

                        lg.appendChild(lgt);
						fs.appendChild(lg);

						lbl.appendChild(lblt);
						//fs.appendChild(lbl);
						fs.appendChild(nt);


                        btnnoteclose.appendChild(btnnoteclose_txt)
                        btnnotesave.appendChild(btnnotesave_txt)
                        btnnoteapply.appendChild(btnnoteapply_txt)
						fs.appendChild(btnnoteclose);
						fs.appendChild(btnnoteapply);
						fs.appendChild(btnnotesave);

						dv.appendChild(fs)

                        var li = document.getElementById(notefor).parentNode;
						var ol = li.querySelector("ol")
						if ((ol != null) && (ol != undefined) && (ol.parentNode == li)) {
							li.insertBefore(dv, ol)
						} else {
							li.appendChild(dv)
						}

	
					}

					// focus textarea
					document.getElementById("usrnote_txt_"+notefor).focus()

					event.preventDefault();
					event.stopPropagation();
				} // if usertgl
			});

		}

		function userNoteOnChange(event) {
			var noteautosavewhiletyping = false;

			if (event.target.classList.contains("usernote") && (event.target.tagName.toUpperCase() == "TEXTAREA") && (event.target.dataset.for != undefined) && (event.target.dataset.for != "")) { // note modified
                var nt = event.target;
                var notefor = event.target.dataset.for;
                var cb = document.getElementById(notefor)
                if (cb == null) {
                	return;
                }

                // enable/disable apply
				var btnapply = nt.parentNode.querySelector('button[data-action="apply"]')
				var btnsave  = nt.parentNode.querySelector('button[data-action="save"]')
				var changed = (nt.value != cb.dataset.note)

                if (noteautosavewhiletyping) {
					CLGlobalStateList[notefor].note  = getCBNote(event.target)
					performAutosave();
                }

				//console.log("userNoteOnChange: detected "+((!changed)?" no ":"")+ " changes for note of "+notefor+": '"+nt.value+"' ?= '"+cb.dataset.note+"'." )
				if (btnapply != null) {
                    btnapply.disabled = !changed
				}

				if (event.ctrlKey && (event.ctrlKey == true) && event.key && event.key == "Enter") {
					// ctrl+Return: Save
					console.log("userNoteOnChange: save request detected, "+((!changed)?" no ":"")+ " changes for note of "+notefor+": '"+nt.value+"' ?= '"+cb.dataset.note+"'." )
					btnsave.click()
				}

				if (event.altKey && (event.altKey == true) && event.key && event.key == "Enter") {
					// shift+Return: Apply
					console.log("userNoteOnChange: apply request detected, "+((!changed)?" no ":"")+ " changes for note of "+notefor+": '"+nt.value+"' ?= '"+cb.dataset.note+"'." )
					btnapply.click()
				}

			}
		}

		function userNoteOnBtnClick(event) {
			var btn = event.target;
			var notefor = btn.dataset.for;
			var dvid = ("usrnote_cont_"+notefor);
			var dv = document.getElementById(dvid);
			if (dv == null) return;

			var cb = document.getElementById(notefor);
			if (cb == null) return;

			if (btn.dataset.action == "save") {
				var notetxt = document.getElementById("usrnote_txt_"+notefor).value;

                console.log("saving changes to note for="+notefor+": '"+notetxt+"'")
                setCBNote(cb, notetxt)

                CLGlobalStateList[notefor].note  = notetxt
				performAutosave();
                
				dv.parentNode.removeChild(dv);

			} else if (btn.dataset.action == "apply") {
				var notetxt = document.getElementById("usrnote_txt_"+notefor).value;
                
                console.log("applying changes to note for="+notefor+": '"+notetxt+"'")
                setCBNote(cb, notetxt)

                CLGlobalStateList[notefor].note  = notetxt
				performAutosave();

                btn.disabled = true;

			} else if (btn.dataset.action == "close") {
                console.log("discarding changes to note for="+notefor)
				dv.parentNode.removeChild(dv);
			}

			event.preventDefault();
			event.stopPropagation();

		}

	    function setCBNote(cb, notetxt) {
			if (typeof(cb) == "string") {
				//console.log("WARNING: setCBNote(cb='"+cb+"', txt='"+notetxt+"') was called with typeof(cb)==string, fetching element.")
        		cb = document.getElementById(cb)
        	}
			if ((cb == null) || (cb == undefined)) {
				console.log("WARNING: setCBNote(cb='"+cb+"', txt='"+notetxt+"') failed, bacause cb was not found (null or undefined).")
				return;
			}
			if (notetxt == undefined) {
				//console.log("WARNING: setCBNote(cb='"+cb+"', txt='"+notetxt+"') failed, bacause txt was not not set (undefined).")
				return;
			}

            cb.dataset.note = notetxt;
            //console.log("setting changes to note for="+cb.id+": '"+notetxt+"'")

			// update toggler
			var tgl =document.querySelector("a[data-for='"+cb.id+"']")
			if (notetxt.trim() != "") {
				tgl.classList.add("usrntglfilled")
				tgl.title = "User notes: \n" + notetxt;
			} else {
				tgl.classList.remove("usrntglfilled")
				tgl.title = "User notes";
			}

			// update textarea if open
			var nt = document.getElementById("usrnote_txt_"+cb.id);
			if ((nt != null) && (nt != undefined)) {
				nt.value = notetxt;
			}

		}

        function  getCBNote(cbox) {
        	if (typeof(cbox) == "string") {
        		cbox = document.getElementById(cbox)
        	}
            if (cbox && (cbox.dataset.note != undefined)) {
            	return cbox.dataset.note
            } 
            return "NOTE DATA-ATTRIBUTE MISSING!"
        }

		function setupLinks() {
            var links = document.querySelectorAll('a[href]:not([href=""])');
            for (var lnk of links) {
            	if (lnk.attributes && lnk.attributes.href && lnk.attributes.href.value != "" && lnk.attributes.href.value[0] == "#" && lnk.attributes.href.value.indexOf("#goto_") >= 0) { // internal
            	    
            		lnk.addEventListener("click", function(event) {
            			if ((event.target.tagName != "A")) {
            				return;
            			}

            			var lnk = event.target;
            			var targetelem = "a[name='"+lnk.attributes.href.value.substr(1)+"']"; // remove # char
            			console.log("emulating internal href="+lnk.attributes.href.value+" => gotoElem("+'"'+targetelem+'"'+") ..." )
            			
            			gotoElem(targetelem)

            			event.preventDefault();
					    event.stopPropagation();
            		} );
            	}
            }

			document.getElementById("frmChecklist").addEventListener("click", function(event) {
				if ((event.target.tagName == "A") && (event.target.href[0] == "#")) { // internal link
					
					console.log("Internal link target replaced with js goto")
					event.preventDefault();
					event.stopPropagation();
				} /* else if (event.target.tagName == "INPUT") {
					if(event.target.checked) {
						showAllWithClass(event.target.name);
					} else {
						hideAllWithClass(event.target.name);
					}
				} */
			});
		}


        function finalizeChecklistIDs(rootselector, settingsobj) {
            
        	var start = window.performance.now()

        	generalIDcntr  = 0;
		    checkboxIDcntr = 0;

			var rootorig = $(rootselector);
            var rootelem = rootorig.clone(true);  // do deep clone

			if (rootelem.length < 1) {
				console.log("finalizeChecklistIDs: root selector does not match: length 0 found. aborting."); 
				return
			} 

			if (settingsobj == undefined) {
				console.log("finalizeChecklistIDs: no settings param, using defaults."); 
				var settingsobj = createDefaultSettings(undefined)
			}

            var settingsobj_orig = CloneSettingsObj(settingsobj);

			checklists = rootelem.children().filter('div')
			if (checklists.length < 1) {
				console.log("finalizeChecklistIDs: checklists div selector does not match: length 0 found. aborting."); 
				return
			}

			for (var i=0; i<checklists.length; i++) {
				var checklist = checklists[i]; 
                

                var settingsobj_sub = CloneSettingsObj(settingsobj);
                settingsobj_orig

				settingsobj_sub.lvl++
				finalizeChecklistIDsWorker(checklist, settingsobj_sub);
			}
			
			
			
			var settingsobj_sub = CloneSettingsObj(settingsobj);
			


			var res = String(exportFinalizdedList(rootelem, settingsobj_sub));

			generalIDcntr  = 0;
		    checkboxIDcntr = 0;

		    window.finalizedDOMstr = res;

		    rootelem

		    if (rootelem[0].parentNode) {
				rootelem.parentNode.removeChild(rootelem); // removed cloned object to avoid id collisions
			}
			rootelem = null

		    var end = window.performance.now()


			console.log("finalizeChecklistIDs: Done (took "+(end - start)+"ms).");


		}

		function finalizeChecklistIDsWorker(checklist, settingsobj) {
			
			var cl = $(checklist);
			var ols = cl.children().filter('ol');

            var settingsobj_parent = CloneSettingsObj(settingsobj)

			for (var i=0; i<ols.length; i++) {
				var ol = ols[i];
				ol = $(ol);
				
				var lis = ol.children().filter('li');
                
				for (var j=0; j<lis.length; j++) {
					var li = lis[j]
					li = $(li)

					settingsobj = CloneSettingsObj(settingsobj_parent) // restore to parent since inheritance works downwards and not for siblings

					settingsobj = initCheckitemID(li, settingsobj);
                    var cbbaseID = settingsobj.cbbaseID

                    // prepare precursor DOM, undo li specific ID and use checkbox id instead
                    li.attr('id', cbbaseID)

					var cntSubs = li.children().filter('ol').length;
					var hasSubs = (cntSubs > 0);

                    if (hasSubs) {

                    	// update settingsobj
                        var settingsobj_sub = CloneSettingsObj(settingsobj)

					    // go deeper recursively:
					    settingsobj_sub.lvl++
						finalizeChecklistIDsWorker(li, settingsobj_sub) // go to the nexut lower level (recursively)
					} else {
						// done
						li
					}



				}
			}
		}

        function exportFinalizdedList(rootelem, settingsobj_sub) {

        	var finalizedDOM = new Array()
        	var finalizedDOMstr = ""

        	var rootelem = $(rootelem);
			if (rootelem.length < 1) {
				console.log("exportFinalizdedList: root selector does not match: length 0 found. aborting."); 
				return
			} 

			var checklists = rootelem.children().filter('div')
			if (checklists.length < 1) {
				console.log("exportFinalizdedList: checklists div selector does not match: length 0 found. aborting."); 
				return
			}

			for (var i=0; i<checklists.length; i++) {
				var checklist = checklists[i];
                var checklistobj = $(checklist)
                var checklistobj0 = (checklistobj[0])
                var clhtml = checklistobj0.innerHTML
                if (typeof(clhtml) == "string") { finalizedDOMstr += "\r\n\r\n" + clhtml; }
				finalizedDOM.push(clhtml)
			}

            /*
        	 $('body').append(
              '<form name="frmFinalizedDOM" id="frmFinalizedDOM" action="" onsubmit="return validatefrmSaveLoad();">'
			+ '	<textarea rows="10" id="edtFinalizedDOM"></textarea><br>'
			+ ''
			+ '</form><!-- frmFinalizedDOM form -->'
	        );

	        $('#edtFinalizedDOM')[0].value = finalizedDOMstr*/
	        return finalizedDOMstr;
        }

		
		function initElementID(el) {
			var el = $(el)
			var currentid = el.attr('id');
			if (currentid == undefined) {
				do {
				    var idval = el.prop("tagName")+((generalIDcntr).toString());
				    generalIDcntr++;
				} while (document.getElementById(idval) != null) 
				
				el.attr('id',idval)
				
				//console.log("initElementID: assigned:"+idval); 
			}
			var readidval = el.attr('id');
			//console.log("initElementID: read:"+readidval); 
			return readidval
		}

		function initCheckitemID(elem, settingsobj) {
			var el = $(elem)
			var currentid = el.attr('id');
			var itembaseid = ""
            var idval = ""
            var itemprefix = ""

            var settingsobj_updated = CloneSettingsObj(settingsobj);

            if (el.length == 0) {
            	console.log("ERROR: initCheckitemID: elem not found: "+elem+".")
            	return;
            }


			if (currentid == undefined) { // create auto ID, inherit parent id if settings tell us to
				settingsobj_updated.lastid.autoID = true;
				settingsobj_updated.lastid.userID = false;

				if ((el.first().prop('tagName') =="INPUT") && (el.attr('type') != undefined) && (el.attr('type').toLowerCase() == "checkbox")) {
					itemprefix = ""
				} else {
					itemprefix = el.prop("tagName")+"_"
				}

				do {
					itembaseid = settingsobj.opt.prefixAutoID + leftpad((checkboxIDcntr++).toString(), settingsobj.opt.autoIDMinLength, "0");

					if (settingsobj.opt.applyInheritanceOnAutoID) {
						if ((settingsobj.lastid.autoID) && (settingsobj.opt.inheritAutoID)) {
							itembaseid = settingsobj.lastid.id + settingsobj.opt.seperatorSubID + itembaseid
							settingsobj_updated.lastid.inherited = true
						} else if  ((settingsobj.lastid.userID) && (settingsobj.opt.inheritUserID)) {
							itembaseid = settingsobj.lastid.id + settingsobj.opt.seperatorSubID + itembaseid
							settingsobj_updated.lastid.inherited = true
						} else {
							settingsobj_updated.lastid.inherited = false
						}
					}

					idval = itemprefix+itembaseid;

					if (document.getElementById(idval) != null) {
						console.log("Info: ID collision for autoID '"+idval+"' (idval), incrementing and trying next...")
					}
					if (document.getElementById(itembaseid) != null) {
						console.log("Info: ID collision for autoID '"+itembaseid+"' (itembaseid), incrementing and trying next...")
					}

					if (checkboxIDcntr >= Number.MAX_SAFE_INTEGER-1) {
						console.log("ERROR: ID collisions until maxint. giving up.")
						checkboxIDcntr-- // undo ++ to avoid roll-over 
						break;
					}
				} while ((document.getElementById(idval) != null) || (document.getElementById(itembaseid) != null))

				el.attr('id',idval)

                settingsobj_updated.lastid.id = itembaseid;
				settingsobj_updated.lastid.idelem = el;

				//console.log("initElementID: assigned:"+idval); 
			} else { // use user ID, modify only if settings tell us to
                settingsobj_updated.lastid.autoID = false;
				settingsobj_updated.lastid.userID = true;

                if ((el.first().prop('tagName') =="INPUT") && (el.attr('type') != undefined) && (el.attr('type').toLowerCase() == "checkbox")) {
					itemprefix = ""
				} else {
					itemprefix = el.prop("tagName")+"_"
				}
				itembaseid = el.attr('id');

                if (settingsobj.opt.applyInheritanceOnUserID) {
					if ((settingsobj.lastid.autoID) && (settingsobj.opt.inheritAutoID)) {
						itembaseid = settingsobj.lastid.id + settingsobj.opt.seperatorSubID + itembaseid
						settingsobj_updated.lastid.inherited = true
					} else if  ((settingsobj.lastid.userID) && (settingsobj.opt.inheritUserID)) {
						itembaseid = settingsobj.lastid.id + settingsobj.opt.seperatorSubID + itembaseid
						settingsobj_updated.lastid.inherited = true
					} else {
						settingsobj_updated.lastid.inherited = false
					}
                }

				idval = itemprefix+itembaseid;
		
				el.attr('id',idval)

				if (document.getElementById(itembaseid) != null) {
					if (settingsobj.opt.ignoreduplicateIDs != true) {
					    console.log("ERROR: ID collision for user supplied ID '"+itembaseid+"' (itembaseid), set by element now designated '"+idval+"', saying '"+el.text().substr(0,30)+"[...]'. \n  Please fix list ID markup. Behaviour and states may be wrong until this is solved!")
					}
				}


				
			}
			//var readidval = el.attr('id');
			//console.log("initElementID: read:"+readidval); 
			settingsobj_updated.lastid.id = itembaseid
			settingsobj_updated.lastid.idelem = el
			
            settingsobj_updated.cbbaseID = itembaseid

			return settingsobj_updated
		}

		function edtFindIDKeyDown(ev) {
			if (ev.key == "Enter" || ev.code == "Enter") {
				ev.preventDefault();
				ev.stopPropagation();
				clFindID()
				return false;
			}
		}

		function appendImportExportForm(settingsobj) {
            $('body').append(
              '<form name="frmSaveLoad" id="frmSaveLoad" action="" onsubmit="return validatefrmSaveLoad();">'
			+ '<a href="#checklistlist" class="toplnk">scroll to Top</a> <a href="#SaveLoad" accesskey="s" class="toplnk">scroll to SaveLoad Form</a>'
			+ '<div>'
			+ '<fieldset><legend>Navigation &amp; Interaction</legend>'			
			+ '	<label for="edtFindID" accesskey="f">find ID</label><input type="text" id="edtFindID" name="edtFindID" value="" onKeyDown="edtFindIDKeyDown(event)" size="30"> '
			+ '	<input type="button" name="btnFindID" value="Goto ID" title="goto (last find) ID" accesskey="g" onClick="clFindID();"> | '
			+ '  <input type="button" name="btnStats" id="btnStats" title="show Statistics" value="Stats" accesskey="t" onClick="(function(ev) {var res = checkStatistics(); alert(res.msg);})(event)"> | '
			+ '  <input type="button" name="btnUnchecked" id="btnUnchecked" accesskey="u" title="Find first unchecked" value="Find first unchecked" onClick="findFirstUnchecked()"><br>'
			+ ' <input id="cbUsectrlsafetyforlbl" type="checkbox" checked="checked" value="1" onClick="usectrlsafetyforlbl = this.checked;"><label for="cbUsectrlsafetyforlbl">Use Ctrl safety for clicks on labels</label> | '
			+ ' <input id="cbUsectrlsafetyformulti" type="checkbox" checked="checked" value="1" onClick="usectrlsafetyformulti = this.checked;"><label for="cbUsectrlsafetyformulti">Use Ctrl safety for multi-checkbox-actions</label> | '
			+ '  <br>'
			+ ' <input type="button" name="btnExpandAll" id="btnExpandAll" title="[+] Expand all items"  value="[+] Expand all items" onClick="expandAll()" accesskey="e"> | '
			+ ' <input type="button" name="btnCollapseAll" id="btnCollapseAll" title="[+] Collapse all items" value="[-] Collapse all items" onClick="collapseAll()" accesskey="c"> | '
			+ '	<input type="button" name="btnReset" value="Reset all" onClick="if (window.confirm(\'Uncheck everything?\')) {resetForm(false);}"> | '
			+ '	<input type="button" name="btnCheckAll" value="Check all" onClick="if (window.confirm(\'Check everything?\')) {resetForm(true);}"> | '
			
			+ '</fieldset><br>'
			+ '<fieldset><legend>Save & Load</legend>'						
			+ '	<a name="SaveLoad"></a><label for="edtSaveLoad">save/load list</label><br>'
			+ '	<textarea  rows="10" id="edtSaveLoad"></textarea><br>'
			+ '	<input type="button" name="btnSave" value="Save state as ID list" onClick="saveForm()">'
			+ '	<input type="button" name="btnLoad" value="Load state from ID list" onClick="restoreForm()">'
			+ '	<select size="1" name="lbSaveOpt" id="lbSaveOpt">'
			+ '	 <option value="sa">Save all</option>'
			+ '	 <option value="sc">Save checked</option>'
			+ '	 <option value="su">Save unchecked</option>'
			+ '	 <option value="sai" selected="selected">Save all (int)</option>'
			+ '	 <option value="sci">Save checked (int)</option>'
			+ '	 <option value="sui">Save unchecked (int)</option>'
			+ '	</select>'
			+ '	<select size="1" name="lbLoadOpt" id="lbLoadOpt">'
			+ '	 <option value="la" selected="selected">Load all</option>'
			+ '	 <option value="lc">Load checked</option>'
			+ '	 <option value="lu">Load unchecked</option>'
			+ '	</select>'
			+ '	<input type="button" name="btnTextCopy" value="Copy" title="Copy to clipboard" onClick="copyOutputToClipboard();">'
			+ '	<input type="button" name="btnTextPaste" value="Paste" title="Paste from clipboard" onClick="pasteOutputFromClipboard();">'
			+ ' <br>'
			+ '	<br>'
			+ '	<input type="checkbox" id="textIDs" name="textIDs" checked="checked"><label for="textIDs">Export Ids</label> | '
			+ '	<input type="checkbox" id="textIdx" name="textIdx" checked="checked"><label for="textIdx">Export Numbers</label> | '
			+ '	<input type="checkbox" id="textVALs" name="textVALs" checked="checked"><label for="textVALs" title="Exporting values is safer but makes it more cumbersome to tick the exported checklist off">Values</label> | '
			+ '	<input type="checkbox" id="textMD" name="textMD" ><label for="textMD" title="Markdown. Only has effect with numbers disabled, use wrap of 0 and with indent of 4 for best results.">M&darr;</label> | '
			+ '	<label for="textWrapAt">wrap at</label><input type="text" id="textWrapAt" name="textWrapAt" value="72" size="4" title="0 = do not wrap"> | '
			+ '	<label for="textWrapIndent">indent</label><input type="text" id="textWrapIndent" name="textWrapIndent" value="3" size="4"> | '
			+ '	<input type="checkbox" id="textExportNotes" name="textExportNotes" checked="checked"><label for="textExportNotes">Export Notes</label> | '
			+ '	<input type="checkbox" id="textExportEmptyNotes" name="textExportEmptyNotes" checked="checked"><label for="textExportEmptyNotes">Export empty Notes</label> | <br>'
			+ '	<input type="button" name="btnTextExport" value="Export Text Checklist" onClick="textExport();">'
			+ '	<input type="button" name="btnTextImport" value="Load IDs &amp; values within Text" onClick="textImport();"><br>'
            + '	<br>'
            + '	<input type="button" name="btnSaveLocal" value="Save to local storage" onClick="saveToLocalStorageUser();">'
            + '	<input type="button" name="btnLoadLocal" value="Load from local storage" onClick="restoreFromLocalStorageUser();"><br>'
			+ '	<input type="button" name="btnClearLocalUser" value="Clear data (user)" onClick="clearLocalStorageUser();">'
			+ '	<input type="button" name="btnClearLocalAuto" value="Clear data (autosave)" onClick="clearAutosave();">'
			+ '	<input type="button" name="btnClearLocalAll" value="Clear data (everything)" onClick="clearLocalStorageAll();"><br>'
			+ '	<input type="button" name="btnExportFinalalizedDOM" value="Export DOM with finalized IDs" onClick="ExportFinalizedDOM();"><br>'
            + '	<br>'
			+ ' <label for="inputFileNameToSaveAs">Save as filename</label><input id="inputFileNameToSaveAs" value="PCB-checklist.txt" size="30">'
            + ' <button onclick="saveTextAsFile()">Save Text to File</button><br>'
			+ ' <label for="fileToLoad">Load from local file</label><input type="file" id="fileToLoad">'
			+ ' <button onclick="loadFileAsText()" id="btnloadFileAsText">Load Selected File</button> <!--button onclick="return false;">Dummy</button--><br>'
			+ '	<br>'
			+ '</fieldset>'			
			+ '</div>'
			+ ''
			+ '</form><!-- SaveLoad form -->'
	        );

            usectrlsafetyforlbl = document.getElementById('cbUsectrlsafetyforlbl').checked;
            usectrlsafetyformulti = document.getElementById('cbUsectrlsafetyformulti').checked;
		}

		function ExportFinalizedDOM() {
			$("#edtSaveLoad").prop("value", window.finalizedDOMstr);
		}

		
		
		function arrLen(arr) {
			var k;
			var len = 0;
			for (k in arr) {
				len++;
			}
			return len;
		}
		
		function getCBElementList() {
			var inputlst = $("#frmChecklist input");
		 	var cblst = inputlst.filter("input[type=checkbox]");
		 	return cblst;
		}
		
		
		function getCBArray(opt) {
		 	var cblst = getCBElementList()
		 	var cbox;
		 	var cbarr = {};
		 	
		 	if ((opt == undefined) || (opt == "")) {
				var opt = $("#lbSaveOpt");
				if (opt.length < 1) {
					opt = "sa";
				} else {
					opt = opt.val();
				}
		 	}
		 	//console.log( "found " +cblst.length.toString()+" checkboxes (again)." );
		 	
		 	for (var k=0; k<cblst.length; k++) {
		 		cbox = cblst.get(k);
		 		
		 		if (cbox.length < 1) {
		 			console.log("length 0 found"); 
		 			continue;
		 		}
		 		if ((cbox.id in cbarr)) {
		 			console.log("duplicate id key '"+cbox.id+"' found"); 
		 			continue;
		 		}
		 		if (cbox.id == undefined) {
		 			console.log("undefined id found"); 
		 			continue;
		 		}
		 		if (cbox.id == "") {
		 			console.log("empty id found"); 
		 			continue;
		 		}
		 		
		 		//if (cbox.is(":checked")) {
		 		

		 		if (cbox.checked) {
		 			if ((opt == "sa") || (opt == "sc")) { // save all , save checked
		 			    cbarr[cbox.id] = {}
		 				cbarr[cbox.id].state = true;
		 				cbarr[cbox.id].note  = getCBNote(cbox);
		 			} else if ((opt == "sai") || (opt == "sci")) {// save all as int , save checked as int
		 			    cbarr[cbox.id] = {}
		 			    cbarr[cbox.id].state = getCBStateInt(cbox);
		 			    cbarr[cbox.id].note  = getCBNote(cbox);
		 			}
		 		} else {
		 			if ((opt == "sa") || (opt == "su")) { // save all, save unchecked
		 			    cbarr[cbox.id] = {}
		 				cbarr[cbox.id].state = false;
		 				cbarr[cbox.id].note  = getCBNote(cbox);
		 			} else if ((opt == "sai") || (opt == "sui")) { // save all as int, save unchecked as int
		 			    cbarr[cbox.id] = {}
						cbarr[cbox.id].state = getCBStateInt(cbox);
						cbarr[cbox.id].note  = getCBNote(cbox);
		 			}
		 			
		 		}
		 	}
		 	//console.log( "items in array: " +arrLen(cbarr)+"." );
		 	return cbarr;
		}



		function getCBStateInt(cbox) {
			if (cbox.checked) {
				if (cbox.indeterminate == true) {
					return 3;
				} else {
					return 1;
				}
			} else {
				if (cbox.indeterminate == true) {
					return 2;
				} else {
					return 0;
				}
			}
		}
		
		function  restoreCBArray(cbarr, opt) {
			var k, v;
			if ((opt == undefined) || (opt == "")) {
				var opt = $("#lbLoadOpt");
				if (opt.length < 1) {
					opt = "la";
				} else {
					opt = opt.val();
				}
			}
			
			for (k in cbarr) {
				cbox = $("#"+k);
				cbox = cbox.filter("[type=checkbox]");
				
				if (cbox.length == 1 ) { // checkbox exists 
				    //cbox = cbox[0];
					if ((cbarr[k].state == true) || (cbarr[k].state == 1) || (cbarr[k].state == "1")) {
						//console.log("restoring checkbox '"+k+"' state to checked.");
						if ((opt == "la") || (opt == "lc")) { // load all , load checked
							if ((opt == "la") || (opt == "lc")) {
								cbox.prop('indeterminate', false);
							}
							cbox.prop('checked', true);
							setCBNote(cbox.attr("id"),cbarr[k].note)
						}
					} else if ((cbarr[k].state == false) || (cbarr[k].state == 0) || (cbarr[k].state == "0")) {
						if ((opt == "la") || (opt == "lu")) { // load all, load unchecked
						    if ((opt == "la") || (opt == "lu")) {
								cbox.prop('indeterminate', false);
							}
							cbox.prop('checked', false);
							setCBNote(cbox.attr("id"),cbarr[k].note)
						}
					} else if ((cbarr[k].state == 2) || (cbarr[k].state == "2")) {
						
						if (opt == "la" || (opt == "lu") ) {
							console.log("WARNING: restoreCBArray: Undecided value "+cbarr[k].state+" for index "+k+". Marking.")
							cbox.prop('checked', false);
							cbox.prop('indeterminate', true);
							setCBNote(cbox.attr("id"),cbarr[k].note)
						} else {
							console.log("WARNING: restoreCBArray: Undecided value "+cbarr[k].state+" for index "+k+". Ignoring due to load option.")
						}
					} else if ((cbarr[k].state == 3) || (cbarr[k].state == "3")) {
						
						if (opt == "la" || (opt == "lc")) {
							console.log("WARNING: restoreCBArray: Undecided value "+cbarr[k].state.state+" for index "+k+". Marking.")
							cbox.prop('checked', true);
							cbox.prop('indeterminate', true);
							setCBNote(cbox.attr("id"),cbarr[k].note)
						} else {
							console.log("WARNING: restoreCBArray: Undecided value "+cbarr[k].state+" for index "+k+". Ignoring due to load option.")
						}

					} else {
						console.log("WARNING: restoreCBArray: Undefined value "+cbarr[k].state+" for index "+k+". Ignoring.")
					}

				} else {
					console.log("unable to find unique checkbox with id '"+k+"' and restore value '"+cbarr[k].state+"' to it.");
				}
			}
		}
		
		function saveForm() {
			var cbarr = getCBArray();
			var hashstr = window.JSON.stringify(cbarr);
			var clsha1 = hex_sha1(hashstr)
			
			cbarr['CLversion'] = CLversion;
			cbarr['CLsha1'] = clsha1;
			
			var tbox = $("#frmSaveLoad #edtSaveLoad");
			var jstr = window.JSON.stringify(cbarr);
			jstr = jstr.replace(/,/g,',\n');
			tbox.val(jstr);
		}

		function copyOutputToClipboard(txt) {
			copyToClipboard($("#edtSaveLoad").prop("value"));
		}

		function pasteOutputFromClipboard() {
			$("#edtSaveLoad").prop("value", "")
			$("#edtSaveLoad").focus()
			document.execCommand("paste")
			navigator.clipboard.readText().then(
              clipText => document.getElementById("edtSaveLoad").value = clipText);
		}

		function copyToClipboard(txt) {
			navigator.clipboard.writeText(txt).then(function(permstat) {
			  /* clipboard successfully set */
			  console.log("Writing text '"+txt.substr(0,30)+"...' to clipboard succeeded: "+permstat)
			}, function() {
			  /* clipboard write failed */
			  console.log("Writing text '"+txt.substr(0,30)+"...' to clipboard failed: "+permstat)
			});
		}
		
		function restoreForm() {
			var tbox = $("#frmSaveLoad #edtSaveLoad");
			var jstr = tbox.val();
			
            try {
			    var cbarr = window.JSON.parse(jstr);
            } catch (err) {
                console.log("Could not read JSON: "+err+" Aborting.")
            	return
            } 

			if (!versionAndHashOKOrAccepted(cbarr)) {
				console.log("Aborting import.")
				return
			}
			
			
			delete cbarr['CLversion']; // remove the version field, which should not be restored.
			delete cbarr['CLsha1']; // remove the version field, which should not be restored.
			
			restoreCBArray(cbarr);
			CLGlobalStateList = cbarr; // init with new current state
		}
		
		
		function resetForm(val) {
			var inputlst = $("#frmChecklist input");
		 	var cblst = inputlst.filter("input[type=checkbox]");
		 	var cbox;
		 	var cbarr = {};
		 	//console.log( "found " +cblst.length.toString()+" checkboxes (again)." );
		 	
		 	for (var k=0; k<cblst.length; k++) {
		 		cbox = cblst.get(k);
		 		var cbid = cbox.id
		 		if (cbox != undefined && cbid) {
		 			cbox = $("#"+cbid);
		 			if (val == 0 || val == false || val == 1 || val == true) {
						cbox.prop('checked', val);
						cbox.prop('indeterminate', false);
		 			} else if (val == 2) { 
		 			    cbox.prop('checked', false);
						cbox.prop('indeterminate', true);
		 			} else if (val == 3) { 
                        cbox.prop('checked', true);
						cbox.prop('indeterminate', true);
		 			}
		 			setCBNote(cbid, "")
		 		}
		 	}
		}
		

		function onClickCtrlSafety(ev) {
			if ((usectrlsafetyforlbl != undefined) && (usectrlsafetyforlbl == false)) {
				console.log("onClickCtrlSafety disabled by setting.");
				return true;
			}

			if ( ((ev.path != undefined) && (ev.path[0].tagName == "A")) || ((ev.target != undefined) && (ev.target.tagName == "A")) ) {
				console.log("onClickCtrlSafety disabled for link click.");
				return true;
			}

			if (!ev.shiftKey && !ev.ctrlKey) {
				console.log("onClickCtrlSafety aborted due to shift/ctrl key safety. Press shift or control key to enable this function.");
				ev.preventDefault();
				ev.stopPropagation();
				return false;
			} else {
                console.log("onClickCtrlSafety passed.");

                // fix for Firefox, not using default label action on ctrl or shhift click
                var cb = $('#'+$(ev.target).attr("for"))[0]

                var isChecked = (cb.checked)
                cb.checked = !isChecked
                ev.preventDefault();
                ev.stopPropagation();
                console.log("onClickCtrlSafety toggle executed.");


				//return true;
			}
		}
		
		function subsetchecked(ev, elem, check) {
			
			console.log("subsetchecked for elem '"+elem.toString()+"' id '"+elem.id+"' called, desired value is "+check.toString()+".");
			
			if (usectrlsafetyformulti && (!ev.shiftKey && !ev.ctrlKey)) {
				console.log("subsetchecked aborted due to shift/ctrl key safety. Press shift or control key to enable this function.");
				return;
			} else if (!usectrlsafetyformulti) {
				console.log("shift/ctrl disabled for multi-actions.");
			}
			
			var elem1 = $(elem);
			var parent1 = elem1.parent();
			var childs1 = parent1.find("input[type=checkbox]");
			
			for (k=0;k<childs1.length; k++) {
				if (check) {
					childs1.prop("checked",true);
				} else {
					childs1.prop("checked",false);
				}
			}
		}
		
		
		function subtoggle(ev,elem) {
			return;
			
			console.log("subtoggle for elem '"+elem.toString()+"' id '"+elem.id+"' called.");
			var elem1 = $(elem);
			
			childs1 = elem1.children("ol");
			//next1 = elem1.next("ol");
			//childs1 = next1;
			//childs1 = elem1.children();
			
			if (childs1.css('display') == "none") {
				childs1.show();
				elem1.css('color','');
				elem1.removeClass('isCollapsed');
			} else {
				childs1.hide();
				elem1.css('color','#808080');
				elem1.addClass('isCollapsed');
			}
			ev.stopPropagation();
			ev.stopImmediatePropagation();
		}
		
		
		function nexttoggle(ev,elem) {
			
			console.log("nexttoggle for elem '"+elem.toString()+"' id '"+elem.id+"' called.");
			elem1 = $(elem);
			
			//childs1 = elem1.children("ol");
			var nexta = elem1.next("ol");
			var nextb = elem1.next("div").next("ol"); // if usernotes are open this can happen
            var next1 = null
			
			//childs1 = elem1.children();
			if (nexta.length >= 1) {
				next1 = nexta
			} else if (nextb.length >= 1) {
				next1 = nextb
			} else {
				console.log("no matches for nexta/b.");
			}
			
			if (next1.css('display') == "none") {
				next1.show();
				elem1.css('color','');
				elem1.removeClass('isCollapsed');
				//elem1.html('-');
				elem1.html('&minus;');
			} else {
				next1.hide();
				elem1.css('color','#808080');
				elem1.addClass('isCollapsed');
				elem1.html('&plus;');
			}
			ev.stopPropagation();
			ev.stopImmediatePropagation();
		}
		
		
		
		$( document ).ready(function() {
			var cbarr = {};
		 
		    console.log( "document loaded" );
		    inputlst = $("#frmChecklist input");
		 	cblst = inputlst.filter("[type=checkbox]");
		 	console.log( "found " +cblst.length.toString()+" checkboxes." );
		 	
		 	cbarr = getCBArray();
		 	
		});
		
		
		
		
		function textImport() {
			var tbox = $("#frmSaveLoad #edtSaveLoad");
			var tstr = tbox.val();
			cbarr = {};
			var backreplace = false;
			
			//idregex = "[^{^}]*{([A-Za-z_\\-0-9]+):([012])+}";
			
			idvalexpr = '{([A-Za-z_0-9\\.\\-]+):["]*([a-z0-9\\.\-]+)["]*}';
			idvalregex = new RegExp(idvalexpr, 'g');

			//     \[([\?_xX ])\][ ][ ]((?!\]  ).)*{([A-Za-z_0-9\\.\\-]+):["]*([\?01])["]*}
			//   [\[]([\?_xX ])\][ ][ ]((?!\]  ).)*{([A-Za-z_0-9\\.\\-]+):["]*([\?01])["]*}
			cbidexpr = '[\[]([\?\!_xX ])\][ ][ ]((?!\]  ).)*?{([A-Za-z_0-9\\.\\-]+):["]*([\?0123])["]*}'; // ((?!\]  ).)* == matches anything but "]  "
			try {
			    cbidregex = new RegExp(cbidexpr, 'gs');
			} catch (e) {
				cbidregex = new RegExp(cbidexpr, 'g');
				tstr = tstr.replace(/\r/g,"&checklistr;")
				tstr = tstr.replace(/\n/g,"&checklistn;")
				backreplace = true;
			}
			
            // {(cl:n@C641)This is a test note [_] [X] containing{1} some(2) strange[3] brackets. cl:n)}
			cbnoteexpr = /\{\(cl\:n\@([A-Za-z0-9_\-]+)\)(.*?)\(cl:n\)\}/; // ((?!\]  ).)* == matches anything but "]  "
			try {
			    cbnoteregex = new RegExp(cbnoteexpr, 'gs');
			} catch (e) {
				cbnoteregex = new RegExp(cbnoteexpr, 'g');
				tstr = tstr.replace(/\r/g," ")
				tstr = tstr.replace(/\n/g," ")
			}
			
			var res = idvalregex.exec(tstr);
			while (res != null) {
				
				if (res.length > 2) {
					var id = res[1];
					var resval = res[2];

					if (cbarr[id] == undefined) {
						cbarr[id] = {}
						cbarr[id].state = -1 // init for hashing stability
						cbarr[id].note = "" // init for hashing stability
					}

					var cbval = -1;
					// normalize for hash
					if (resval == false || resval == "false" || resval == 0 || resval == "0") {
						cbval = 0;
					} else if (resval == true || resval == "true" || resval == 1 || resval == "1") {
						cbval = 1;
					} else if (resval == 2 || resval == "2") {
						cbval = 2;
					} else if (resval == 3 || resval == "3") {
						cbval = 3;
					} else {
						cbval = resval
					}


					cbarr[id].state = cbval;
				}
				
				res = idvalregex.exec(tstr);
			}	

			var res = cbidregex.exec(tstr);
			while (res != null) {
				
				if (res.length > 4) {
					var id = res[3]
					var cbval = res[1]
					var idval = res[4]
					// res[2] is dummy data fom .*

					if (cbarr[id] == undefined) {
						cbarr[id] = {}
						cbarr[id].state = -1 // init for hashing stability
						cbarr[id].note = "" // init for hashing stability
					}

					//console.log("found: "+id+":"+idval+" ?= '"+cbval+"'")

					if (idval == "?" && (cbval.toUpperCase() =="X") && idval != "" && id != "" ) {
						cbarr[id].state = 1;
						//console.log("textImport: found CHECKED: "+id+":"+idval+" ?= '"+cbval+"'")
					}
					if (idval == "?" && (cbval =="_" || cbval ==" ") && idval != "" && id != "" ) {
						cbarr[id].state = 0;
						//console.log("textImport: found UNCHECKED: "+id+":"+idval+" ?= '"+cbval+"'")
					}
					if (idval == "?" && (cbval =="?") && idval != "" && id != "" ) {
						cbarr[id].state = 2; // undefined, tendency unchecked
						console.log("INFO: textImport: found UNDECIDED tentatively unchecked: "+id+":'"+idval+"' ?= '"+cbval+"'")
					}
					if (idval == "?" && (cbval =="!") && idval != "" && id != "" ) {
						cbarr[id].state = 3; // undefined, tendency checked
						console.log("INFO: textImport: found UNDECIDED tentatively checked: "+id+":'"+idval+"' ?= '"+cbval+"'")
					}
					if ( ((idval == "0") && (cbval.toUpperCase() =="X") && idval != "" ) || ((idval == "1") && ((cbval =="_") || (cbval ==" ")) && idval != "" ) ) { // inconsistent
						cbarr[id].state = 2; // undefined, tendency unchecked
						console.log("WARNING: textImport: Inconsistent value of checkbox text field ["+cbval+"] != "+idval+" for id "+id+", marking.")
					}

					if ( ((idval == "3") && ((cbval.toUpperCase() ==" ") || (cbval.toUpperCase() =="_")) ) ) { // inconsistent, err on save and assume tentatively unchecked
						cbarr[id].state = 2; // undefined, tendency unchecked
						console.log("WARNING: textImport: Inconsistent value of checkbox text field ["+cbval+"] != "+idval+" for id "+id+", marking.")
					}

					
				}
				
				res = cbidregex.exec(tstr);
			}

            var res = cbnoteregex.exec(tstr);
			while (res != null) {
				if (res.length > 2) {
					var id = res[1]
					var notetxt = res[2]

					if (cbarr[id] == undefined) {
						cbarr[id] = {}
						cbarr[id].state = -1
					}
					if (backreplace) {
						notetxt = notetxt.replace(/&checklistr;/g,"\r")
				        notetxt = notetxt.replace(/&checklistn;/g,"\n")
					}
					cbarr[id].note = notetxt

				}

				res = cbnoteregex.exec(tstr);
			}

			if (!versionAndHashOKOrAccepted(cbarr)) {
				console.log("Aborting import.")
				return
			}
			
			delete cbarr['CLversion']; // remove the version field, which should not be restored.

			delete cbarr['CLsha1']; // remove the version field, which should not be restored.
			

			restoreCBArray(cbarr);
			CLGlobalStateList = cbarr; // init with new current state
			
		}

		function versionAndHashOKOrAccepted(cbarr) {
			var res = false;

			var clversionsaved = cbarr['CLversion']
			if ((clversionsaved != undefined) && (clversionsaved.state != undefined)) {
				clversionsaved = clversionsaved.state
			}
			delete cbarr['CLversion']; // remove the version field, which should not be restored or hashed.

			var clsha1saved = cbarr['CLsha1'];
			if ((clsha1saved != undefined) && (clsha1saved.state != undefined)) {
				clsha1saved = clsha1saved.state
			}
			delete cbarr['CLsha1']; // remove the version field, which should not be restored or hashed.
			
			var restoreddata = JSON.stringify(cbarr);
			var clsha1restored = hex_sha1(restoreddata) // rehash

			if ((clversionsaved != undefined) && (clsha1saved != undefined) && (clversionsaved == CLversion) && (clsha1saved == clsha1restored))
			    res = true // everything matches, chear pass.
			else if ((clversionsaved != undefined) && (clsha1saved != undefined) && (clversionsaved != CLversion) && (clsha1saved != clsha1restored)) {
				// hash and version present and differ
				res = window.confirm("Saved version is "+clversionsaved+" but current document is version "+CLversion+". Saved state will differ from what is being loaded. Also, the hash for saved state ("+clsha1saved+") differs from what will be restored ("+clsha1restored+"). This can happen between browsers or with only whitespace changes but can also mean that the restored document will not represent what was originally exported. Check carefully if you proceed. Proceed?")
			} else if ( ((clversionsaved == undefined) || (clversionsaved != CLversion)) && ( (clsha1saved == undefined) || (clsha1saved == clsha1restored)) ) {
				// version present and differs, hash ok or not present
				res = window.confirm("Saved version is "+clversionsaved+" but current document is version "+CLversion+". Saved state may differ from what is being loaded. Proceed?")
			} else if ((clsha1saved != undefined) && (clsha1saved != clsha1restored) && ( clversionsaved == CLversion) ) {
				// hash present and differs, version ok
				res = window.confirm("Saved version matches document version but hash calculated when data was exported ("+clsha1saved+") differs from what will be restored ("+clsha1restored+"). This can happen between browsers or with only whitespace changes but can also mean that there were edits and the restored document will not represent what was stored. Check carefully if you preceed. Proceed?")
			} else {
				res = window.confirm("Saved is "+clversionsaved+", current document version is "+CLversion+". Exported hash was ("+clsha1saved+"), restored data hashes to ("+clsha1restored+"). Loaded data may not represent what was exported. Proceed?")
			}

			if (!res) {
				//console.log(restoreddata)
				console.log("versionAndHashOKOrAccepted returns false.")
			}

			return res

		}
		
		
		function checkStatistics() {
			cbarr = getCBArray();
			
			return checkStatisticsWorker(cbarr);
		}

		function checkStatisticsWorker(cbarr) {
			//cbarr = getCBArray();
			res = {};
			var checkedcnt = 0;
			var uncheckedcnt = 0;
			var indeterminatechecked = 0
			var indeterminateunchecked = 0
			var unknown = 0
			var notes = 0
			for (k in cbarr) {
				
				if ((cbarr[k].state == false) || (cbarr[k].state == 0)) {
					uncheckedcnt++;
				} else if ((cbarr[k].state == true) || (cbarr[k].state == 1)) {
					checkedcnt++;
				} else if ((cbarr[k].state == 2)) {
					indeterminateunchecked++;
				} else if ((cbarr[k].state == 3)) {
					indeterminatechecked++;
				} else {
					unknown++
				}
				if (cbarr[k].note && (cbarr[k].note.trim() != "") ) {
					notes++
				}
				
			}
			var padl = 4;
			var padc = " "
			var resstr = leftpad(checkedcnt.toString(),padl,padc)          +" passed,             "+leftpad(uncheckedcnt.toString(),padl,padc)+          " untested,             "+leftpad((checkedcnt + uncheckedcnt).toString(),padl,padc)                    +" known,  "+leftpad((checkedcnt + uncheckedcnt +indeterminatechecked+indeterminateunchecked+unknown).toString(),padl,padc)+" total. \n";
			resstr +=    leftpad(indeterminatechecked.toString(),padl,padc)+" tentatively passed, "+leftpad(indeterminateunchecked.toString(),padl,padc)+" tentatively untested, "+leftpad((indeterminatechecked + indeterminateunchecked).toString(),padl,padc)+" total indetermminate,  "+leftpad(unknown.toString(),padl,padc)+          " in unkown state. \n"+leftpad(notes.toString(),padl,padc)+" items with usernotes.\n";
			
			res.unchecked = uncheckedcnt;
			res.checked = checkedcnt;
			res.indeterminateunchecked = indeterminateunchecked;
			res.indeterminatechecked = indeterminatechecked;
			res.unknown = unknown;
			res.notes = notes;
			res.msg = resstr;
			return res;
		}
		
		
		
		
		function textExport() {
			var level = 0;
			var d;
			var elems
			var ddiv;
			var dh1;
			var res = "";
			var opt = {};
			
			opt['includeid'] = $("#textIDs").prop("checked");
			opt['includeval'] = $("#textVALs").prop("checked");
			opt['includeindex'] = $("#textIdx").prop("checked");
			opt['includemarkdown'] = $("#textMD").prop("checked");
			opt['wrapat'] = $("#textWrapAt").val();
			opt['subindent'] = $("#textWrapIndent").val();
            opt['exportnotes'] = $("#textExportNotes").prop("checked")
			opt['exportemptynotes'] = $("#textExportEmptyNotes").prop("checked")
			
			elems = $('form div');
			for (d=0; d<elems.length; d++) {
				ddiv = $(elems[d]);
				dh1 = ddiv.children("h1");
				
				if (dh1.length >=1) {
					res += dh1.text() + " \n";
				}
				
				res += textExportWorker(ddiv, level+1, opt);
			}
			
			var cllst = getCBArray();
			var clsha1 = hex_sha1(JSON.stringify(cllst))
			//console.log(JSON.stringify(cllst))
			res += '\nLegend: X=checked, _=unchecked, !=tentatively checked, ?=tentatively unchecked'+"\n";
			res += '\n{CLsha1:"'+clsha1+'"}'
			res += '\n{CLversion:"'+CLversion+'"}'+"\n";

			
			var tbox = $("#frmSaveLoad #edtSaveLoad");
			//var jstr = window.JSON.stringify(cbarr);
			//jstr = jstr.replace(/,/g,',\n');
			tbox.val(res);
			
		}
		
		function textExportWorker(currentElement, currentLvl, opt) {
			var ol_childs;
			var ol_child;
			var li_childs;
			var li_child;
			var li_cbox;
			var li_label;
			var idx;
			var idstr;
			var str;
			
			var k, m, n;
			var res = '';
			var line = '';
			
			if (opt['subindent'] == undefined) { opt['subindent'] = 3; }
			if (opt['wrapat'] == undefined) { opt['wrapat'] = 0; }
			if (opt['includeindex'] == undefined) { opt['includeindex'] = true; }
			if (opt['includeid'] == undefined) { opt['includeid'] = true; }
			if (opt['exportnotes'] == undefined) { opt['exportnotes'] = true; }
			if (opt['exportemptynotes'] == undefined) { opt['exportemptynotes'] = true; }
			if (opt['wrapnotes'] == undefined) { opt['wrapnotes'] = true; }
			
			ol_childs = currentElement.children("ol"); // get all ordered list childs
			//if (ol_childs.length < 1) { return; } // no further list items in this tree.
			var indent = "";
			for (n=0; n < currentLvl; n++) {
				for (m=0;m<opt['subindent'];m++) {
					indent += " ";
				}
			}
			
			for (k=0; k<ol_childs.length; k++) {
				ol_child = $(ol_childs[k]);
				
				li_childs = ol_child.children("li");
				
				for (m=0; m<li_childs.length; m++) {
					li_child = $(li_childs[m]);
					
					// process this item
						// get check state
						li_cbox = li_child.children("input[type=checkbox]");
						
						// get text label
						li_label = li_child.children("label");
						
						// assemble plain text
						line = indent;
						if (li_label.length >= 1) {
							if (opt['includeindex']) {
								idx = li_child.index();
								
								var ltype = ol_child.css('list-style-type');
								
								switch(ltype) {
									case 'upper-alpha'          : idstr = String.fromCharCode("A".charCodeAt(0) + (idx+0))+ "."; break; break;
									case 'lower-roman'          : idstr =  romanize(idx+1); idstr = idstr.toLowerCase()+ "."; break;
									case 'decimal-leading-zero' : idstr = (idx+1).toString()+ "."; if (idstr.length < 2) { idstr = '0'+idstr; } break;
									case 'decimal'              : idstr = (idx+1).toString()+ ".";  break;
									case 'lower-alpha'          : idstr = String.fromCharCode("a".charCodeAt(0) + (idx+0))+ "."; break; break;
									case 'upper-roman'          : idstr = romanize(idx+1); idstr = idstr.toUpperCase()+ ".";  break;
									case 'lower-greek'          : idstr = greekchar(idx); break;
									//case 1: idstr = String.fromCharCode("A".charCodeAt(0) + (idx+0))+ "."; break;
									//case 2: idstr = (idx+0).toString()+ "."; break;
									//case 3: idstr =  romanize(idx+1); idstr = idstr.toLowerCase()+ "."; break;
									//case 4: idstr = romanize(idx+1); idstr = idstr.toUpperCase()+ "."; break;
									default:idstr = '?'+(idx+0).toString()+ "."; break;
								}
								while(idstr.length < opt['subindent']) { idstr += ' '; }
								line+=idstr+"";
							} else if (opt['includemarkdown']) {
								line += "* ";
							}
							
							var cboxid = "";
							var cboxint = "";
							
							if (li_cbox.length >= 1) {
								if (li_cbox.prop("indeterminate")) {
									if (li_cbox.prop("checked") == true) {
										line += "[!]";
										cboxint = 3;
									} else {
										line += "[?]";
										cboxint = 2;
									}
									cboxid = li_cbox.prop("id");

								} else {
									if (li_cbox.prop("checked") == true) {
										line += "[X]";
										cboxint = 1;
									} else {
										if (opt['includemarkdown']) {
											line += "[ ]";
										} else {
											line += "[_]";
										}

										cboxint = 0;
									}
								cboxid = li_cbox.prop("id");
								}
							} else {
								line += "[?]";
							}
							
							line += "  " + li_label.text().trim() 
							if (opt['includeid']) {
								var val = ((opt['includeval']) ? cboxint.toString() : "?")
								line += "  {"+cboxid+":"+val+"}"; 
							}

							if (opt['wrapat'] > 0) {
								line = wordwrap(line, opt['wrapat'], opt['subindent'], true);
							}
							
							line += " \n";

                            // {(cl:n@C641)This is a test note [_] [X] containing{1} some(2) strange[3] brackets. (cl:n)}

                            
							if (opt['exportnotes'] && (opt['exportemptynotes'] || li_cbox.attr("data-note") != "") ) {
								line += indent;
								var subindent = ""
								for (var i=0; i < (opt['subindent']); i++) { subindent += ' '; }
								line += subindent;

								var note = "{(cl:n@"+cboxid+")" + li_cbox.attr("data-note") + "(cl:n)}";
								if (opt['wrapnotes']) {
									note =  wordwrap(note, opt['wrapat'], opt['subindent'], true);
								}
								line += note

								line += " \n";
							}
							
							res+=line;
						}
					
					// process possible sub lists in this item
					res +=  textExportWorker(li_child, currentLvl+1, opt);
				}
				
			}
			
			return res;
			
		}
		
		function wordwrap(line, wrapPosition, subindent, dowordwrap) {
			if (line.length < wrapPosition) {
				return line;
			}
						
			// get whitespace prefix
			var indentpatt = new RegExp("^[ \\s\\t]+");
			var white = new RegExp("^[\\s ]+$");
			var k; var tst;
			var subindentstr = "";
			var firstwrap = true;
			for (k=0; k<subindent; k++) { subindentstr += " "; }
			
 			var windent = indentpatt.exec(line);
 			
 			if (windent == null) {
 				windent = '';
 			} else {
 				windent = windent[0];
 				line = line.substring(windent.length);
 			}
 			wrappos = wrapPosition - windent.length; // substract whitespace from internal wrapping index, since it is removed from line and added later after wrapping.
 			
 			lines = new Array();
 			while (line.length > wrappos) {
 				for (k=wrappos; k > 0; k--) {
 					tst = line.charAt(k);
 					if (white.test(tst)) {
 						// wrap here
 						lines.push(line.substring(0, k));
 						line = line.substring(k+1);
 						if (firstwrap) {
 							wrappos -= subindent; // wrap ealier, because now subindent is added
 							firstwrap = false;
 						}
 						break;
 					}
 				}
 				if (k==0) {
	 				// no suitable whitespace found: hard break
	 				lines.push(line.substring(0, wrappos));
	 				line = line.substring(wrappos+1);
	 				if (firstwrap) {
						wrappos -= subindent; // wrap ealier, because now subindent is added
						firstwrap = false;
					}
 				}
 			}
 			if (line.trim().length > 0) {
 				lines.push(line);
 			}
 			line = "";
 			
 			for (k=0;k<lines.length;k++) {
 				if (k>0) {
 					line += windent + subindentstr + lines[k];
 				} else {
 					line += windent + lines[k];
 				}
 				if ((k+1) < lines.length) { 
 					line+= "\n";
 				}
 			}
 			return line;
		}
		
		function leftpad(content, length, padstr) {
        	content = String(content)
        	padstr = String(padstr || padstr === 0 ? padstr : ' ')
        	var left = Math.max(length - content.length, 0)
        	var padding = padstr.repeat(Math.floor(left / padstr.length))
        	//var fractleft = Math.max(length - content.length - padding.length, 0)
        	var fractleft = Math.max(left % padstr.length, 0)
        	var fractpadding = padding.substr(0,fractleft)
        	return padding + fractpadding + content
        }
		
		function romanize(num) {
		  var lookupRm = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
		  var lookupNum = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
		  var roman = '',i;
		  
		  for ( i=0;i<lookupNum.length;i++ ) {
		    while ( num >= lookupNum[i] ) {
		      roman += lookupRm[i];
		      num -= lookupNum[i];
		    }
		  }
		  return roman;
		}
		
		function greekchar(num) {
			switch(num) {
				case 00 : return unescape('%u03B1'); break;
				case 01 : return unescape('%u03B2'); break;
				case 02 : return unescape('%u03B3'); break;
				case 03 : return unescape('%u03B4'); break;
				case 04 : return unescape('%u03B5'); break;
				case 05 : return unescape('%u03B6'); break;
				case 06 : return unescape('%u03B7'); break;
				case 07 : return unescape('%u03B8'); break;
				case 08 : return unescape('%u03D1'); break;
				case 09 : return unescape('%u03B9'); break;
				case 10 : return unescape('%u03BA'); break;
				case 11 : return unescape('%u03BB'); break;
				case 12 : return unescape('%u03BC'); break;
				case 13 : return unescape('%u03BD'); break;
				case 14 : return unescape('%u03BE'); break;
				case 15 : return unescape('%u03BF'); break;
				case 16 : return unescape('%u03C0'); break;
				case 17 : return unescape('%u03D6'); break;
				case 18 : return unescape('%u03C1'); break;
				case 19 : return unescape('%u03C2'); break;
				case 20 : return unescape('%u03C3'); break;
				case 21 : return unescape('%u03C4'); break;
				case 22 : return unescape('%u03C5'); break;
				case 23 : return unescape('%u03C6'); break;
				case 24 : return unescape('%u03C7'); break;
				case 25 : return unescape('%u03C8'); break;
				case 26 : return unescape('%u03C9'); break;
				default : return unescape('%u03C9') + num.ToString();
			}
		}
		
		
		function findFirstOLChildUnchecked(ev, elem) {
			console.log("findFirstOLChildUnchecked for elem '"+elem.toString()+"' id '"+elem.id+"' called.");
			
			
			//if (!ev.shiftKey && !ev.ctrlKey) {
			//	console.log("subsetchecked aborted due to shift/ctrl key safety. Press shift or control key to enable this function.");
			//	return;
			//}
			
			var elem1 = $(elem);
			var parent1 = elem1.parent();
			var childs1 = parent1.find("ol");
			
			findFirstChildUnchecked(childs1);
		}
		
		
		function findFirstChildUnchecked(theParent) {
			parent1 = $(theParent);
			
			//var elem1 = $(aParentChild);
			//var parent1 = elem1.parent();
			//var childs1 = parent1.find("input[type=checkbox]");
			
		 	//var cblst = parent1.filter("input[type=checkbox]");
		 	
		 	var cblst = parent1.find("input[type=checkbox]");
		 	
			var warnings = false;
			var allchecked = true;
			for (k=0; k<cblst.length; k++) {
				cbox = cblst.get(k);
		 		
		 		if (cbox.length < 1) {
		 			console.log("length 0 found"); 
		 			warnings = true;
		 			continue;
		 		}
		 		if (cbox.id == undefined) {
		 			console.log("undefined id found"); 
		 			warnings = true;
		 			continue;
		 		}
		 		if (cbox.id == "") {
		 			console.log("empty id found"); 
		 			warnings = true;
		 			continue;
		 		}
		 		
		 		//if (cbox.is(":checked")) {
		 		if (cbox.checked) {
		 			continue;
		 		} else {
		 			allchecked = false;
		 			clFindIDWorker(cbox.id);
		 			break;
		 		}
			}
			if (warnings) {
				alert('There were warnings. Please check console log.');
			}
			
			if (allchecked) {
				alert('All '+k.toString()+' child items checked. This part is complete.');
			}
			
		}
		
		
		function findFirstUnchecked() {
			var cblst = getCBElementList();
			var warnings = false;
			var allchecked = true;
			for (k=0; k<cblst.length; k++) {
				cbox = cblst.get(k);
		 		
		 		if (cbox.length < 1) {
		 			console.log("length 0 found"); 
		 			warnings = true;
		 			continue;
		 		}
		 		if (cbox.id == undefined) {
		 			console.log("undefined id found"); 
		 			warnings = true;
		 			continue;
		 		}
		 		if (cbox.id == "") {
		 			console.log("empty id found"); 
		 			warnings = true;
		 			continue;
		 		}
		 		
		 		//if (cbox.is(":checked")) {
		 		if (cbox.checked) {
		 			continue;
		 		} else {
		 			allchecked = false;
		 			clFindIDWorker(cbox.id);
		 			break;
		 		}
			}
			if (warnings) {
				alert('There were warnings. Please check console log.');
			}
			
			if (allchecked) {
				alert('All '+k.toString()+' items checked. You are done.');
			}
			
		}
		
		function expandAll() {
            var togglers = $('body span.toggler')
            var toggler = undefined;
            var toggler0 = undefined;

            for (var i=0;i<togglers.length; i++) {
            	toggler = togglers[i]
            	toggler0 = $(toggler)

            	if ((toggler0.html() == "+") || (toggler0.html() == "&plus;")) {
            		var ev = new MouseEvent('click');
            		
            		toggler.onclick(ev, toggler)
            	}
            }
		}

		function collapseAll() {
			var togglers = $('body span.toggler')
            var toggler = undefined;
            var toggler0 = undefined;

            for (var i=0;i<togglers.length; i++) {
            	toggler = togglers[i]
            	toggler0 = $(toggler)

            	if ((toggler0.html() == "-") || (toggler0.html() == "\u2212")) {
				    var ev = new MouseEvent('click');

            		toggler.onclick(ev, toggler)
            	}
            }
		}

		function gototop(ev, el) {
			var elem = $(el)
            par_div = elem.closest('div')
			if (par_div.length ==1) {
				gotoElem(par_div);
			}
		}

		function gotoparent(ev, el) {
            var elem = $(el)
            if (elem.length ==1) {
            	//console.log("closest 0 at "+elem.first().innerText);
                par_ol = elem.closest('ol')

                if (par_ol.length ==1) {
                	//console.log("closest 1 at "+par_ol.first().innerText);
                    par_li = par_ol.closest('li')
                    if (par_li.length ==1) {
                    	//console.log("closest 2 at "+par_li.first().innerText);
                    	gotoElem(par_li);
                    } else {
						par_div = elem.closest('div')
						if (par_div.length ==1) {
							gotoElem(par_div);
						}
				    }
                } else {
					par_div = elem.closest('div')
					if (par_div.length ==1) {
						gotoElem(par_div);
					}
				}
            } 
		}
				
		function clFindID() {
			var idstr = $("#edtFindID").val();
			idstr = idstr.replace('{','');
			idstr = idstr.replace(':0}','');
			idstr = idstr.replace(':1}','');
			idstr = idstr.replace(':2}','');
			idstr = idstr.replace('}','');
			idstr = idstr.trim();
			clFindIDWorker(idstr);
		}
		
		function clFindIDWorker(idstr) {
			var cbox = $("#"+idstr);

			
			if (cbox.length == 1) {
				gotoElem(cbox)
			}
		}

		function gotoElem(elem) {
            var elem0 = $(elem)			


            var toffset = -1;
			var st = -1;
			
			toffset = elem0.offset().top;

			var tadd = (-1)*($('div.stickybar').height()+2)


			//console.log("offset:"+toffset);	
			if ((toffset+tadd) >= 0) {
				try {
					$('html, body').animate({ // use animate if using jquery only
						scrollTop: (toffset+tadd)
					}, 500);
				} catch (err) {
					console.log("animate not available.");
					try {
						$('html, body').velocity({ // use animate if using jquery only
							scrollTop: (toffset+tadd)
						}, 500);
					} catch (err) {
						console.log("velocity not available.");
						$('html, body').scrollTop((toffset+tadd));	
					}
				}
				$('html, body').scrollTop((toffset+tadd));
			}

		}


		function saveTextAsFile() {
			var textToSave = document.getElementById("edtSaveLoad").value;
			var textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
			var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
			var fileNameToSaveAs = document.getElementById("inputFileNameToSaveAs").value;

			var downloadLink = document.createElement("a");
			downloadLink.download = fileNameToSaveAs;
			downloadLink.innerHTML = "Download File";
			downloadLink.href = textToSaveAsURL;
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);

			downloadLink.click();
			console.log("file exported.");
		}

		function destroyClickedElement(event) {
			document.body.removeChild(event.target);
		}

		function loadFileAsText() {
			var fileToLoad = document.getElementById("fileToLoad").files[0];

			var fileReader = new FileReader();
			fileReader.onload = function(fileLoadedEvent) 
			{
				var textFromFileLoaded = fileLoadedEvent.target.result;
				document.getElementById("edtSaveLoad").value = textFromFileLoaded;
			};
			fileReader.readAsText(fileToLoad, "UTF-8");
			console.log("file loaded.");
			return false;
		}

		function validatefrmSaveLoad() {
			console.log("abort submit.");
			return false;
		}

		
