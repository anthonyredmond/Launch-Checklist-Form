// Write your JavaScript code here!

class Status {   
   #minFuel = 10000;
   #maxCargoMass = 10000;
 
   constructor(fieldName, statusID, name, prefix, postfix, dataType) {
     this.fieldName = fieldName;
     this.statusID = statusID;
     this.name = name;
     this.prefix = prefix ? prefix : name;
     this.postfix = postfix;
     this.dataType = dataType;
   }
 
   get field() {
     return document.forms['launchFormActual'].elements[this.fieldName];
   }
 
   get value() {
     return this.field.value
   }
 
   set value(newValue) {
     this.field.value = newValue;
     this.onchange();
   }
 
   get cleanField() {  
     return this.value.trim();
   }
 
   get typeValid() {
     let cf = this.cleanField, notblank = cf.length>0;
     switch(this.dataType) {
       case 'string':
         return notblank;
       case 'number':
         return notblank && (!isNaN(cf) && (cf>=0));
     }
   }
 
   get dataTypeAlert() {
     switch(this.dataType) {
       case 'string':
         return 'Field "'+ this.fieldName +'" is required and must not be blank.';
         break;
       case 'number':        
         return 'Field "'+ this.fieldName +'" is required, and must must be a non-negative numeric value.';
         break;
     }
   }
   
   updateDisplay() {
     let el = document.getElementById(this.statusID);
     if (el) {        
       el.innerHTML = this.prefix+' '+((this.typeValid&&this.dataValid)?'':' NOT')+' '+this.postfix;
       launchControl.updateDisplay();
     }
   }
   
   setAmbiance() {
     let fl = [this.field, document.getElementById(this.statusID)], key, f;
     for (key in fl) {
       f = fl[key];
       let cl = f.classList;
       if (this.dataValid) 
         cl.remove('dataInvalid')
       if (!this.dataValid) 
         cl.add('dataInvalid')
       if (this.typeValid) 
         cl.remove('typeInvalid')
       if (!this.typeValid) 
         cl.add('typeInvalid')
     }
   }
 
   onchange() {
     let resp = true;
     if (!this.typeValid) {
       resp = false;
       alertUser(this.field, this.dataTypeAlert);
     }
     this.setAmbiance();
     this.updateDisplay();
     return resp;
   }
 
   get preventDefault() {
     return this.onchange();
   }
 
   get dataValid() {
     if (!this.typeValid)
       return false;
     let v=parseFloat(this.cleanField);    
     switch(this.fieldName) {
       case 'fuelLevel':
         return (v >= this.#minFuel)
        break;
       case 'cargoMass':
         return (v <= this.#maxCargoMass)
         break;
       default:
         return true;
     }
   }
 }
 
 class LaunchControl {
   #status = [];
   constructor() {
     //fieldName, statusID, name, prefix, postfix, dataType, dataValid
     this.#status = [new Status( 'pilotName', 'pilotStatus', 'Pilot', '', 'Ready', 'string'),
                     new Status( 'copilotName', 'copilotStatus', 'Co-pilot', '', 'Ready', 'string'),
                     new Status( 'fuelLevel', 'fuelStatus', 'Fuel level', '', 'high enough for launch', 'number'),
                     new Status( 'cargoMass', 'cargoStatus', 'Cargo mass', '', 'low enough for launch', 'number')]; 
   }
 
   status(key) {
     switch(typeof key) {
       case 'number':
         if (key >=0 && key < this.#status.length)
           return this.#status[key]
         else 
           return undefined;  
         break;
       case 'string':
         for (let idx = 0, el, lcKey = key.toLowerCase(); idx < this.#status.length; idx++) {
           if (((el=this.#status[idx]).fieldName.toLowerCase() == lcKey) || (el.name.toLowerCase() == lcKey))
             return el;                
         }
         return undefined;        
     }
   }
 
   fields() {
     let ol, idx;           
     for (ol=[], idx = 0; idx < this.#status.length; idx++)
       ol.push(this.#status[idx].fieldName)
     return ol;
   }
   
   get invalidCount() {
     let count=0;          
     for (let idx=0, st; idx < this.#status.length; idx++)
       if (!((st = this.#status[idx]).typeValid&&st.dataValid))
         count++
     return count;          
   }
               
   updateDisplay() {
     let el = document.getElementById('faultyItems');
     if (el) {
       let elsib = document.getElementById('launchStatus'), 
           text=['Shuttle Not Ready For Launch', 'All Go For Launch'],
           newText=text[(this.invalidCount == 0)?1:0];
       if (elsib.innerHTML != newText)
         elsib.innerHTML = newText  
       if (this.invalidCount>0) {
         if (el.style.visibility != 'visible')
           el.style.visibility = 'visible';
       } else if (el.style.visibility == 'visible') {
         el.style.visibility = '';
       }
     }            
   }
 
   preventDefault(form) {
     if (form.tagName == "FORM") {
       let list = this.#status;
       for (let idx=0, el; idx < list.length; idx++) {
         if (el = list[idx]) {
           el.preventDefault
         }
       }
     }
     return (this.invalidCount==0)
   }
         
   get display() {
     let el = document.getElementById('faultyItems');
     return (el.style.visibility == 'visible');
   }
 
   set display(newSetting) {
     let el = document.getElementById('faultyItems');
     el.style.visibility = (newSetting?'visible':'');
   }        
   
   toggleDisplay() {
     this.display = !this.display;    
   }
 
   setDefaults() {
     let el = '';
     (el = this.status('pilot')).value = 'Anthony';
     (el = this.status('co-pilot')).value = 'Jermaine';
     (el = this.status('fuelLevel')).value = 10500;
     (el = this.status('cargoMass')).value = 197;
   }
 }
 
 function fieldPredicate(field) {
   return 'Field "'+ field.name +'"';
 }
 
 function alertUser(field, message) {
     alert(message);
     if (field.focus && typeof(field.focus) == 'function') //verify that field has a focus function
       field.focus(); //take user to field with error condition
 }
 
 class PlanetScape {  
   #planetsSrc = 'https://handlers.education.launchcode.org/static/planets.json';
   #loading=false;
   constructor() {
     this.data=[];
     this.selectedMission = -1;
   }
   
   #load() {
     if (this.#loading)
       return false;  
     let xmlhttp = new XMLHttpRequest(), ps=this;
     this.#loading = true;
     xmlhttp.onreadystatechange = function() {
       if (this.readyState == 4 && this.status == 200) {
         ps.#loading = false;
         ps.data = JSON.parse(this.responseText);
         ps.populateMissionOptions();
       }
     };
     xmlhttp.open("GET", this.#planetsSrc, true);
     xmlhttp.send();    
   }
   
   get loaded() {
     return (this.data.length > 0)
   }
   
   populateMissionOptions() {
     let list=[];
     list.push(`<SPAN class="missionOption" onclick="planetScape.randomMission();">Random Mission</SPAN>`);
     for (let dataEl, idx=0; idx < this.data.length; idx++) {
       dataEl = this.data[idx];
       list.push(`<SPAN class="missionOption" onclick="planetScape.render(${idx}, true)">${dataEl.name}</SPAN>`);
     }
     document.getElementById('missionOptions').innerHTML = list.join(', ');
   
   }
   
   activateMissionOption() {
     let div = document.getElementById('missionOptions'), idx, list, el;
     for (idx = 1, el, list = div.getElementsByTagName('SPAN'); idx < list.length; idx++) {
       el = list[idx];
       if (idx == this.selectedMission+1) 
         el.classList.add('active')
       else
         el.classList.remove('active')
     }
   } 
         
   randomMission() {
     let mission = Math.floor(Math.random()*this.data.length);
     this.render(mission, true)
   }
   
   render(mission = this.selectedMission, setCurrent=false) {
     if (!this.loaded) {
       this.#load();
       self.setTimeout(`planetScape.render(${mission}, ${setCurrent})`, 500)
       return false;
     }
     if (mission==-1) 
       mission=0;
     if (setCurrent)
       this.selectedMission = mission;
     this.activateMissionOption();
     var mData = this.data[mission]
     let html, list=[], key, dataCount=0;
     for (key in mData) {
       if (mData[key]===undefined) {
         mData[key]='';
       } else 
         dataCount++
       let el = document.getElementById('md_'+key)
       if (el) {
         switch(el.id) {
           case 'md_image':
             el.src = mData[key]
             break;
           default:
             el.innerText = mData[key]
         }
       }
     }
     let destDiv = document.getElementById('missionConsole');
     destDiv.style.display = (dataCount == 0)?'none':'block';
   }
   
   fixImg(img) {
     return false;
   }
 }    
     
 self.launchControl = new LaunchControl;
 
 self.planetScape = new PlanetScape;
 
// Write your JavaScript code here!

/* This block of code shows how to format the HTML once you fetch some planetary JSON!
<h2>Mission Destination</h2>
<ol>
   <li>Name: ${}</li>
   <li>Diameter: ${}</li>
   <li>Star: ${}</li>
   <li>Distance from Earth: ${}</li>
   <li>Number of Moons: ${}</li>
</ol>
<img src="${}">
*/
