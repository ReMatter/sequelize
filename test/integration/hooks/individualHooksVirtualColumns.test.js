'use strict';

const chai = require('chai'),
  expect = chai.expect,
  Support = require('../support'),
  DataTypes = require('sequelize/lib/data-types'),
  sinon = require('sinon');

describe(Support.getTestDialectTeaser('Hooks - Individual Hooks Virtual Columns'), () => {
  beforeEach(async function() {
    this.User = this.sequelize.define('User', {
      username: {
        type: DataTypes.STRING,
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING
      },
      lastName: {
        type: DataTypes.STRING
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.firstName} ${this.lastName}`;
        }
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
      }
    });

    this.ParanoidUser = this.sequelize.define('ParanoidUser', {
      username: {
        type: DataTypes.STRING
      },
      firstName: {
        type: DataTypes.STRING
      },
      lastName: {
        type: DataTypes.STRING
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.firstName} ${this.lastName}`;
        }
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
      }
    }, {
      paranoid: true
    });

    await this.sequelize.sync({ force: true });
  });

  describe('#update with individualHooks', () => {
    it('should exclude virtual columns from preload query by default', async function() {
      const findAllSpy = sinon.spy(this.User, 'findAll');

      await this.User.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' },
        { username: 'user2', firstName: 'Jane', lastName: 'Smith' }
      ]);

      await this.User.update(
        { status: 'inactive' },
        { where: { username: 'user1' }, individualHooks: true }
      );

      expect(findAllSpy).to.have.been.calledOnce;

      const callArgs = findAllSpy.firstCall.args[0];
      expect(callArgs).to.have.property('attributes');
      expect(callArgs.attributes).to.not.include('fullName');
      expect(callArgs.attributes).to.include('username');
      expect(callArgs.attributes).to.include('firstName');
      expect(callArgs.attributes).to.include('lastName');
      expect(callArgs.attributes).to.include('status');

      findAllSpy.restore();
    });

    it('should include virtual columns when individualHooksWithVirtuals is true', async function() {
      const findAllSpy = sinon.spy(this.User, 'findAll');

      await this.User.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' },
        { username: 'user2', firstName: 'Jane', lastName: 'Smith' }
      ]);

      await this.User.update(
        { status: 'inactive' },
        { where: { username: 'user1' }, individualHooks: true, individualHooksWithVirtuals: true }
      );

      expect(findAllSpy).to.have.been.calledOnce;

      const callArgs = findAllSpy.firstCall.args[0];
      // When individualHooksWithVirtuals is true, attributes should not be explicitly set
      // (or should include all attributes including virtuals)
      expect(callArgs.attributes).to.be.undefined;

      findAllSpy.restore();
    });

    it('should still execute hooks correctly with virtual columns excluded', async function() {
      const beforeHook = sinon.spy();
      const afterHook = sinon.spy();

      this.User.beforeUpdate(beforeHook);
      this.User.afterUpdate(afterHook);

      await this.User.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' },
        { username: 'user2', firstName: 'Jane', lastName: 'Smith' }
      ]);

      await this.User.update(
        { status: 'inactive' },
        { where: { username: 'user1' }, individualHooks: true }
      );

      expect(beforeHook).to.have.been.calledOnce;
      expect(afterHook).to.have.been.calledOnce;

      // Verify the instance passed to hooks has physical attributes
      const instance = beforeHook.firstCall.args[0];
      expect(instance.username).to.equal('user1');
      expect(instance.firstName).to.equal('John');
      expect(instance.lastName).to.equal('Doe');
    });
  });

  describe('#destroy with individualHooks', () => {
    it('should exclude virtual columns from preload query by default', async function() {
      const findAllSpy = sinon.spy(this.User, 'findAll');

      await this.User.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' },
        { username: 'user2', firstName: 'Jane', lastName: 'Smith' }
      ]);

      await this.User.destroy({
        where: { username: 'user1' },
        individualHooks: true
      });

      expect(findAllSpy).to.have.been.calledOnce;

      const callArgs = findAllSpy.firstCall.args[0];
      expect(callArgs).to.have.property('attributes');
      expect(callArgs.attributes).to.not.include('fullName');
      expect(callArgs.attributes).to.include('username');
      expect(callArgs.attributes).to.include('firstName');
      expect(callArgs.attributes).to.include('lastName');

      findAllSpy.restore();
    });

    it('should include virtual columns when individualHooksWithVirtuals is true', async function() {
      const findAllSpy = sinon.spy(this.User, 'findAll');

      await this.User.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' },
        { username: 'user2', firstName: 'Jane', lastName: 'Smith' }
      ]);

      await this.User.destroy({
        where: { username: 'user1' },
        individualHooks: true,
        individualHooksWithVirtuals: true
      });

      expect(findAllSpy).to.have.been.calledOnce;

      const callArgs = findAllSpy.firstCall.args[0];
      expect(callArgs.attributes).to.be.undefined;

      findAllSpy.restore();
    });

    it('should still execute hooks correctly with virtual columns excluded', async function() {
      const beforeHook = sinon.spy();
      const afterHook = sinon.spy();

      this.User.beforeDestroy(beforeHook);
      this.User.afterDestroy(afterHook);

      await this.User.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' }
      ]);

      await this.User.destroy({
        where: { username: 'user1' },
        individualHooks: true
      });

      expect(beforeHook).to.have.been.calledOnce;
      expect(afterHook).to.have.been.calledOnce;

      const instance = beforeHook.firstCall.args[0];
      expect(instance.username).to.equal('user1');
      expect(instance.firstName).to.equal('John');
    });
  });

  describe('#restore with individualHooks', () => {
    it('should exclude virtual columns from preload query by default', async function() {
      const findAllSpy = sinon.spy(this.ParanoidUser, 'findAll');

      await this.ParanoidUser.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' },
        { username: 'user2', firstName: 'Jane', lastName: 'Smith' }
      ]);

      await this.ParanoidUser.destroy({
        where: { username: 'user1' }
      });

      await this.ParanoidUser.restore({
        where: { username: 'user1' },
        individualHooks: true
      });

      expect(findAllSpy).to.have.been.calledOnce;

      const callArgs = findAllSpy.firstCall.args[0];
      expect(callArgs).to.have.property('attributes');
      expect(callArgs.attributes).to.not.include('fullName');
      expect(callArgs.attributes).to.include('username');
      expect(callArgs.attributes).to.include('firstName');
      expect(callArgs.attributes).to.include('lastName');

      findAllSpy.restore();
    });

    it('should include virtual columns when individualHooksWithVirtuals is true', async function() {
      const findAllSpy = sinon.spy(this.ParanoidUser, 'findAll');

      await this.ParanoidUser.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' },
        { username: 'user2', firstName: 'Jane', lastName: 'Smith' }
      ]);

      await this.ParanoidUser.destroy({
        where: { username: 'user1' }
      });

      await this.ParanoidUser.restore({
        where: { username: 'user1' },
        individualHooks: true,
        individualHooksWithVirtuals: true
      });

      expect(findAllSpy).to.have.been.calledOnce;

      const callArgs = findAllSpy.firstCall.args[0];
      expect(callArgs.attributes).to.be.undefined;

      findAllSpy.restore();
    });

    it('should still execute hooks correctly with virtual columns excluded', async function() {
      const beforeHook = sinon.spy();
      const afterHook = sinon.spy();

      this.ParanoidUser.beforeRestore(beforeHook);
      this.ParanoidUser.afterRestore(afterHook);

      await this.ParanoidUser.bulkCreate([
        { username: 'user1', firstName: 'John', lastName: 'Doe' }
      ]);

      await this.ParanoidUser.destroy({
        where: { username: 'user1' }
      });

      await this.ParanoidUser.restore({
        where: { username: 'user1' },
        individualHooks: true
      });

      expect(beforeHook).to.have.been.calledOnce;
      expect(afterHook).to.have.been.calledOnce;

      const instance = beforeHook.firstCall.args[0];
      expect(instance.username).to.equal('user1');
      expect(instance.firstName).to.equal('John');
    });
  });

  describe('Models without virtual attributes', () => {
    beforeEach(async function() {
      this.SimpleUser = this.sequelize.define('SimpleUser', {
        username: {
          type: DataTypes.STRING
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: 'active'
        }
      });

      await this.SimpleUser.sync({ force: true });
    });

    it('should not set attributes filter when model has no virtual columns', async function() {
      const findAllSpy = sinon.spy(this.SimpleUser, 'findAll');

      await this.SimpleUser.bulkCreate([
        { username: 'user1' }
      ]);

      await this.SimpleUser.update(
        { status: 'inactive' },
        { where: { username: 'user1' }, individualHooks: true }
      );

      expect(findAllSpy).to.have.been.calledOnce;

      const callArgs = findAllSpy.firstCall.args[0];
      // When there are no virtual attributes, the attributes filter should not be applied
      expect(callArgs.attributes).to.be.undefined;

      findAllSpy.restore();
    });
  });
});
