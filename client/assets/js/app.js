(function() {
    'use strict';

    var app = angular.module('application', [
            'ui.router',
            'ngAnimate',

            //foundation
            'foundation',
            'foundation.dynamicRouting',
            'foundation.dynamicRouting.animations', 
            'one.com'
        ])
        .config(config)
        .run(run);

    config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

    function config($stateProvider, $urlProvider, $locationProvider) {
        $urlProvider.otherwise('/');

        $locationProvider.html5Mode({
            enabled: false,
            requireBase: false
        });

        $locationProvider.hashPrefix('!');
    }

    function run() {
        FastClick.attach(document.body);
    }

    app.controller('AppController', ['$scope', 'OneService', function($scope, OneService) {
        var lookup = OneService;
        $scope.search = function() {
            if ($scope.query.trim() != '') {
                lookup.init($scope.query);
                lookup.run().then(function(result) {
                    if (result.status === "success") {
                        $scope.result = 'Found: ' + result.message.join('-');
                    } else {
                        $scope.result = result.message;
                    }
                });
            }
        };
    }]);

})();