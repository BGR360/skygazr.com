/**
 * Created by Ben on 5/3/16.
 */

var napervilleLatLng = {lat: 41.720927, lng: -88.151684};

// Initializing Google Maps API
function initMap() {
    var map = new google.maps.Map(document.getElementById("map"), {
        center: napervilleLatLng,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.HYBRID
    });
}