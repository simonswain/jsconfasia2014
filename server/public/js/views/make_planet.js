/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.make_planet = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(1,1,1,.18)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    var data = this.planet.toJSON();
    var radius = xh;
    data.x = Number(this.w/2);
    data.y = Number(xh*2);
    ctx.fillStyle = '#69c';
    ctx.beginPath();
    ctx.arc(data.x, data.y, radius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    var segments = {
      population: '#900',
      pollution: '#444',
      agriculture: '#090',
      industry: '#0cc'
    };
    
    var oldAngle = 0;    
    _.each(segments, function(color, k){
      var portion =data[k] / data.land;
      var wedge = 2 * Math.PI * portion;
      var angle = oldAngle + wedge;
      ctx.beginPath();
      ctx.arc(data.x, data.y, radius, oldAngle, angle);
      ctx.lineTo(data.x, data.y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();    // fill with wedge color
      oldAngle += wedge;
    });


    var vals = [
      'land',
      'age',
      'raw',
      'consumed',
      'population',
      // 'birthrate',
      // 'deathrate', 
      'agriculture',
      'pollution',
      'industry',
      'credit'
    ];
    var xl = this.w/2 + xw/4;
    var xr = this.w/2 - xw/4;
    var yy = 5.5*xh;
    ctx.fillStyle = '#fff';
    ctx.font = '32pt arial';

    ctx.textAlign = 'center';
    ctx.fillText(data.name, this.w/2, 4*xh);

    vals.forEach(function(k){

      ctx.textAlign = 'left';
      ctx.fillText(k, xl, yy);

      ctx.textAlign = 'right';
      ctx.fillText(data[k].toFixed(0), xr, yy);
      yy += xh;
    });


    //

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



    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.planet = new App.Models.Planet({name: 'Test Planet'});
    this.period = 100;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    //setInterval(this.init.bind(this), 20000);

    // restart every 20s
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
