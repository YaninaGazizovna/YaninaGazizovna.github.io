import Observable from '../framework/observable.js';
import { UpdateType } from '../data.js';

export default class PointModel extends Observable {
  #pointApiService = null;

  #points = [];
  #destinations = [];
  #offers = [];

  constructor(pointApiService) {
    super();
    this.#pointApiService = pointApiService;
  }

  get points (){
    return this.#points;
  }

  get destinations (){
    return this.#destinations;
  }

  get offers (){
    return this.#offers;
  }

  init = async () => {
    try {
      const points = await this.#pointApiService.points;
      this.#destinations = await this.#pointApiService.destinations;
      this.#offers = await this.#pointApiService.offers;
      this.#points = points.map(this.#adaptToClient);

      this.#points = points.map(this.#adaptToClient).map((point) => this.#additionPoint(point));
    } catch(err) {
      this.#points = [];
    }

    this._notify(UpdateType.INIT);
  };

  updatePoint = async(updateType, update) => {
    const index = this.points.findIndex((point) => point.id === update.id);

    if (index === -1) {
      throw new Error ('Can\'t update unexisting point');
    }

    try {
      const response = await this.#pointApiService.updatePoint(update);
      const updatedPoint = this.#additionPoint(this.#adaptToClient(response));

      this.#points = [
        ...this.#points.slice(0, index),
        updatedPoint,
        ...this.#points.slice(index + 1),
      ];

      this._notify(updateType, updatedPoint);
    }
    catch(err) {
      throw new Error('Can\'t update point');
    }
  };

  addPoint = async (updateType, update) => {
    try {
      const response = await this.#pointApiService.addPoint(update);
      const newPoint = this.#additionPoint(this.#adaptToClient(response));

      this.#points = [newPoint, ...this.#points];

      this._notify(updateType, newPoint);
    }
    catch(err) {
      throw new Error('Can\'t add point');
    }
  };

  deletePoint = async (updateType, update) => {
    const index = this.#points.findIndex((point) => point.id === update.id);

    if (index === -1) {
      throw new Error('Can\'t delete unexisting point');
    }

    try {
      await this.#pointApiService.deletePoint(update);
      this.#points = [
        ...this.#points.slice(0, index),
        ...this.#points.slice(index + 1),
      ];
      this._notify(updateType);
    }
    catch(err) {
      throw new Error('Can\'t delete point');
    }
  };

  #adaptToClient = (point) => {
    const adaptedPoint = {...point,
      dateTo: point['date_to'],
      basePrice: point['base_price'],
      dateFrom: point['date_from'],
      isFavorite: point['is_favorite'],
    };

    delete adaptedPoint['date_to'];
    delete adaptedPoint['base_price'];
    delete adaptedPoint['date_from'];
    delete adaptedPoint['is_favorite'];

    return adaptedPoint;
  };

  #additionPoint(point) {
    const {
      destination:destinationIdNumber,
      offers:offerIdNumber,
    } = point;

    const destination = this.destinations.find(((el) => el.id === destinationIdNumber));
    const offerByType = this.offers.find(({type}) => type === point.type);
    const offers = offerByType.offers.filter(({id}) => offerIdNumber.includes(id));

    return {
      ...point,
      destination,
      offers,
    };
  }
}
