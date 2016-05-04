/**
 * Created by Ben on 5/3/16.
 */

(function (angular) {
    "use strict";

    var app = angular.module('skygazr.map', ['ngRoute', 'firebase.utils', 'firebase']);

    app.factory('pinsList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        return function(userId) {
            var ref = fbutil.ref('pins/' + userId);
            return $firebaseArray(ref);
        }
    }]);

    app.controller('MapCtrl', function($scope, $rootScope, NgMap, user, pinsList) {
        // Resize the map to take up the whole screen
        NgMap.getMap("map").then(function(map) {
            document.getElementById("map").setAttribute("style", "height: 100%");
            google.maps.event.trigger(map, 'resize');
        }).catch(function(error) {
            console.log(error);
        });

        $scope.loggedIn = $rootScope.loggedIn;

        $scope.pins = [];
        if ($scope.loggedIn) {
            console.log("Logged in: showing pins");
            $scope.pins = pinsList(user.uid);
            console.log($scope.pins);
        } else {
            console.log("Not logged in: no pins to show");
        }
    });

    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/map', {
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
        });
    }]);

})(angular);