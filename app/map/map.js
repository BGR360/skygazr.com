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
        resizeMap();

        $scope.showPinMenu = function() {
            $('#pinsMenu').show();
        };

        $scope.hidePinMenu = function() {
            $('#pinsMenu').hide();
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

                // Destroy all the pins when this controller loses scope
                $scope.$on("$destroy", function() {
                    google.maps.event.removeListener(clickListener);
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
                "name": "pin",
                "color": "#000",
                "location": {
                    "latitude": location.lat(),
                    "longitude": location.lng()
                },
                "notes": ""
            };
            $scope.pins.$add(newPin);
        }
    });

    app.controller('MapPinEditCtrl', function($scope, $stateParams, user, PinsService) {
        var pins = PinsService.getPinsForUser(user.uid);
        $scope.pin = pins.$getRecord($stateParams.pinId);

        $scope.$on('$destroy', function() {
            $scope.pins.$save($stateParams.pinId);
        });
    });

})(angular);