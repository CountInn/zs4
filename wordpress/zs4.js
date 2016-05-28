////////////////////////////////////////////////////////////////////////"+"

var zs4 = {
	
	console:{
		active:true,
		log:function(s){if(zs4.zs4.console.active==true)console.log(s);return zs4.zs4.console.active;},
		on:function(){return(zs4.zs4.console.active=true);},
		off:function(){return(zs4.zs4.console.active=false);},
	},
	copy:{
		object:{
			properties:function(s,d){
				for (var n in s){
					if(zs4.is.object(s[n])){
						if(!d.hasOwnProperty(n)){d[n]={};}
						zs4.copy.object.properties(s[n],d[n]);
						continue;
					}
					d[n]=s[n];
				}
				return d;
			},
		},
	},
	create:{
		zs4:function(){
			var nu = {
				zs4:zs4,
				arg:{},
				evt:[],
				tool:[],
				bpc:4,
				bpm:120,
				stats:{
					chords:0,
					bars:0,
					beats:0,
					
					countChords:0,
					countBars:0,
					countBeats:0,
					
					currentBar:null,
					currentBeat:null,
					start:function(){
						this.currentBar = null;
						this.currentBeat = null;
						this.countChords = this.countBars = this.countBeats = 0;
					},
					countEvent:function(e){
						e.duration = 0;
						if (e.bar != null) {
							this.countBars++;
							this.currentBar = e;
							this.currentBeat = e;
							this.currentBar.bar.beats = [e];
							this.currentBar.bar.events = [e];
							
							this.countBeats++;
							this.currentBeat.beat = {
								events:[e],
							};
						}
						else if (e.beat!=null){
							this.countBeats++;
							this.currentBeat = e;
							
							this.currentBeat.beat = {
								events:[e],
							};
							
							if (this.currentBar != null){
								this.currentBar.bar.beats.push(e);
								this.currentBar.bar.events.push(e);
							}
						}
						else {
							if (this.currentBar != null){
								this.currentBar.bar.events.push(e);
							}
							
							if (this.currentBeat != null){
								this.currentBeat.beat.events.push(e);
							}
						}
						
						if (e.chord != null && e.chord.ok){
							this.countChords++;
						}
					},
					end:function(){
						this.chords = this.countChords;
						this.bars = this.countBars;
						this.beats = this.countBeats;
					},
				},
				key:zs4.music.parse.chord(""),
				evt_current:null,
				evt_curidx:-1,
				current_tool:null,
				
				onKeyChange:function(nuKee){
					if	(!this.key.ok)
						return;
					
					nuKee = parseInt(nuKee);
					
					var delta = nuKee - this.key.v;
					this.key.v = nuKee;
					
					this.transpose(delta);
				},

				onLogoClick:function(){
					if (this.evt.length == 0)
						return;
					
					zs4.player.onLogoClick(this);

					this.refresh();
				},

				onSelectTool:function(){
					var t = parseInt(this.toolselect.value);
					if (t < 0 || t >= this.tool.length)return;
		
					var tool_selected = false;
					for (var i = 0 ; i < this.tool.length ; i++)
					{
						var tul = this.tool[i];
						if (t==i){
							if	(tul.visible){
								tul.toolWindow.style.display = 'none';
								tul.visible = false;
								this.current_tool = null;
							}else{
								tul.toolWindow.style.display = 'inline-block';
								tul.visible = true;
								tul.onSelectEvent();
								this.current_tool = tul;
								this.current_tool.onSelectEvent();
								tool_selected = true;
							}
							
						}else{
							tul.toolWindow.style.display = 'none';
							this.tool[i].visible = false;
							
						}
					}
					
					console.log(this.tool[t]);
					this.toolselect.value = -1;
				},
				
				onEventClick:function(evt){
					if (zs4.player.is.running()){
						zs4.player.onEventClick(this,evt);
					}else{
						this.setCurrentEvent(evt);
					}
				},
				
				clearCurrentEvent:function(){
					if (this.evt_current != null){
						this.evt_current.eEvent.className = '';
						this.evt_current = null;
					}
				},

				otherZs4Playing:function(){
					if (zs4.player.zs4 != null && zs4.player.zs4 != this) 
						return true;
					else
						return false;
				},
				
				setCurrentEvent:function(evt){
					this.clearCurrentEvent();
					this.evt_current = evt;
					evt.eEvent.className = 'zs4current';

					
					this.evt_curidx = -1;
					for (var i = 0 ; i < this.evt.length ; i++){
						if (evt == this.evt[i])
						this.evt_curidx = i;
					}
					
					if (this.current_tool != null){
						this.current_tool.onSelectEvent();
					}
					
					if (this.current_tool != null){
						this.current_tool.refresh();
					}
					//this.refresh();
				},

				getEventIndex:function(evt){
					for (var i = 0 ; i < this.evt.length ; i++){
						if (evt == this.evt[i])
						return i;
					}
					
					return 0;
				},

				currentEvent:function(){
					this.setCurrentEvent(this.evt[((this.evt_curidx) % this.evt.length)]);
				},
				setNextEvent:function(){
					this.setCurrentEvent(this.evt[((this.evt_curidx+1) % this.evt.length)]);
				},
				setPreviousEvent:function(){
					this.setCurrentEvent(this.evt[((this.evt_curidx+this.evt.length-1) % this.evt.length)]);
				},
				searchNextEvent:function(from){
					return ((this.evt_curidx+1) % this.evt.length);
				},
				searchPrevEvent:function(from){
					return ((this.evt_curidx+this.evt.length-1) % this.evt.length);
				},
				searchPrevBar:function(from){
					if (from == null) from = this.evt_curidx;
					from %= this.evt.length;
					
					if (this.evt[from].bar)
						return from;
						
					for (var i = (this.evt.length-1) ; i > 0; i--){
						idx = ((from+i)%this.evt.length);
						if (this.evt[idx].bar)
							return idx;
					}
					
					return from;
				},
				
				transpose:function(delta){
				
					for ( var i = 0 ; i < this.evt.length ; i++ ){
						var evt = this.evt[i];
						// if this event has a chord
						if (evt.chord!=null){
							evt.chord.v = zs4.music.transpose.note.name(evt.chord.v,delta)
							evt.chord.b = zs4.music.transpose.note.name(evt.chord.b,delta)
						}
					}
					this.refresh();
				},

				renderStats:function(){
					this.stsEvents.textContent = ('events:'+this.evt.length+'/');
					this.stsChords.textContent = ('chords:' + this.stats.chords);
					this.stsBars.textContent = ('bars:' + this.stats.bars);
					this.stsBeats.textContent = ('beats:' + this.stats.beats);
				},
				recomputeTiming(){
				
					function distributeBeatEvents(beatEvent,millies){
						tickPerEvent = Math.round(millies/beatEvent.beat.events.length)
						for (var i = 0 ; i < beatEvent.beat.events.length ; i++ ){
							if ( i == (beatEvent.beat.events.length-1)){
								beatEvent.beat.events[i].duration = millies;
								return;
							}
							beatEvent.beat.events[i].duration = tickPerEvent;	
							millies -= tickPerEvent;
						}
					};
					
					function distributeBarBeats(barEvent,millies){
						tickPerBeat = Math.round(millies/barEvent.bar.beats.length)
						for (var i = 0 ; i < barEvent.bar.beats.length ; i++ ){
							if ( i == (barEvent.bar.beats.length-1))
								return distributeBeatEvents(barEvent.bar.beats[i],millies);
								
							distributeBeatEvents(barEvent.bar.beats[i],tickPerBeat);
							millies -= tickPerBeat;
						}
					};
					
					var barTotalMillies = Math.round(this.bpc * (60000/this.bpm));
					
					for ( var i = 0 ; i < this.evt.length ; i++ ){
						if (this.evt[i].bar != null) distributeBarBeats(this.evt[i],barTotalMillies);
					}

					for ( var i = 0 ; i < this.evt.length ; i++ ){
						if (this.evt[i].duration <= 0) this.evt[i].duration = barTotalMillies;
					}

				},
				refresh:function(){
					
					this.stats.start();
					for ( var i = 0 ; i < this.evt.length ; i++ ){
						this.evt[i].duration = 0;
						this.evt[i].refresh();
						this.stats.countEvent(this.evt[i]);
					}
					this.stats.end();
					this.renderStats();
					
					this.recomputeTiming();
					if (this.current_tool != null){
						this.current_tool.refresh();
					}
				},
				
				addEvent:function(str,info){
					var o = {
						zs4:this,
						bar:null,
						beat:null,
						duration:0,
						lyric:str.trim(),
						refresh:function(){
							if (this.chord != null && this.chord.ok){
								
								this.eChordBaseNote.style.visibility = 'visible';
								this.eChordBaseNote.textContent = zs4.music.note.name(this.chord.v);
								this.eChordType.textContent = zs4.music.CHORD.TYPE[this.chord.t].t;
								if (this.chord.b != this.chord.v){
									this.eBass.style.display = 'inline';
									this.eBassNote.textContent = zs4.music.note.name(this.chord.b);
								}
								else{
									this.eBass.style.display = 'none';
								}
								
								
							}
							else{
								this.eChordBaseNote.style.visibility = 'hidden';
								this.eChordBaseNote.textContent = '.';
								this.eChordType.textContent = '';
								this.eBassNote.textContent = '';
								this.eBass.style.display = 'none';
							}
							
							if (this.bar){
								this.eBlockChart.className = 'zs4bar';
							}else if (this.beat){
								this.eBlockChart.className = 'zs4beat';
							}else{
								this.eBlockChart.className = '';
							}
						},
					};
					o.eEvent = document.createElement('zs4-event');
					o.eEvent.style.display = 'inline-block';
					o.eEvent.style.marginTop = '1em';
					o.eEvent.zs4 = o;
					o.eEvent.onclick = function(){this.zs4.zs4.onEventClick(this.zs4);};
					
					o.eBlockChart = document.createElement('zs4-block-chart');
					o.eBlockChart.style.display = 'block';
					//o.eBlockChart.textContent = info; 
					o.eEvent.appendChild(o.eBlockChart); 
					
						o.eChordBaseNote = document.createElement('zs4-chord-base');
						o.eBlockChart.appendChild(o.eChordBaseNote);
						
						o.eChordType = document.createElement('zs4-chord-type');
						o.eBlockChart.appendChild(o.eChordType);
						
						o.eBass = document.createElement('zs4-bass');
						o.eBass.style.display = 'none';
						o.eBlockChart.appendChild(o.eBass);
						
							o.eSlash = document.createElement('zs4-bass-slash');
							o.eBass.appendChild(o.eSlash);
							o.eSlash.textContent = '/';
							
							o.eBassNote = document.createElement('zs4-bass-note');
							o.eBass.appendChild(o.eBassNote);
							
						
						if (info.search(":") == -1) {
							var chord = zs4.music.parse.chord(info);
							if (chord.ok){
								o.bar = {};
								o.beat = {};
								o.chord = chord;
								o.eChordBaseNote.textContent = zs4.music.note.name(chord.v);
								o.eChordType.textContent = zs4.music.CHORD.TYPE[chord.t].t;
								if (!this.key.ok) {
									this.key.v  = chord.v;
									this.key.t  = chord.t;
									this.key.ok = chord.ok;
								}
								if (chord.b != chord.v){
									o.eBass.style.display = 'inline';
									o.eBassNote.textContent = zs4.music.note.name(chord.b);
								}
								else{
									o.eBass.style.display = 'none';
								}
							}
						}
						
					o.eBlockLyric = document.createElement('zs4-block-lyric');
					o.eBlockLyric.style.display = 'block';
					if ((str.length > 0 && str.trim().length == 0)||(str.length == 0&&info.trim().length > 0)) { o.eBlockLyric.textContent = 'W'; o.eBlockLyric.style.visibility = 'hidden';}
					else { o.eBlockLyric.textContent = str; }
					o.eEvent.appendChild(o.eBlockLyric);
					
					this.cnt.appendChild(o.eEvent);
					this.evt.push(o);
					
					this.evt_current = o;
					this.evt_curidx = this.evt.length-1;
					
					return o;
				},
				
				run:function(){
					this.runChordsAndLyrics();
					this.transpose(0);
					if (this.evt.length > 0)
						this.setCurrentEvent(this.evt[0]);
				},
				
				runChordsAndLyrics:function(){
					this.data = zs4.html.get.plain(this.data);
					if (this.data == null || this.data.length < 1){
						this.cnt.appendChild(zs4.html.nu.err('no data available.'));
						return this.cnt;
					}
				
					var mode='s'; // s=space, t=text
					var process='p';
					var buffer = "";
					var musinfo = "";
					
					var cur = 0;
					var last_ch = ' ';
					var last_ch_was_space = true;
					for (var i = 0 ; i < this.data.length ; i++){
						var render = false;
						var cur_ch = this.data.charAt(i);
						var new_mode = 'x';
						
						// handle line breaks;
						if (cur_ch == '\n'){
							if (buffer.length > 0||musinfo.length > 0){this.addEvent(buffer,musinfo); buffer="";musinfo="";}
							this.cnt.appendChild(document.createElement("br"));
							last_ch_was_space = true;
							continue;
						}
						
						// handle musical info
						if (cur_ch == '['){
							if (buffer.length > 0||musinfo.length > 0){this.addEvent(buffer,musinfo); buffer="";musinfo="";}
							last_ch_was_space = false;
							if (i < (this.data.length-1)) i++; else break;
							var from = i;
							var count = 0;
							var found = false;
							for (;i<this.data.length;i++){
								if (this.data.charAt(i) == ']'){found = true;break;}
								count++;
							}
							if (!found){
								var ne = document.createElement("zs4-error");
								ne.textContent = "unmatched [ character!";
								this.cnt.appendChild(ne);
								break;
							}
							//alert("found chord "+this.data.substr(from,count));
							musinfo = this.data.substr(from,count);
							
							continue;
						}

						// handle space character
						if (zs4.is.space(cur_ch)){
							if (buffer.length > 0||musinfo.length > 0){this.addEvent(buffer,musinfo); buffer="";musinfo="";}
							buffer += ' ';
							if (last_ch_was_space) continue;
							this.addEvent(buffer,musinfo); buffer="";musinfo="";
							last_ch_was_space = true;
							continue;
						}
						else {
							last_ch_was_space = false;
							buffer += cur_ch.toString();
						}
						
					}
					
					if (buffer.length > 0||musinfo.length > 0){this.addEvent(buffer,musinfo); buffer="";musinfo="";}
					
					return this.cnt;
				},

				createTool:function(name){
					var nu = {
						nam:name,
						zs4:this,
						visible:false,
						
						refresh:function(){
						},
						
						onSelectEvent:function(){
						},
						
						getCurrentEvent:function(){
							if (this.zs4.evt.length == 0 || this.zs4.evt_current == null ) return null;
							return this.zs4.evt_current;
						},
						getCurrentChord:function(){
							var e = this.getCurrentEvent();
							if (e == null)return null;
							
							if (e.chord == null || !e.chord.ok) return null;
							
							return e.chord;
						},
						deleteCurrentChord:function(){
							var e = this.getCurrentEvent();
							if (e == null)return null;
							
							if (e.chord == null)
								return null;
							
							e.chord = null;
							return null;
						},
						setCurrentChordRoot:function(note){
							var event = this.getCurrentEvent();
							if (event == null)return null;

							var chord = this.getCurrentChord();
							if (chord == null){
								chord = zs4.music.parse.chord("C");
								event.chord = chord;
							}
							chord.v = parseInt(note);
						},
						setCurrentChordType:function(type){
							var event = this.getCurrentEvent();
							if (event == null)return null;

							var chord = this.getCurrentChord();
							if (chord == null)return null;
							
							chord.t = parseInt(type);
						},
						setCurrentChordBass:function(bass){
							var event = this.getCurrentEvent();
							if (event == null)return null;

							var chord = this.getCurrentChord();
							if (chord == null)return null;
							
							chord.b = parseInt(bass);
						},
						toggleBar:function(){
							var event = this.getCurrentEvent();
							if (event == null)return null;
							
							if (event.bar){event.bar=null;}
							else {event.bar = {}; event.beat = {};}
						},
						toggleBeat:function(){
							var event = this.getCurrentEvent();
							if (event == null)return null;
							
							if (event.beat && event.bar != null)event.beat=null;
							else event.beat = {};
						},
					};
					
					nu.eleOption = zs4.html.nu.ele('option');
					nu.eleOption.value = this.tool.length;
					nu.eleOption.textContent = name;
					this.toolselect.appendChild(nu.eleOption);
					
					nu.toolWindow = zs4.html.nu.ele('zs4-tool-window');
					nu.toolWindow.style.display = 'none';
					nu.toolWindow.zs4 = this;
					
					nu.toolTitlebar = zs4.html.nu.ele('zs4-tool-titlebar');
					nu.toolTitlebar.style.display = 'block';
					nu.toolTitlebar.textContent = name;
					nu.toolTitlebar.zs4 = this;
					
					this.workarea.appendChild(nu.toolWindow);
					
					this.tool.push(nu);
					
					return nu;
				},

				createToolTranspose(){
					var nu = this.createTool('transpose');

					nu.eEventTranspose = zs4.html.nu.ele('zs4-tool-transpose');
					nu.eEventTranspose.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventTranspose);

						nu.eEventTransposeLabel = zs4.html.nu.ele('zs4-tool-transpose-label');
						nu.eEventTransposeLabel.textContent = 'key:';
						nu.eEventTranspose.appendChild(nu.eEventTransposeLabel);
						
						nu.eEventTransposeSelect = zs4.html.nu.ele('select');
						nu.eEventTransposeSelect.zs4 = nu;
						
							for (var i = 0 ; i < zs4.music.NOTES.length ; i++ ){
								var opt = zs4.html.nu.ele('option');
								opt.value = i;
								opt.innerHTML = zs4.music.NOTES[i].n;
								nu.eEventTransposeSelect.appendChild(opt);
							}
							
						nu.eEventTransposeSelect.onchange = function(){this.zs4.zs4.onKeyChange(this.value);};
						nu.eEventTranspose.appendChild(nu.eEventTransposeSelect);
					
					nu.refresh = function(){
						nu.eEventTransposeSelect.value = this.zs4.key.v;
					};

					return nu;
				},
				
				createToolBpc(){
					var nu = this.createTool('bpc');

					nu.eEventBpc = zs4.html.nu.ele('zs4-tool-bpc');
					nu.eEventBpc.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventBpc);

						nu.eEventBpcLabel = zs4.html.nu.ele('zs4-tool-bpc-label');
						nu.eEventBpcLabel.textContent = 'bpc:';
						nu.eEventBpc.appendChild(nu.eEventBpcLabel);
						
						nu.eEventBpcInput = zs4.html.nu.ele('input');
						nu.eEventBpcInput.type = 'number';
						nu.eEventBpcInput.value = this.bpc;
						nu.eEventBpcInput.min = 1;
						nu.eEventBpcInput.max = zs4.music.MAX_BEATS_PER_BAR;
						nu.eEventBpc.appendChild(nu.eEventBpcInput);
						nu.eEventBpcInput.zs4 = nu;
						nu.eEventBpcInput.onchange = function(){this.zs4.zs4.bpc = parseInt(this.value); this.zs4.zs4.refresh();};

					return nu;
				},
				
				createToolBpm(){
					var nu = this.createTool('bpm');

					nu.eEventBpm = zs4.html.nu.ele('zs4-tool-bpm');
					nu.eEventBpm.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventBpm);

						nu.eEventBpmLabel = zs4.html.nu.ele('zs4-tool-bpm-label');
						nu.eEventBpmLabel.textContent = 'bpm:';
						nu.eEventBpm.appendChild(nu.eEventBpmLabel);
						
						nu.eEventBpmInput = zs4.html.nu.ele('input');
						nu.eEventBpmInput.type = 'number';
						nu.eEventBpmInput.value = this.bpm;
						nu.eEventBpmInput.min = 12;
						nu.eEventBpmInput.max = 480;
						nu.eEventBpm.appendChild(nu.eEventBpmInput);
						nu.eEventBpmInput.zs4 = nu;
						nu.eEventBpmInput.onchange = function(){this.zs4.zs4.bpm = parseInt(this.value); this.zs4.zs4.refresh();};

					return nu;
				},
				
				createToolMidi(){
					var nu = this.createTool('midi');

					nu.eEventMidi = zs4.html.nu.ele('zs4-tool-midi');
					nu.eEventMidi.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventMidi);

						nu.eEventMidiLabel = zs4.html.nu.ele('zs4-tool-midi-label');
						nu.eEventMidiLabel.textContent = 'midi:';
						nu.eEventMidiLabel.zs4 = nu;
						nu.eEventMidiLabel.onclick = function(){
							this.zs4.patchPlayNote();
							this.zs4.zs4.refresh();
						};
						nu.eEventMidi.appendChild(nu.eEventMidiLabel);

					nu.patchPlayNote = function(){
						if (zs4.midi.access != null && zs4.midi.play.note!=zs4.playNote){
							zs4.playNote = zs4.midi.play.note;
						}
					};
					
					nu.onSelectEvent = function(){
						this.refresh();
					},
					
					nu.refresh = function(){
						this.eEventMidiLabel.className = '';
						if (zs4.midi.access == null){
							this.eEventMidiLabel.className = 'zs4error';
							nu.eEventMidiLabel.textContent = 'midi: not available';
						}else if (zs4.midi.play.note==zs4.playNote){
							nu.eEventMidiLabel.textContent = 'midi: is active';
						}else{
							nu.eEventMidiLabel.textContent = 'click to activate midi';
						}
						
					};

					return nu;
				},
				
				createToolAudio(){
					var nu = this.createTool('audio');

					nu.eEventAudio = zs4.html.nu.ele('zs4-tool-audio');
					nu.eEventAudio.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventAudio);

						nu.eEventAudioLabel = zs4.html.nu.ele('zs4-tool-audio-label');
						nu.eEventAudioLabel.textContent = 'audio:';
						nu.eEventAudioLabel.zs4 = nu;
						nu.eEventAudioLabel.onclick = function(){
							this.zs4.patchPlayNote();
							this.zs4.zs4.refresh();
						};
						nu.eEventAudio.appendChild(nu.eEventAudioLabel);

					nu.patchPlayNote = function(){
						if (zs4.audio.context != null && zs4.audio.play.note!=zs4.playNote){
							zs4.playNote = zs4.audio.play.note;
						}
					};
					
					nu.onSelectEvent = function(){
						this.refresh();
					},
					
					nu.refresh = function(){
						this.eEventAudioLabel.className = '';
						if (zs4.audio.context == null){
							this.eEventAudioLabel.className = 'zs4error';
							nu.eEventAudioLabel.textContent = 'audio: not available';
						}else if (zs4.audio.play.note==zs4.playNote){
							nu.eEventAudioLabel.textContent = 'audio: is active';
						}else{
							nu.eEventAudioLabel.textContent = 'click to activate audio';
						}
						
					};

					return nu;
				},
				
				createToolBars(){
					var nu = this.createTool('bars');

					nu.eEventBar = zs4.html.nu.ele('zs4-tool-bar');
					nu.eEventBar.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventBar);
						
						nu.eEventBarButton = zs4.html.nu.ele('zs4-tool-bar-button');
						nu.eEventBarButton.textContent = 'bar';
						nu.eEventBarButton.zs4 = nu;
						nu.eEventBarButton.onclick = function(){
							//alert('add chord');
							this.zs4.toggleBar();
							this.zs4.zs4.refresh();
						};
						nu.eEventBar.appendChild(nu.eEventBarButton);

					nu.refresh = function(){
						this.onSelectEvent();
					};

					nu.onSelectEvent = function(){
						if (this.zs4.evt_current != null){
							var e = this.zs4.evt_current;
							if (e.bar){
								this.eEventBarButton.className = 'zs4bar';
							}
							else {
								this.eEventBarButton.className = '';
							}
						}
					};
					
					return nu;
				},
				
				createToolBeats(){
					var nu = this.createTool('beats');

					nu.eEventBeat = zs4.html.nu.ele('zs4-tool-beat');
					nu.eEventBeat.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventBeat);
						
						nu.eEventBeatButton = zs4.html.nu.ele('zs4-tool-beat-button');
						nu.eEventBeatButton.textContent = 'beat';
						nu.eEventBeatButton.zs4 = nu;
						nu.eEventBeatButton.onclick = function(){
							//alert('add chord');
							this.zs4.toggleBeat();
							this.zs4.zs4.refresh();
						};
						nu.eEventBeat.appendChild(nu.eEventBeatButton);

					nu.refresh = function(){
						this.onSelectEvent();
					};

					nu.onSelectEvent = function(){
						if (this.zs4.evt_current != null){
							var e = this.zs4.evt_current;
							if (e.bar){
								this.eEventBeatButton.className = 'zs4beat';
							}
							else {
								this.eEventBeatButton.className = '';
							}
						}
					};
					
					return nu;
				},
				
				createToolChord(){
					var nu = this.createTool('chord');

					nu.eEventChord = zs4.html.nu.ele('zs4-tool-chord');
					nu.eEventChord.style.display = 'inline-block';
					nu.toolWindow.appendChild(nu.eEventChord);
						
						nu.eEventChordAdd = zs4.html.nu.ele('zs4-tool-chord-add');
						nu.eEventChordAdd.textContent = 'add chord';
						nu.eEventChordAdd.zs4 = nu;
						nu.eEventChordAdd.onclick = function(){
							//alert('add chord');
							this.zs4.setCurrentChordRoot(0);
							this.zs4.zs4.refresh();
						};
						nu.eEventChord.appendChild(nu.eEventChordAdd);
						
						nu.eEventChordLabel = zs4.html.nu.ele('zs4-tool-chord-label');
						nu.eEventChordLabel.textContent = 'chord:';
						nu.eEventChord.appendChild(nu.eEventChordLabel);
							
						nu.eEventChordNote = zs4.html.nu.ele('select');
						nu.eEventChordNote.zs4 = nu;
						nu.eEventChord.appendChild(nu.eEventChordNote);
							for (var i = 0 ; i < zs4.music.NOTES.length ; i++ ){
								var opt = zs4.html.nu.ele('option');
								opt.value = i;
								opt.innerHTML = zs4.music.NOTES[i].n;
								nu.eEventChordNote.appendChild(opt);
							}
						nu.eEventChordNote.onchange = function(){
							this.zs4.setCurrentChordRoot(this.value);
							this.zs4.zs4.refresh();
						};
						
							
						nu.eEventChordType = zs4.html.nu.ele('select');
						nu.eEventChordType.zs4 = nu;
						nu.eEventChord.appendChild(nu.eEventChordType);
						
							for (var i = 0 ; i < zs4.music.CHORD.TYPE.length ; i++ ){
								var opt = zs4.html.nu.ele('option');
								opt.value = i;
								opt.innerHTML = zs4.music.CHORD.TYPE[i].t;
								nu.eEventChordType.appendChild(opt);
							}
						nu.eEventChordType.onchange = function(){
							this.zs4.setCurrentChordType(this.value);
							this.zs4.zs4.refresh();
						};
							
						nu.eEventChordSlash = zs4.html.nu.ele('zs4-chord-slash');
						nu.eEventChordSlash.zs4 = nu;
						nu.eEventChord.appendChild(nu.eEventChordSlash);
							
						nu.eEventChordBass = zs4.html.nu.ele('select');
						nu.eEventChordBass.zs4 = nu;
						nu.eEventChord.appendChild(nu.eEventChordBass);
						
							for (var i = 0 ; i < zs4.music.NOTES.length ; i++ ){
								var opt = zs4.html.nu.ele('option');
								opt.value = i;
								opt.innerHTML = zs4.music.NOTES[i].n;
								nu.eEventChordBass.appendChild(opt);
							}
						nu.eEventChordBass.onchange = function(){
							this.zs4.setCurrentChordBass(this.value);
							this.zs4.zs4.refresh();
						};
							
							
						//nu.eEventChordType.onchange = function(){this.zs4.onKeyChange();};
						nu.eEventChordDelete = zs4.html.nu.ele('zs4-event-chord-delete');
						nu.eEventChordDelete.textContent = 'X';
						nu.eEventChordDelete.zs4 = nu;
						nu.eEventChordDelete.onclick = function(){
							//alert('add chord');
							this.zs4.deleteCurrentChord();
							this.zs4.zs4.refresh();
						};
						nu.eEventChord.appendChild(nu.eEventChordDelete);
						
					nu.refresh = function(){
						this.onSelectEvent();
					};

					nu.onSelectEvent = function(){
						if (this.zs4.evt_current != null){
							var e = this.zs4.evt_current;
							if (e.chord != null){
								this.eEventChordAdd.style.display = 'none';
								this.eEventChordLabel.style.display = 'inline'
								this.eEventChordNote.style.display = 'inline'
								this.eEventChordType.style.display = 'inline'
								this.eEventChordSlash.style.display = 'inline'
								this.eEventChordBass.style.display = 'inline'
								this.eEventChordDelete.style.display = 'inline'
								
								this.eEventChordNote.value = e.chord.v;
								this.eEventChordType.value = e.chord.t;
								this.eEventChordBass.value = e.chord.b;
								//alert('chord found!');
							}
							else {
								this.eEventChordAdd.style.display = 'inline';
								this.eEventChordLabel.style.display = 'none'
								this.eEventChordNote.style.display = 'none'
								this.eEventChordType.style.display = 'none'
								this.eEventChordSlash.style.display = 'none'
								this.eEventChordBass.style.display = 'none'
								this.eEventChordDelete.style.display = 'none'
								
								//alert('no chord!');
							}
						}
					};
					
					return nu;
				},
				
				createLogoElement(){
					var nu = zs4.html.nu.ele('zs4-titlebar-logo');
					nu.textContent = 'zs4';
					return nu;
				},
				
				createColon(){
					var nu = zs4.html.nu.ele('zs4-colon');
					nu.textContent = ':';
					return nu;
				},
			};
			return nu;
		},
	},
	playNote:function(channel,note,volume,millies){
	},
	html:{
		init:{
			id:function(id){
				return zs4.html.init.block(zs4.html.get.id(id));
			},
			block:function(container){
				
				
				var ele = zs4.html.nu.ele('zs4');
				ele.style.display = 'block';
				container.appendChild(ele); 
				ele.zs4 = nu;
				
				var nu = zs4.create.zs4();
				ele.zs4 = nu;
				container.zs4 = nu;
				
				
				nu.ele = ele;		
				
				zs4.initialize();
				
				// make a title bar;
				nu.titlebarElement = zs4.html.nu.ele('zs4-titlebar');
				nu.titlebarElement.style.display = 'block';
				ele.appendChild(nu.titlebarElement);
				
					nu.titlebarLogo = nu.createLogoElement(); 
					nu.titlebarLogo.zs4 = nu;
					nu.titlebarLogo.onclick = function(){this.zs4.onLogoClick();};
					nu.titlebarElement.appendChild(nu.titlebarLogo);
					
					nu.player = null;
					
					nu.toolselect = zs4.html.nu.ele('select');
					nu.toolselect.zs4 = nu;
					nu.toolselect.onchange = function(){this.zs4.onSelectTool(this.value);};
					nu.titlebarElement.appendChild(nu.toolselect);
					nu.toolselectNone = zs4.html.nu.ele('option');
					nu.toolselectNone.textContent = 'tool';
					nu.toolselectNone.value = -1;
					nu.toolselect.appendChild(nu.toolselectNone);
					
				// 
				nu.workarea = zs4.html.nu.ele('zs4-workarea');
				nu.workarea.style.display = 'block';
				//nu.workarea.appendChild(nu.createLogoElement())
				//nu.workarea.textContent = 'workarea';
				ele.appendChild(nu.workarea);
			
				// create content bin
				nu.cnt = zs4.html.nu.ele('zs4-content');
				nu.cnt.style.marginLeft = '2em';
				nu.cnt.style.display = 'block';
				ele.appendChild(nu.cnt);
	
				nu.stsElement = zs4.html.nu.ele('zs4-statusbar');
				nu.stsElement.style.display = 'block';
				ele.appendChild(nu.stsElement);

					nu.stsEvents = zs4.html.nu.ele('zs4-count-events');
					nu.stsElement.appendChild(nu.stsEvents);

					nu.stsChords = zs4.html.nu.ele('zs4-count-chords');
					nu.stsElement.appendChild(nu.stsChords);

					nu.stsBars = zs4.html.nu.ele('zs4-count-bars');
					nu.stsBars.className = 'zs4bar';
					nu.stsElement.appendChild(nu.stsBars);

					nu.stsBeats = zs4.html.nu.ele('zs4-count-beat');
					nu.stsBeats.className = 'zs4beat';
					nu.stsElement.appendChild(nu.stsBeats);
	
				nu.createToolAudio();
				nu.createToolBars();
				nu.createToolBeats();
				nu.createToolBpc();
				nu.createToolBpm();
				nu.createToolChord();
				nu.createToolMidi();
				nu.createToolTranspose();
				return zs4.zs4 = nu;
			}
		},
		nu:{
			ele:function(nam){
				var nu = document.createElement(nam); 
				return nu;
			},
			err:function(val){
				var nu = zs4.html.nu.ele('zs4-error');
				nu.textContent = val;
				return nu;
			},
		},
		get:{
			id:function(id){
				return document.getElementById(id);
			},
			plain:function(f){
				var t = "";
				if (!zs4.is.string(f)) return t;
				var last_ch = ' ';
				var last_ch_was_space = true;
				var lessening = false;
				var o = 0;
				for (var i = 0 ; i < f.length ; i++){
					var cur_ch = f.charAt(i);
					if (cur_ch=='<') {lessening=true; continue;}
					if (cur_ch=='>') {lessening=false; continue;}
					if (lessening||cur_ch=='\t'||cur_ch=='\r')continue;
				
					if (cur_ch=='\n'){if (o==0||i==(f.length-1))continue; t += cur_ch.toString();o++;last_ch_was_space=false;continue;}
					
					if (zs4.is.space(cur_ch)){
						if (last_ch_was_space)continue;
						t += " "; o++;
						last_ch_was_space = true;
						continue;
					}
					last_ch_was_space = false;
					t += cur_ch.toString();
					o++;
				}
				return t.trim();
			}
		},
	},
	http:{
		ajax:function(u,cb){
			this.bindFunction=function(caller,o) {return function(){ return caller.apply(o,[o]);};};this.stateChange=function(o){if (this.request.readyState==4)this.cb(this.request.responseText);};this.getRequest=function(){if (window.ActiveXObject)return new ActiveXObject('Microsoft.XMLHTTP');else if(window.XMLHttpRequest)return new XMLHttpRequest();return false;};this.postBody=(arguments[2]||"");this.cb=cb;this.u=u;this.request=this.getRequest();if(this.request){var req=this.request;req.onreadystatechange=this.bindFunction(this.stateChange,this);if (this.postBody!==""){req.open("POST",u,true);req.setRequestHeader('Content-type','application/json');} else{req.open("GET",u,true);}req.send(this.postBody);}
		},
		get:function(u,cb){
			zs4.http.ajax(u,function(d){if(cb!=null)cb(d);});
			return ('zs4.http.ajax(\''+u+'\',cb)');
		},
		post:function(u,o,cb){
			zs4.server.ajax(u,function(d){if(cb!=null){cb(d);}else{zs4.console.log(zs4.response);}},JSON.stringify(o));
			return ('zs4.http.ajax(\''+u+'\',cb,'+JSON.stringify(o)+')');
		},
	},
	initialize:function(){
		if (zs4.initialized) return true;
		zs4.initialized = true;
		
		//initialize Audio
		zs4.audio.initialize();
		//initialize MIDI
		zs4.midi.initialize();
		// initialize Player
		zs4.player.initialize();

		if (zs4.audio.initialized){
			zs4.playNote = zs4.audio.play.note;
		}
		else
		if (zs4.midi.initialized){
			zs4.playNote = zs4.midi.play.note;
		}
		
		return zs4.initialized;
	},
	initialized:false,
	is:{
		array:function(a){
			if	(a==null)return false;
			return (a instanceof Array);
		},
		boolean:function(b){
			if	(b==null)return false;
			if	(typeof(b)!='boolean')return false;
			return true;
		},
		function:function(f){
			if (f==null)return false;
			return (f instanceof Function);
		},
		name:function(n){
			if	(!this.string(n))return false;
			if	(n=="zs4")return true;
			var l=n.length;
			if	(l<1)return false;
			for (var i=0;i<l;i++){
				if(n.charAt(i)<'a'||n.charAt(i)>'z')return false;
			}
			return true;
		},
		number:function(b){
			if	(b==null)return false;
			if	(typeof(b)!='number')return false;
			return true;
		},
		object:function(o){
			if	(o==null)return false;
			if ((o instanceof Function)==true)return false;
			if	((o instanceof Array)==true)return false;
			if	(o instanceof Object)return true;
			return false;
		},
		property:function(o,p){
			if(!this.object(o)||!this.string(p))return null;
			var a = p.split('.');
			var l = a.length;
			var p = '';
			if (l<1)return null;
			if ((l>=2)&&(a[0]=='zs4')&&(a[1]=='zs4'))return null;
			//zs4.zs4.console.log('p.split().length='+l);
			for (var i = 0 ; i < l ; i++){
				if (p!='')p+='.'; p+=a[i];
				//zs4.zs4.console.log('checking o.'+p);
				if (!o.hasOwnProperty(a[i])){return null;}
				o=o[a[i]]; 
			}
			return o;
		},
		string:function(s){
			if	(s==null)return false;
			if	(typeof(s)!='string')return false;
			return true;
		},
		space:function(ch){
			if (ch=='\n'||ch=='\r'||ch=='\t'||ch==' ')return true;
			return false;
		},
	},
	midi:{
		access:null,
		initialized:false,
		input:[],
		output:[],
		current_output:0,
		status:{
			onMIDISuccess:function(midiAccess) {
				zs4.midi.access = midiAccess;
				zs4.midi.initialized = true;
				
				for (var entry of zs4.midi.access.inputs) {
					zs4.midi.input.push(entry[1]);
				}
				
				for (var entry of zs4.midi.access.outputs) {
					zs4.midi.output.push(entry[1]);
				}
			},

			onMIDIFailure:function(e) {
				zs4.midi.access = null;
				zs4.midi.initialized = false;
			},
		},
		initialize:function(){
			if (zs4.midi.initialized)
				return zs4.midi.access;
				
			zs4.midi.initialized = true; 
			if (navigator.requestMIDIAccess) {
				navigator.requestMIDIAccess({
					sysex: false // this defaults to 'false' and we won't be covering sysex in this article. 
				}).then(zs4.midi.status.onMIDISuccess, zs4.midi.status.onMIDIFailure);
			} else {
				zs4.midi.initialized = true; 
				zs4.midi.access = null;
			}	
			return zs4.midi.access;
		},
		constant:{
			GM:{
			},
			A4_NOTE:69,
			MIDI_NOTE_MIN:21,
			MIDI_NOTE_MAX:108,
			MIDDLE_C:60,
		},
		play:{
			note:function(channel,note,volume,millies){
			
				var noteOnMessage = [0x90|(channel&0xf), (note&0x7f), (volume&0x7f)];    // note on, middle C, full velocity
				var noteOffMessage = [0x80|(channel&0xf), (note&0x7f), 0x40];    // note off, middle C, full velocity
				var output = zs4.midi.output[0];
				output.send( noteOnMessage );  //omitting the timestamp means send immediately.
				output.send( noteOffMessage, window.performance.now() + millies );
			},
		},
	},
	audio:{
		context:null,
		create:{
			voice:function(name){
				
			},
		},
		ctxType:'AudioContext',
		initialized:false,
		initialize:function(){
			if (zs4.audio.initialized)
				return true;
			
			if (typeof window.AudioContext === "function"){
				zs4.audio.context = new window.AudioContext();
			} else if (typeof window.webkitAudioContext === "function"){
				zs4.audio.context = new window.webkitAudioContext();
				ctxType='webkitAudioContext';
			}
			
			if (zs4.audio.context == null)
				return false;
				
			zs4.audio.initialized = true;
			return true;
		},
		play:{
			note:function(channel,note,volume,millies){
				return zs4.audio.play.frequency((440 * Math.pow(2.0,((note-zs4.midi.constant.A4_NOTE)/12.0))),millies,volume);
			},
			frequency:function(freq,millies,volume){
				if (volume == null)
					volume = 127;

				var aVol = volume / 127; 
					
				var o = zs4.audio.context.createOscillator();
				o.type = 'sine';
				o.frequency.value = freq;
				
				var g = zs4.audio.context.createGain();
				g.gain.value = volume / 127;
				
				o.connect(g);
				g.connect(zs4.audio.context.destination);
				
				
				o.start(0);
				setTimeout(function(){o.stop();},millies);
				
			},
		},

	},
	music:{
		transpose:{
			note:{
				name:function(value,delta){
					return ((1200+value+delta) % 12);
				}
			},
		},
		parse:{
			chord:function(str){
				str = str.trim();
				var nu = {v:0,t:0,b:0,ok:true};
				
				str = str.trim();
				if (str.length < 1){nu.ok=false; return nu;};
				
				// look up main note name
				for (var i=0;i<zs4.music.PLAIN_NOTES.length;i++){
					if (str.substr(0,1).toLowerCase()==zs4.music.PLAIN_NOTES[i].n.toLowerCase()){
						nu.v = nu.b = zs4.music.PLAIN_NOTES[i].v;
						str = str.substr(1,(str.length-1));
						if (str.length == 0) return nu;
						break;
					}
				}
				
				//check for sharp or flat
				if (str[0]=='#'){
					nu.v = nu.b = zs4.music.transpose.note.name(nu.v,+1);
					str = str.substr(1,(str.length-1));
					if (str.length == 0) return nu;
				}
				else if (str[0]=='b'){
					nu.v = nu.b = zs4.music.transpose.note.name(nu.v,-1);
					str = str.substr(1,(str.length-1));
					if (str.length == 0) return nu;
				}
				
				// chord variant
				for (var i = 0 ; i < zs4.music.CHORD.TYPE.length; i++){
					var length = zs4.music.CHORD.TYPE[i].t.length;
					if (length > 0 && length <= str.length){
						if (str.substr(0,length).toLowerCase() == zs4.music.CHORD.TYPE[i].t.toLowerCase()){
							nu.t = i;
							str = str.substr(length,(str.length-length));
							if (str.length == 0) return nu;
							break;
						}
					}
				}
				if (str.length == 0) return nu;

				
				// Slash
				if (str[0] != '/'){
					nu.ok = false;
					return nu;
				}
				str = str.substr(1,(str.length-1));
				
				// bass note
				for (var i=0;i<zs4.music.PLAIN_NOTES.length;i++){
					if (str.substr(0,1).toLowerCase()==zs4.music.PLAIN_NOTES[i].n.toLowerCase()){
						nu.b = zs4.music.PLAIN_NOTES[i].v;
						str = str.substr(1,(str.length-1));
						if (str.length == 0) return nu;
						break;
					}
				}
				
				//check for sharp or flat
				if (str[0]=='#'){
					nu.b = zs4.music.transpose.note.name(nu.b,+1);
					str = str.substr(1,(str.length-1));
					if (str.length == 0) return nu;
				}
				else if (str[0]=='b'){
					nu.b = zs4.music.transpose.note.name(nu.b,-1);
					str = str.substr(1,(str.length-1));
					if (str.length == 0) return nu;
				}
				
				return nu;
			},
		},
		note:{
			name(v){
				v = zs4.music.transpose.note.name(v,0);
				return zs4.music.NOTES[v].n;
			},
		},
		PLAIN_NOTES:[
			{n:'C',v:0},
			{n:'D',v:2},
			{n:'E',v:4},
			{n:'F',v:5},
			{n:'G',v:7},
			{n:'A',v:9},
			{n:'B',v:11},
			{n:'H',v:11},
		],
		NOTES:[
			{n:'C',v:0},
			{n:'C#',v:1},
			{n:'D',v:2},
			{n:'Eb',v:3},
			{n:'E',v:4},
			{n:'F',v:5},
			{n:'F#',v:6},
			{n:'G',v:7},
			{n:'Ab',v:8},
			{n:'A',v:9},
			{n:'Bb',v:10},
			{n:'B',v:11},
		],
		CHORD:{
			TYPE:[	//				C				D				E		F				G				A				B		
				{t:"",			a:	[true,	false,	false,	false,	true,	false,	false,	true,	false,	false,	false,	false]},
				{t:"-7b5",		a:	[true,	false,	false,	true,	false,	false,	true,	false,	false,	false,	true,	false]},
				{t:"-6",		a:	[true,	false,	false,	true,	false,	false,	false,	true,	false,	true,	false,	false]},
				{t:"-7",		a:	[true,	false,	false,	true,	false,	false,	false,	true,	false,	false,	true,	false]},
				{t:"M7",		a:	[true,	false,	false,	false,	true,	false,	false,	true,	false,	false,	false,	true]},
				{t:"+7",		a:	[true,	false,	false,	false,	true,	false,	false,	false,	true,	false,	true,	false]},
				{t:"o7",		a:	[true,	false,	false,	true,	false,	false,	true,	false,	false,	true,	false,	false]},
				{t:"-",			a:	[true,	false,	false,	true,	false,	false,	false,	true,	false,	false,	false,	false]},
				{t:"o",			a:	[true,	false,	false,	true,	false,	false,	true,	false,	false,	false,	false,	false]},
				{t:"+",			a:	[true,	false,	false,	false,	true,	false,	false,	false,	true,	false,	false,	false]},
				
				{t:"6",			a:	[true,	false,	false,	false,	true,	false,	false,	true,	false,	true,	false,	false]},
				{t:"7",			a:	[true,	false,	false,	false,	true,	false,	false,	true,	false,	false,	true,	false]},
			],
		},
		SEMI_TONES_PER_OCTAVE:12,
		MAX_BEATS_PER_BAR:23,
	},
	player:{
		internal:{
			iterationCount:0,
			chord:null,
			bar:{
				jump:false,
				jumpEvent:0,
				jumpZs4:null,
				jumpEventEle:null,
				
				active:{
					startTime:0,
					duration:0,
					eventCount:0,
					nextEventTime:0,
					interval:0,
					
				},
			},
			initialTime:0,
			//time:0,
			timeout:2000,
			playBeat:function(no,of,maxlen){
				var zs = zs4.player.zs4;
				var chord = this.chord;
				if (zs == null || chord == null)return;
					
				var pi = zs4.player.internal;
				var n = chord.v + 36;
				var v = 90;
				if ( (no&0xe) == 0 ){
					n = chord.v + 24;
					v = 127;
				}
				zs4.playNote(0,n,v,Math.round(maxlen*2/3));
				
				var type = zs4.music.CHORD.TYPE[chord.t];
				
				n = chord.v + 60;
				for (var i = 0 ; i < type.a.length ; i++ ){
					if (type.a[i])
						zs4.audio.play.note(0,n+i,v,Math.round(maxlen*2/3));
				}
				
			},
			barLoop:function(){
				var pi = zs4.player.internal;
				var zs = zs4.player.zs4;
				if (pi.chord){
					console.log('Bar chord:'+zs4.music.note.name(pi.chord.v));
				}
				
				var barTotalMillies = Math.round(zs.bpc * (60000/zs.bpm));
				var beatMillies = Math.round(barTotalMillies/zs.bpc);
				
				zs4.player.internal.playBeat(0,zs.bpc,beatMillies);
				for (var i = 1 ; i < zs.bpc ; i++ ){
					setTimeout(function(){zs4.player.internal.playBeat(i,zs.bpc,beatMillies);},(i*beatMillies));
				}
				
			},
			eventLoop:function(){
				var pi = zs4.player.internal;
				pi.time = (new Date).getTime();
				var zs = zs4.player.zs4;
				
				if (zs != null){
					var ce = zs.evt_current;
					
					if (pi.bar.active.startTime==0){
						pi.bar.active.startTime = (new Date).getTime();
					}else{
						pi.bar.active.startTime = pi.bar.active.nextEventTime;
					}
					pi.bar.active.nextEventTime = pi.bar.active.startTime + ce.duration;
					
					if (ce.chord)
						pi.chord = ce.chord;
					
					
					// LOOP ENDING!!!! PUT STUFF BEFORE!!!!
					// look-ahead! if a bar is upcoming.
					var nextIdx = zs.searchNextEvent();
					if (pi.bar.active.nextEventTime > ((new Date).getTime()))
						pi.timeout = (pi.bar.active.nextEventTime - ((new Date).getTime()));
					else pi.timeout = 0;
					
					if (zs.evt[nextIdx].bar && pi.bar.jump){
					
						if (zs4 != pi.bar.jumpZs4){
							zs4.player.attach(pi.bar.jumpZs4);
							zs = zs4.player.zs4;
						}	
						pi.bar.jumpEventEle.className = '';
						zs.setCurrentEvent(zs.evt[pi.bar.jumpEvent]);
						pi.bar.jump = false;
					
					}else{
						zs4.player.zs4.setNextEvent();
					}
					
					if (ce.bar != null)
					{
						pi.barLoop();
						
/*
						var noteOnMessage = [0x90, 60, 0x7f];    // note on, middle C, full velocity
						var noteOffMessage = [0x80, 60, 0x40];    // note off, middle C, full velocity
						var output = zs4.midi.output[0];
						output.send( noteOnMessage );  //omitting the timestamp means send immediately.
						output.send( [0x80, 60, 0x40], window.performance.now() + 1000.0 );
  
						console.log('BAR:'+(((new Date).getTime())-pi.bar.active.startTime) + ':' + pi.timeout);
*/
					}
				}
				else if (zs4.player.internal.bar.jump && zs4.player.internal.bar.jumpZs4 != null ){
					zs4.player.internal.bar.jumpEventEle.className = '';
					zs4.player.attach(zs4.player.internal.bar.jumpZs4);
					zs4.player.zs4.setCurrentEvent(zs4.player.zs4.evt[0]);
					zs4.player.internal.bar.jump = false;
				}
				
				setTimeout(pi.eventLoop,pi.timeout);
			},

		},
		zs4:null,
		html:null,
		initialize:function(){
			if (zs4.player.html != null) return zs4.player.html;
			
			zs4.player.html = zs4.html.nu.ele('zs4-player');
			zs4.player.html.textContent = 'Player';

			zs4.player.internal.initialTime = (new Date).getTime();
			setTimeout(zs4.player.internal.eventLoop,zs4.player.internal.timeout);
			
		},
		is:{
			running:function(){
				if (zs4.player.zs4 != null)return true;
				return false;
			},
		},
		attach:function(nuZs4){
			zs4.player.detach();
			nuZs4.titlebarElement.appendChild(zs4.player.html);
			nuZs4.player = zs4.player.html;
			zs4.player.zs4 = nuZs4;
		},
		detach:function(){
			if (zs4.player.zs4 != null){
				if (zs4.player.zs4.player != null){
					zs4.player.zs4.titlebarElement.removeChild(zs4.player.zs4.player);
					zs4.player.zs4.player = null;
				}
				zs4.player.zs4 = null;
			}
		},
		onEventClick(clickZs4,evt){
			var idx = clickZs4.getEventIndex(evt);
			if (zs4.player.internal.bar.jumpEventEle!=null)
				zs4.player.internal.bar.jumpEventEle.className = '';
			idx = clickZs4.searchPrevBar(idx); 
			zs4.player.internal.bar.jump = true;
			zs4.player.internal.bar.jumpEvent = idx;
			zs4.player.internal.bar.jumpEventEle = clickZs4.evt[idx].eEvent;
			zs4.player.internal.bar.jumpZs4 = clickZs4;
			zs4.player.internal.bar.jumpEventEle.className = 'jumpToEvent';
		},
		onLogoClick:function(clickZs4){
			if (clickZs4 == zs4.player.zs4){
				if (clickZs4.player == zs4.player.html){
					//alert("active zs4 object, player active.");
					zs4.player.detach();
					// detach player
				} else {
					//alert("active zs4 object, player idle.");
					zs4.player.attach(clickZs4);
					// attach player
				}
			} else {
				if (clickZs4.player == zs4.player.html){
					alert("idle zs4 object, player active.");
				} else {
					zs4.player.internal.bar.active.startTime = 0;
					zs4.player.onEventClick(clickZs4,clickZs4.evt[0]);
				}
			}
			//console.log(clickZs4);
		},
	},
	zs4:{
	},
};

