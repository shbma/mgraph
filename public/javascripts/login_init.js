
async function getGraphInfo() {    
    desk = getDeskName()
    getLoginInfo()
    neo4jLogin()
    updateMenu()
    draw() 
    await start()
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

async function start() {
    let labelEl = document.getElementById("Label")       
    if (labelEl) {
        labelEl.add(new Option("Новый тип"))
        fillingSelect("Label", 'MATCH (n) RETURN distinct labels(n)', 'labels(n)')  // select типов вершин    
        templateChanged(true, 'Label')
    } 
    fillTypeSelector("theTypeSelectInAdd")
    
    let selectDeskId = getActualDeskId() 
    await fillingSelect("deskSelect", 'MATCH (n:Доска) RETURN n.title AS desks, n.id AS ids', "desks", "ids", selectDeskId)    
    
    let typologySelect = document.getElementById("typoSelect")
    if (typologySelect){
        let selectTyDeskId = getActualTypoId()
        await fillingSelect("typoSelect", 'MATCH (n:Доска {type:"Типология"}) RETURN n.title AS desks, n.id AS ids', "desks", "ids", selectTyDeskId)    
    }
    updateConfigLabels()  
    updateConfigRelationships()
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

/** Пересоздает конфигурационные массивы с параметрами отображения для узлов. */
function updateConfigLabels() {   
    let cypherNodes = 'MATCH (a) WHERE ' + deskCondition('a') + ' RETURN DISTINCT labels(a) AS label'
            
    let session = driver.session()
    session
        .run(cypherNodes)
        .then(result => {                   
            config.labels = []
            for(let node of result.records) {                
                let captionOfLabel = node.get('label')                                          
                    config.labels[captionOfLabel] = {
                        caption: "title",
                        size: "size",
                        community: "community"                        
                        //image: 'https://visjs.org/images/visjs_logo.png'
                    }                    
                    /*config.labels["Node"] = {  // если индивидуально под вершину
                        caption: "title",
                        size: "size",
                        community: "topicNumber",
                        image: 'https://visjs.org/images/visjs_logo.png'
                    }*/
            }
        })
        .catch(error => {console.log(error)})
        .then(() => {
            session.close()
        })
}

/** Пересоздает конфигурационные массивы с параметрами отображения для связей. */
function updateConfigRelationships() {
    let cypherRelations = 'MATCH (a)-[r]-(b) WHERE ' 
                    + deskCondition('a') + ' AND '
                    + deskCondition('b') + ' RETURN DISTINCT type(r) AS relType'    
    
    let session = driver.session()
    session
        .run(cypherRelations)
        .then(result => {                   
            config.relationships = []
            for(let line of result.records) {                
                let captionOfRelation = line.get('relType')                                            
                config.relationships[captionOfRelation] =  {
                        caption: "type",
                        thickness: "thickness",
                        title_properties: false
                    }                 
            }
        })
        .catch(error => {console.log(error)})
        .then(() => {
            session.close()
        })
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
