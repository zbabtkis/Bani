/**
 *
 * Backbone Dropdown Widget 1.0.0
 * Simple dropdown selection tool built with Backbone.js.
 * http://zacharybabtkis.com/demos/backbone-dropdown
 *
 * Copyright 2013, Zachary Babtkis
 * Licenced under MIT License.
 * http://opensource.org/licenses/MIT
 *
 */

/**
 * @class factory for Dropdown widgets.
 *
 * @attribute _options
 * @method    configure
 */

var Dropdown = (function() {
    /**
     * CONSTANTS
     */
    var CLASS_ANIMATE   = "animated"
      , CLASS_NOANIMATE = "no-animation"
      , CLASS_ACTIVE    = "active"
      , TEMPLATE        = "<div class='current'><span class='item'><%= current %></span></div>"
                        + "<ul role='listbox' class='dd-list'><% _.each(items, function(item) { %>"
                        + "<li role='option' id='<%= item.label.replace(\" \", \"-\") %>' data-label='<%= item.label %>' data-value='<%= item.value %>'>"
                        + "<%= item.label%></li><% }); %></ul>";
    
    var Model = Backbone.Model.extend({
        defaults: {
            label: 'Default',
            value: 1,
            isSelected: false
        }
    });
    
    var Collection = Backbone.Collection.extend({
        model: Model,
        select: function(value) {
            var choose   = this.findWhere({value: value}),
                selected = this.getCurrent();
            
            if(selected) selected.set('isSelected', false, {silent: true});
            
            choose.set('isSelected', true);
        },
        getCurrent: function() {
            return this.findWhere({isSelected: true});
        }
    });
    
    var View = Backbone.View.extend({
        tagName: 'div',
        
        className: 'bani-dropdown',
        
        template: _.template(TEMPLATE),
        
        events: {
            'click li':'_chooseItem',
            'click .current': 'open'
        },
        
        initialize: function() {
            
            _.bindAll(this, 'close');
            
            this.collection = new Collection();
            this.listenTo(this.collection, 'change:isSelected', this.render);
            
            _.defaults(this.options, Dropdown.configure());                 // Set view defaults specified by arguments or configure method.
            
            Dropdown._register(this);
            
            return this;
            
        },
        
        render: function() {            
            var current        = this.collection.findWhere({isSelected: true})
              , themeClass     = this.options.theme
              , animationClass = this.options.animated ? CLASS_ANIMATE : CLASS_NOANIMATE
              , html           = this.template({
                  items: this.collection.toJSON()                           // For rendering list of all models.
                , current: current ? current.get('label') : null            // For rendering currently selected model.
              });
                                
            this.$el.html(html)
                .addClass(animationClass + " " + themeClass);
            
            return this;
        },
        
        // Sets clicked model on collection.
        _chooseItem: function(e) {
            var value = $(e.currentTarget).data('value');
                                    
            this.value(value);                                               // Tell the collection which model to select.
            this.close();
                        
            return this;
        },
        
        open: function(e) {   
            e.stopPropagation();
                
            
            $('body').on('click', this.close);                               // Clicks outside of list close list.
            this.$('ul').addClass(CLASS_ACTIVE);
            
            return this;
        },
        
        close: function() {
            $('body').off('click', this.close);
            this.$('ul').removeClass(CLASS_ACTIVE);
            
            return this;
        },
        
        // Convenience method for setting/getting current value.
        value: function(val) {
            var selected;
            
            if(val) {
                this.collection.select(val);                                  // Set val if argument provided.
            }
            
            selected = this.collection.getCurrent();                          // Get currently selected model.
            
            return selected ? selected.get('value') : '';                     // Return the value of currently selected model.
        }
    });

    // Return widget class.
    return View;
}());

/**
 * @ private
 * Holds current global options
 */
Dropdown._options  = {};
/**
 * @private
 * Holds all widgets currently in DOM.
 */
Dropdown._elements = [];

/**
 * @private
 * Register new element in _elements.
 */
Dropdown._register = function(el) { this._elements.push(el); }

/**
 * @public
 * Set global configuration options.
 */
Dropdown.configure = function(options) {
    
    if(options) {
        _.extend(this._options, options);
    }
        
    return this._options;
}
var SliderBar = (function() {
    var Model = Backbone.Model.extend({
        defaults: {
            max: 10,
            min: 0,
            viewMax: 300,
            value: 0,
            viewValue: 0,
            decimals: 0,
        },
        
        initialize: function() {
            this.on({
                'change:viewValue': this.calculateModel,
                'change:viewMax': this.responsive,
            });
        },
        
        calculateModel: function() {
            var attr = this.toJSON(),
                trueVal = (Math.abs(attr.max - attr.min) * (0 + attr.viewValue)) / Math.abs(attr.viewMax);
            
            this.set('value', trueVal.toFixed(attr.decimals));
                                    
            return this;
        },
        
        responsive: function() {
            var prevMax = this.previous('viewMax'),
                prevVal =  this.previous('viewValue'),
                currentMax = this.get('viewMax');
                        
            this.set('viewValue', currentMax * (prevVal || 1) / prevMax, {validate: true});
        },
        
        value: function(value) {
            this.set('value', value, {validate: true});
            
            var viewValue = this.get('value') * this.get('viewMax') / this.get('max');
            
            this.set('viewValue', viewValue, {validate: true});
        },
        
        validate: function(attributes) {
            if(attributes.viewValue > attributes.viewMax || attributes.value > attributes.max) {
                return "value larger than max";
            }
            if(attributes.viewValue < 0 || attributes.value < attributes.min) {
                return "value smaller than mix";
            }
        }
    });
    
    var View = Backbone.View.extend({
        tagName: 'div',
        
        events: {
            'mousemove': 'initDrag',
            'mousedown': 'mousedown',
            'mouseup': 'mouseup',
            'click': 'updatePosition',
            'selectstart': 'preventSelect'
        },
        
        defaults: {
            theme: 'theme-green',
            horizontal: true
        },
                
        className: 'slider-bar',
        
        initialize: function(options) {
            var defaults = (options && options.defaults) ? options.defaults : {};
            
            _.defaults(defaults, SliderBar._defaults);
            
            this.model = new Model(defaults);
            
            this.listenTo(this.model, 'change:viewValue', this.render);
            
            _.bindAll(this, 'respond');
            $(window).resize(this.respond);
            
            SliderBar._elements.push(this);
            
            return this;
        },
        
        render: function() {
            var dragger = $('<div class="value-bar"></div>'),
                model = this.model.toJSON(),
                val = this.isDown ? model.viewValue : model.value * model.viewMax / model.max - 7,
                defaults = _.defaults(SliderBar._options, this.defaults);
                        
            this.options = _.defaults(this.options, defaults);
                                    
            this.$el.html('')
                .append(dragger)
                .addClass(this.options.horizontal ? 'horizontal' : 'vertical')
                .addClass(this.options.theme);
            
            this.respond()
                .addTicks();
            
            if(this.options.horizontal) {
                this.$('.value-bar').css({
                    'left': val
                });
            } else {
                this.$('.value-bar').css({
                    'top': val
                });
            }
            
            if(this.dValue) {
                this.dValue.html(model.value);
                this.dValue.css('left', val);
            }
            
            return this;
        },
        
        addTicks: function() {
            for(var i = 0; i <= this.model.get('max'); i++) {
                var tick = $('<div class="tick" />');
                if(this.options.horizontal) {
                    tick.css('left', i * this.model.get('viewMax') / this.model.get('max'));
                } else {
                    tick.css('top', i * this.model.get('viewMax') / this.model.get('max'));
                }
                this.$el.append(tick);
            }
            
            return this;
        },
        
        respond: function() {
            var newSize = (this.options && this.options.horizontal) ? this.$el.width() : this.$el.height();
            this.model.set('viewMax', newSize);
                        
            return this;
        },
        
        mousedown: function() {
            this.isDown = true;
            
            if(this.options.label) {
                this.dValue  = this.dValue || $('<div class="value-display"></div>').hide();
                this.$el.before(this.dValue);
                this.dValue.fadeIn('fast');
            }
            
            return this;
        },
        
        mouseup: function() {
            this.isDown = false;
            this.render();
            
            this.dValue.fadeOut('fast');
                        
            return this;
        },
        
        initDrag: function(e) {
            if(this.isDown) {
                this.updatePosition(e);
            }
            
            return this;
        },
        
        updatePosition: function(e) {
            var newVal = (this.options.horizontal ? e.pageX - this.$el[0].offsetLeft - 5 : e.pageY - this.$el[0].offsetTop - 5);
                                    
            this.model.set('viewValue', newVal, {validate: true});
        },
        
        // Chrome fix for select cursor issue.
        preventSelect: function(e) {
            e.originalEvent.preventDefault();
                        
            return false;
        },
        
        value: function(val) {
            if(_.isNumber(val)) {
                this.model.value(val);
            } else {
                return this.model.get('value');
            }
        }
    });
    
    return View;
    
}());

SliderBar._elements = [];

SliderBar._options = {};

SliderBar._defaults = {};

SliderBar.configure = function(config) {
    _.extend(SliderBar._options, config.options);
    _.extend(SliderBar._defaults, config.defaults);
    
    return SliderBar._options;
}
var ToggleSwitch = (function() {
    var Model = Backbone.Model.extend({
        defaults: {
            value: true,
            enable: true
        },
        initialize: function(attributes, defaults) {
            _.extend(this, attributes);
            this.set(defaults);
        },
        toggle: function(attr) {
            this.set(attr, !this.get(attr));
        }
    });
    
    var View = Backbone.View.extend({
        tagName: 'div',
        className: 'toggle-switch',
        defaults: {},
        events: {
            'click': 'toggle'
        },
        initialize: function(options) {
            var defaults   = (options && options.defaults) ? options.defaults : {},
                attributes = (options && options.attributes) ? options.attributes : {};

            this.model = (options && options.model) ? options.model : new Model(attributes, defaults);
            this.options = options;

            this.listenTo(this.model, 'change:value', this.render);
            
            // Add to element registry.
            ToggleSwitch._elements.push(this);
                        
            return this;
        },
        render: function() {
            var isOn     = this.model.get('value') ? 'active' : '',
                enabled  = this.model.get('enable') ? '' : 'disabled',
                defaults = ToggleSwitch.configure(),
                theme    = (this.options && this.options.theme) ? this.options.theme : defaults.theme,
                animated = ((this.options && this.options.animated) || defaults.animated) ? 'animate' : '';
            
            // Build element html and styles.
            this.$el.removeClass()
                .addClass([theme, animated, isOn, enabled, this.className].join(' '))
                .html(isOn ? '<span class="value">' + defaults.onValue + '</span>' : '<span class="value">' + defaults.offValue + '</span>')
                .attr({
                    'aria-checked': this.model.get('value'),
                    'aria-label': this.model.get('label'),
                    'aria-readonly': enabled,
                    'role': 'checkbox',
                    'tabindex': '0'
                });
                
            this.model.get('enable') ? this.delegateEvents() : this.undelegateEvents();

            return this;
        },
        toggle: function() {
            this.model.toggle('value');
            
            return this;
        },
        enable: function(enable) {
            if(typeof enable === 'undefined') {
                this.model.set('enable', true);
            } else {
                this.model.set('enable', enable);
            }
        },
        disable: function() {
            this.enable(false);
        }
    });
    
    return View;
}());

// Holds elements for rerendering on configure.
ToggleSwitch._elements = [];

// Default options.
ToggleSwitch._options = {
    theme: 'theme-green',
    animated: false,
    onValue: 'On',
    offValue: 'Off'
}

// Allows for configuring widget options globally and getting current options.
ToggleSwitch.configure = function(configs) {
    if(configs) {
        _.each(configs, function(val, key) {
            ToggleSwitch._options[key] = val;
        });
        _.each(ToggleSwitch._elements, function(element) {
            element.render();
        });
    }
    
    return ToggleSwitch._options;
}
    
    