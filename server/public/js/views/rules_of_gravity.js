/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.rules_of_gravity = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(1,1,1,.003)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // snapshot bottom half for sliding chart
    var slideframe = ctxfx.getImageData(0, 0, this.cw, this.ch);
    ctxfx.putImageData(slideframe, xw/64, 0);

    // draw here

    var radius = xw;
    var mass_x = this.w/2;
    var mass_y = this.h/2;

    var angle = de_ra (this.a); 
    var distance = this.h * 0.4
    var planet_x = (this.w/2) + distance * Math.cos(angle);
    var planet_y = (this.h/2) + distance * Math.sin(angle);

  
    var ax = (this.w/2) + (distance - radius/2) * Math.cos(angle);
    var ay = (this.h/2) + (distance - radius/2) * Math.sin(angle);

    var bx = (this.w/2) + (radius) * Math.cos(angle);
    var by = (this.h/2) + (radius) * Math.sin(angle);


    ctxfx.fillStyle = '#fff';
    ctxfx.beginPath();
    ctxfx.arc(mass_x, planet_y, xw/32, 0, 2 * Math.PI, true);
    ctxfx.closePath();
    ctxfx.fill();

    // xy triangle

    ctx.strokeStyle = '#900';
    ctx.lineWidth = xw/16;
    ctx.beginPath();

    ctx.moveTo(mass_x, mass_y) ;
    ctx.lineTo(planet_x, mass_y);
    ctx.lineTo(planet_x, planet_y);
    ctx.lineTo(mass_x, planet_y);
    ctx.lineTo(mass_x, mass_y);

    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = '#0cc';
    ctx.beginPath();
    ctx.arc(mass_x, mass_y, radius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // planet

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(planet_x, planet_y, radius/2, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // angle
    // var aax = (this.w/2) + (distance/2) * Math.cos(angle/2);
    // var aay = (this.h/2) + (distance/2) * Math.sin(angle/2);

    var aax = (this.w/2) + (distance/2) * Math.cos(angle/2);
    var aay = (this.h/2) + (distance/2) * Math.sin(angle/2);

    // var a0 = (this.a + 180) % 360;
    // var a1 = this.a % 90;
    // var a2 = (a0 - a1) % 360;

    // ctx.strokeStyle = '#0cc';
    // ctx.beginPath();
    // ctx.stroke();

    // // ctx.fillStyle = '#000';
    // // ctx.beginPath();

    // if(mass_y < planet_y && planet_x > mass_x){
    //   ctx.arc(planet_x, planet_y, radius * 2, de_ra(180 + this.a), de_ra(270), false);
    // }else if(mass_y < planet_y && planet_x < mass_x){
    //   ctx.arc(planet_x, planet_y, radius * 2, de_ra(270), de_ra(180 + this.a), false);
    // }else if(mass_y > planet_y && planet_x < mass_x){
    //   ctx.arc(planet_x, planet_y, radius * 2, de_ra(this.a-180), de_ra(90), false);
    // }else if(mass_y > planet_y && planet_x > mass_x){
    //   ctx.arc(planet_x, planet_y, radius * 2, de_ra(90), de_ra(this.a-180), false);
    // }

    // ctx.stroke();
    // ctx.closePath();
    

    // backfill for angle value
    //ctx.arc(aax, aay, radius/2, 0, 2 * Math.PI, true);

    // ctx.fillStyle = '#0cc';
    // ctx.font = '18pt Arial';
    // ctx.textAlign = 'center';
    // ctx.fillText( this.a.toFixed(0), aax, aay);

    // arrow
    ctx.strokeStyle = '#c00';
    ctx.lineWidth = xw/16;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.closePath();


    // arrowhead

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle - Math.PI/2);

    ctx.strokeStyle = '#c00';
    var zz = xw/4
    ctx.beginPath();
    ctx.moveTo(-zz, zz) 
    ctx.lineTo(0, 0)
    ctx.lineTo(zz, zz) 
    ctx.stroke();
    ctx.closePath();
    
    ctx.restore();
    //

    // x

    // ctx.fillStyle = '#fff';
    // ctx.font = 'bold 24pt Arial';
    // ctx.textAlign = 'center';
    // ctx.fillText( (planet_x - mass_x).toFixed(0), planet_x, xh);

    // ctx.fillStyle = '#fff';
    // ctx.font = 'bold 24pt Arial';
    // ctx.textAlign = 'center';
    // ctx.fillText( (planet_x - mass_x).toFixed(0), planet_x, xh);


    // x sin
    // ctxfx.fillStyle = '#0cc';
    // ctxfx.beginPath();
    // ctxfx.arc(xw * 1.5, planet_y, xw/32, 0, 2 * Math.PI, true);
    // ctxfx.closePath();
    // ctxfx.fill();


    // x
    // ctx.fillStyle = '#fff';
    // ctx.font = 'bold 24pt Arial';
    // ctx.textAlign = 'center';
    // ctx.fillText( (planet_y - mass_y).toFixed(0), xw, planet_y);


    // math

    ctx.fillStyle = '#fff';
    ctx.font = '18pt Arial';
    ctx.textAlign = 'center';

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

    this.a += 0.5;
    this.a = this.a % 360;
    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.a = 0;

    this.period = 25;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
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
