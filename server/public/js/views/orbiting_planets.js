/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.orbiting_planets = Backbone.View.extend({
  template: _.template('<div class="canvas"></div><div class="fx"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'onClose', 'render', 'start', 'stop', 'draw', 'tick');
    this.render();
    $(window).on('resize', this.render);
  },
  onClose: function(){
    $(window).off('resize', this.render);
    this.stop();
  },
  draw: function(){

    var self = this;

    if(!this.running){
      return;
    }

    var ctx = this.cview.getContext('2d');
    var ctxfx = this.fxview.getContext('2d');

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.05)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    // ctx.lineWidth = 2;			
    // ctx.beginPath();
    // ctx.arc(this.w/2, this.h/2, xw/2, 0, 2 * Math.PI, true);
    // ctx.fill();
    // ctx.stroke();   

    // planets
    var draw_vectors = function(){
      var planet;
      for (var i in self.planets) {
        planet = self.planets[i];

        ctx.strokeStyle = 'rgba(0,255,255,0.4);';
        ctx.lineWidth = xw/16;			
        ctx.beginPath();
        ctx.moveTo(self.w/2, self.h/2);
        ctx.lineTo(planet.x, planet.y);
        ctx.stroke();   

        ctxfx.fillStyle = '#0cc';
        ctxfx.strokeStyle = '#0ff';
        ctxfx.lineWidth = 2;
        ctxfx.beginPath();
        ctxfx.arc(planet.x, planet.y, planet.size * xw/128, 0, 2 * Math.PI, true);
        ctxfx.fill();
        ctxfx.stroke();

      }
    }();

    // planets
    var draw_planets = function(){
      var planet;
      for (var i in self.planets) {
        planet = self.planets[i];

        ctx.fillStyle = '#0cc';
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size * xw/48, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();

      }
    }();

    // fake star
    ctx.fillStyle = '#ff0';	
    ctx.strokeStyle = '#ff0';	

    var p = 12;
    var r = xw/2;
    var m = 0.7;
    ctx.save();
    ctx.beginPath();
    ctx.translate(this.w/2, this.h/2);
    ctx.moveTo(0,0-r);
    for (var i = 0; i < p; i++) {
      ctx.rotate(Math.PI / p);
      ctx.lineTo(0, 0 - (r*m));
      ctx.rotate(Math.PI / p);
      ctx.lineTo(0, 0 - r);
    }
    ctx.fill();
    ctx.restore();



    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }

    // tick here

    var tick_planets = function(){
      var planet;
      for (var i in self.planets) {
        planet = self.planets[i];
        planet.d += planet.v;
        planet.d = planet.d % 360;
        planet.x = (self.w/2) + planet.r * Math.cos(planet.d);
        planet.y = (self.h/2) + planet.r * Math.sin(planet.d);
      }
    }();


    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;
    this.period = 25;

    this.planets = [];
    
    var init_planets = function(){
      for(var i=0, ii = random1to(3) + 2; i<ii; i++){
        self.planets.push (self.makePlanet());
      }
    }();

  },
  makePlanet: function() {
    var planet = {
      size: (Math.min(this.w,this.h) * 0.01) + random.from0to(Math.min(this.w,this.h) * 0.01),
      r: Math.min(this.w,this.h) * 0.1 + random.from0to(Math.min(this.w,this.h) * 0.4),
      d: random.from0to(360),
      v: 0.00001 * (random.from0to(2000)),
      x: 0,
      y: 0
    };
    return planet;
  },
  start: function () {
    this.init();
    this.running = true;
    this.tick();
    this.draw();
  },
  stop: function(){
    this.running = false;
    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    if(this.requestId){
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  },
  fitToView: function(){
    var sx = this.cw / this.w;
    var sy = this.ch / this.h;
    this.scale = Math.min(sx, sy);

    this.x = (this.cw / 2) - ((this.w * this.scale)/2);
    this.y = (this.ch / 2) - ((this.h * this.scale)/2);
  },
  render : function(){
    this.stop();
    this.$el.html(this.template());
    this.$('.canvas').html('<canvas id="canvas"></canvas>');
    this.$('.fx').html('<canvas id="fx"></canvas>');

    // virtual scren size
    this.w = 1024;
    this.h = 768;

    // actual screen size
    this.cview = document.getElementById('canvas');
    this.cw = this.cview.width = this.$('.canvas').width();
    this.ch = this.cview.height = this.$('.canvas').height();

    this.fxview = document.getElementById('fx');
    this.fxview.width = this.$('.fx').width();
    this.fxview.height = this.$('.fx').height();

    this.fitToView();

    this.start();

  }
});
