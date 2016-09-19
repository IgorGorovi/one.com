(function() {
    'use strict';

    var app = angular.module('application', [
            'ui.router',
            'ngAnimate',

            //foundation
            'foundation',
            'foundation.dynamicRouting',
            'foundation.dynamicRouting.animations'
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

    app.factory('OneService', ['$q', function($q) {
        var lookup = new TreeLookup();
        var searchQueue = [];
        //loopCenter is the object returned by OneService
        //this uses the bfs search functionality defined below
        var loopCenter = {
            run: function() {
                var head = 0;
                var searchComplete = false;
                var def = $q.defer();
                var loopDeferred = $q.defer();
                //to start the loop we resolve it to continue
                loopDeferred.resolve({ "message": 'continue' });
                var count = 0;
                var loop = function(promise) {
                    promise.then(function(input) {
                            var message = input.message;
                            var result = input.visited;
                            var currentNodeTuple;

                            if (message === "continue") {
                                currentNodeTuple = searchQueue[head];
                                // if current tuple is defined then
                                if (currentNodeTuple) {
                                    searchQueue.splice(head, 1);
                                    loop(breathFirstSearch(currentNodeTuple.node, currentNodeTuple.visited));
                                } else { //else array is empty or such 
                                    loopCenter.destroy();
                                    def.resolve({ "status": "not-found", "message": "- Not Found -" });
                                }
                            } else {
                                loopCenter.destroy(); //done searching so remove queued up searches 
                                def.resolve({ "status": "success", "message": result });
                            }
                        },
                        function(error) {
                            loopCenter.destroy();
                            def.reject({ "status": "error", "message": "- Encountered Error-" });
                        });
                }
                loop(loopDeferred.promise);
                return def.promise;
            },
            init: function(node) {
                searchQueue.push({ node: node, visited: [] });
            },
            destroy: function() {
                searchQueue = [];
            }
        };

        var breathFirstSearch = function(node, visited) {
            var def = $q.defer();
            var nextSet = [];
            var nodeString;
            //first node
            if (visited.length === 0) {
                nodeString = '/';
            } else {
                nodeString = '/' + visited.join('/');
            }
            lookup.getChildrenAsCallback(nodeString, function(err, nodesList) {
                console.log('nodeList', nodesList);
                if (err) {
                    def.reject("encountered error");
                } else {
                    if (nodesList.length === 0) {
                        //if its a dead-end then just continue
                        def.resolve({ "message": 'continue' });
                    } else {
                        var found = nodesList.some(function(n) {
                            var val;
                            if (n !== node) {
                                searchQueue.push({ "node": node, "visited": visited.concat([n]) });
                            }
                            return n === node;
                        });
                        if (found === true) {
                            //you are done therefore stop iterations
                            def.resolve({ "message": 'stop', "visited": visited.concat([node]) });
                        } else {
                            def.resolve({ "message": 'continue' });
                        }
                    }
                }
            });
            return def.promise;
        }
        return loopCenter;
    }]);

})();