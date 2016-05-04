/**
 * Created by Ben on 5/4/16.
 *
 * Adapted from angularfire-seed: https://github.com/firebase/angularfire-seed
 * Copyright (c) 2010-2014 Google, Inc. http://angularjs.org
 */

angular.module('firebase.auth', ['firebase', 'firebase.utils'])
    .factory('Auth', ['$firebaseAuth', 'fbutil', function($firebaseAuth, fbutil) {
        return $firebaseAuth(fbutil.ref());
    }]);
