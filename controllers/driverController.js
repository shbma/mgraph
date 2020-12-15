exports.read = (request, response) => {
    try {
        request.neo4j.read(request.body.cypher)
            .then(data => {
                let array = []
                let keys = data.records[0].keys
                data.records.forEach(record => {
                    let newRecord = {}
                    for(let i = 0; i < record._fields.length; i++) {
                        if (typeof(record._fields[i]) == 'object') {
                            newRecord[keys[i]] = record._fields[i].low
                        } else {
                            newRecord[keys[i]] = record._fields[i]
                        }
                    }
                    array.push(newRecord)
                })
                response.send(array)
            })
            .catch(error => console.log(error))
    } catch (err) {
        console.log(err)
        response.render('error/500')
    }
}

exports.write = (request, response) => {
    try {
        request.neo4j.write(request.body.cypher)
            .then(() => response.send('Успешно'))
            .catch(error => console.log(error))
    } catch (err) {
        console.log(err)
        response.render('error/500')
    }
}