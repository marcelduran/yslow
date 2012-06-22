/**
 * Custom ruleset must be placed in this directory as rulseset_name.js
 *
 * Here is a very simplified snippet for registering a new rules and ruleset:
 *
 * YSLOW.registerRule({
 *     id: 'foo-rule1',
 *     name: 'Sample Test #1',
 *     info: 'How simple is that?',
 * 
 *     lint: function (doc, cset, config) {
 *         return {
 *             score: 90,
 *              message: 'close but no cigar',
 *            components: ['element1']
 *         };
 *     }
 * });
 * 
 * YSLOW.registerRuleset({
 *     id: 'foo',
 *     name: 'Foobar Ruleset',
 *     rules: {
 *         'foo-rule1': {}
 *     },
 *     weights: {
 *         'foo-rule1': 3
 *     }
 * });
 *
 */
