var Bani = (function() {
    var UUID = (function UUID() {
        var _ids = [];
        
        function _makeID() {
            var text = "",
                possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        
            for( var i=0; i < 10; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));
        
            return text;
        }
        
        function generate() {
            var id = _makeID();
            if(_.indexOf(_ids, id) !== -1) {
                id = generate();
            }
            
            return id;
        }
        
        return {
            generate: generate
        }
    }());
    
    var ObjectAccess = (function() {
        var _objects = {};
        
        function registerOwner(ownerName) {
            var owner = _.findWhere(_objects, {name: ownerName});
                        
            _objects[owner.id].owns.push(this.id);
            this.ownedBy = owner.id;
            
            return this;
        }
        
        function requestAccess (target) {
            var targetObj = _.findWhere(_objects, {name: target});
                        
            if(targetObj.ownedBy === this.id
              && _.indexOf(this.owns, targetObj.id !== -1)) {
                return grantPermissions(targetObj, 0);
            } else if(_.intersection(targetObj.group, this.group).length > 0) {
                if(targetObj.permissions.toString().split("")[1] > 0) {
                    return grantPermissions(targetObj, 1);
                }
            } else {
                return grantPermissions(targetObj, 2);
            }
        }
                        
        function grantPermissions(targetObj, accessNumber) {
            var type = targetObj.permissions.toString().split("");
            switch (type[accessNumber]) {
                case "2":
                    return grantFull(targetObj);
                case "1":
                    return grantRead(targetObj);
                default:
                    return grantNone(targetObj);
            }
        }
        
        function grantNone(targetObj) {
            return false;
        }
        
        function grantRead(targetObj) {
            return _.clone(targetObj.attributes || targetObj.properties);
        }
        
        function grantFull(targetObj) {
            return targetObj;
        }
        
        function getOwner(target) {
            var id = _.findWhere(_objects, {name: target}).ownedBy;
            
            return _objects[id];
        }
        
        return {
            requestAccess: requestAccess,
            registerOn: registerOwner,
            ownerOf: getOwner,
            add: function(obj) {
                _objects[obj.id] = obj;
            }
        };
        
    }());
        
  var types = {
		View: {
            ownedBy: null,
            group: null,
            owns: [],
            permissions: 755,
            typeof: "View",
            setTypeVals: function() {
                this.id = UUID.generate();
            }
		},
      
        Controller: {
            initialize: function() {
                this.id = UUID.generate();
            },
            owns: [],
            setTypeVals: function() {
                this.id = UUID.generate();
            },
            typeof: "Controller",
            requestAccess: function(name) {
                return _.bind(ObjectAccess.requestAccess, this)(name);
            }
        },
      
        Model: {
            ownedBy: null,
            owns: [],
            group: null,
            permissions: 222,
            typeof: "Model",
            attributes: {},
            toJSON: function() {
                return _.clone(this.attributes);
            },
            setTypeVals: function() {
                this.id = UUID.generate();
            },
            set: function(key, value) {
                this.attributes[key] = value;
                $(this).trigger('change:' + key);
            },
            get: function(key) {
                return this.attributes[key];
            }
        }
	};
 
	function extend(name, type, obj) {
		var extension = function() {};
 
		for(var key in types[type]) {
			extension.prototype[key] = types[type][key];
		}
 
		for(var key in obj) {
			extension.prototype[key] = obj[key];
		}
 
		types[name] = extension;
	}
 
	function register(type, name, object) {
		var obj = new types[type]();
        
        obj.setTypeVals();
        obj.name = name;
                
		if(obj.initialize) obj.initialize.apply(obj);
        
        ObjectAccess.add(obj);
                
		return {
            id: obj.id,
            setOwner: function(name) {
                _.bind(ObjectAccess.registerOn, obj)(name);
                return this;
            }
        };
	}
 
	return {
		register: register,
		extend: extend,
        onEvent: function(action) {
            var owner = ObjectAccess.ownerOf(action.target);
            
            switch(owner.requestAccess(action.target).typeof) {
                case 'View':
                    owner.requestAccess(action.target).$el.on(action.event, _.bind(action.callback, owner));
                    break;
                default:
                    $(owner.requestAccess(action.target)).on(action.event, function(e) {
                        _.bind(action.callback, owner)(e.currentTarget.toJSON());
                    });
                    break;
            }
        },
        save: function(owner, modelName, callback) {
            var model = owner.requestAccess(modelName);
                        
            callback.apply(model);
        }
	};
}());