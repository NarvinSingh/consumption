import { coalesce, curry, mix } from './utils.mjs';
import observable from './observable.mjs';

const observableApp = (Superclass = Object) => class ObservableApp extends Superclass {
  createNotification(componentName, event, data) {
    return {
      subject: this,
      subjectName: coalesce(this.name, this.constructor.name),
      componentName,
      event,
      data,
    };
  }

  createError(componentName, message, data) {
    const err = new Error(message);
    err.details = this.createNotification(componentName, null, data);
    return err;
  }

  notify(componentName, event, data) {
    this.notifyObservers(this.createNotification(componentName, event, data));
  }

  raise(componentName, message, data) {
    this.notifyObservers(this.createError(componentName, message, data));
  }

  makeNotificationCreator(componentName = null) {
    return curry(this.createNotification, componentName).bind(this);
  }

  makeErrorCreator(componentName = null) {
    return curry(this.createError, componentName).bind(this);
  }

  makeNotifier(componentName = null) {
    return curry(this.notify, componentName).bind(this);
  }

  makeRaiser(componentName = null) {
    return curry(this.raise, componentName).bind(this);
  }

  static summarize(notificaton) {
    const { event, message, data } = notificaton;

    if (notificaton instanceof Error && notificaton.details) {
      const { subjectName, componentName, data: detailsData } = notificaton.details;
      return { subjectName, componentName, event: message, data: detailsData };
    }

    const { subjectName } = notificaton;

    if (event instanceof Error && event.details) {
      const { componentName, data: detailsData } = event.details;
      return { subjectName, componentName, event: event.message, data: detailsData };
    }

    const { componentName } = notificaton;
    return { subjectName, componentName, event, data };
  }
};

export default mix(observableApp, observable);
