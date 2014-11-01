/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.economics = Backbone.View.extend({
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

    var draw_flow =  function(){

      var xw = self.w/10;
      var xh = self.h/10;
      var xx = Math.min(self.w, self.h)/10;

      // draw here

      // connections
      _.each(self.obs, function(ob){
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
      _.each(self.obs, function(ob){
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
      _.each(self.obs, function(ob){
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
    }();

    // values

    var data = this.planet.toJSON();
    var radius = xh * 2;
    // data.x = Number(this.w - 6*xh);
    // data.y = Number(3.3*xh);
    data.x = Number(this.w/2);
    data.y = Number(this.h/2);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(data.x, data.y, radius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    var segments = {
      pop: '#fff',
      pol: '#c00',
      ind: '#0cc',
      agr: '#090'
    };

    var oldAngle = 0;
    _.each(segments, function(color, k){
      var val = data[k] / data.land;
      if(k === 'pol'){
        val = data.land * (val/100);
      }
      var wedge = 2 * Math.PI * val;
      var angle = oldAngle + wedge;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(data.x, data.y, radius, oldAngle, angle);
      ctx.lineTo(data.x, data.y);
      ctx.closePath();
      ctx.fill();
      oldAngle += wedge;
    });

    var segments = {
      pop: '#fff',
      pol: '#c00',
      agr: '#090',
      ind: '#0cc',
      cr: '#cc0'
    };
    var vals = [
      //'land',
      'pop',
      // 'birthrate',
      // 'deathrate',
      'agr',
      'ind',
      'pol',
      'cr'
    ];



    var xl = xw;
    var xr = 6*xw;
    var xp = 9*xw;
    var xd = this.w - (4*xw);
    var xo = this.w - (xw);
    var yy = 8*xh;
    var yy = 8*xh;

    
    ctx.font = '32pt arial';
    ctx.fillStyle = '#aaa';
    vals.forEach(function(k){

      ctx.save();

      ctx.textAlign = 'right';

      switch(k){
      case 'pop':
        ctx.translate(360, 140);
        ctx.textAlign = 'right';
        break;

      case 'agr':
        ctx.translate(190, 370);
        break;

      case 'ind':
        ctx.translate(420, 600);
        break;

      case 'pol':
        ctx.translate(840, 370);
        ctx.textAlign = 'left';
        break;

      case 'cr':
        ctx.translate(820, 570);
        break;

      default:
        break;

      }
      
      if(segments[k]){
        ctx.fillStyle = segments[k];
      }

      //ctx.textAlign = 'left';
      //ctx.fillText(k, 0, yy);

      var val = data[k];
      if(k === 'pol'){
        val = data.land * (val/100);
      }

      var pct = val / data.land * 100;

      var s;


      // actual value
     if(data.hasOwnProperty('d_' + k)){
       ctx.fillText(data[k].toFixed(0), 0, 0);
      }


      // deltas


      s = data['d_' + k]
      if(!s){
        s = 0;
      } else {
        s = s.toFixed(0);
      }

      if(data['d_' + k] === 0){
        s = '-';
      } else if(data['d_' + k] < 0){
        s = '-' + s;
      } else {
        s = '+' + s;
      }

     if(data.hasOwnProperty('d_' + k)){
        ctx.fillText(s, 0, xh * 1);
     }

     //  // outputs
     //  s = data['out_' + k]
     //  if(!s){
     //    s = 0;
     //  } else {
     //    s = s.toFixed(0);
     //  }
     //  if(data['out_' + k] === 0){
     //    s = '-';
     //  } else if(data['out_' + k] < 0){
     //    s = s;
     //  }

     // if(data.hasOwnProperty('d_' + k)){
     //   ctx.fillText(s, 0, xh * 1);
     //  }




      if(k === 'cr'){
        ctx.fillText(data[k].toFixed(2), 0, xh*2);
      } else {
        // % is on bar chart
        //ctx.fillText(pct.toFixed(2) + '%', 0, xh*3);
      }

      ctx.restore();

    });


    // chart
    var drawChart = function(){
      var chart = self.chart;
      var w = xw*3;
      var h = xh*4
      ctx.save();
      ctx.translate(self.w - 7*xh, xh);
      //ctx.translate(xh*1.5, self.h - h - xh*1.5);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.rect(0, 0, w,h);
      ctx.fill();

      ctx.lineWidth = xw/16;

      _.each(self.chart, function(vals, key){
        ctx.strokeStyle = segments[key];
        var xstep = w /  self.chartLimit;
        ctx.beginPath();
        ctx.moveTo(0, h - (h * vals)[0]);
        vals.forEach(function(val, ix){
          ctx.lineTo(1+ ix * xstep, h - (h * val));
        });
        ctx.stroke();
        ctx.closePath();
      });

      ctx.beginPath();
      ctx.strokeStyle = '#000';
      ctx.rect(0, 0, w,h);
      ctx.stroke();

      ctx.restore();
    }();


    //

    var yy = this.h * 0.1;
    //var yy = this.h * 0.65;
    ctx.fillStyle = '#a3a';
    ctx.font = 'bold 12pt courier';
    ctx.textAlign = 'left';
    _.each(this.rules, function(rule){
      ctx.fillText(rule, 0, yy);
      yy += xh/2;
    });

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

    var data = this.planet.toJSON();
    _.each(['pop','pol','agr','ind'], function(key){
      var val = data[key];
      if(key === 'pol'){
        val = val/100; // val is %
      } else{
        // express as
        val = (val / data.land);
      }
      self.chart[key].push(val);
      while(self.chart[key].length > self.chartLimit+1){
        self.chart[key].shift();
      }
      //console.log(key, val);
    });
    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;
    this.chartLimit = 1000;
    this.chart = {
      pop: [],
      pol: [],
      agr: [],
      ind: []
    };

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
      'POP + IND + AGR + POL <= SIZ',
      'POP <+ birthrate',
      'POP <- deathrate',
      'POP <= AGR',
      'IND.out ~ POP',
      'IND +> POL',
      'POL +~> deathrate',
      'IND %+> AGR',
      'IND gen Ships',
      'Ship takes POP',
    ];

    this.planet = new App.Models.Planet({
      name: 'Test Planet',
      fake_empire: false
    });
    this.period = 50;

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
