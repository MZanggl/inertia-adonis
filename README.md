## [What is inertia](https://reinink.ca/articles/introducing-inertia-js)

> **Note:** The whole inertia project is in the very early stages of development and IS NOT yet intended for public consumption.

# Inertia Adonis Adapter

Create server-driven single page applications. No client routing, no store.

To use Inertia.js you need both a server-side adapter (like this one) as well as a client-side adapter, such as [inertia-vue](https://github.com/inertiajs/inertia-vue). Be sure to also follow the installation instructions for the client-side adapter you choose. This documentation will only cover the Adonis adapter setup. For Laravel use this [adapter](https://github.com/inertiajs/inertia-laravel).

# Installation

`npm install inertia-adonis --save`

# Setup root template

The first step to using Inertia is creating a root template. We recommend using app.edge. This template should include your assets, as well as the empty div tag.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    {{{ startTag }}
    {{ script('app') }}
</body>
</html>
```

`startTag` is simply a helper for creating our base div. It includes a data-page attribute which contains the inital page information. Here's what that looks like.

```html
<div id="app" data-page="{{ pageString }}"></div>
```

You can change the id while still making use of the `startTag` tag by using 

```javascript
Inertia.setRootView('name')
```

More on where to put that code in the section "Sharing data".

# Add Inertia middleware and provider

Next, add the Inertia middleware to our web middleware group, found in the `start/kernel.js` file. This middleware provides the `inertia` context, monitors for asset changes, and also fixes an edge case with 302 redirects.

```javascript
const globalMiddleware = [
  // ...
  'Adonis/Middleware/Inertia'
]
```

We also have to add the service provider. Do this in `start/app.js`.

```javascript
const providers = [
  // ...
  'inertia-adonis/providers/InertiaProvider'
]
```

# Making Inertia responses
To make an Inertia response, use `inertia.render()`. This function takes three arguments, the component name, and the component data (props). We will look at the third argument later.

```javascript
const Employee = use('App/Models/Employee')

class EmployeeController {
    async index({ inertia }) {
        const employees = await Employee::all()
        return inertia.render('Employees', { employees })
    }
}

module.exports = EmployeeController
```

# Following redirects
When making a non-GET Inertia request, via `<inertia-link>` or manually, be sure to still respond with a proper Inertia response. For example, if you're creating a new user, have your "store" endpoint return a redirect back to a standard GET endpoint, such as your user index page. Inertia will automatically follow this redirect and update the page accordingly. Here's a simplified example.

```javascript
class UserController {
    async index({ inertia }) {
        const users = await User.all()
        return inertia.render('Users/Index', { users })
    }

    store({ response }) {
        // User::create({ ... })

        return response.route('users')
    }
}
```
Note, when redirecting after a PUT, PATCH or DELETE request the middleware turns 302 response codes into 303, otherwise the subsequent request will not be treated as a GET request. A 303 redirect is the same as a 302 except that the follow-up request is explicitly changed to a GET request.

# Sharing data
To share data with all your components, use `Inertia.share(data)`. This can be done both synchronously and lazily. A good place for this is inside `start/hooks.js` in the method `hooks.after.providersBooted`.

```javascript
const { hooks } = require('@adonisjs/ignitor')

hooks.after.providersBooted(async () => {
    const Inertia = use('Adonis/Addons/Inertia')

    // Synchronously
    Inertia.share('app.name', 'name')

    // Lazily
    Inertia.share('user', (context, { component, props }) => {
        return context.auth.user
    })
})
```

Synchronously shared variables will be identical for all users who visit the website, so only share very general things synchronously, like the name of the app for example.

# Accessing data in root template
`inertia.render` accepts a third argument to pass data to the root template. These parameters will not get passed as props to the component.

```javascript
return inertia.render('Users/Index', { users }, { serverOnlyVar: 1337 })
```
```html
<title{{ serverOnlyVar }}</title>
```

# Asset versioning
One common challenge with single-page apps is refreshing site assets when they've been changed. Inertia makes this easy by optionally tracking the current version of your site assets. In the event that an asset changes, Inertia will automatically make a hard page visit instead of a normal ajax visit on the next request.

To enable automatic asset refreshing, first call the Inertia.setVersion(version) method with your current asset version. You can put this under `start/hooks.js` again.

```javascript
const { version } = require('../package.json')

hooks.after.providersBooted(async () => {
    const Inertia = use('Adonis/Addons/Inertia')

    Inertia.setVersion(version)
})
```

# TODO
- Avoid third parameter in `inertia.render` method
- Refactor stautus change from 302 -> 303