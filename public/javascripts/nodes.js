import { selectorsID, deskInterest, deskDefault
    } from '/javascripts/constants.js'
import {getDeskName, getActualDeskId, getActualTypoId, deskCondition
    } from '/javascripts/desks.js'
import {updateMenu, updateGraph, fillingSelect, getAndApplyCanvasState,
    clearSelect, autosize
    } from '/javascripts/common.js'

/** Выдает имя выбранного типа вершины */
export function getTemplateInfo(){
    let templatesSelector = document.getElementById("theTypeSelectInAdd")
    let text = templatesSelector.options[templatesSelector.selectedIndex].text
    let value = templatesSelector.options[templatesSelector.selectedIndex].value
    return {'title': text, 'id': value}
}

/**
 * Выдает cypher-запрос на добавление новой вершины (типа или его экземпляра)
 * @param{viz} object - объект холста
 * @param{string} typeOfNode - тип вершины: это класс('type') или экземпляр('instance')
 * @param{string} caption - имя создаваемой вершины
 * @param{number} community - код группы вершин (для класса задать, для экземпляра достанет сам)
 * @param{string} templateName - метка (имя типа), которая присваивается вершине
 */
export function makeCypher4VertexAdd(viz, typeOfNode='instance', caption, community, templateName){
    let cypher ="MATCH (n) WITH max(n.id) AS last_ID " 
    if (typeOfNode == 'instance'){  // достанем с типологии код сообщества
        let cond = deskCondition('a', '', '', deskInterest.RELDESK, {}, 'Типология')  
        cypher += `
            CALL {
                MATCH ` + cond + `WHERE a.id=` + getTemplateInfo().id + 
                ` RETURN a.community AS tCommunity
               } ` 
        community = 'tCommunity'
    }                
    cypher += "MATCH " + deskCondition('', 'd', '', deskInterest.DESK) 
    cypher +=" CREATE (a:" + templateName
              
    cypher += "{"             

    cypher += ' title: "' + caption + '", '
    cypher += ' id: last_ID+1, '
    cypher += ' community: ' + community  + ', ' 
    cypher += ' description: "' + document.getElementById("description").value  + '", ' 
    cypher += ' sources: "' + document.getElementById("sourcesInAdd").value  + '", ' 
    cypher += ' timesize: "' + document.getElementById("timeSizeInAdd").value  + '", ' 
    let sizeVal = document.getElementById("size")
                          .options[document.getElementById("size").selectedIndex]
                          .value
    cypher += ' size:' + sizeVal + '}) '
    let focus = viz._network.getViewPosition()  // в текущий фокус камеры
    let coords = {x: parseInt(focus.x), y: parseInt(focus.y)}    
    cypher += 'CREATE ' + deskCondition('a', 'd', '', deskInterest.RELATION, coords)  // создаем связь до доски                    
    //console.log(cypher)
    return cypher
}

/** 
 * Добавляет вершину выбранного типа в граф 
 * @param{string} тип вершины - это класс('type') или экземпляр('instance')
 */
export function addVertex(driver, viz, config, typeOfNode='instance') {
    let caption = document.getElementById("caption").value
    if(caption === "") {
        return 'error: empty caption'
    }
    
    let templateName = ''
    let community = 0
    
    if (typeOfNode == 'type'){
        community = document.getElementById("communityInAdd").value
        if (isNaN(parseInt(community)) || parseInt(community) < 0) {
            return 'error: bad community'
        }
        templateName = 'Тип'
    } else if (typeOfNode == 'instance'){
        templateName = getTemplateInfo().title
    }   
    
    config.labels[caption] = {
        caption: "title",
        size: "size",
        community: "community"
    }

    let cypher = makeCypher4VertexAdd(viz, typeOfNode, caption, community, templateName)

    // добавляем в граф вершину с заданным типом, свойствами и привязкой к доске
    var session = driver.session()
    session
        .run(cypher)
        .then(() => {})
        .catch(error => {
            console.log(error)
            alert("Не получилось добавить вершину. Возможно вы где-то ввели недопустимый символ.")
            alert(cypher)
        })
        .then(() => {
            session.close()            
            updateGraph(driver, viz, config, false, true)
            updateMenu()
        }) 

    //newPropertysLabelCount = 0
    document.getElementById("caption").value = ""
}

/** выдает объект с параметрами вершины*/
export async function getNodeParameters(nodeID){
    let request = { 
            'cypher': ` MATCH (n {id:` + nodeID + `}) 
                        RETURN n.title AS title, n.community AS community`
        }    
    let response = await fetch('/driver', {        
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(request)
    })        
    if (!response.ok) {
        console.log('Ошибка HTTP in changeNode: ' + response.status)
        return
    }
    let result = await response.json()                        
    return result[0]
}

export async function changeNode(driver, viz, config) {
    let communityNew = null
    let cypherTypeAddon = ''    
    let nodeID = document.getElementById("nodeSelect").value
    let typeSelector = document.getElementById("theTypeSelectInEdit")
    if (typeSelector) {
        let typeID = typeSelector.value
        // узнаем параметры новой метки
        let typeInfo = await getNodeParameters(typeID)                      
        let labelNew = typeInfo['title']
        communityNew = typeInfo['community']
        // узнаем текущую метку вершины
        typeInfo = await getNodeTypeInfo(nodeID)
        let labelOld = typeInfo.title
        
        cypherTypeAddon = ' REMOVE p:' + labelOld + ' SET p:' + labelNew + ' '
        }    
        
    // сформируем запрос в БД на изменения
    let cypher = "MATCH (p {id:" + nodeID + "})" +
        cypherTypeAddon + 
        " SET p.title = \"" + document.getElementById("title").value + "\"" +
        " SET p.description = \"" + document.getElementById("desc").value + "\"" +            
        " SET p.size = " + parseFloat(document.getElementById("type").value)
    if (document.getElementById("sourcesInEdit")){
        cypher += " SET p.sources = \"" + document.getElementById("sourcesInEdit").value + "\""
    }
    if (document.getElementById("timeSizeInEdit")){
        cypher += " SET p.timesize = " + document.getElementById("timeSizeInEdit").value
    }
    if (document.getElementById("communityInEdit")){
        communityNew = document.getElementById("communityInEdit").value
    }
    if (communityNew != null){
        cypher += ' SET p.community = ' + communityNew
    }
    cypher += ' RETURN p;'
    console.log(cypher)

    // выполним запрос
    let request = { 'cypher': cypher }
    let response = await fetch('/driver', {        
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(request)
    })
    if (!response.ok) {
        console.log('Ошибка HTTP in changeNode: ' + response.status)
        return
    }
    updateGraph(driver, viz, config)
    updateMenu()
    
} 

export function removeNode(driver, viz, config) {
    var session = driver.session()    
    session
        .run("MATCH (p) WHERE p.id =" + document.getElementById("nodeSelect").value + " DETACH DELETE p")
        .then(result => {
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {            
            session.close()
            //updateGraph(driver, viz, config, true) 
            let visualID = getVisualNodeIdByRealId(viz, document.getElementById("nodeSelect").value)                        
            viz._network.selectNodes([visualID])  // выделяем на холсте узел
            viz._network.deleteSelected()   // удаляем его из визуализации
            updateMenu()
        })
}


/**
 * Выбирает одну вершину с данной доски и вставляет ее в списки выбора,
 * id которых лежат в массиве selectorsID
 */
export async function getNodesSimple() {
    let request = {
        'cypher': `MATCH (n) WHERE ` + deskCondition('n') + `
                   WITH head(collect(n)) AS p
                   RETURN p.id, p.title`
    }

    let response = await fetch('/driver', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(request)
    })

    if (response.ok) {
        response
            .json()
            .then(result => {
                result.map(record => {
                    let text = "<" + record['p.id'] + ">:" + record['p.title']
                    for (let i = 0; i < selectorsID.length; i++)
                        document.getElementById(selectorsID[i]).add(new Option(text, record['p.id'], false, false))
                })
            })
    } else {
        console.log('Ошибка HTTP: ' + response.status)
    }

}


/**
 * Выбирает все вершины с данной доски и заполняет ими списки выбора,
 * id которых лежат в массиве selectorsID
 */
export async function getNodes() {
    let request = {
        'cypher': `MATCH (n) WHERE ` + deskCondition('n') + `
                   WITH head(collect(p)) AS p
                   RETURN p.id, p.title ORDER BY p.title`
    }

    let response = await fetch('/driver', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(request)
    })

    if (response.ok) {
        response
            .json()
            .then(result => {
                result.map(record => {
                    let text = "<" + record['p.id'] + ">:" + record['p.title']
                    for (let i = 0; i < selectorsID.length; i++)
                        document.getElementById(selectorsID[i]).add(new Option(text, record['p.id'], false, false))
                })
            })
    } else {
        console.log('Ошибка HTTP: ' + response.status)
    }

}

/**
 * Выдает данные по типу заданного экземпляра вершины
 * @param{number} instanceID - id вершины, для которой добываем свойства типа
 * @return{objectr} значения свойств типа нужной вершины, 
 *                  например {'typeID':127, 'community':5, 'title': "Знание"}
 */
export async function getNodeTypeInfo(instanceID){
    let cond_typo = deskCondition('t', 'dt', '', deskInterest.RELDESK, {}, 'Типология')  
    
    let request = {
        'cypher': ` MATCH (s {id:` + instanceID + `}) 
                    CALL {
                        WITH s
                        MATCH ` + cond_typo + ` 
                        WHERE t.title=labels(s)[0]
                        RETURN t.id as typeID, t.community AS community, t.title AS title
                    } 
                    RETURN typeID, community, title`
    }    

    let response = await fetch('/driver', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(request)
    })

    if (response.ok) {
        let result = await response.json()                        
        return result[0]
    } else {
        console.log('Ошибка HTTP: ' + response.status)
        return {}
    }
}

/** 
 * Зполняет списки с типами вершин. Может поставить выбранной по конретному id.
 * @param{string} id элемента со списком выбра на html-странице
 * @param{string} whichID - id элемента, чей тип надо поставить выбранным
 */
export async function fillTypeSelector(selector, whichID=''){
    let selEl = document.getElementById(selector)    
    if (selEl){
        let selectedTypeId = null
        if (whichID){              
            let info = await getNodeTypeInfo(whichID)
            selectedTypeId = info.typeID            
        } 
        let cond = deskCondition('n', '', '', deskInterest.RELDESK, {}, 'Типология')  
        fillingSelect(selector, 
                    'MATCH ' + cond + ' RETURN DISTINCT n.title, n.id', 
                    'n.title', 'n.id', selectedTypeId)
    }
}

/**
 * Запрашивает информацию с выбранного узла и заполняет по ней форму редактирования
 */
export async function getSelectedNodeInfo(realId="") {
    let id = realId != "" ? realId : document.getElementById("nodeSelect").value
    if (id === "") return

    let request = {
        'cypher': `MATCH (p {id: ` + id + `}) 
                   RETURN p.description, p.sources, p.title, p.size, p.community, p.timesize, p.id 
                   LIMIT 1`
    }

    let response = await fetch('/driver', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(request)
    })

    if (response.ok) {
        response
            .json()
            .then(result => {
                result.map(record => {
                    document.getElementById("desc").value = 
                        record["p.description"] != undefined ? record["p.description"] : ''
                    autosize(document.getElementById("desc"))  // подстроим высоту поля под конент
                    document.getElementById("title").value = 
                        record["p.title"] != undefined ? record["p.title"] : ''
                    document.getElementById("sourcesInEdit").value = 
                        record["p.sources"] != undefined ? record["p.sources"] : ''
                    document.getElementById("timeSizeInEdit").value = 
                        record["p.timesize"] != undefined ? record["p.timesize"] : '0'                    
                    if (document.getElementById("communityInEdit")) {
                        document.getElementById("communityInEdit").value = 
                            record["p.community"] != undefined ? record["p.community"] : ''
                    }

                    fillTypeSelector("theTypeSelectInEdit", record["p.id"])

                    let size = record["p.size"]
                    // типоразмер
                    let sizeOptions = document.getElementById("type").options
                    for (let i = 0; i < sizeOptions.length; i++) {
                        if (size == sizeOptions[i].value) {
                            document.getElementById("type").selectedIndex = i
                            break
                        }
                    }

                })
            })
    } else {
        console.log('Ошибка HTTP: ' + response.status)
    }
}

/**
 * По ID вершины от визуализатора считывает известные ему свойства вершины
 * @param {number} ID вершины на холсте
 * @return {object} объект со свойствами ключ-значение, например {'id':'5', 'use':'IT'}
 */
export function getVisualNodeProperties(viz, visualId){
    let props = {}
    // извлечем свойства из поля title вершины (должен быть способ лучше)
    let nodePropertiesString = viz._nodes[visualId].title    
    nodePropertiesString.split('<br>').forEach((line, i, arr) => {
        let keyVal = line.replace('<strong>','').replace('</strong>','').split(':')        
        if (keyVal[0].length > 0) {
            props[keyVal[0]] = keyVal[1].trim()
        }
    })
    return props
}

/**
 * Находит ID вершины на холсте по переданному ID из базы данных (они существуют независимо)
 * @param {number} ID вершины в БД
 * @return {number} ID этой же вершины на холсте
 */
export function getVisualNodeIdByRealId(viz, realID){
    let visualIdList = Object.keys(viz._nodes)
    let nodes_quantity = visualIdList.length
    for (let i=0; i<nodes_quantity; i++){        
        let visualId = visualIdList[i]
        let properties = getVisualNodeProperties(viz, viz._nodes[visualId].id)
        
        if (parseInt(properties.id) == parseInt(realID)){
            return visualId
        }
    }
    return -1
}

/**
 * Сохраняет координаты вершин с холстав в БД
 */
export function saveCoordinates(driver, viz){        
    let pos = viz._network.getPositions()  // считаем все координаты всех вершин 
    // в виде в pos={{0:{x:-10, y:15}, {0:{x:154, y:165}, ... }

    // соберем все в один запрос
    let cypherMatchNodes = ' MATCH '
    let cypherMatchRelations = ' MATCH '
    let cypherSET = ' SET '
    Object.keys(pos).forEach(visualId => {        
        id = parseInt(getVisualNodeProperties(viz, visualId).id)
        nodeName = 'id' + id
        relName = 'r' + id 
        cypherMatchNodes += '(' + nodeName +' {id: ' + id + '}), '
        cypherMatchRelations += deskCondition(nodeName, 'd', relName, deskInterest.RELDESK) + ', '
        cypherSET += relName + '.x=' + pos[visualId].x + ', ' 
        cypherSET += relName + '.y=' + pos[visualId].y + ', ' 
    })
    cypherMatchNodes = cypherMatchNodes.slice(0, -2); //отрежем ', ' с хвостов
    cypherMatchRelations = cypherMatchRelations.slice(0, -2);
    cypherSET = cypherSET.slice(0, -2)
    
    cypher = cypherMatchNodes + cypherMatchRelations + cypherSET 
 
    //и отправим на сервер
    var session = driver.session()    
    session
        .run(cypher)
        .then(result => {})
        .catch(error => {
            console.log(error)
        })
        .then(() => session.close())
}

/**
 * Сохраняет координаты кокретной вершины с холста в БД
 * @param{number} visualID - фронтендный id вершины
 */
export function saveSingleNodeCoordinates(driver, viz, visualId){        
    let pos = viz._network.getPositions(visualId)  // считаем все координаты всех вершин 
    // в виде в pos={458: {x:-10, y:15} } - пример для visualID = 458

    // соберем все в один запрос
    let cypherMatchNodes = ' MATCH '
    let cypherMatchRelations = ' MATCH '
    let cypherSET = ' SET '
    
    let id = parseInt(getVisualNodeProperties(viz, visualId).id)
    let nodeName = 'id' + id
    let relName = 'r' + id 
    cypherMatchNodes += '(' + nodeName +' {id: ' + id + '}) '
    cypherMatchRelations += deskCondition(nodeName, 'd', relName, deskInterest.RELDESK) + ' '
    cypherSET += relName + '.x=' + pos[visualId].x + ', ' 
    cypherSET += relName + '.y=' + pos[visualId].y + ' ' 
    
    let cypher = cypherMatchNodes + cypherMatchRelations + cypherSET 

    //и отправим на сервер
    var session = driver.session()    
    session
        .run(cypher)
        .then(result => {})
        .catch(error => {
            console.log(error)
        })
        .then(() => session.close())
}

/** 
 * Расставляет вершины по сохраненным ранее в базе координатам
 * и возвращает холст на прежние координаты и масштаб
 */
export function restoreCoordinates(driver, viz){
    var session = driver.session()    
    let cypher = 'MATCH ' + deskCondition('a', 'd', 'r') + ' RETURN a.id AS nodeID, r.x AS x, r.y AS y'    
    session
        .run(cypher)
        .then(result => {          
            result.records.forEach(record => { 
                let x = record.get('x').low                                    
                let y = record.get('y').low
                let realID = record.get('nodeID').low                
                if (x != 0 || y!= 0) {
                    let visualID = getVisualNodeIdByRealId(viz, realID)
                    if (visualID != -1) {  // узел найден на холсте
                        viz._network.moveNode(visualID, x, y) 
                    }
                }
            })            
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            session.close()
            getAndApplyCanvasState(viz)  // подвинем холст в сохраненное состояние               
        })    
}

/** ставит камеру на узел, чей ID из базы данных передан в фунцию*/
export function focusOnNode(viz, realID){
    let visualID = getVisualNodeIdByRealId(viz, realID)    
    viz._network.focus(visualID)
}

/*=================== Обработка событий ================*/

/**
 * Привязывает обработчик к событию выбора второй вершины
 * (чтобы выбрать несколько нужен длинный click или Ctrl+click по каждой следующей).
 * Вторая выбранная вершиная ставится выбранной во втором select форме создания связи
 */
export function setNodeSelectHandler(viz){        
    viz._network.on('selectNode', (param) => {        
        if (param.nodes.length <= 1) {  // т.е. если выделено меньше 2х вершин - не интересно
            return
        }
        let currentNodeId = viz._network.getNodeAt(param.pointer.DOM); // вершина под событием
        let properties = getVisualNodeProperties(viz, currentNodeId)
        let realID = parseInt(properties.id)        

        // ставим выбранной нужную вершину и симулируем клик по select-ам        
        if (realID != NaN) { 
            // форма создания ребра - во второй select  
            clearSelect('relationshipEnd')
            document.getElementById('relationshipEnd').add(new Option(properties.title, realID, false, true))                
            document.getElementById('relationshipEnd').dispatchEvent(new MouseEvent('change'))            
        }        
    })
}

/**
 * Привязывает обработчик к клику по вершине.
 * Кликнутая вершина ставится выбранной в формах c select-ами по вершинам
 */
export function setNodeClickHandler(viz){        
    viz._network.on('click', (param) => {  // по клику на холст
        if (param.nodes.length == 0) {
            return
        }
        let nodeIdAtCanvas = NaN
        let realID = NaN
        if (viz._network.getSelectedNodes().length == 1){  
            nodeIdAtCanvas = param.nodes[0]  // ID вершины на холсте, не совпадает с ID в БД        
            let properties = getVisualNodeProperties(viz, nodeIdAtCanvas)
            realID = parseInt(properties.id)
            if (realID != NaN) {
                clearSelect('nodeSelect')
                // добавим в список выбранную вершину и программно кликнем по ней
                document.getElementById('nodeSelect').add(new Option(properties.title, realID, false, true))                
                document.getElementById('nodeSelect').dispatchEvent(new MouseEvent('change'))

                clearSelect('relationshipStart')
                // добавим в список выбранную вершину и программно кликнем по ней
                document.getElementById('relationshipStart').add(new Option(properties.title, realID, false, true))                                
                document.getElementById('relationshipStart').dispatchEvent(new MouseEvent('change'))
            }
        }
        
    })
}

/**
 * Привязывает обработчик к окончанию перетаскивания вершин(ы).
 * По событию - сохраняются в БД текущие координаты перемешенной вершин(ы)
 */
export function setNodeDragHandler(driver, viz){
    viz._network.on('dragEnd', (event) => {        
        let nodes = event.nodes    
        if (nodes.length == 0) {
            return
        }
        nodes.forEach((nodeID) => {
            saveSingleNodeCoordinates(driver, viz, nodeID)
        })    
    })
}
