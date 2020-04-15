const mix = (...mixins) => mixins.reduceRight((Class, createMixin) => createMixin(Class), Object);

export default mix;
