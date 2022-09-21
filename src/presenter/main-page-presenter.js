import { render, RenderPosition,remove } from '../framework/render.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import MainPageView from '../view/main-page-view.js';
import MessageView from '../view/message-view.js';
import LoadingView from '../view/loading-view.js';
import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';
import SortView from '../view/sort-view.js';
import { sortByPointPrice, sortByPointDuration, sortByPointDate } from '../util.js';
import { SortType, UserAction, UpdateType, FilterType } from '../fish/data.js';
import { filter } from '../fish/filter.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

export default class MainPagePresenter {

  #mainPageComponents = new MainPageView();
  #loadingComponent = new LoadingView();
  #messageComponent = null;
  #pointModel = null;
  #pageContainer = null;
  #filterModel = null;

  #pointPresenter = new Map();
  #newPointPresenter = null;
  #isLoading = true;
  #uiBlocker = new UiBlocker(TimeLimit.LOWER_LIMIT, TimeLimit.UPPER_LIMIT);

  #sortComponent = null;
  #currentSortType = SortType.DAY;
  #filterType = FilterType.EVERYTHING;

  constructor (pageContainer, pointModel, filterModel){
    this.#pageContainer = pageContainer;
    this.#pointModel = pointModel;
    this.#filterModel = filterModel;

    this.#newPointPresenter = new NewPointPresenter(this.#mainPageComponents.element, this.#handleViewAction,this.#pointModel);

    this.#pointModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get points (){
    this.#filterType = this.#filterModel.filter;
    const points = this.#pointModel.points;
    const filteredPoints = filter[this.#filterType](points);

    switch (this.#currentSortType){
      case SortType.PRICE:
        return filteredPoints.sort(sortByPointPrice);

      case SortType.TIME:
        return filteredPoints.sort(sortByPointDuration);

      case SortType.DAY:
        return filteredPoints.sort(sortByPointDate);
    }

    return filteredPoints;
  }

  get destinations (){
    const destinations = this.#pointModel.destinations;
    return destinations;
  }

  init = () => {
    this.#renderPage();
  };

  createPoint = (callback) => {
    this.#currentSortType = SortType.DAY;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.#newPointPresenter.init(callback);
  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenter.get(data.id).init(data);
        break;

      case UpdateType.MINOR:
        this.#clearPage();
        this.#renderPage();
        break;

      case UpdateType.MAJOR:
        this.#clearPage({resetSortType: true});
        this.#renderPage();
        break;

      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderPage();
        break;
    }
  };

  #handleViewAction = (actionType, updateType, update) => {
    this.#uiBlocker.block();
    switch (actionType){
      case UserAction.UPDATE_POINT:
        this.#pointPresenter.get(update.id).setSaving();
        this.#pointModel.updatePoint(updateType, update);
        break;

      case UserAction.ADD_POINT:
        this.#newPointPresenter.setSaving();
        this.#pointModel.addPoint(updateType, update);
        break;

      case UserAction.DELETE_POINT:
        this.#pointPresenter.get(update.id).setDeleting();
        this.#pointModel.deletePoint(updateType, update);
        break;
    }
    this.#uiBlocker.unblock();
  };

  #handleModeChange = () => {
    this.#newPointPresenter.destroy();
    this.#pointPresenter.forEach((presenter) => presenter.resetView());
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearPage();
    this.#renderPage();
  };

  #renderLoading = () => {
    render(this.#loadingComponent, this.#mainPageComponents.element, RenderPosition.AFTERBEGIN);
  };

  #renderPoint = (point,destinations) => {
    const pointPresenter = new PointPresenter(this.#mainPageComponents.element, this.#handleViewAction, this.#handleModeChange,this.#pointModel);
    pointPresenter.init(point,destinations);
    this.#pointPresenter.set(point.id, pointPresenter);
  };

  #renderPoints = (points) => {
    points.forEach((point) => this.#renderPoint(point));
  };

  #renderSort = () => {
    this.#sortComponent = new SortView(this.#currentSortType);
    this.#sortComponent.setSortTypeChangeHandler(this.#handleSortTypeChange);

    render(this.#sortComponent, this.#mainPageComponents.element, RenderPosition.BEFOREBEGIN);
  };

  #renderPage = () => {
    render(this.#mainPageComponents, this.#pageContainer);

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    const points = this.points;
    const pointsCount = points.length;

    this.#renderSort();

    if (pointsCount === 0){
      this.#messageComponent = new MessageView(this.#filterType);
      render( this.#messageComponent, this.#mainPageComponents.element);
    }

    this.#renderPoints(points.slice(0, Math.min(pointsCount)));

  };

  #clearPage = ({resetSortType = false} = {}) => {
    this.#newPointPresenter.destroy();
    this.#pointPresenter.forEach((presenter) => presenter.destroy());
    this.#pointPresenter.clear();
    remove(this.#loadingComponent);

    remove(this.#sortComponent);
    remove(this.#messageComponent);

    if (resetSortType) {
      this.#currentSortType = SortType.DAY;
    }
  };
}
