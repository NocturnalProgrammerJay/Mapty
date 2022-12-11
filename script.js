'use strict'

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')

//Takes two callback functions. First is when the browser successfully gotten the coordinates of the user. Second callback captures the error
if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(function(position){
        const {latitude} = position.coords 
        const {longitude} = position.coords 
        console.log(`https://www.google.com/maps/@${latitude},${longitude},10z`)
        const coords = [latitude, longitude]


        //L = namespace for leafletjs library (global variables to access scripts)
        const map = L.map('map').setView(coords, 13)  // second value is the zoom //for map div in html

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { // the map is a bunch of small tiles from openstreammap URL which is a open source
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)


        map.on('click', function(mapEvent){ //mapEvent = event = e
            const {lat, lng} = mapEvent.latlng
            console.log(mapEvent)

            // marker creates marker, addTo adds marker to map, bindpopup is the string, 
            L.marker([lat, lng])
            .addTo(map) 
            .bindPopup(L.popup({maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: 'running-popup'})).setPopupContent('Workout')
            .openPopup()
        })// leaflet mehtod

    }, function(){
        alert("Could not get your position")
    }) 

    //CDN = content delivery network
    //git note 