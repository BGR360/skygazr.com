/**
 * Created by Ben on 5/4/16.
 *
 * Adapted from angularfire-seed: https://github.com/firebase/angularfire-seed
 * Copyright (c) 2010-2014 Google, Inc. http://angularjs.org
 */

(function(angular) {
    "use strict";

    var app = angular.module('skygazr.home', ['firebase.auth', 'firebase', 'firebase.utils', 'ui.router']);

    app.controller('HomeCtrl', ['$scope', 'fbutil', 'user', '$firebaseObject', 'FBURL', function ($scope, fbutil, user, $firebaseObject, FBURL) {
        $scope.user = user;
    }]);

    app.config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'home/home.html',
                controller: 'HomeCtrl',
                resolve: {
                    // forces the page to wait for this promise to resolve before controller is loaded
                    // the controller can then inject `user` as a dependency. This could also be done
                    // in the controller, but this makes things cleaner (controller doesn't need to worry
                    // about auth status or timing of accessing data or displaying elements)
                    user: ['Auth', function (Auth) {
                        return Auth.$waitForAuth();
                    }]
                },
                css: 'home/home.css'
            });
    }]);

})(angular);
