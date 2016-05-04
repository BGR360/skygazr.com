/**
 * Created by Ben on 5/3/16.
 */

(function (angular) {
    "use strict";

    var app = angular.module('skygazr.map', ['ui.router', 'firebase.utils', 'firebase']);

    app.factory('pinsList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        return function(userId) {
            var ref = fbutil.ref('pins/' + userId);
            return $firebaseArray(ref);
        }
    }]);

    app.controller('MapCtrl', function($scope, $rootScope, $state, NgMap) {
        // Resize the map to take up the whole screen
        NgMap.getMap("map").then(function(map) {
            document.getElementById("map").setAttribute("style", "height: 100%");
            google.maps.event.trigger(map, 'resize');
        }).catch(function(error) {
            console.log(error);
        });

        $scope.loggedIn = $rootScope.loggedIn;

        if ($scope.loggedIn) {
            $state.go('map.loggedIn');
        } else {
            console.log("Not logged in: no pins to show");
        }
    });

    app.controller('MapLoggedInCtrl', function($scope, user, pinsList) {
        console.log("Logged in: showing pins");
        $scope.pins = pinsList(user.uid);
        console.log($scope.pins);
    });

    app.config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('map', {
                url: '/map',
                templateUrl: 'map/map.html',
                controller: 'MapCtrl',
                resolve: {
                    // forces the page to wait for this promise to resolve before controller is loaded
                    // the controller can then inject `user` as a dependency. This could also be done
                    // in the controller, but this makes things cleaner (controller doesn't need to worry
                    // about auth status or timing of accessing data or displaying elements)
                    user: ['Auth', function (Auth) {
                        return Auth.$waitForAuth();
                    }]
                },
                css: 'map/map.css'
            })
            .state('map.loggedIn', {
                url: '/map/loggedIn',
                templateUrl: 'map/map.loggedIn.html',
                controller: 'MapLoggedInCtrl',
                css: 'map/map.css'
            });
    }]);

})(angular);