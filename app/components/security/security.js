/**
 * Created by Ben on 5/4/16.
 * 
 * Adapted from angularfire-seed: https://github.com/firebase/angularfire-seed
 * Copyright (c) 2010-2014 Google, Inc. http://angularjs.org
 */

(function (angular) {
    "use strict";

    // when $routeProvider.whenAuthenticated() is called, the path is stored in this list
    // to be used by authRequired() in the services below
    var securedRoutes = [];

    angular.module('skygazr.security', ['ui.router', 'firebase.auth', 'skygazr.config'])

        .config(['$stateProvider', function ($routeProvider) {
            // routes which are not in our map are redirected to /home
            //$stateProvider.otherwise({redirectTo: '/home'});
        }])

        /**
         * Adds a special `whenAuthenticated` method onto $routeProvider. This special method,
         * when called, waits for auth status to be resolved asynchronously, and then fails/redirects
         * if the user is not properly authenticated.
         *
         * The promise either resolves to the authenticated user object and makes it available to
         * dependency injection (see AuthCtrl), or rejects the promise if user is not logged in,
         * forcing a redirect to the /login page
         */
        .config(['$stateProvider', function ($stateProvider) {
            // credits for this idea: https://groups.google.com/forum/#!msg/angular/dPr9BpIZID0/MgWVluo_Tg8J
            // unfortunately, a decorator cannot be use here because they are not applied until after
            // the .config calls resolve, so they can't be used during route configuration, so we have
            // to hack it directly onto the $stateProvider object
            $stateProvider.whenAuthenticated = function (path, route) {
                securedRoutes.push(path); // store all secured routes for use with authRequired() below
                route.resolve = route.resolve || {};
                route.resolve.user = ['Auth', function (Auth) {
                    return Auth.$requireAuth();
                }];
                $stateProvider.state(path, route);
                return this;
            }
        }])

        /**
         * Apply some route security. Any route's resolve method can reject the promise with
         * { authRequired: true } to force a redirect. This method enforces that and also watches
         * for changes in auth status which might require us to navigate away from a path
         * that we can no longer view.
         */
        .run(['$rootScope', '$location', 'Auth', 'loginRedirectPath',
            function ($rootScope, $location, Auth, loginRedirectPath) {
                // watch for login status changes and redirect if appropriate
                Auth.$onAuth(check);

                // some of our routes may reject resolve promises with the special {authRequired: true} error
                // this redirects to the login page whenever that is encountered
                $rootScope.$on("$routeChangeError", function (e, next, prev, err) {
                    if (err === "AUTH_REQUIRED") {
                        $location.path(loginRedirectPath);
                    }
                });

                function check(user) {
                    if (!user && authRequired($location.path())) {
                        console.log('check failed', user, $location.path()); //debug
                        $location.path(loginRedirectPath);
                    }
                }

                function authRequired(path) {
                    console.log('authRequired?', path, securedRoutes.indexOf(path)); //debug
                    return securedRoutes.indexOf(path) !== -1;
                }
            }
        ]);

})(angular);
