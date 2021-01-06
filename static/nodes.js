
function addOption(optionName) {
    for (option of Label.options) {
        if (option.text == optionName) {
            Label.value = optionName
            return
        }
    }
    Label.add(new Option(optionName, optionName, false, true))
}
/** 
 * Считывает название Типа вершины из поля формы. Если это "Новый тип",
 * то для него создается раздел в config.labels. 
 * @return {object} контейнер с названием и сведениями о состоянии
 *   {
       name: название типа, 
 *     isNew: флаг - новый ли,
 *     isFirstLevel: флаг - верхний ли уровень наследования,
 *     error: флаг ошибки
 *    }
 */

function handleTemplateName(){
    let result = {name: "", isNew: false, isFirstLevel: false, error: false}

    let templatesSelector = document.getElementById("Label")
    if(templatesSelector.options[templatesSelector.selectedIndex].text === "Новый тип") {
        result.isNew = true
        if(document.getElementById("nameOfLabel").value === "") {
            result.error = true
            result.name = "Default"
            addOption("Default")
        } else {
            result.isFirstLevel = true
            result.name = replacementSpaces(document.getElementById("nameOfLabel").value)
            addOption(result.name)
            config.labels[result.name] = {
                caption: "title",
                size: "size",
                community: "community"
            }
        } 
    }
    else {
        result.name = templatesSelector.options[templatesSelector.selectedIndex].text
    }
    return result
}

/** Добавляет вершину выбранного типа в граф */
function addNodeByTamplateClick() {
    if(document.getElementById("caption").value === "") {
        return
    }
    templateInfo = handleTemplateName()
    if (templateInfo.error) {
        return
    }
    let session = driver.session()
    session
        //.run("MATCH (n:" + templateInfo.name + ") RETURN n.community")
        .run("match(a) return a")
        .then(result => {
            //let community = result.records[0].get("n.community")

            let cypher ="MATCH (n) WITH max(n.community) AS last_community, max(n.id) AS last_ID " 
            cypher += "MATCH " + deskCondition('', 'd', '', interest=deskInterest.DESK) 
            cypher +=" CREATE (a:" + templateInfo.name
            
            // собираем в запрос свойства
            let propertys = readPropertys("Label")
            let isFirstProperty = propertys === "" ? true : false
            cypher += "{" + propertys
            if (!isFirstProperty) {
                cypher += ","
            }
            
            let community_id = templateInfo.isNew ? " last_community+1 " : community

            cypher += ' title: "' + document.getElementById("caption").value + '", '
            cypher += ' id: last_ID+1, '
            cypher += ' community: ' + community_id  + ', '            
            cypher += ' x: 0, y: 0, '
            let sizeVal = document.getElementById("size")
                                  .options[document.getElementById("size").selectedIndex]
                                  .value
            cypher += ' size:' + sizeVal + '}) '
            let coords = {x:0, y:0}
            cypher += 'CREATE ' + deskCondition('a', 'd', '', interest=deskInterest.RELATION, relProperties=coords)  // создаем связь до доски                    

            // добавляем в граф вершину с заданным типом, свойствами и привязкой к доске
            var subSession = driver.session()
            subSession
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
                alert(cypher)
        })
        .catch(error => {
            console.log(error)
            alert("Ошибка запроса к БД. Не удалось прочитать тип вершины.")            
        })

    newPropertysLabelCount = 0
    templateChanged(templateInfo.isFirstLevel, "Label")
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
            " SET p.use = [\"" + document.getElementById("use").value.split(",").join("\" , \"") + "\"]" +
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

function getNodes() {
    //{desk:"' + getDeskName() + '"}
    var session = driver.session()
    session
        .run('MATCH (p) RETURN p.id, p.title ORDER BY p.id')
        .then(result => {
            result.records.forEach(record => {
                let text = "<" + record.get("p.id") + ">:" + record.get("p.title")
                for (let i = 0; i < selectorsID.length; i++)
                    document.getElementById(selectorsID[i]).add(new Option(text, record.get("p.id"), false, false))
            })
        })
        .catch(error => {
            console.log(error) 
        })
        .then(() => {
            var subSession = driver.session()
            subSession
                .run('MATCH (p) RETURN DISTINCT p.topic, p.topicNumber')
                .then(result => {
                    result.records.forEach(record => {
                        communities[record._fields[1]] = (record._fields[0])
                    })
                })
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            session.close()
            getSelectedNodeInfo()
        })
}

function getSelectedNodeInfo() {
    var session = driver.session()
    let id = document.getElementById("nodeSelect").value
    if (id === "") return
    session
        .run("MATCH (p {id: " + id + "}) RETURN p.description, p.use, p.title, p.topic, p.size LIMIT 1")
        .then(result => {
            result.records.forEach(record => {
                document.getElementById("desc").value = record.get("p.description")
                document.getElementById("title").value = record.get("p.title")
                document.getElementById("topic").value = record.get("p.topic")
                document.getElementById("use").value = record.get("p.use").join(", ")

                let size = record.get("p.size")
                let sizeOptions = document.getElementById("type").options
                for (let i = 0; i < sizeOptions.length; i++) {
                    if (size == sizeOptions[i].value) {
                        document.getElementById("type").selectedIndex = i
                        break
                    }
                }
            })
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => session.close())
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
    let cypher = 'MATCH ' + deskCondition('a', 'd', 'r') + ' RETURN id(a) AS nodeID, r.x AS x, r.y AS y'    
    session
        .run(cypher)
        .then(result => {          
            result.records.forEach(record => { 
                let x = record.get('x').low                                    
                let y = record.get('y').low
                let realID = record.get('nodeID').low                
                if (x != 0 || y!= 0) {                               
                    viz._network.moveNode(realID, x, y) 
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

async function updateGraphAfterClick(param) {
    finishedUpdateCount++
    if (finishedUpdateCount == 2) {
        updateGraph()
        newPropertysLabelCount = 0
    }
}

function createNode(templateInfo, community, param, properties, title) {
    let createSession = driver.session()
    createSession
        .run(`MATCH ${deskCondition('', 'd', '', interest=deskInterest.DESK)}
                create(a:${templateInfo.name} {
                    ${properties}
                    ${title}
                    size: ${size.value},
                    community: ${community}
                })
                create ${deskCondition('a', 'd', '', interest=deskInterest.RELATION, param.pointer.DOM)}
                return id(a)`)
        .then(result => {
            createSession.close()
            selectedNode = result.records[0].get("id(a)").low
            lastLabel = templateInfo.name
            updateGraphAfterClick(param)
            if (!title) {
                caption.value = ""
            }
        })
}

function getCommunity(templateInfo, param, properties, title, callback) {
    let label = templateInfo.isNew ? "" : `:${templateInfo.name}`
    let resultCaption = templateInfo.isNew ? "max(a.community)" : "a.community"
    let community
    let communitySession = driver.session()
        communitySession
            .run(`match(a${label}) return ${resultCaption}`)
            .then(result => {
                communitySession.close()
                community = Number(result.records[0].get(resultCaption))
                callback(templateInfo, community, param, properties, title)
            })
}

/**Данная версия readPropertys ищет свойтсва не в строке а считывает их из массива */
function readPropertysFromArray(variable="a.", delimiter=" =") {
    let cypher = ""
    for (let property of properties) {
        cypher += `${variable}${property}${delimiter} "${document.getElementById(property).value}", `
    }
    for (let i = 0; i < newPropertysLabelCount; i++) {
        if (document.getElementById(`propertyLabel${i}`).value) {
            cypher += `${variable}${document.getElementById(`propertyLabel${i}`).value}${delimiter}
            "${document.getElementById(`propertyLabel${i}Value`).value}", `
        }
    }
    return cypher
}

function setNode(templateInfo, community, param, properties) {
    let setSession = driver.session()
    setSession
        .run(`match(a) where id(a) = ${selectedNode} remove a:${lastLabel}
        set
            a:${templateInfo.name},
            ${properties}
            a.title = "${caption.value}",
            a.size = ${size.value},
            a.community = ${community}`)
        .then(() => {
            setSession.close()
            getProperties(param)
        })
}


/**
 * Привязывает обработчик к клику по вершине.
 * Кликнутая вершина ставится выбранной в формах c select-ами по вершинам
 */
async function setNodeClickHandler(){
    viz._network.once('click', (param) => {  // по клику на холст
        finishedUpdateCount = 0
        let templateInfo = handleTemplateName()
        if (isFirstClick) {
            getProperties(param)
        }
        else {
            getCommunity(templateInfo, param, readPropertysFromArray(), "", setNode)
        }
        if (param.nodes.length == 0) {
            getCommunity(templateInfo, param, "", "", createNode)
        }
        if (viz._network.getSelectedNodes().length == 1){  
            properties = []
            nodeIdAtCanvas = param.nodes[0]  // ID вершины на холсте, не совпадает с ID в БД        
            let nodeProperties = getVisualNodeProperties(nodeIdAtCanvas)
            realID = parseInt(nodeProperties.id)
            if (realID != NaN) {
                // ставим выбранной нужную вершину и симулируем клик по select-ам
                document.getElementById('nodeSelect').value = realID
                document.getElementById('nodeSelect').dispatchEvent(new MouseEvent('change'))

                document.getElementById('relationshipStart').value = realID
                document.getElementById('relationshipStart').dispatchEvent(new MouseEvent('change'))
            }
        }
        isFirstClick = false
    })
}

function getProperties(param) {
    if (param.nodes.length == 1) {
        setNodeClickHandler()
        selectedNode = null//Для того, чтобы не перезаписать свойства при следующем щелчке, временный костыль
        let session = driver.session()
        session
            .run(`match(a) where id(a) = ${param.nodes[0]} return *`)
            .then(result => {
                session.close()
                Label.value = result.records[0].get("a").labels[0]
                finishedUpdateCount = 1
                updateGraphAfterClick(param, function () {writeProperties(result.records[0].get("a").properties)})
            })
    }
    else {
        updateGraphAfterClick(param, function () {templateChanged(true, "Label")})
    }
}

function writeProperties(properties) {
    caption.value = properties.title
    size.value = properties.size
    div1Label.innerHtml = ""
    div2Label.innerHtml = ""
    div3Label.innerHtml = ""
    for (property in properties) {
        if (property != "size" && property != "title" && property != "community") {
            div2Label.innerHtml += `<label>${property}:</label><br>
                                    <input type = "text" id = "${property}">${properties[property]}<br>`
        }
    }
}
