
function getGraphInfo() {
    desk = getDeskName()
    getLoginInfo()
    neo4jLogin()
    updateMenu()
    draw() 
    start()
    updateGraph(false, true)
}

/** выдает тексты стартового cypher-запроса */
function initialCypher(){
    let desk = getDeskName()        
    //connected_nodes выдаст только связанные между собой узлы, одиночные - нет
    return {
        'connected_nodes': 'MATCH (a)-[r]-(b) WHERE ' 
                    + deskCondition('a') + ' AND '
                    + deskCondition('b') + ' RETURN a, r',
        'nodes': 'MATCH (a) WHERE ' + deskCondition('a') + ' RETURN a'
        }
}

function start() {   
    document.getElementById("Label").add(new Option("Новый тип"))
    document.getElementById("Type").add(new Option("Новый тип"))
    fillingSelect("Label", 'MATCH (n) WHERE '+deskCondition('n')+' RETURN distinct labels(n)', 'labels(n)')
    fillingSelect("Type", 'MATCH (a)-[r]->(b) WHERE ' 
            + deskCondition('a') + ' AND '
            + deskCondition('b') + ' RETURN distinct(type(r))', "(type(r))")    
    fillingSelect("deskSelect", 'MATCH (n:Доска) RETURN distinct n.title AS desks', "desks")
    templateChanged(true, 'Label')
    templateChanged(true, 'Type')    
}

function draw() {    
    config = {
        container_id: "viz",
        server_url: serverUrl,
        server_user: username,
        server_password: password,
        labels: {  // не влияет на ситуацию - config.labels перезаписывается в других местах 
            "Node": {
                caption: "title",
                size: "size",
                community: "topicNumber"
            }
        }, 
        relationships: {
            "subsection": {
                caption: "type",
                thickness: "thickness",
                title_properties: false
            } 
        },
        arrows: true,
        initial_cypher: initialCypher().connected_nodes
    }

    viz = new NeoVis.default(config)
    console.log(viz)
    viz.render()
}

async function neo4jLogin() {
    driver = neo4j.driver(serverUrl, neo4j.auth.basic(username, password), {encrypted: 'ENCRYPTION_OFF'})
    driver.onError = error => {
        console.log(error)
    }

    try {
        await driver.verifyConnectivity()
    } catch (error) {
        alert("Ошибка аутентификации")
    }
}

function getLoginInfo() {
    const menu = document.forms.graphMenu
    serverUrl = document.getElementById("url").value
    username = menu.elements.username.value
    password = menu.elements.password.value
}
