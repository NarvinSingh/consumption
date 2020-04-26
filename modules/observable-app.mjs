import { curry, mix } from './utils.mjs';
import observable from './observable.mjs';

const observableApp = (Superclass = Object) => class ObservableApp extends Superclass {
  createNotification(componentType, componentName, event, data) {
    return { app: this, componentType, componentName, event, data };
  }

  createError(componentType, componentName, message, data) {
    const err = new Error(message);
    err.details = this.createNotification(componentType, componentName, null, data);
    return err;
  }

  notify(componentType, componentName, event, data) {
    this.notifyObservers(this.createNotification(componentType, componentName, event, data));
  }

  raise(componentType, componentName, message, data) {
    this.notifyObservers(this.createError(componentType, componentName, message, data));
  }

  makeNotificationCreator(componentType, componentName) {
    return curry(this.createNotification, componentType, componentName).bind(this);
  }

  makeErrorCreator(componentType, componentName) {
    return curry(this.createError, componentType, componentName).bind(this);
  }

  makeNotifier(componentType, componentName) {
    return curry(this.notify, componentType, componentName).bind(this);
  }

  makeRaiser(componentType, componentName) {
    return curry(this.raise, componentType, componentName).bind(this);
  }

  static summarize(notificaton) {
    const { event, message, data } = notificaton;

    if (notificaton instanceof Error && notificaton.details) {
      const { componentType: type, componentName: name, data: detailsData } = notificaton.details;
      return { type, name, event: message, data: detailsData };
    }

    if (data instanceof Error && data.details) {
      const { componentType: type, componentName: name, data: detailsData } = data.details;
      return { type, name, event: data.message, data: detailsData };
    }

    const { componentType: type, componentName: name } = notificaton;
    return { type, name, event, data };
  }
};

export default mix(observableApp, observable);
