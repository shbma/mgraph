import {selectorsID, vizIDa} from '/javascripts/constants.js'
import {getDeskName, getActualDeskId, getActualTypoId, deskCondition
    } from '/javascripts/desks.js'
import {updateMenu, updateGraph, fillingSelect, templateChanged} from '/javascripts/common.js'
import {fillTypeSelector} from '/javascripts/nodes.js'

export async function getGraphInfo(driver, viz, vizID='viz', config) {        
    driver = await neo4jLogin()
    await updateMenu(selectorsID)
    let vision = draw(vizIDa) 
    config = vision['config']
    viz = vision['viz']    
    await start(driver, config)
    updateGraph(driver, viz, config, false, true)
}

/** выдает тексты стартового cypher-запроса */
export function initialCypher(){
    let desk = getDeskName()        
    //connected_nodes выдаст только связанные между собой узлы, одиночные - нет
    return {
        'connected_nodes': 'MATCH (a)-[r]-(b) WHERE ' 
                    + deskCondition('a') + ' AND '
                    + deskCondition('b') + ' RETURN a, r',
        'nodes': 'MATCH (a) WHERE ' + deskCondition('a') + ' RETURN a'
        }
}

export async function start(driver, config) {
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
    updateConfigLabels(driver, config)  
    updateConfigRelationships(driver, config)
}

export function draw(vizID='viz') {  
    let login = getLoginInfo()  
    let config = {
        container_id: vizID,
        server_url: login.serverUrl,
        server_user: login.username,
        server_password: login.password,
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

    let vizObject = new NeoVis.default(config)
    vizObject.render()
    return {'config': config, 'viz': vizObject}
}

/** Пересоздает конфигурационные массивы с параметрами отображения для узлов. */
export function updateConfigLabels(driver, config) {   
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
export function updateConfigRelationships(driver, config) {
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

export async function neo4jLogin() {
    let login = getLoginInfo()
    let driver = neo4j.driver(login.serverUrl, neo4j.auth.basic(login.username, login.password), 
        {encrypted: 'ENCRYPTION_OFF'})
    driver.onError = error => {
        console.log(error)
    }

    try {
        await driver.verifyConnectivity()
        return driver        
    } catch (error) {
        alert("Ошибка аутентификации")
    }
}

export function getLoginInfo() {
    const menu = document.forms.graphMenu
    return {
        'serverUrl': document.getElementById("url").value,
        'username': menu.elements.username.value,
        'password': menu.elements.password.value
    }
}
