'use strict';

const chai = require('chai');

const expect = chai.expect;
const Support = require('../../../support');

const dialect = Support.getTestDialect();
const _ = require('lodash');
const { Op, IndexHints } = require('@sequelize/core');
const { MySqlQueryGenerator: QueryGenerator } = require('@sequelize/core/_non-semver-use-at-your-own-risk_/dialects/mysql/query-generator.js');

if (dialect === 'mysql') {
  describe('[MYSQL Specific] select data as json', () => {
    const suites = {

      selectQuery: [
        {
          arguments: ['myTable', { attributes: ['id'], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id', 'name'], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`), \'name\', (SELECT `_0_root.base`.`name` AS `name`)) AS `root` FROM (SELECT * FROM `myTable` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], where: { id: 2 }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `id` = 2 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], where: { name: 'foo' }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `name` = \'foo\' ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], where: { name: 'foo\';DROP TABLE myTable;' }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `name` = \'foo\\\';DROP TABLE myTable;\' ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['foo', { attributes: [['count(*)', 'count']], json: true }],
          expectation: 'SELECT count(*) AS `count` FROM `foo`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], order: ['id'], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY `id` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], order: ['id', 'DESC'], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY `id`, `DESC` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], order: ['myTable.id'], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY `myTable`.`id` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], order: [['myTable.id', 'DESC']], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY `myTable`.`id` DESC ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], order: [['id', 'DESC']], json: true }, function (sequelize) {
            return sequelize.define('myTable', {});
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY `myTable`.`id` DESC ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          arguments: ['myTable', { attributes: ['id'], order: [['id', 'DESC'], ['name']], json: true }, function (sequelize) {
            return sequelize.define('myTable', {});
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY `myTable`.`id` DESC, `myTable`.`name` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'functions can take functions as arguments',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['id'],
              order: [[sequelize.fn('f1', sequelize.fn('f2', sequelize.col('id'))), 'DESC']],
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY f1(f2(`id`)) DESC ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'functions can take all types as arguments',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['id'],
              order: [
                [sequelize.fn('f1', sequelize.col('myTable.id')), 'DESC'],
                [sequelize.fn('f2', 12, 'lalala', new Date(Date.UTC(2011, 2, 27, 10, 1, 55))), 'ASC'],
              ],
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ORDER BY f1(`myTable`.`id`) DESC, f2(12, \'lalala\', \'2011-03-27 10:01:55\') ASC ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'sequelize.where with .fn as attribute and default comparator',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['id'],
              where: sequelize.and(
                sequelize.where(sequelize.fn('LOWER', sequelize.col('user.name')), 'jan'),
                { type: 1 },
              ),
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE (LOWER(`user`.`name`) = \'jan\' AND `type` = 1) ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'sequelize.where with .fn as attribute and LIKE comparator',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['id'],
              where: sequelize.and(
                sequelize.where(sequelize.fn('LOWER', sequelize.col('user.name')), 'LIKE', '%t%'),
                { type: 1 },
              ),
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE (LOWER(`user`.`name`) LIKE \'%t%\' AND `type` = 1) ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'single string argument should be quoted',
          // a rather odd way to select distinct
          arguments: ['myTable', { attributes: ['name'], group: 'name', json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'name\', (SELECT `_0_root.base`.`name` AS `name`)) AS `root` FROM (SELECT name AS `name` FROM `myTable` GROUP BY `name` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['name'], group: ['name'], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'name\', (SELECT `_0_root.base`.`name` AS `name`)) AS `root` FROM (SELECT name AS `name` FROM `myTable` GROUP BY `name` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'functions work for group by',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['YEAR(createdAt)'],
              group: [sequelize.fn('YEAR', sequelize.col('createdAt'))],
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'YEAR(createdAt)\', (SELECT `_0_root.base`.`YEAR(createdAt)` AS `YEAR(createdAt)`)) AS `root` FROM (SELECT YEAR(createdAt) AS `YEAR(createdAt)` FROM `myTable` GROUP BY YEAR(`createdAt`) ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'It is possible to mix sequelize.fn and string arguments to group by',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['YEAR(createdAt)', 'title'],
              group: [sequelize.fn('YEAR', sequelize.col('createdAt')), 'title'],
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'YEAR(createdAt)\', (SELECT `_0_root.base`.`YEAR(createdAt)` AS `YEAR(createdAt)`), \'title\', (SELECT `_0_root.base`.`title` AS `title`)) AS `root` FROM (SELECT YEAR(createdAt) AS `YEAR(createdAt)`, title AS `title` FROM `myTable` GROUP BY YEAR(`createdAt`), `title` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          arguments: ['myTable', { attributes: ['name'], group: 'name', order: [['id', 'DESC']], json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'name\', (SELECT `_0_root.base`.`name` AS `name`)) AS `root` FROM (SELECT name AS `name` FROM `myTable` GROUP BY `name` ORDER BY `id` DESC ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'HAVING clause works with where-like hash',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['title', [sequelize.fn('YEAR', sequelize.col('createdAt')), 'creationYear']],
              group: ['creationYear', 'title'],
              having: { creationYear: { [Op.gt]: 2002 } },
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'title\', (SELECT `_0_root.base`.`title` AS `title`), \'creationYear\', (SELECT `_0_root.base`.`creationYear` AS `creationYear`)) AS `root` FROM (SELECT title AS `title`, YEAR(`createdAt`) AS `creationYear` FROM `myTable` GROUP BY `creationYear`, `title` HAVING `creationYear` > 2002 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'Combination of sequelize.fn, sequelize.col and { in: ... }',
          arguments: ['myTable', function (sequelize) {
            return {
              attributes: ['id'],
              where: sequelize.and(
                { archived: null },
                sequelize.where(sequelize.fn('COALESCE', sequelize.col('place_type_codename'), sequelize.col('announcement_type_codename')), { [Op.in]: ['Lost', 'Found'] }),
              ),
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE (`archived` IS NULL AND COALESCE(`place_type_codename`, `announcement_type_codename`) IN (\'Lost\', \'Found\')) ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          arguments: ['myTable', { attributes: ['id'], limit: 10, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` LIMIT 10 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          arguments: ['myTable', { attributes: ['id'], limit: 10, offset: 2, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` LIMIT 10 OFFSET 2 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'uses default limit if only offset is specified',
          arguments: ['myTable', { attributes: ['id'], offset: 2, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` LIMIT 18446744073709551615 OFFSET 2 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'uses limit 0',
          arguments: ['myTable', { attributes: ['id'], limit: 0, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` LIMIT 0 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'uses offset 0',
          arguments: ['myTable', { attributes: ['id'], offset: 0, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'multiple where arguments',
          arguments: ['myTable', { attributes: ['id'], where: { boat: 'canoe', weather: 'cold' }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `boat` = \'canoe\' AND `weather` = \'cold\' ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'no where arguments (object)',
          arguments: ['myTable', { attributes: ['id'], where: {}, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'no where arguments (null)',
          arguments: ['myTable', { attributes: ['id'], where: null, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'buffer as where argument',
          arguments: ['myTable', { attributes: ['id'], where: { field: Buffer.from('Sequelize') }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `field` = X\'53657175656c697a65\' ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'use != if ne !== null',
          arguments: ['myTable', { attributes: ['id'], where: { field: { [Op.ne]: 0 } }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `field` != 0 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'use IS NOT if ne === null',
          arguments: ['myTable', { attributes: ['id'], where: { field: { [Op.ne]: null } }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `field` IS NOT NULL ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'use IS NOT if not === BOOLEAN',
          arguments: ['myTable', { attributes: ['id'], where: { field: { [Op.not]: true } }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `field` IS NOT true ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'use != if not !== BOOLEAN',
          arguments: ['myTable', { attributes: ['id'], where: { field: { [Op.not]: 3 } }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `field` != 3 ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'Regular Expression in where clause',
          arguments: ['myTable', { attributes: ['id'], where: { field: { [Op.regexp]: '^[h|a|t]' } }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `field` REGEXP \'^[h|a|t]\' ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'Regular Expression negation in where clause',
          arguments: ['myTable', { attributes: ['id'], where: { field: { [Op.notRegexp]: '^[h|a|t]' } }, json: true }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` WHERE `field` NOT REGEXP \'^[h|a|t]\' ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        }, {
          title: 'Empty having',
          arguments: ['myTable', function () {
            return {
              attributes: ['id'],
              having: {},
              json: true,
            };
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `myTable` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
          needsSequelize: true,
        }, {
          title: 'Contains fields with "." characters.',
          arguments: ['myTable', {
            attributes: ['foo.bar.baz'],
            model: {
              rawAttributes: {
                'foo.bar.baz': {},
              },
            },
            json: true,
          }],
          expectation: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'foo.bar.baz\', (SELECT `_0_root.base`.`foo.bar.baz` AS `foo.bar.baz`)) AS `root` FROM (SELECT * FROM `myTable` ) AS `_0_root.base` ) AS `_1_root`;',
          context: QueryGenerator,
        },
      ],
    };

    _.each(suites, (tests, suiteTitle) => {
      describe(suiteTitle, () => {
        beforeEach(function () {
          this.queryGenerator = new QueryGenerator({
            sequelize: this.sequelize,
            _dialect: this.sequelize.dialect,
          });
        });

        for (const test of tests) {
          const query = test.expectation.query || test.expectation;
          const title = test.title || `MySQL correctly returns ${query} for ${JSON.stringify(test.arguments)}`;
          it(title, function () {
            if (test.needsSequelize) {
              if (typeof test.arguments[1] === 'function') {
                test.arguments[1] = test.arguments[1](this.sequelize);
              }

              if (typeof test.arguments[2] === 'function') {
                test.arguments[2] = test.arguments[2](this.sequelize);
              }
            }

            // Options would normally be set by the query interface that instantiates the query-generator, but here we specify it explicitly
            this.queryGenerator.options = { ...this.queryGenerator.options, ...test.context && test.context.options };

            const conditions = this.queryGenerator.selectQuery(...test.arguments);
            expect(conditions).to.deep.equal(test.expectation);
          });
        }
      });
    });
  });
}
