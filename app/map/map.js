/**
 * Created by Ben on 5/3/16.
 */

(function (angular) {
    "use strict";

    var app = angular.module('skygazr.map', ['ui.router', 'firebase.utils', 'firebase']);

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
            });
    }]);

    app.service('PinsService', function(fbutil, $firebaseArray) {
        var pins = null;

        function getPinsForUser(userId) {
            if (!pins) {
                var ref = fbutil.ref('pins/' + userId);
                pins =  $firebaseArray(ref);
            }
            return pins;
        }
        
        function reset() {
            if (pins) {
                pins.$destroy();
                pins = null;
            }
        }
        
        return {
            getPinsForUser: getPinsForUser,
            reset: reset
        };
    });

    app.controller('MapCtrl', function($scope, $state, user, PinsService, NgMap) {
        var markers = [];

        $scope.loggedIn = !!user;
        
        if ($scope.loggedIn) {
            console.log("Logged in: showing pins");

            $scope.pins = PinsService.getPinsForUser(user.uid);

            // Don't do nothin' until the map is loaded
            NgMap.getMap("map").then(function(map) {
                // Resize the map to take up the whole screen
                document.getElementById("map").setAttribute("style", "height: 100%");
                google.maps.event.trigger(map, 'resize');
                
                var clickListener = google.maps.event.addListener(map, 'click', function(event) {
                    createPin(map, event.latLng);
                });

                // Load the user's saved pins and display them on the map
                $scope.pins.$loaded().then(function(pins) {
                    console.log("pins:", pins);
                    for (var i = 0; i < pins.length; i++) {
                        var pin = pins[i];
                        placeMarker(map, new google.maps.LatLng(
                            pin.location.latitude,
                            pin.location.longitude
                        ));
                    }
                });

                // Destroy all the pins when this controller loses scope
                $scope.$on("$destroy", function() {
                    google.maps.event.removeListener(clickListener);
                    removeAllMarkers();
                });
            }).catch(function(error) {
                console.log(error);
            });
        } else {
            console.log("Not logged in: no pins to show");
        }

        function createPin(map, location) {
            var newPin = {
                "name": "pin",
                "color": "#000",
                "location": {
                    "latitude": location.lat(),
                    "longitude": location.lng()
                },
                "notes": ""
            };
            $scope.pins.$add(newPin);

            placeMarker(map, location);
        }

        function placeMarker(map, location) {
            var marker = new google.maps.Marker({
                position: location,
                map: map
            });

            markers.push(marker);
        }

        function removeAllMarkers() {
            for (var i in markers) {
                if (markers.hasOwnProperty(i)) {
                    var currentMarker = markers[i];
                    currentMarker.setMap(null);
                }
            }
        }
    });

})(angular);