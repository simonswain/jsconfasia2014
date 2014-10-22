/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.canvas_layers = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    var slideframe = ctxfx.getImageData(0, 0, this.cw, this.ch);
    ctxfx.putImageData(slideframe, 0 + xw/32, 0);

    var x, yy;

    x = xw;
    yy = 2 * xh;


    ctx.fillStyle = '#0f0';
    ctx.font = 'bold ' + Math.floor(xh * 0.5) + 'pt courier';
    ctx.textAlign = 'left';

    this.content.forEach(function(s){
      ctx.fillText(s, x, yy);
      yy += xh * 1.2;
    });


    yy = this.h - 3 * xh;
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold ' + Math.floor(xh * 0.5) + 'pt courier';
    ctx.textAlign = 'left';

    this.content2.forEach(function(s){
      ctx.fillText(s, x, yy);
      yy += xh * 1.2;
    });

    ctx.fillStyle = '#fff';
    ctxfx.fillStyle = '#fff';

    ctx.strokeStyle = '#0c0';
    ctx.beginPath();
    ctx.rect(this.w * 0.05, this.h * 0.3, this.w * 0.4, this.h * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(this.w - this.w * 0.05, this.h * 0.3, - this.w * 0.4, this.h * 0.4);
    ctx.stroke();


    if(this.ix >= 0 && this.ix <= 5){
      ctx.beginPath();
      ctx.arc(this.w * 0.25, this.h/2, 2*xw, 0, 2 * Math.PI, true);
      ctx.fill();
    }

    if(this.ix === 0){
      ctxfx.beginPath();
      ctxfx.arc(this.w * 0.75, this.h/2, 2*xw, 0, 2 * Math.PI, true);
      ctxfx.fill();

    }


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
    this.ix += 1;

    if(this.ix >= 100){
      this.ix = 0;
    }

    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.ix = 0;

    this.content = [
     'ctxfx.fillStyle = \'rgba(0, 0, 0, 0.05)\';',
      'ctxfx.fillRect(0, 0, w, h);',
    ];


    this.content2 = [
      'var data = ctxfx.getImageData(0, 0, w, h);',
      'ctxfx.putImageData(data, slidex, 0);'
    ];

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
