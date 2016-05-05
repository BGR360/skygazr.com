/**
 * Created by Ben on 5/4/16.
 *
 * Adapted from angularfire-seed: https://github.com/firebase/angularfire-seed
 * Copyright (c) 2010-2014 Google, Inc. http://angularjs.org
 */

(function(angular) {
    "use strict";

    var app = angular.module('skygazr.home', ['firebase.auth', 'firebase', 'firebase.utils', 'ui.router']);

    app.config(function ($stateProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'home/home.html',
                controller: ['$scope', '$state',
                    function($scope, $state) {
                        $state.go('home.splash');
                    }],
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
            })
            .state('home.splash', {
                url: '/splash',
                templateUrl: 'home/home.splash.html',
                controller: 'HomeCtrl',
                css: 'home/home.css'
            })
            .state('home.login', {
                url: '/login',
                templateUrl: 'home/home.login.html',
                controller: 'HomeLoginCtrl',
                css: 'home/home.css'
            });
    });

    app.controller('HomeCtrl', function ($scope, $rootScope) {
        $scope.loggedIn = $rootScope.loggedIn;
        console.log("Home Page. Logged in:", $scope.loggedIn);
    });

    app.controller('HomeLoginCtrl', function($scope, $state, Auth, fbutil) {
        $scope.email = null;
        $scope.password = null;
        $scope.confirm = null;
        $scope.createMode = false;
        
        $scope.clearErr = function() {
            $scope.err = null;
        };

        $scope.cancelLogin = function() {
            $state.go('home.splash');
        };

        $scope.login = function (email, pass, rememberMe) {
            console.log("Login:", email, pass, rememberMe);
            $scope.err = null;
            Auth.$authWithPassword({email: email, password: pass}, {rememberMe: rememberMe})
                .then(function (/* user */) {
                    $state.go('map');
                }, function (err) {
                    $scope.err = errMessage(err);
                });
        };

        $scope.createAccount = function () {

            $scope.err = null;
            if (assertValidAccountProps()) {
                var email = $scope.email;
                var pass = $scope.password;
                // create user credentials in Firebase auth system
                Auth.$createUser({email: email, password: pass})
                    .then(function () {
                        // authenticate so we have permission to write to Firebase
                        return Auth.$authWithPassword({email: email, password: pass});
                    })
                    .then(function (user) {
                        // create a user profile in our data store
                        var ref = fbutil.ref('users', user.uid);
                        return fbutil.handler(function (cb) {
                            ref.set({email: email, name: name || firstPartOfEmail(email)}, cb);
                        });
                    })
                    .then(function (/* user */) {
                        // redirect to the account page
                        $state.go('account');
                    }, function (err) {
                        $scope.err = errMessage(err);
                    });
            }
        };

        function assertValidAccountProps() {
            if (!$scope.email) {
                $scope.err = 'Please enter an email address';
            }
            else if (!$scope.password || !$scope.confirm) {
                $scope.err = 'Please enter a password';
            }
            else if ($scope.createMode && $scope.password !== $scope.confirm) {
                $scope.err = 'Passwords do not match';
            }
            return !$scope.err;
        }

        function errMessage(err) {
            return angular.isObject(err) && err.code ? err.code : err + '';
        }

        function firstPartOfEmail(email) {
            return ucfirst(email.substr(0, email.indexOf('@')) || '');
        }

        function ucfirst(str) {
            // inspired by: http://kevin.vanzonneveld.net
            str += '';
            var f = str.charAt(0).toUpperCase();
            return f + str.substr(1);
        }
    });

})(angular);
