function GCodeViewModel(code) {
  this.code = code;
  this.vertexIndex = 0;
  this.vertexLength = 0;
}

function GCodeRenderer() {

  var self = this;

  this.viewModels = [];
  this.index = 0;
  this.baseObject = new THREE.Object3D();

  this.motionGeo = new THREE.Geometry();
  this.motionMat = new THREE.LineBasicMaterial({
        opacity: 0.2,
        transparent: true,
        linewidth: 1,
        vertexColors: THREE.VertexColors });

  this.motionIncGeo = new THREE.Geometry();
  this.motionIncMat = new THREE.LineBasicMaterial({
        opacity: 0.2,
        transparent: true,
        linewidth: 1,
        vertexColors: THREE.VertexColors });

  this.feedAllGeo = new THREE.Geometry();

  this.feedGeo = new THREE.Geometry();
  this.feedMat = new THREE.LineBasicMaterial({
        opacity: 0.8,
        transparent: true,
        linewidth: 2,
        vertexColors: THREE.VertexColors });

  this.feedIncGeo = new THREE.Geometry();
  this.feedIncMat = new THREE.LineBasicMaterial({
        opacity: 0.2,
        transparent: true,
        linewidth: 2,
        vertexColors: THREE.VertexColors });

  this.lastLine = {x:0, y:0, z:0, e:0, f:0 , i:0, j:0};
  this.relative = false;

  // this.renderer = renderer;
  this.bounds = {
    min: { x: 100000, y: 100000, z: 100000 },
    max: { x:-100000, y:-100000, z:-100000 }
  };

  this.geometryHandlers = {

    G0: function(viewModel) {
      // console.log("in g0 renderer handler " + code)

      var newLine = {};

      viewModel.code.words.forEach(function(word) {
        // TODO: handle non-numerical values
        switch(word.letter) {
          case 'X': case 'Y': case 'Z':  case 'E':  case 'F':
            var p = word.letter.toLowerCase();
            newLine[p] = self.absolute(self.lastLine[p], parseFloat(word.value));
            break;
        }
      });

      ['x','y','z','e','f'].forEach(function(prop) {
        if (newLine[prop] === undefined) {
          newLine[prop] = self.lastLine[prop];
        }
      });

      viewModel.vertexIndex = self.motionGeo.vertices.length;

      // var color =  new THREE.Color(GCodeRenderer.motionColors[viewModel.code.index%GCodeRenderer.motionColors.length]);
      var color =  GCodeRenderer.motionColors[viewModel.code.index%GCodeRenderer.motionColors.length];
      self.motionGeo.vertices.push(new THREE.Vector3(self.lastLine.x, self.lastLine.y, self.lastLine.z));
      self.motionGeo.vertices.push(new THREE.Vector3(newLine.x, newLine.y, newLine.z));

      self.motionGeo.colors.push(color);
      self.motionGeo.colors.push(color);

      viewModel.vertexLength = self.motionGeo.vertices.length - viewModel.vertexIndex;

      self.lastLine = newLine;

      return self.motionGeo;
    },
    G1: function(viewModel) {
      // console.log("in g1 renderer handler " + viewModel.code)

      var newLine = {};

      viewModel.code.words.forEach(function(word) {
        // TODO: handle non-numerical values
        switch(word.letter) {
          case 'X': case 'Y': case 'Z':  case 'E':  case 'F':
            var p = word.letter.toLowerCase();
            newLine[p] = self.absolute(self.lastLine[p], parseFloat(word.value));
            break;
        }
      });

      ['x','y','z','e','f'].forEach(function(prop) {
        if (newLine[prop] === undefined) {
          newLine[prop] = self.lastLine[prop];
        }
      });
	  

      // var color =  new THREE.Color(GCodeRenderer.feedColors[viewModel.code.index%GCodeRenderer.feedColors.length]);
      var color =  GCodeRenderer.feedColors[viewModel.code.index%GCodeRenderer.feedColors.length];
      var p1 = new THREE.Vector3(self.lastLine.x, self.lastLine.y, self.lastLine.z);
      var p2 = new THREE.Vector3(newLine.x, newLine.y, newLine.z);

      viewModel.vertexIndex = self.feedAllGeo.vertices.length;

      if( viewModel.code.index <= self.index ) {
        self.feedGeo.vertices.push(p1);
        self.feedGeo.vertices.push(p2);
        self.feedGeo.colors.push(color);
        self.feedGeo.colors.push(color);
      }
      else {
        self.feedIncGeo.colors.push(color);
        self.feedIncGeo.colors.push(color);
        self.feedIncGeo.vertices.push(p1);
        self.feedIncGeo.vertices.push(p2);
      }

      self.feedAllGeo.vertices.push(p1);
      self.feedAllGeo.vertices.push(p2);
      self.feedAllGeo.colors.push(color);
      self.feedAllGeo.colors.push(color);

      viewModel.vertexLength = self.feedAllGeo.vertices.length - viewModel.vertexIndex;

      self.lastLine = newLine;

      return self.feedGeo;
    },
    G2: function(viewModel) {
	       console.log("in g2 renderer handler " + viewModel.code)

      var newLine = {};

      viewModel.code.words.forEach(function(word) {
        // TODO: handle non-numerical values
        switch(word.letter) {
          case 'X': case 'Y': case 'Z':  case 'E':  case 'F': case 'I': case 'J':
            var p = word.letter.toLowerCase();
            newLine[p] = self.absolute(self.lastLine[p], parseFloat(word.value));
            break;
        }
      });

      ['x','y','z','e','f','i','j'].forEach(function(prop) {
        if (newLine[prop] === undefined) {
          newLine[prop] = self.lastLine[prop];
        }
      });
	 // Gestion Arc
	  
	 
        var radius = Math.sqrt(Math.pow(newLine.i,2)  + Math.pow(newLine.j,2));
	 //	console.log("Rayon ", radius);
	 
		var cx = self.lastLine.x + newLine.i ; 
		var cy = self.lastLine.y + newLine.j ;
	
	//	console.log("Center ", cx,cy);
		var rx = - newLine.i ;
		var ry = - newLine.j ;
	
		var rtx = newLine.x - cx;
		var rty = newLine.y - cy;
	// cf Marlin
	// float angular_travel = atan2(r_axis0*rt_axis1-r_axis1*rt_axis0, r_axis0*rt_axis0+r_axis1*rt_axis1);
		var theta = Math.atan2((rx*rty - ry*rtx),(rx*rtx + ry*rty));
		// Calculer l'angle autrement...
		console.log("Angle theta calculé ", theta);
    // if (angular_travel < 0) { angular_travel += 2*M_PI; }
	
		if (theta < 0) { theta += 2 * Math.PI ;}
    // if (isclockwise) { angular_travel -= 2*M_PI; }
		 theta = 2 * Math.PI - theta ;
		 
         //  theta -= 2 * Math.PI ;		 
	     console.log("Angle corrige", theta);
	// float millimeters_of_travel = hypot(angular_travel*radius, fabs(linear_travel));
		var millimeters_of_travel = theta*radius;
    // if (millimeters_of_travel < 0.001) { return; }
    //uint16_t segments = floor(millimeters_of_travel/MM_PER_ARC_SEGMENT);
		var nb_segments = Math.floor(millimeters_of_travel / 1);
    // if(segments == 0) segments = 1;
		if(nb_segments == 0) nb_segments = 1;
	// console.log("Nb Segments ", nb_segments);
    // float theta_per_segment = angular_travel/segments;
		var theta_per_segment = theta/nb_segments;
    // float linear_per_segment = linear_travel/segments;
	
    // float arc_target[4];
		var arc_target = [];
		var old_target = [];
    // float sin_Ti;
		var sin_Ti;
    // float cos_Ti;
		var cos_Ti;
    // float r_axisi;
		var rxi;
    // uint16_t i;
	    var i ;
    // int8_t count = 0;
		var count = 0 ;
	// Initialize the linear axis - Rt - On change Z
    // arc_target[axis_linear] = position[axis_linear];
 		    
         old_target[0] = self.lastLine.x ;
		 old_target[1] = self.lastLine.y ;
		 old_target[2] = self.lastLine.z ;

    for (i = 1; i <= nb_segments ; i++) { // Increment (segments-1)
	    // G2 OK
		
		cos_Ti = Math.cos(i*theta_per_segment);
		sin_Ti = Math.sin(i*theta_per_segment);
		
		 rx =  -newLine.i*cos_Ti +  newLine.j*sin_Ti;
		 ry = -newLine.i*sin_Ti - newLine.j*cos_Ti;
		 
		// Update arc_target location for G2 cx - rx ?
		arc_target[0] = cx - rx;
		arc_target[1] = cy + ry;
		arc_target[2] = newLine.z;
		    
      // var color =  new THREE.Color(GCodeRenderer.feedColors[viewModel.code.index%GCodeRenderer.feedColors.length]);
      var color =  GCodeRenderer.feedColors[viewModel.code.index%GCodeRenderer.feedColors.length];
      var p1 = new THREE.Vector3(old_target[0], old_target[1], old_target[2]);
      var p2 = new THREE.Vector3(arc_target[0], arc_target[1], arc_target[2]);
         old_target[0] = arc_target[0] ;
		 old_target[1] = arc_target[1] ;
		 old_target[2] = arc_target[2] ;
         // console.log("Dessin de ",old_target[0] ,old_target[1]) ;
 
      viewModel.vertexIndex = self.feedAllGeo.vertices.length;

      if( viewModel.code.index <= self.index ) {
        self.feedGeo.vertices.push(p1);
        self.feedGeo.vertices.push(p2);
        self.feedGeo.colors.push(color);
        self.feedGeo.colors.push(color);
      }
      else {
        self.feedIncGeo.colors.push(color);
        self.feedIncGeo.colors.push(color);
        self.feedIncGeo.vertices.push(p1);
        self.feedIncGeo.vertices.push(p2);
      }

      self.feedAllGeo.vertices.push(p1);
      self.feedAllGeo.vertices.push(p2);
      self.feedAllGeo.colors.push(color);
      self.feedAllGeo.colors.push(color);

      viewModel.vertexLength = self.feedAllGeo.vertices.length - viewModel.vertexIndex;
      
    }
	
      self.lastLine = newLine;
      return self.feedGeo;
    },
	G3: function(viewModel) {
	       console.log("in g3 renderer handler " + viewModel.code)

      var newLine = {};

      viewModel.code.words.forEach(function(word) {
        // TODO: handle non-numerical values
        switch(word.letter) {
          case 'X': case 'Y': case 'Z':  case 'E':  case 'F': case 'I': case 'J':
            var p = word.letter.toLowerCase();
            newLine[p] = self.absolute(self.lastLine[p], parseFloat(word.value));
            break;
        }
      });

      ['x','y','z','e','f','i','j'].forEach(function(prop) {
        if (newLine[prop] === undefined) {
          newLine[prop] = self.lastLine[prop];
        }
      });
	  // Gestion Arc
	 
        var radius = Math.sqrt(Math.pow(newLine.i,2)  + Math.pow(newLine.j,2));
	//	console.log("Rayon ", radius);
	
		var cx = self.lastLine.x + newLine.i ; 
		var cy = self.lastLine.y + newLine.j ;
		
	//	console.log("Center ", cx,cy);
		var rx = - newLine.i ;
		var ry = - newLine.j ;
	
		var rtx = newLine.x - cx;
		var rty = newLine.y - cy;
	// cf Marlin
	// float angular_travel = atan2(r_axis0*rt_axis1-r_axis1*rt_axis0, r_axis0*rt_axis0+r_axis1*rt_axis1);
		var theta = Math.atan2((rx*rty - ry*rtx),(rx*rtx + ry*rty));
		
		//console.log("Angle theta calculé ", theta);
    // if (angular_travel < 0) { angular_travel += 2*M_PI; }
	
		if (theta < 0) { theta += 2 * Math.PI ;}
		console.log("Angle theta corrigé ", theta);
    // if (isclockwise) { angular_travel -= 2*M_PI; }
	//	if (p2.arc_cw == true) { theta = 2 * Math.PI - theta ; }
	    // console.log("Angle corrige", theta);
	// float millimeters_of_travel = hypot(angular_travel*radius, fabs(linear_travel));
		var millimeters_of_travel = theta*radius;
    // if (millimeters_of_travel < 0.001) { return; }
    //uint16_t segments = floor(millimeters_of_travel/MM_PER_ARC_SEGMENT);
		var nb_segments = Math.floor(millimeters_of_travel / 1);
    // if(segments == 0) segments = 1;
		if(nb_segments == 0) nb_segments = 1;
	 // console.log("Nb Segments ", nb_segments);
    // float theta_per_segment = angular_travel/segments;
		var theta_per_segment = theta/nb_segments;
    // float linear_per_segment = linear_travel/segments;
	//	var linear_per_segment = linear_travel/nb_segments;
    // float extruder_per_segment = extruder_travel/segments;
	// Vector rotation matrix values
    
    // float arc_target[4];
		var arc_target = [];
		var old_target = [];
    // float sin_Ti;
		var sin_Ti;
    // float cos_Ti;
		var cos_Ti;
    // float r_axisi;
		var rxi;
    // uint16_t i;
	    var i ;
    // int8_t count = 0;
		var count = 0 ;
	// Initialize the linear axis - Rt - On change Z
    // arc_target[axis_linear] = position[axis_linear];
 		    
         old_target[0] = self.lastLine.x ;
		 old_target[1] = self.lastLine.y ;
		 old_target[2] = self.lastLine.z ;

    for (i = 1 ; i <= nb_segments ; i ++) { // Increment (segments-1)
	    // G3 OK
		cos_Ti = Math.cos(i*theta_per_segment);
		sin_Ti = Math.sin(i*theta_per_segment);
		
		rx = -newLine.i*cos_Ti +  newLine.j*sin_Ti;
		ry = -newLine.i*sin_Ti - newLine.j*cos_Ti;
		// Update arc_target location
		arc_target[0] = cx + rx;
		arc_target[1] = cy + ry;
		arc_target[2] = newLine.z;
		    
      // var color =  new THREE.Color(GCodeRenderer.feedColors[viewModel.code.index%GCodeRenderer.feedColors.length]);
      var color =  GCodeRenderer.feedColors[viewModel.code.index%GCodeRenderer.feedColors.length];
      var p1 = new THREE.Vector3(old_target[0], old_target[1], old_target[2]);
      var p2 = new THREE.Vector3(arc_target[0], arc_target[1], arc_target[2]);
         old_target[0] = arc_target[0] ;
		 old_target[1] = arc_target[1] ;
		 old_target[2] = arc_target[2] ;
//console.log("Dessin de ",old_target[0] ,old_target[1]," a ",arc_target[0],arc_target[1]) ;
      viewModel.vertexIndex = self.feedAllGeo.vertices.length;

      if( viewModel.code.index <= self.index ) {
        self.feedGeo.vertices.push(p1);
        self.feedGeo.vertices.push(p2);
        self.feedGeo.colors.push(color);
        self.feedGeo.colors.push(color);
      }
      else {
        self.feedIncGeo.colors.push(color);
        self.feedIncGeo.colors.push(color);
        self.feedIncGeo.vertices.push(p1);
        self.feedIncGeo.vertices.push(p2);
      }

      self.feedAllGeo.vertices.push(p1);
      self.feedAllGeo.vertices.push(p2);
      self.feedAllGeo.colors.push(color);
      self.feedAllGeo.colors.push(color);

      viewModel.vertexLength = self.feedAllGeo.vertices.length - viewModel.vertexIndex;
      
      
	}
	  self.lastLine = newLine; 
      return self.feedGeo;
    }
	

  } // end geometryHandlers

  this.materialHandlers = {

    G0: function(viewModel) {
      return this.motionMat;
    },
    G1: function(viewModel) {
      return this.feedMat;
    },
    G2: function(viewModel) {
      return this.feedMat;
    },
    G3: function(viewModel) {
      return this.feedMat;
    }
  } // end materialHandlers

};

GCodeRenderer.motionColors = [ new THREE.Color(0xdddddd) ]
GCodeRenderer.feedColors = [
                             // new THREE.Color(0xffcc66), // canteloupe
                             new THREE.Color(0x66ccff), // sky
                             new THREE.Color(0x22bb22), // honeydew
                             // new THREE.Color(0xff70cf), // carnation
                             new THREE.Color(0xcc66ff), // lavender
                             new THREE.Color(0xfffe66), // banana
                             new THREE.Color(0xff6666) // salmon
                             // new THREE.Color(0x66ffcc), // spindrift
                             // new THREE.Color(0x66ff66), // flora
                           ]

GCodeRenderer.prototype.absolute = function(v1, v2) {
    return this.relative ? v1 + v2 : v2;
  }

GCodeRenderer.prototype.render = function(model) {
  var self = this;
  self.model = model;

  self.model.codes.forEach(function(code) {
    self.renderGCode(code);
  });

  self.updateLines();

  // Center
  self.feedAllGeo.computeBoundingBox();
  self.bounds = self.feedAllGeo.boundingBox;

  self.center = new THREE.Vector3(
      self.bounds.min.x + ((self.bounds.max.x - self.bounds.min.x) / 2),
      self.bounds.min.y + ((self.bounds.max.y - self.bounds.min.y) / 2),
      self.bounds.min.z + ((self.bounds.max.z - self.bounds.min.z) / 2));

  var zScale = window.innerHeight / (self.bounds.max.z - self.bounds.min.z),
      yScale = window.innerWidth / (self.bounds.max.y - self.bounds.min.y),
      xScale = window.innerWidth / (self.bounds.max.x - self.bounds.min.x),

      scale = Math.min(zScale, Math.min(xScale, yScale));

  self.baseObject.position = self.center.multiplyScalar(-scale);
  self.baseObject.scale.multiplyScalar(scale);

  return self.baseObject;
};

GCodeRenderer.prototype.updateLines = function() {
  var self = this;

  while( self.baseObject.children.length > 0 ) {
    self.baseObject.remove(self.baseObject.children[0]);
  }

  var motionLine = new THREE.Line(this.motionGeo, this.motionMat, THREE.LinePieces);
  var feedLine = new THREE.Line(this.feedGeo, this.feedMat, THREE.LinePieces);
  var feedIncLine = new THREE.Line(this.feedIncGeo, this.feedIncMat, THREE.LinePieces);
  self.baseObject.add(motionLine);
  self.baseObject.add(feedLine);
  self.baseObject.add(feedIncLine);
};

/* returns THREE.Object3D */
GCodeRenderer.prototype.renderGCode = function(code) {
  var cmd = code.words[0].letter+code.words[0].value;
  var viewModel = new GCodeViewModel(code);

  var geometryHandler = this.geometryHandlers[cmd] || this.geometryHandlers['default'];
  if (geometryHandler) {
    geometryHandler(viewModel);
  }
  var materialHandler = this.materialHandlers[cmd] || this.materialHandlers['default'];
  if (materialHandler) {
    materialHandler(viewModel);
  }

  if(viewModel.vertexLength > 0) {
    this.viewModels.push(viewModel);
  }
};


GCodeRenderer.prototype.setIndex = function(index) {
  index = Math.floor(index);
  if( this.index == index ) { return; }
  if( index < 0 || index >= this.viewModels.length ) {
    throw new Error("invalid index");
  }

  var vm = this.viewModels[index];

  this.feedGeo = new THREE.Geometry();

  var vertices = this.feedAllGeo.vertices.slice(0, vm.vertexIndex + vm.vertexLength);
  Array.prototype.push.apply( this.feedGeo.vertices, vertices );

  var colors = this.feedAllGeo.colors.slice(0, vm.vertexIndex + vm.vertexLength);
  Array.prototype.push.apply( this.feedGeo.colors, colors );


  this.index = index;
  this.updateLines();
};
