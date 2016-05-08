/**
 * Created by Ben on 5/4/16.
 *
 * Adapted from angularfire-seed: https://github.com/firebase/angularfire-seed
 * Copyright (c) 2010-2014 Google, Inc. http://angularjs.org
 */

(function (angular) {
    "use strict";

    var app = angular.module('skygazr.account', ['firebase', 'firebase.utils', 'firebase.auth', 'ui.router']);

    app.config(['$stateProvider', function($stateProvider) {
        // require user to be authenticated before they can access this page
        // this is handled by the .whenAuthenticated method declared in
        // components/router/router.js
        $stateProvider
            .whenAuthenticated('account', {
                url: '/account',
                templateUrl: 'account/account.html',
                controller: 'AccountCtrl',
                css: 'account/account.css'
            });
    }]);

    app.controller('AccountCtrl', function($scope, $state, $timeout, Auth, fbutil, user, $firebaseObject, PinsService) {
        var unbind;
        // create a 3-way binding with the user profile object in Firebase
        var profile = $firebaseObject(fbutil.ref('users', user.uid));
        profile.$bindTo($scope, 'profile').then(function(ub) { unbind = ub; });

        // expose logout function to scope
        $scope.logout = function() {
            if( unbind ) { unbind(); }
            profile.$destroy();
            Auth.$unauth();
            PinsService.reset();
            
            // Hacky because there were issues with the home page
            $timeout(function() {
                $state.go('home.login');
            }, 1000);
        };

        $scope.changePassword = function(pass, confirm, newPass) {
            resetMessages();
            if( !pass || !confirm || !newPass ) {
                $scope.err = 'Please fill in all password fields';
            }
            else if( newPass !== confirm ) {
                $scope.err = 'New pass and confirm do not match';
            }
            else {
                Auth.$changePassword({email: profile.email, oldPassword: pass, newPassword: newPass})
                    .then(function() {
                        $scope.msg = 'Password changed';
                    }, function(err) {
                        $scope.err = err;
                    })
            }
        };

        $scope.clear = resetMessages;

        $scope.changeEmail = function(pass, newEmail) {
            resetMessages();
            var oldEmail = profile.email;
            Auth.$changeEmail({oldEmail: oldEmail, newEmail: newEmail, password: pass})
                .then(function() {
                    // store the new email address in the user's profile
                    return fbutil.handler(function(done) {
                        fbutil.ref('users', user.uid, 'email').set(newEmail, done);
                    });
                })
                .then(function() {
                    $scope.emailmsg = 'Email changed';
                }, function(err) {
                    $scope.emailerr = err;
                });
        };

        function resetMessages() {
            $scope.err = null;
            $scope.msg = null;
            $scope.emailerr = null;
            $scope.emailmsg = null;
        }
    });

})(angular);
