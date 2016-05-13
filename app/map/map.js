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
                abstract: true,
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
            .state('map.pinsList', {
                url: '/pins',
                templateUrl: 'map/map.pinsList.html',
                css: 'map/map.css'
            })
            .state('map.editPin', {
                url: '/pins/:pinId',
                templateUrl: 'map/map.editPin.html',
                controller: 'MapPinEditCtrl',
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

        $scope.markers = [];
        $scope.hasOpenedPinMenu = false;

        resizeMap();

        $scope.showPinMenu = function(force) {
            $('#pinsMenu').show();
            if (force) {
                $scope.hasOpenedPinMenu = true;
            }
        };

        $scope.hidePinMenu = function(force) {
            if (!$scope.hasOpenedPinMenu || force) {
                $('#pinsMenu').hide();
                $scope.hasOpenedPinMenu = false;
            }
        };

        // Hide the pins menu if device screen is too small
        (function($, viewport){
            viewport.use('bootstrap4');

            // Execute code when page loads and each time window size changes
            $(document).ready(function() {
                showOrHidePinsMenu();
                $(window).resize(
                    viewport.changed(showOrHidePinsMenu, 50)
                );
            });

            function showOrHidePinsMenu() {
                if ( viewport.is('>=md') ) {
                    $scope.showPinMenu();
                } else if ( viewport.is('<md') ) {
                    $scope.hidePinMenu();
                }
            }
        })(jQuery, ResponsiveBootstrapToolkit);

        $scope.loggedIn = !!user;
        
        if ($scope.loggedIn) {
            console.log("Logged in: showing pins");

            $scope.pins = PinsService.getPinsForUser(user.uid);

            // Don't do nothin' until the map is loaded
            NgMap.getMap("map").then(function(map) {
                var clickListener = google.maps.event.addListener(map, 'click', function(event) {
                    createPin(map, event.latLng);
                });

                // Load the user's saved pins and display them on the map
                $scope.pins.$loaded().then(function(pins) {
                    console.log("pins:", pins);
                    for (var i = 0; i < pins.length; i++) {
                        var pin = pins[i];
                        var latlng = new google.maps.LatLng(
                            pin.location.latitude,
                            pin.location.longitude
                        );
                        placeMarker(map, latlng, pins.$keyAt(i));
                    }
                });

                // Watch the array of pins for child_removed events
                $scope.pins.$watch(function(event) {
                    if (event.event == "child_removed") {
                        //removeMarkerForPin(event.key);
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

        function resizeMap() {
            NgMap.getMap("map").then(function(map) {
                // Resize the map to take up the whole screen
                document.getElementById("map").setAttribute("style", "height: 100%; width: 100%");
                google.maps.event.trigger(map, 'resize');
            });
        }

        function createPin(map, location) {
            var newPin = {
                "name": "New Pin",
                "color": "#000",
                "location": {
                    "latitude": location.lat(),
                    "longitude": location.lng()
                },
                "notes": ""
            };
            $scope.pins.$add(newPin).then(function(ref) {
                placeMarker(map, location, ref.key());
            });
        }

        function placeMarker(map, location, pinId) {
            var marker = new google.maps.Marker({
                position: location,
                map: map,
                draggable: true,
                animation: google.maps.Animation.DROP
            });

            marker.pinId = pinId;
            marker.addListener('dragend', function() {
                var pin = $scope.pins.$getRecord(pinId);
                pin.location = {
                    latitude: marker.getPosition().lat(),
                    longitude: marker.getPosition().lng()
                };
                $scope.pins.$save(pin).catch(function(error) {
                    console.log(error);
                });
            });
            marker.addListener('click', function() {
                $state.go('map.editPin', {pinId: pinId});
            });

            $scope.markers.push(marker);
        }

        function removeAllMarkers() {
            var markers = $scope.markers;
            for (var i in markers) {
                if (markers.hasOwnProperty(i)) {
                    var currentMarker = markers[i];
                    currentMarker.setMap(null);
                    markers[i] = null;
                }
            }
            markers = [];
        }
    });

    app.controller('MapPinEditCtrl', function($scope, $state, $stateParams) {
        $scope.pin = $scope.pins.$getRecord($stateParams.pinId);
        $scope.showPinMenu(true);

        $scope.removePin = function(pin) {
            removeMarkerForPin(pin);
            $scope.pins.$remove(pin).then(function(ref) {
                removeMarkerForPin(ref.key());
                $state.go('map.pinsList');
            }).catch(function(error) {
                console.log(error);
            });
        };
        
        $scope.goBack = function() {
            $state.go('map.pinsList');
        };

        $scope.$on('$destroy', function() {
            $scope.pins.$save($scope.pin);
        });

        function removeMarkerForPin(pinId) {
            var markers = $scope.markers;
            for (var i in markers) {
                if (markers.hasOwnProperty(i)) {
                    var marker = markers[i];
                    if (marker.pinId == pinId) {
                        marker.setMap(null);
                        markers[i] = null;
                        markers.splice(i, 1);
                        break;
                    }
                }
            }
        }
    });

})(angular);