'use strict'

const Inertia = require('./index')

class Middleware {
    async handle(context, next) {
        Inertia.bind(context)
        await next()

        const { inertia, request, response } = context
        if (inertia.isAjaxRequest() && inertia.hasVersionChanged()) {
            inertia.forceReload()
        }

        // turn 302 redirects into GET, so inertia can handle it correctly
        if (['PUT', 'PATCH', 'DELETE'].includes(request.method()) && is302Redirect(response)) {
            redirectUsing303(response)
        }
    }
}

function is302Redirect(response) {
    const { method, args } = response._lazyBody

    if (method !== 'redirect') {
        return false
    }

    if (args[0] !== 302) {
        return false
    }

    return true
}

function redirectUsing303(response) {
    response._lazyBody.args[0] = 303
}

module.exports = Middleware
