'use strict';
//CHALLENGES
//edit, delete, delete all workouts from the users interface
//sort workouts by fields
//rebuild - local storage objects
//build realistic error and confirmation message

//ability to position the map and show all workouts [very hard]
//Draw lines and shapes instead of makers
//geocode takes in a description 
//display weather data for workout time and place 


class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); //gives a unique number 
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; // [lat, lng] any array for each markers geolocation 
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    // ^ tells prettier to ignore the next line
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //instantiate object parent variables coords, distance, durations, date, id, and clicks
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(); //this is where 'type' is defined, so this method call must be here
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

///////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = []; // for array of objects 

  constructor() {
    // Get user's position when the page renders
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this)); //this first this refers to form, the second this refers to app (current object)
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) // Window Navigator object
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //first this refers to the getCurrentPosition function, second this is referring to navigator geolocation object
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    //position is referred to as geolocationPosition object from the navigator object 
    //console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); 
    // L = namespace variable from leaflet library 
    // second map is a method from leaflet library as well 
    //this variable gives the page a map for the user to see

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //This method must be called here because we need the map to be render first. 
    //If workouts is empty then this wont execute 
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) { //mapE is a property of the app instance 
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';

    form.style.display = 'none';
    form.classList.add('hidden'); // has animation of sliding when added, so we set display to none first to not show this effect that lasts one second
    setTimeout(() => (form.style.display = 'grid'), 1000); //set display back to grid after one second. So its there but hidden with no effect transitions
  }

  _toggleElevationField() {
    //event listener on select fields from form. By default running is viewable and cycling is hidden until user makes a selection
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    //es6 arrow function expression, using distance, duration, cadence variables 
    const validInputs = (...inputs) => //rest ... creates an array and every() returns true if each iteration is true, if one is false then returns false
      inputs.every(inp => Number.isFinite(inp));
      

      //Check if numbers are positive
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    // + is for string to number conversions 
    const type = inputType.value; //select element
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng; //current geolocation 

    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) || //Two helper functions
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

        //One app object and one to many workout objects 
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      
      //Guard clause - means checking if the opposite is true and we return immediately
      if ( //using helper arrow function above
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation); //passing an array of coordinates and other variables
    }

    //newWorkout method does delegation  - creates objects and then delegate functionality to other methods(below)

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords) //tells leaflet where to place this marker
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`, 
          //.type is a property for all workout instances. from running or cycling child classes
          //either use the running-popup or cycling-popup css selector
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}` //marker image + description
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // li start
    //data-id: attribute builds a bridge between the user interface and the data we have in the application
    //"workout workout--${workout.type}" determines the green or orange bolder
    // Speed and pace are created properties from class methods of running and cycling.
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}"> 
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    //li end
    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span> 
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html); //each new insertion will appear after the form element
  }

  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    //e is the event property from app and the target is app, and closet selects the closet parent element with selected class name
    //selects the closet workout element but li's only appear when an workout is created by the user else returns null 
    const workoutEl = e.target.closest('.workout'); 

    //guard clause
    if (!workoutEl) return;

    //.dataset set is how you access a elements data attributes and data-id targets the specific data attributes.
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    //setView - leaflet library method
    this.#map.setView(workout.coords, this.#mapZoomLevel, { //controls users map POV
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  _setLocalStorage() {
    //localStorage is a API from the browser that we can use, should use small amount of data.
    //localStorage a simple key:value store, both must be strings. A map or you can say array of dictionaries
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    //In other words store this key value pair to the localStorage in json string format
    //check -> go to url> webTools > applications tab > local storage
  }

  _getLocalStorage() {
    /**
     * JSON. parse() is used for parsing data that was received as JSON; it deserializes a JSON string into a JavaScript object.
     * JSON. stringify() on the other hand is used to create a JSON string out of an object or array; it serializes a JavaScript object into a JSON string.
     */

    const data = JSON.parse(localStorage.getItem('workouts')); //pull from user localStorage API (array of dictionaries)
    //objects that were return lost their prototype chain and no longer an object of the running or cycling class. Therefore can't inherit any of their methods. 
    //only have basic methods that any object will have. fix by restoring objects in a for loop
    console.log(data);

    if (!data) return;
    
    //if user had workouts in localStorage then this the first time the #workouts property is used.
    //new workouts will be appended to this list by the user 
    this.#workouts = data; 

    this.#workouts.forEach(work => {
      //populate workout objects to the list (HTML)
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();//reloads page 
    //console -> app.reset()
  }
}

//App instance 
const app = new App();