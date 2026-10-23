const assert = require('assert');
const { getProjectors, getProjectorHistory } = require('../src/services/projectorService');

async function testProjectorEnrichment() {
  const list = await getProjectors();
  assert.strictEqual(list.length, 11, 'Must have exactly 11 projectors');

  for (const p of list) {
    assert('isUsed' in p, 'Projector must indicate isUsed boolean');
    assert('currentLoan' in p, 'Projector must include currentLoan');
    assert(Array.isArray(p.history), 'Projector must include history array');
  }

  const history = await getProjectorHistory('01');
  assert(Array.isArray(history), 'getProjectorHistory must return array');
  console.log('Projector history and live usage status test passed.');
}

testProjectorEnrichment().catch(err => {
  console.error(err);
  process.exit(1);
});
