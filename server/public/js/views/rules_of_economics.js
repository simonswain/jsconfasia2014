/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.rules_of_economics = Backbone.View.extend({
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

    var xw = this.w/10;
    var xh = this.h/10;
    var xx = Math.min(this.w, this.h)/10;

    // draw here

    // connections
    _.each(this.obs, function(ob){
      _.each(ob.to, function(to){
        var x = self.w/2 + (ob.x * 3 * xx);
        var y = self.h/2 + (ob.y * 3 * xx);

        var to_x = self.w/2 + (self.obs[to].x * 3 * xx);
        var to_y = self.h/2 + (self.obs[to].y * 3 * xx);
        
        var angle = 0;
        var c = 0;

        if(to_x < x){
          x -= xx;
          to_x += xx;
          c ++;
          angle -= 90
        }

        if(to_x > x){
          x += xx;
          to_x -= xx;
          c ++;
          angle += 90
        }

        if(to_y < y){
          y -= xx;
          to_y += xx;
          c ++;
          //angle += 0;
        }

        if(to_y > y){
          y += xx;
          to_y -= xx;
          angle += 180
          c ++;
        }

        ctx.lineWidth = xw/10;
        ctx.strokeStyle = ob.color; 
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(to_x, to_y);
        ctx.stroke()
        ctx.closePath();     
      });
    });

    // boxes
    _.each(this.obs, function(ob){
      var x = self.w/2 + (ob.x * 3 * xx);
      var y = self.h/2 + (ob.y * 3 * xx);
      ctx.save();
      ctx.translate(x, y);

      ctx.lineWidth = xw/10;
      ctx.fillStyle = '#000';
      ctx.fillRect(0 - xx, 0 - xx, 2 * xx, 2 * xx);
      ctx.strokeStyle = ob.color;
      ctx.strokeRect(0 - xx, 0 - xx, 2 * xx, 2 * xx);      

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24pt Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ob.title, 0, xx/3);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24pt Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ob.chinese, 0, -xx/3);

      ctx.restore();

    });


    // arrow heads
    _.each(this.obs, function(ob){
      _.each(ob.to, function(to){

        var x = self.w/2 + (ob.x * 3 * xx);
        var y = self.h/2 + (ob.y * 3 * xx);

        var to_x = self.w/2 + (self.obs[to].x * 3 * xx);
        var to_y = self.h/2 + (self.obs[to].y * 3 * xx);
        
        var angle = 0;
        var c = 0;

        if(to_x < x){
          x -= xx;
          to_x += xx;
          c ++;
          angle -= 90
        }

        if(to_x > x){
          x += xx;
          to_x -= xx;
          c ++;
          angle += 90
        }

        if(to_y < y){
          y -= xx;
          to_y += xx;
          c ++;
          //angle += 0;
        }

        if(to_y > y){
          y += xx;
          to_y -= xx;
          angle += 180
          c ++;
        }

        angle = angle / c;
        ctx.lineWidth = xw/10;

        ctx.save();
        ctx.translate(to_x, to_y);
        ctx.rotate(de_ra(angle));
        var z = xw/5;
        ctx.beginPath(); 
        ctx.strokeStyle = ob.color; 
        ctx.moveTo(-z, z);
        ctx.lineTo(0, 0);
        ctx.lineTo(z, z);
        ctx.stroke()
        ctx.restore();


      });

    });
    //

    ctx.restore();
    ctxfx.restore();

    var yy = xh;
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 14pt arial';
    ctx.textAlign = 'left';
    _.each(this.rules, function(rule){
      ctx.fillText(rule, xw, yy);
      yy += xh/3;
    });



    //this.requestId = window.requestAnimationFrame(this.draw);

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

    this.obs = {
      pop: {
        x: 0,
        y: -1,
        title: 'POP',
        chinese: '人口',
        color: '#fff',
        to: ['ind']
      },
      agr: {
        x: -1,
        y: 0,
        title: 'AGR',
        chinese: '农业',
        color: '#090',
        to: ['pop']
      },
      // raw: {
      //   x: 0,
      //   y: -1,
      //   title: 'Raw',
      //   color: '#B8860B',
      //   to: ['pop', 'ind']
      // },
      ind: {
        x: 0,
        y: 1,
        title: 'IND',
        chinese: '行业',
        color: '#0cc',
        to: ['pol','agr']
      },
      pol: {
        x: 1,
        y: 0,
        title: 'POL',
        chinese: '污染',
        color: '#c00',
        to: ['pop']
      }
      
    };

    this.rules = [
      'POP + IND + AGR cannot exceed Size of Planet',
      'POP has birthrate and deathrate',
      'IND increases POL',
      'POL increases deathrate',
      'IND output is ~ POP',
      'IND increases AGR',
      'POP is limited by AGR',
      'IND creates credit to make Ships',
      'Suplus POP will leave via ship',
      'IND & AGR can be traded'
    ];


    this.period = 100;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    setInterval(this.init.bind(this), 20000);

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
