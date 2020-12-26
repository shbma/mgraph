/** выдает имя выбранного типа вершины*/
function getTemplateInfo(){
    let templatesSelector = document.getElementById("theTypeSelect")
    let text = templatesSelector.options[templatesSelector.selectedIndex].text
    let value = templatesSelector.options[templatesSelector.selectedIndex].value
    return {'title': text, 'id': value}
}

/**
 * Выдает cypher-запрос на добавление новой вершины (типа или его экземпляра)
 * @param{string} typeOfNode - тип вершины: это класс('type') или экземпляр('instance')
 * @param{string} caption - имя создаваемой вершины
 * @param{number} community - код группы вершин (для класса задать, для экземпляра достанет сам)
 * @param{string} templateName - метка (имя типа), которая присваивается вершине
 */
function makeCypher4VertexAdd(typeOfNode='instance', caption, community, templateName){
    let cypher ="MATCH (n) WITH max(n.id) AS last_ID " 
    if (typeOfNode == 'instance'){  // достанем с типологии код сообщества
        let cond = deskCondition('a', '', '', deskInterest.RELDESK, {}, deskType='Типология')  
        cypher += `
            CALL {
                MATCH ` + cond + `WHERE a.id=` + getTemplateInfo().id + 
                ` RETURN a.community AS tCommunity
               } ` 
        community = 'tCommunity'
    }                
    cypher += "MATCH " + deskCondition('', 'd', '', interest=deskInterest.DESK) 
    cypher +=" CREATE (a:" + templateName
              
    cypher += "{"             

    cypher += ' title: "' + caption + '", '
    cypher += ' id: last_ID+1, '
    cypher += ' community: ' + community  + ', ' 
    cypher += ' description: "' + document.getElementById("description").value  + '", ' 
    cypher += ' sources: "' + document.getElementById("sources").value  + '", ' 
    let sizeVal = document.getElementById("size")
                          .options[document.getElementById("size").selectedIndex]
                          .value
    cypher += ' size:' + sizeVal + '}) '
    let coords = {x:0, y:0}
    cypher += 'CREATE ' + deskCondition('a', 'd', '', interest=deskInterest.RELATION, relProperties=coords)  // создаем связь до доски                    
    //console.log(cypher)
    return cypher
}

/** 
 * Добавляет вершину выбранного типа в граф 
 * @param{string} тип вершины - это класс('type') или экземпляр('instance')
 */
function addVertex(typeOfNode='instance') {
    let caption = document.getElementById("caption").value
    if(caption === "") {
        return 'error: empty caption'
    }
    
    let templateName = ''
    let community = 0
    
    if (typeOfNode == 'type'){
        community = document.getElementById("community").value
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

    let cypher = makeCypher4VertexAdd(typeOfNode, caption, community, templateName)

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
            updateGraph()
            updateMenu()
        }) 

    newPropertysLabelCount = 0
    document.getElementById("caption").value = ""
}

function clickOnUL(event) {
    let selectedNodeId = event.target.closest("li").value
    let nodeSelector = document.getElementById("nodeSelect")
    for (let i = 0; i < nodeSelector.options.length; i++){
        if (nodeSelector.options[i].value == selectedNodeId) {
            nodeSelector.selectedIndex = i
            getSelectedNodeInfo()
            return
        }
    }
}

function searchNodeByName(inputNode, UL, clickOnULFunction) {
    let input = document.getElementById(inputNode).value.toLowerCase().trim()
    let list = document.getElementById(UL)
    clearUL(UL)
    if (input === ""){return}
    let nodeSelector = document.getElementById("nodeSelect")
    for (let i = 0; i < nodeSelector.options.length; i++){
        if (nodeSelector.options[i].text.toLowerCase().indexOf(input) >= 0) {
            console.log(input + " : " + nodeSelector.options[i].text.toLowerCase())
            let li = document.createElement("li")
            li.value = nodeSelector.options[i].value
            li.onclick = (event) => clickOnULFunction(event, inputNode, UL)
            let a = document.createElement("a")
            a.text = nodeSelector.options[i].text

            li.appendChild(a)
            list.appendChild(li)
        }
    }
}

function addNode() {
    let availableId = 0
    var idSession = driver.session()
    idSession
        .run("MATCH (p) RETURN p.id ORDER BY p.id DESC LIMIT 1")
        .then(result => {
            result.records.forEach(record => {
                availableId = 1 + parseInt(record.get("p.id"))
            })
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            idSession.close()
        })
        .then(() => {
            var createSession = driver.session()
            let topic = document.getElementById("newTopic").value
            if (topic === "Создать новую тему") {
                topic = document.getElementById("newTitle").value
                communities.push(topic)
            }
            createSession
                .run("CREATE (a" + availableId + ":Node {title: \"" + document.getElementById("newTitle").value +
                    "\", topic:\"" + topic +
                    "\", topicNumber:" + communities.indexOf(topic) +
                    ", description:\"" + document.getElementById("newDesc").value +
                    "\", use: [\" " + document.getElementById("newUse").value.split(",").join("\" , \"") + 
                    " \"], id:" + availableId + 
                    ", size:" + parseFloat(document.getElementById("newType").value) + "})")
                .then(() => {
                })
                .catch(error => {
                    console.log(error)
                })
                .then(() => {
                    createSession.close()
                    updateGraph()
                    updateMenu()
                })
        })
}

function changeNode() {
    var setSession = driver.session()
    setSession
        .run(
            "MATCH (p {id:" + document.getElementById("nodeSelect").value + "})" +
            " SET p.title = \"" + document.getElementById("title").value + "\"" +
            " SET p.description = \"" + document.getElementById("desc").value + "\"" +
            //" SET p.use = [\"" + document.getElementById("use").value.split(",").join("\" , \"") + "\"]" +
            " SET p.size = " + parseFloat(document.getElementById("type").value)
        )
        .then(result => {
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            setSession.close()
            updateGraph()
            updateMenu()
        })
} 

function removeNode() {
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
            //updateGraph(true)
            visualID = getVisualNodeIdByRealId(document.getElementById("nodeSelect").value)            
            viz._network.selectNodes([visualID])  // выделяем на холсте узел
            viz._network.deleteSelected()   // удаляем его из визуализации
            updateMenu()
        })
}

async function getNodes() {
    //{desk:"' + getDeskName() + '"}
    let request = {
        'cypher': 'MATCH (p) RETURN p.id, p.title ORDER BY p.id'
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

    request['cypher'] = 'MATCH (p) RETURN DISTINCT p.topic, p.topicNumber'

    response = await fetch('/driver', {
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
                    communities[record['p.topicNumber']] = (record['p.topic'])
                })
            })
    } else {
        console.log('Ошибка HTTP: ' + response.status)
    }

    //{desk:"' + getDeskName() + '"}
    // var session = driver.session()
    // session
    //     .run('MATCH (p) RETURN p.id, p.title ORDER BY p.id')
    //     .then(result => {
    //         result.records.forEach(record => {
    //             let text = "<" + record.get("p.id") + ">:" + record.get("p.title")
    //             for (let i = 0; i < selectorsID.length; i++)
    //                 document.getElementById(selectorsID[i]).add(new Option(text, record.get("p.id"), false, false))
    //         })
    //     })
    //     .catch(error => {
    //         console.log(error) 
    //     })
    //     .then(() => {
    //         var subSession = driver.session()
    //         subSession
    //             .run('MATCH (p) RETURN DISTINCT p.topic, p.topicNumber')
    //             .then(result => {
    //                 result.records.forEach(record => {
    //                     communities[record._fields[1]] = (record._fields[0])
    //                 })
    //             })
    //     })
    //     .catch(error => {
    //         console.log(error)
    //     })
    //     .then(() => {
    //         session.close()
    //         getSelectedNodeInfo()
    //     })
}

async function getSelectedNodeInfo() {
    let id = document.getElementById("nodeSelect").value
    if (id === "") return

    let request = {
        'cypher': 'MATCH (p {id: ' + id + '}) RETURN p.description, p.use, p.title, p.size LIMIT 1'
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
                    document.getElementById("desc").value = record["p.description"]
                    document.getElementById("title").value = record["p.title"]
                    if (record["p.use"] != undefined)
                        document.getElementById("use").value = record["p.use"].join(", ")   

                    let size = record["p.size"]
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
function getVisualNodeProperties(visualId){
    let props = {}
    // извлечем свойства из поля title вершины (должен быть способ лучше)
    nodePropertiesString = viz._nodes[visualId].title    
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
function getVisualNodeIdByRealId(realID){
   visualIdList = Object.keys(viz._nodes)
   nodes_quantity = visualIdList.length
    for (i=0; i<nodes_quantity; i++){        
        visualId = visualIdList[i]
        let properties = getVisualNodeProperties(viz._nodes[visualId].id)
        
        if (parseInt(properties.id) == parseInt(realID)){
            return visualId
        }
    }
    return -1
}

/**
 * Сохраняет координаты вершин с холстав в БД
 */
function saveCoordinates(){        
    let pos = viz._network.getPositions()  // считаем все координаты всех вершин 
    // в виде в pos={{0:{x:-10, y:15}, {0:{x:154, y:165}, ... }

    // соберем все в один запрос
    let cypherMatchNodes = ' MATCH '
    let cypherMatchRelations = ' MATCH '
    let cypherSET = ' SET '
    Object.keys(pos).forEach(visualId => {        
        id = parseInt(getVisualNodeProperties(visualId).id)
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
 * Расставляет вершины по сохраненным ранее в базе координатам
 */
function restoreCoordinates(){
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
                    let visualID = getVisualNodeIdByRealId(realID)                                
                    viz._network.moveNode(visualID, x, y) 
                }
            })            
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => session.close())    
}


/*=================== Обработка событий ================*/

/**
 * Привязывает обработчик к событию выбора вершины
 * (чтобы выбрать несколько нужен длинный click или Ctrl+click по каждой следующей).
 * Вторая выбранная вершиная ставится выбранной во втором select форме создания связи
 */
function setNodeSelectHandler(){    
    viz._network.on('selectNode', (param) => {  
        if (param.nodes.length <= 1) {  // т.е. если выделено меньше 2х вершин - не интересно
            return
        }
        let currentNodeId = viz._network.getNodeAt(param.pointer.DOM); // вершина под событием
        let properties = getVisualNodeProperties(currentNodeId)
        realID = parseInt(properties.id)

        // ставим выбранной нужную вершину и симулируем клик по select-ам        
        if (realID != NaN) { 
            // форма создания ребра - во второй select    
            document.getElementById('relationshipEnd').value = realID
            document.getElementById('relationshipEnd').dispatchEvent(new MouseEvent('change'))             
        }        
    })
}

/**
 * Привязывает обработчик к клику по вершине.
 * Кликнутая вершина ставится выбранной в формах c select-ами по вершинам
 */
function setNodeClickHandler(){    
    viz._network.on('click', (param) => {  // по клику на холст
        if (param.nodes.length == 0) {
            return
        }
        if (viz._network.getSelectedNodes().length == 1){  
            nodeIdAtCanvas = param.nodes[0]  // ID вершины на холсте, не совпадает с ID в БД        
            let properties = getVisualNodeProperties(nodeIdAtCanvas)
            realID = parseInt(properties.id)
            if (realID != NaN) {
                // ставим выбранной нужную вершину и симулируем клик по select-ам
                document.getElementById('nodeSelect').value = realID
                document.getElementById('nodeSelect').dispatchEvent(new MouseEvent('change'))

                document.getElementById('relationshipStart').value = realID
                document.getElementById('relationshipStart').dispatchEvent(new MouseEvent('change'))

            }
        }
        
    })
}
