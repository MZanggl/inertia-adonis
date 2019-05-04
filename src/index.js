'use strict'

const set = require('lodash/set')
const he = require('he')

const headers = {
    AJAX: 'X-Inertia',
    VERSION: 'X-Inertia-Version',
    LOCATION: 'X-Inertia-Location'
}

const sharedProps = {}
let rootView = 'app'
let version = null

const bind = context => new Inertia(context)
const share = (key, value) => set(sharedProps, key, value)
const setRootView = newRootView => (rootView = newRootView)
const setVersion = newVersion => (version = newVersion)
const getVersion = () => (typeof version === 'function' ? version() : version)

class Inertia {
    constructor(context) {
        this.context = context
        context.inertia = this
    }

    hasVersionChanged() {
        return (
            this.context.request.method() === 'GET' &&
            this.context.request.header(headers.VERSION) != getVersion()
        )
    }

    forceReload() {
        this.context.response
            .status(409)
            .header(headers.LOCATION, this.context.request.originalUrl())
    }

    isAjaxRequest() {
        return !!this.context.request.header(headers.AJAX)
    }

    render(component, props = {}, edgeParameters = {}) {
        const { view, response, request } = this.context
        props = { ...sharedProps, ...props }

        Object.entries(props).forEach(([key, value]) => {
            if (typeof value === 'function') {
                props[key] = value(this.context, { component, props })
            }
        })

        const page = {
            component,
            props,
            url: request.originalUrl(),
            version: getVersion()
        }

        if (this.isAjaxRequest()) {
            response.header('Vary', 'accept')
            response.header(headers.AJAX, true)
            return response.json(page)
        }

        const pageString = JSON.stringify(page, null, 0)
        return view.render(rootView, {
            page,
            pageString,
            startTag: `<div id="${rootView}" data-page="${he.escape(pageString)}"></div>`,
            ...edgeParameters
        })
    }
}

module.exports = {
    bind,
    setRootView,
    share,
    getVersion,
    setVersion
}
