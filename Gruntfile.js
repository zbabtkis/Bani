grunt = require("grunt");

grunt.initConfig({

	concat: {
	    js: {
	      	src: ['Views/Backbone-Dropdown/backbone.dropdown.js'
	          	, 'Views/Backbone-SliderBar/backbone.sliderbar.js'
	          	, 'Views/Backbone-ToggleSwitch/backbone.toggleswitch.js'
	       	],
	      	dest: 'dist/bani-views.js',
	    },
	    css: {
	    	src: ['Views/Backbone-Dropdown/backbone.dropdown.css',
				'Views/Backbone-SliderBar/backbone.sliderbar.css',
				'Views/Backbone-ToggleSwitch/backbone.toggleswitch.css'
	       	],
	      	dest: 'dist/bani-views.css',
	    }
	},
	uglify: {
		js: {
			files: {
				'dist/bani-views.min.js': ['dist/bani-views.js'],
			}
	    }
	},
	cssmin: {
		combine: {
	    	files: {
	    		'dist/bani-views.min.css': ['dist/bani-views.css']
	    	}
	    }
	}
});

grunt.loadNpmTasks('grunt-contrib-cssmin')
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-concat');

grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);