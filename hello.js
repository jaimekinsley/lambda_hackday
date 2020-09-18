const chance = require('chance').Chance();

exports.handler = () => {
  console.log(`hello i am a lambda with randomness ${chance.name()}`);
};
