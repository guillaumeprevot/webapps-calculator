// Project configuration. 

module.exports = function(grunt) {
	grunt.initConfig({
	  jshint: {
		options: {
		  curly: false,
		  eqeqeq: true,
		  eqnull: true,
		  browser: true,
		  laxbreak: true,
		  sub: true,
		  reporter: require('jshint-html-reporter'),
		  reporterOutput: 'gruntfile-jshint.html'
		},
		src: ['./webapp/*.js']
	  }	  
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.registerTask('default', ['jshint']);
}
