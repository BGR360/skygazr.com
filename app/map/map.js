/**
 * Created by Ben on 5/3/16.
 */

(function (angular) {
    "use strict";

    var app = angular.module('skygazr.map', ['ngRoute', 'firebase.utils', 'firebase']);

    app.controller('MapCtrl', ['$scope', 'NgMap', function($scope, NgMap) {
        // Resize the map to take up the whole screen
        NgMap.getMap("map").then(function(map) {
            document.getElementById("map").setAttribute("style", "height: 100%");
            google.maps.event.trigger(map, 'resize');
        }).catch(function(error) {
            console.log(error);
        })
    }]);

    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/map', {
            templateUrl: 'map/map.html',
            controller: 'MapCtrl',
            css: 'map/map.css'
        });
    }]);

})(angular);