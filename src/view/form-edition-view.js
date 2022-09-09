import AbstractStatefulView from '../framework/view/abstract-stateful-view';
import {
  EVENT_TYPE,
  DESTINATION_NAME,
} from '../fish/data.js';
import {
  destinations,
  offer,
} from '../fish/point.js';
import {
  humanizeDate,
} from '../util.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/themes/confetti.css';


const createTypeEditTemplate = (currentType) => EVENT_TYPE.map((type) =>
  `<div class="event__type-item">
   <input id="event-type-${ type }" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${type}" ${ currentType === 'checked' }>
   <label class="event__type-label  event__type-label--${ type }" for="event-type-${ type }">${ type }</label>
   </div>`).join('');

const editDestinationNamesListTemplate = () => (
  DESTINATION_NAME.map((name) =>
    `<option value="${ name }"></option>`));

const EditionFormElementTemplate = (points) => {
  const {
    basePrice,
    dateFrom,
    dateTo,
    type,
    destination,
    offers,
    destinationNameTemplate = destinations.find((el) => (el.id === destination)).name,
  } = points;

  const typeEditTemplate = createTypeEditTemplate(type);
  const destinationNameListTemplate = editDestinationNamesListTemplate(destination);
  const descriptionTemplate = destinations.map((el) => {
    if (destinationNameTemplate === null || destinationNameTemplate !== el.name){
      return null;
    }
    if (el.name === destinationNameTemplate){
      return el.description;
    }
  }).join('');

  const picturesTemplate = destinations.map((el) => {
    if (destinationNameTemplate === null || destinationNameTemplate !== el.name){
      return null;
    }

    if(el.name === destinationNameTemplate){
      return el.pictures[0].src.map((picture) =>`<img class="event__photo" src= "${ picture }" alt="${ el.pictures[0].description }">`);
    }
  }).join('');

  const pointOfferType = offer.filter((el) => (el.type === type));

  const PointOfferTemplate = pointOfferType.map((el) => {
    const checked = (offers === el.id) ? 'checked' : '';

    return ` <div class="event__offer-selector">
              <input class="event__offer-checkbox visually-hidden" id="event-offer-${ el.title }" type="checkbox" ${ checked } name="event-offer-${ el.title }">
              <label class="event__offer-label" for="event-offer-${ el.title }">
              <span class="event__offer-title"> ${ el.title } </span>
              &plus;&euro;&nbsp;
              <span class="event__offer-price"> ${ el.price } </span>
              </div>`;
  });

  return `<li class="trip-events__item">
              <form class="event event--edit" action="#" method="post">
                <header class="event__header">
                  <div class="event__type-wrapper">
                    <label class="event__type  event__type-btn" for="event-type-toggle-1">
                      <span class="visually-hidden">Choose event type</span>
                      <img class="event__type-icon" width="17" height="17" src="img/icons/${ type }.png" alt="Event type icon">
                    </label>
                    <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox">

                    <div class="event__type-list">
                      <fieldset class="event__type-group">
                        <legend class="visually-hidden">Event type</legend>

                        ${ typeEditTemplate }

                      </fieldset>
                    </div>
                  </div>

                  <div class="event__field-group  event__field-group--destination">
                    <label class="event__label  event__type-output" for="event-destination-1">
                    ${ type }
                    </label>
                    <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${ destinationNameTemplate }" list="destination-list-1" >
                    <datalist id="destination-list-1">

                    ${ destinationNameListTemplate}

                    </datalist>
                  </div>

                  <div class="event__field-group  event__field-group--time">
                    <label class="visually-hidden" for="event-start-time-1">From</label>
                    <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${ humanizeDate(dateFrom) }">
                    &mdash;
                    <label class="visually-hidden" for="event-end-time-1">To</label>
                    <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${ humanizeDate(dateTo) }">
                  </div>

                  <div class="event__field-group  event__field-group--price">
                    <label class="event__label" for="event-price-1">
                      <span class="visually-hidden">Price</span>
                      &euro;
                    </label>
                    <input class="event__input  event__input--price" id="event-price-1" type="text" name="event-price" value="${ basePrice }">
                  </div>

                  <button class="event__save-btn  btn  btn--blue" type="submit">Save</button>
                  <button class="event__reset-btn" type="reset">Delete</button>
                  <button class="event__rollup-btn" type="button">
                    <span class="visually-hidden">Open event</span>
                  </button>
                </header>
                <section class="event__details">
                  <section class="event__section  event__section--offers">
                    <h3 class="event__section-title  event__section-title--offers">Offers</h3>

                    <div class="event__available-offers">
                    ${ PointOfferTemplate }

                      </div>
                    </div>
                  </section>

                  <section class="event__section  event__section--destination">
                    <h3 class="event__section-title  event__section-title--destination">Destination</h3>
                    <p class="event__destination-description">${ descriptionTemplate }</p>
                    <div class="event__photos-container">
    <div class="event__photos-tape">

      ${ picturesTemplate }

      </div>
        </div>
                  </section>
                </section>
              </form>
            </li>`;
};

export default class FormEditionView extends AbstractStatefulView {
  #datepicker = null;

  constructor(point) {
    super();
    this._state = FormEditionView.parsePointToState(point);

    this.#setInnerHandlers();
  }

  get template() {
    return EditionFormElementTemplate(this._state);
  }

  setFormSaveHandler = (callback) => {
    this._callback.formSave = callback;
    this.element.querySelector('form').addEventListener('submit', this.#formSaveHandler);
  };

  #formSaveHandler = (evt) => {
    evt.preventDefault();
    this._callback.formSave(FormEditionView.parseStateToPoint(this._state));
  };

  setDeleteClickHandler = (callback) => {
    this._callback.deleteClick = callback;
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#formDeleteClickHandler);
  };

  #formDeleteClickHandler = (evt) => {
    evt.preventDefault();
    this._callback.deleteClick(FormEditionView.parseStateToPoint(this._state));
  };

  setRollupEditHandler = (callback) => {
    this._callback.rollupEdit = callback;
    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#rollupEditHandler);
  };

  #rollupEditHandler = (evt) => {
    evt.preventDefault();
    this._callback.rollupEdit(FormEditionView.parsePointToState(this._state));
  };

  _restoreHandlers = () => {
    this.#setInnerHandlers();
    this.setFormSaveHandler(this._callback.formSave);
    this.setDeleteClickHandler(this._callback.deleteClick);
    this.setRollupEditHandler(this._callback.rollupEdit);
    this.#setDatepicker();
  };

  #typeToggleHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      type: evt.target.value,
    });
  };

  #destinationToggleHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      destinationNameTemplate: evt.target.value,
    });
  };

  #setInnerHandlers = () => {
    this.element.querySelectorAll('.event__type-input').forEach((i) =>
      i.addEventListener('click', this.#typeToggleHandler));
    this.#setDatepicker();

    this.element.querySelector('.event__input--destination').addEventListener('change', this.#destinationToggleHandler);
  };

  #datesChangeHandler = ([userDateFrom,userDateTo]) => {
    this.updateElement({
      dateFrom: userDateFrom,
      dateTo:userDateTo
    });
  };

  #setDatepicker = () => {
    this.#datepicker = flatpickr(
      this.element.querySelectorAll('.event__input--time'),
      {
        enableTime: true,
        mode: 'range',
        minDate: 'today',
        dateFormat: 'j/m/y / h:i',
        onChange: this.#datesChangeHandler,
      },
    );
  };

  reset = (point) => {
    this.updateElement(
      FormEditionView.parsePointToState(point)
    );
  };

  static parsePointToState = (point) => ({
    ...point
  });

  static parseStateToPoint = (state) => {
    const point = {
      ...state
    };

    return point;
  };
}
