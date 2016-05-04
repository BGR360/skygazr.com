// Adapted from angularfire-seed: https://github.com/firebase/angularfire-seed
// Copyright (c) 2010-2014 Google, Inc. http://angularjs.org

'use strict';

var app = angular.module('skygazr', ['routeStyles', 'ngMap',
    'skygazr.config',
    'skygazr.security',
    'skygazr.home',
    'skygazr.map'
])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({
            redirectTo: '/home'
        });
    }])

    .run(['$rootScope', 'Auth', function($rootScope, Auth) {
        // track status of authentication
        Auth.$onAuth(function(user) {
            $rootScope.loggedIn = !!user;
        });
    }]);