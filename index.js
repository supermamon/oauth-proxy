const PORT = process.env['PORT'] || 8000;
const restify = require('restify')
const errors = require('restify-errors')
const plugins = require('restify').plugins
const qs = require('qs')
const appendQuery = require('append-query')

const server = restify.createServer()
server.use(plugins.queryParser())

server.get('/', (req,res,next) => {

    if (!req.query['forward_to']) {
        return next(new errors.BadRequestError('Missing forward_to parameter'))
    }

    if (req.query['arg_format']) {
        if (req.query['arg_format']!='json' && req.query['arg_format']!='qs') {
            return next(new errors.BadRequestError('Invalid arg_format parameter.'))
        }
    }

    var props = {}

    console.log('query', req.query)

    for (var prop in req.query) {
        if (req.query.hasOwnProperty(prop)) {
            props[prop] = req.query[prop]
        }
    }
    let location = props['forward_to']
    delete props['forward_to']

    let arg_format = props['arg_format']
    delete props['arg_format']

    if (arg_format == 'qs') {
        location = appendQuery(location, qs.stringify(props))
    } else {
        location += `${encodeURI(JSON.stringify(props))}`
    } 

    console.log(location)
    res.redirect(location, next)

})





server.listen(PORT, () => {
    console.log('%s listening at %s', server.name, server.url)
})