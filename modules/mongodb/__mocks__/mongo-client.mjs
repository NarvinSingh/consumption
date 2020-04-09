import MongoParseError from './mongo-parse-error.mjs';
import MongoServerSelectionError from './mongo-server-selection-error.mjs';

export default class MongoClient {
  constructor(url, options) {
    this.isMocked = true;
    this.url = url;
    this.options = options;
  }

  connect() {
    if (this.url.includes('notahost')) {
      return Promise.reject(new MongoParseError('URI does not have hostname, domain name and tld'));
    }

    if (this.url.includes('notauser') || this.url.includes('badpassword')) {
      return Promise.reject(new MongoServerSelectionError('Authentication failed.'));
    }

    return Promise.resolve(this);
  }
}
