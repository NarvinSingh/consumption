/* eslint-disable max-classes-per-file */
import { mix } from './utils.mjs';

const speaker = (Superclass = Object) => class Speaker extends Superclass {
  constructor(sound, ...superArgs) {
    super(...superArgs);
    this.sound = sound;
  }

  speak() {
    return `${this.sound}...`;
  }
};

const eater = (Superclass = Object) => class Eater extends Superclass {
  constructor(energy, energyEfficiency, ...superArgs) {
    super(...superArgs);
    this.energy = energy;
    this.energyEfficiency = Math.max(0.9, energyEfficiency);
    this.bowelLoad = 0;
  }

  eat(amount) {
    this.energy += amount * this.energyEfficiency;
    this.bowelLoad += amount * (1 - this.energyEfficiency);
  }
};

const pooper = (Superclass = Object) => class Pooper extends Superclass {
  constructor(...superArgs) {
    super(...superArgs);
    this.bowelLoad = this.bowelLoad || 0;
  }

  poop(amount) {
    this.bowelLoad -= amount;
  }
};

const staticMixin1 = (Superclass = Object) => class StaticMixin1 extends Superclass {
  static getStaticThing1() {
    return 'StaticMixin1 thing';
  }
};

const staticMixin2 = (Superclass = Object) => class StaticMixin2 extends Superclass {
  static getStaticThing2() {
    return 'StaticMixin2 thing';
  }
};

const sound = 'meow';
const energy = 10;
const energyEfficiency = 0.9;
const energyAmount = 12;
const poopAmount = 0.1;

describe.each([
  [
    'Pooper -> Eater -> Speaker',
    mix(Object, speaker, eater, pooper),
    [energy, energyEfficiency, sound],
  ],
  [
    'Pooper -> Speaker -> Eater',
    mix(Object, eater, speaker, pooper),
    [sound, energy, energyEfficiency],
  ],
  [
    'Speaker -> Pooper -> Eater',
    mix(Object, eater, pooper, speaker),
    [sound, energy, energyEfficiency],
  ],
  [
    'Eater -> Speaker -> Pooper',
    mix(Object, pooper, speaker, eater),
    [energy, energyEfficiency, sound],
  ],
  [
    'Speaker -> Eater -> Pooper',
    mix(Object, pooper, eater, speaker),
    [sound, energy, energyEfficiency],
  ],
  [
    'Pooper -> Eater -> Speaker',
    mix({}, speaker, eater, pooper),
    [energy, energyEfficiency, sound],
  ],
])('Mixin %s tests', (name, Cat, args) => {
  test('Prototype chain is correct', () => {
    const cat = new Cat(...args);
    const prototypes = [...Array(4)]
      .map((item, index) => [...Array(index + 1)]
        .reduce((acc) => Object.getPrototypeOf(acc), cat).constructor.name)
      .join(' -> ');

    expect(prototypes).toBe(`${name} -> Object`);
  });

  test.each([
    ['sound'],
    ['energy'],
    ['energyEfficiency'],
    ['bowelLoad'],
  ])('Has the property %s', (prop) => {
    const cat = new Cat(...args);

    expect(cat[prop]).toBeDefined();
  });

  test.each([
    ['speak'],
    ['eat'],
    ['poop'],
  ])('Has the shared method %s', (method) => {
    const cat1 = new Cat(...args);
    const cat2 = new Cat(...args);

    expect(cat1[method]).toBeInstanceOf(Function);
    expect(cat1[method]).toBe(cat2[method]);
  });

  test('Speaking makes a sound', () => {
    const cat = new Cat(...args);

    expect(cat.speak()).toBe(`${sound}...`);
  });

  test('Eating increases energy', () => {
    const cat = new Cat(...args);

    cat.eat(energyAmount);
    expect(cat.energy).toBe(energy + (energyAmount * energyEfficiency));
  });

  test('Eating increases bowel load', () => {
    const cat = new Cat(...args);

    cat.eat(energyAmount);
    expect(cat.bowelLoad).toBe(energyAmount * (1 - energyEfficiency));
  });

  test('Pooping decreases bowel load', () => {
    const cat = new Cat(...args);

    cat.eat(energyAmount);
    cat.poop(poopAmount);
    expect(cat.bowelLoad).toBe(energyAmount * (1 - energyEfficiency) - poopAmount);
  });
});

describe('Mixin StaticMixin1 -> StaticMixin2 tests', () => {
  test('Prototype chain is correct', () => {
    const StaticMixin12 = mix(Object, staticMixin1, staticMixin2);
    const prototypes = [...Array(2)]
      .map((item, index) => [...Array(index + 1)]
        .reduce((acc) => Object.getPrototypeOf(acc), StaticMixin12).name)
      .join(' -> ');

    expect(`${StaticMixin12.name} -> ${prototypes}`).toBe('StaticMixin2 -> StaticMixin1 -> Object');
  });

  test.each([
    ['getStaticThing1'],
    ['getStaticThing2'],
  ])('Has the static method %s', (method) => {
    const StaticMixin12 = mix(Object, staticMixin1, staticMixin2);

    expect(StaticMixin12[method]).toBeInstanceOf(Function);
  });

  test.each([
    ['getStaticThing1'],
    ['getStaticThing2'],
  ])('Has the not shared static method %s', (method) => {
    const StaticMixin12a = mix(Object, staticMixin1, staticMixin2);
    const StaticMixin12b = mix(Object, staticMixin1, staticMixin2);

    expect(StaticMixin12a[method]).toBeInstanceOf(Function);
    expect(StaticMixin12b[method]).toBeInstanceOf(Function);
    expect(StaticMixin12a[method]).not.toBe(StaticMixin12b[method]);
  });

  test.each([
    ['getStaticThing1', 'StaticMixin1 thing'],
    ['getStaticThing2', 'StaticMixin2 thing'],
  ])('Static method %s gets correct value', (method, expectedValue) => {
    const StaticMixin12 = mix(Object, staticMixin1, staticMixin2);

    expect(StaticMixin12[method]()).toBe(expectedValue);
  });
});

describe.each([
  ['Speaker -> StaticMixin2 -> StaticMixin1', mix(Object, staticMixin1, staticMixin2, speaker)],
  ['StaticMixin2 -> Speaker -> StaticMixin1', mix(Object, staticMixin1, speaker, staticMixin2)],
  ['StaticMixin2 -> StaticMixin1 -> Speaker', mix(Object, speaker, staticMixin1, staticMixin2)],
])('Mixin %s tests', (name, Mixin) => {
  test('Prototype chain is correct', () => {
    const prototypes = [...Array(3)]
      .map((item, index) => [...Array(index + 1)]
        .reduce((acc) => Object.getPrototypeOf(acc), Mixin).name)
      .join(' -> ');

    expect(`${Mixin.name} -> ${prototypes}`).toBe(`${name} -> Object`);
  });

  test.each([
    ['getStaticThing1'],
    ['getStaticThing2'],
  ])('Class has the static method %s', (method) => {
    expect(Mixin[method]).toBeInstanceOf(Function);
  });

  test.each([
    ['getStaticThing1'],
    ['getStaticThing2'],
  ])('Instance does not have the static method %s', (method) => {
    const mixin = new Mixin('meow');

    expect(mixin[method]).not.toBeDefined();
  });

  test('Class does not have the method speak', () => {
    expect(Mixin.speak).not.toBeDefined();
  });

  test('Instance has the method speak', () => {
    const mixin = new Mixin('meow');

    expect(mixin.speak).toBeInstanceOf(Function);
  });

  test('Instance has the shared method speak', () => {
    const mixin1 = new Mixin('meow');
    const mixin2 = new Mixin('meow');

    expect(mixin1.speak).toBeInstanceOf(Function);
    expect(mixin1.speak).toBe(mixin2.speak);
  });

  test('Class does not have the property sound', () => {
    expect(Mixin.sound).not.toBeDefined();
  });

  test('Instance has the property sound', () => {
    const mixin = new Mixin('meow');

    expect(mixin.sound).toBeDefined();
  });

  test('Speaking makes a sound', () => {
    const mixin = new Mixin('meow');

    expect(mixin.speak()).toBe('meow...');
  });
});
