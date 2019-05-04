const { ServiceProvider } = require.main.require('@adonisjs/fold')

class InertiaProvider extends ServiceProvider {
    register() {
        this.app.bind('Adonis/Addons/Inertia', () => require('../src/index'))

        this.app.bind('Adonis/Middleware/Inertia', () => {
            const Bind = require('../src/Middleware')
            return new Bind()
        })
    }
}

module.exports = InertiaProvider
