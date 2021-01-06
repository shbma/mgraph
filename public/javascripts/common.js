import {getGraphInfo, initialCypher} from '/javascripts/login_init.js'
import {selectorsID, vizIDa} from '/javascripts/constants.js'
import {getNodesSimple, restoreCoordinates, addVertex, getSelectedNodeInfo, 
    setNodeSelectHandler, setNodeClickHandler, setNodeDragHandler, changeNode, removeNode
    } from '/javascripts/nodes.js'
import {addRelationship, removeRelationship} from '/javascripts/relations.js'
import {searchNodeByName, restoreBeforeSearchPos} from '/javascripts/search.js'
import {addDepthFilter, showOneWayFilter} from '/javascripts/filters.js'
import {getDeskName, getActualDeskId} from '/javascripts/desks.js'


export function updateGraph(driver, viz, config, reloadNeeded=false, renderNeeded=false) {    
    let desk = getDeskName()        
    let session = driver.session()
    session
        .run(initialCypher().connected_nodes)
        .then(result => {
            if (result.records.length === 0) {  // актуально, если ребер совсем нет                
                if (renderNeeded) {
                    viz.renderWithCypher(initialCypher().nodes)
                } else {
                    viz.updateWithCypher(initialCypher().nodes)
                }
            }
            else if (renderNeeded){
                viz.renderWithCypher(initialCypher().connected_nodes)
                viz.updateWithCypher(initialCypher().nodes)
            } else {
                viz.updateWithCypher(initialCypher().connected_nodes)
                viz.updateWithCypher(initialCypher().nodes)
            }
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            if (reloadNeeded)                
                viz.reload()            
            // ставим обработчики событий на холсте
            setVisEventsHandlers(driver, viz, vizIDa, config)  
            session.close()
        })
}

export async function updateMenu() {
    for (let i = 0; i < selectorsID.length; i++)
        clearSelect(selectorsID[i])
    //for (let i = 0; i < topicsID.length; i++)
    //    clearSelect(topicsID[i])
    //let text = "Создать новую тему"
    //document.getElementById("newTitle").value = ""
    //document.getElementById("newDesc").value = ""
    //document.getElementById("newUse").value = ""
    //document.getElementById("newTopic").add(new Option(text, text, false, false))
    //getNodes()
    await getNodesSimple()
}

export async function fillingSelect(select, cypherCode, captionOfResult, valueOfResult='', selectedValue=null) {        
    let request = {
        'cypher': cypherCode
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
                if (result.length == 0) console.log('no results')     
                // очистим список и заполним заново                      
                document.querySelectorAll('#'+select+' option').forEach(option => option.remove()) 
                for(let template of result) {                
                    let captionOfTemplate = template[captionOfResult]                          
                    let valueOfTemplate = valueOfResult ? template[valueOfResult] : valueOfResult
                    let isSelected = valueOfTemplate == selectedValue
                    document.getElementById(select).add(new Option(captionOfTemplate, valueOfTemplate, false, isSelected))
                }    
            })
    } else {
        console.log('Ошибка HTTP: ' + response.status)
    }

}

export function clearSelect(selectID) {        
    for (let i = document.getElementById(selectID).options.length - 1; i >= 0; i--)
        document.getElementById(selectID).options[i] = null
}

// использовалась при добавлении узла --> TODO проверить, что нигде еще не нужна и удалить
export function templateChanged(isFirstLevel, templateType) {
    document.getElementById("div3" + templateType).innerHTML = ""
    let templatesSelector = document.getElementById(templateType)
    if(templatesSelector.options[templatesSelector.selectedIndex].text === "Новый тип" && isFirstLevel) {
        document.getElementById("div2" + templateType).innerHTML = ""
        document.getElementById("div1" + templateType).innerHTML = '<label>Имя типа:</label><br>' +
        '<input type="text" id="nameOf' + templateType + '"><br>' +
        '<label>Унаследован от:</label><br>' +
        '<select id="extends' + templateType + '"'
        + '" onChange="templateChanged(false, \'' + templateType + '\')"></select><br>'
        document.getElementById("extends" + templateType).add(new Option("Не унаследован"))
        if(templateType === "Label") {
            fillingSelect("extends" + templateType, 
                'MATCH (n)  WHERE ' + deskCondition('n') + ' RETURN distinct labels(n)', "labels(n)")
        }
        else {
            fillingSelect("extends" + templateType, 
                'MATCH (a)-[r]->(b) WHERE ' 
                + deskCondition('a') + ' AND '
                + deskCondition('b') + ' RETURN distinct(type(r))', "(type(r))")
        }
    }
    else {
        if(isFirstLevel) {
            document.getElementById("div1" + templateType).innerHTML = ""
        }
        document.getElementById("div2" + templateType).innerHTML = ""
        let session = driver.session()
        let extendsTemplatesSelector = document.getElementById("extends" + templateType)
        let nameOfLabel = isFirstLevel ? templatesSelector.options[templatesSelector.selectedIndex].text
        : extendsTemplatesSelector.options[extendsTemplatesSelector.selectedIndex].text
        let cypher = templateType 
        if (cypher === "Label") {
            cypher = 'MATCH (a:' + nameOfLabel + ') WHERE ' + deskCondition('a') 
                + ' UNWIND keys(a) AS key RETURN distinct key'
        }
        else {
            cypher = "match (a)-[r:" + nameOfLabel + "]->(b) WHERE " 
                + deskCondition('a') + " AND "
                + deskCondition('b') + " Unwind keys(r) AS key return distinct key"
        }
        session
            .run(cypher)
            .then(result => {
                for(let property of result.records) {
                    if(property.get("key") !== "title" && property.get("key") !== "size" 
                        && property.get("key") !== "id" && property.get("key") !== "community"
                        && property.get("key") !== "desk") {
                        document.getElementById("div2" + templateType).innerHTML +=
                        '<label>' + property.get("key") + ':</label><br>' +
                        '<input type = "text" id = "' + property.get("key") + '"><br>'
                    }
                }
            })
            .catch(error => {
                console.log(error)
            })
            .then(() => {
                session.close()
            })
    }
    newPropertysLabelCount = 0
    newPropertysTypeCount = 0
}

// использовалось при добавлени свойств узла --> TODO проверить есть ли где-то еще и удалить
export function addPropertyClick(templateType) {
    let numberOfNewProperty = 0
    let propertys = []
    let propertysValues = []
    let newPropertysCount = templateType === "Label" ? newPropertysLabelCount : newPropertysTypeCount
    while (document.getElementById("property" + templateType + numberOfNewProperty) != null) {
        propertys.push(document.getElementById("property" + templateType + numberOfNewProperty).value)
        propertysValues.push(document.getElementById("property" + templateType + numberOfNewProperty++ + "Value").value)
    }
    document.getElementById("div3" + templateType).innerHTML += '<label>Имя свойства:</label><br>' +
    '<input type = "text" id = "property' + templateType + newPropertysCount + '"<br>' +
    '<br><label>Значение:</label><br>' +
    '<input type = "text" id = "property' + templateType + newPropertysCount++ + 'Value"<br><br>'
    for(let i = 0; i < propertys.length; i++) {
        document.getElementById("property" + templateType + i).value = propertys[i]
        document.getElementById("property" + templateType + i + "Value").value = propertysValues[i]
    }
    if(templateType === "Label") {
        newPropertysLabelCount = newPropertysCount
    }
    else {
        newPropertysTypeCount = newPropertysCount
    }
}

export function readPropertys(templateType) {
    let cypher = ""
    let startOfIDProperty = 0
    let propertysHTML = document.getElementById("div2" + templateType).innerHTML
    let isFirstProperty = true
    while (true) {
        startOfIDProperty = propertysHTML.indexOf("=", startOfIDProperty)
        if(startOfIDProperty == -1) {
            break
        }
        if(!isFirstProperty) {
            cypher += ","
        }
        startOfIDProperty = propertysHTML.indexOf("=", ++startOfIDProperty)
        startOfIDProperty += 2;
        let endOfIDProperty = startOfIDProperty;
        while(propertysHTML[endOfIDProperty] != '"') {
            endOfIDProperty++;
        }
        let propertyCaption = replacementSpaces(propertysHTML.slice(startOfIDProperty, endOfIDProperty))
        cypher += propertyCaption + ': "' + document.getElementById(propertyCaption).value + '"'
        isFirstProperty = false
    }
    let newPropertyNumber = 0;
    while(document.getElementById("property" + templateType + newPropertyNumber) != null) {
        if(document.getElementById("property" + templateType + newPropertyNumber).value === "") {
            newPropertyNumber++
            continue
        }
        if(!isFirstProperty) {
            cypher += ","
        }
        if(document.getElementById("property" + templateType + newPropertyNumber).value === "") {
            continue
        }
        cypher += replacementSpaces(document.getElementById("property" + templateType + newPropertyNumber).value) + ': "' +
        document.getElementById("property" + templateType + newPropertyNumber++ + "Value").value + '"'
        isFirstProperty = false
    }
    return cypher
}

export function replacementSpaces(caption) {
    let indexOfSpace
    while ((indexOfSpace = caption.indexOf(" ")) != -1) {
        caption = caption.slice(0, indexOfSpace) + "_" + caption.slice(indexOfSpace + 1)
    }
    return caption
}

/**
 * Выдает строковое представление входного объекта
 * @param{object} объект из пар ключ-значение. Например {x:10, y:22.4, name:"HotPoint"}
 * @return{string} строковое представление объекта. Например 'x:10, y:22.4, name:"HotPoint"'
*/
export function stringify(properties){
    let props=[] 
    let val = ''
    Object.keys(properties).forEach((k)=>{
        val = properties[k]
        if (typeof(val) != 'number') {
            val = '"' + val + '"'
        }
        props.push(k+":"+val)
    }); 
    return props.join(',')
}

/**
 * Ищет ближайшую к данной точке вершину
 * @param{object} - пара координат точки на холсте, например {x: 5, y: 7}
 * @return{number} - фронтендное id ближайшего узла
 */
export function findNearestNode(viz, point){    
    let nodes = viz._network.body.nodes
    let nearestNode = {
        distance: Number.MAX_VALUE,
        id: -1
    }
    Object.keys(nodes).forEach((key)=>{
        let distance = (nodes[key].x - point.x)**2 + (nodes[key].y - point.y)**2
        if (distance < nearestNode.distance){
            nearestNode.distance = distance
            nearestNode.id = nodes[key].id
        }
    })    
    return nearestNode.id 
}

/**
 * Устанавливает фокус камеры на узел, ближайший к point
 * @param{object} point - точка прицела, например {x: 20, y:-52}
 * @param{object} parameters - дополнительные параметры, например масштаб {scale: 1})
 */
export function setCanvasFocusNearPoint(viz, point, parameters={}){
    let visualID = findNearestNode(viz, point)  
    viz._network.focus(visualID, parameters)
}

/** 
 * Сохраняет в cookies текущее состояние холста (фокус, масштаб)
 */
export function setCanvasState(viz, cookieName='viz'){    
    let focus = viz._network.getViewPosition()
    let state = getCookie(cookieName, true) 
    state = state ? state : {}
    state[getActualDeskId()] = {            
        focus: {
            x: focus.x, 
            y: focus.y
        },
        scale: viz._network.getScale()
    }
    setCookie('viz', state);
}

/** 
 * Считывает из cookies и устанавливает состояние холста 
 */
export function getAndApplyCanvasState(viz, cookieName='viz'){    
    let state = getCookie(cookieName, true)  
    let deskId = getActualDeskId()
    if (state[deskId]){ 
        setCanvasFocusNearPoint(viz, state[deskId].focus, {scale: state[deskId].scale})
    }
}

/** подстройка высоты textarea под содержимое*/
export function autosize(el){      
  setTimeout(function(){    
    el.style.cssText = 'height:auto; padding:0';    
    el.style.cssText = 'height:' + el.scrollHeight + 'px';
  },0);
}

/*=================== Обработка событий ================*/

/** Как только закончится стабилизация графа - включаем режим ручной расстановки вершин*/
export function setStabilizedHandler(driver, viz){
    viz._network.on('stabilized', (param) => {
        // отключим физику и сделаем ребрa бесконечно растяжимыми
        viz._network.physics.physicsEnabled = false
        viz._network.setOptions({
            edges: {
                smooth: {
                    type: 'continuous' // dynamic, continuous, discrete, diagonalCross, straightCross, horizontal, vertical, curvedCW, curvedCCW, cubicBezier
                }
            }
        }) 

        restoreCoordinates(driver, viz)  // расставим вершины и холст по сохраненным позициям        
    })    
}

/* Как только закончили двигать/масштабировать холст, сохраним его новое состояние*/
export function setCanvasDragZoomHandler(viz){
    viz._network.on('dragEnd', (e) => {        
        setCanvasState(viz, vizIDa)
    })
    viz._network.on('zoom', (e) => {        
        setCanvasState(viz, vizIDa)
    })
}

/** Ставит обработчики на кнопки в интерфейсе */
export function setButtonsHandlers(driver, viz, vizID, config) {
    $('#updateVisualization').click((event)=>{ updateGraph(driver, viz, config, true) }) //обновить визуализацию
    $('#addVertexTrigger').click((event)=>{ addVertex(driver, viz, config, 'instance') }) //добавить вершину addNode.ejs
    
    $('#addTypeTrigger').click((event)=>{ addVertex(driver, viz, config, 'type') }) //добавить тип addType.ejs
    $('#nodeSelect').change((event)=>{ getSelectedNodeInfo() }) //выбор вершины editNode.ejs, editType.ejs
    
    $('#changeNodeTrigger').click((event)=>{ changeNode(driver, viz, config) }) // изменить вершину
    $('#deleteNodeTrigger').click((event)=>{ removeNode(driver, viz, config) }) // удалить верину
    
    $('#changeTypeTrigger').click((event)=>{ changeNode(driver, viz, config) }) // изменить вершину-тип
    $('#deleteTypeTrigger').click((event)=>{ removeNode(driver, viz, config) }) // удалить верину-тип
    
    $('#addRelationshipTrigger').click((event)=>{ addRelationship(driver, viz, config) }) // добавить связь
    $('#deleteRelationshipTrigger').click((event)=>{ removeRelationship(driver, viz, config) }) // удалить связь
    
    $('#enterTrigger').click((event)=>{ getGraphInfo(driver, viz, vizID, config) }) // вход
    
    $('#nodeSearch').on('input', (event)=>{ //поиск
        searchNodeByName('nodeSearch', 'dropDownUL', clickOnULSearch) 
    }) 
    $('#restoreBeforeSearchTrigger').click((event)=>{ restoreBeforeSearchPos(viz) }) // обратно
    
    $('#depthFilterShowTrigger').click((event)=>{ addDepthFilter(viz, true) }) // фильтр глубина показать
    $('#depthFilterAddTrigger').click((event)=>{ addDepthFilter(viz) }) // фильтр глубина добавить

    $('#depthFilterShowTrigger').click((event)=>{ showOneWayFilter(viz) }) // фильтр раздел
    $('#sectionFilterAddTrigger').click((event)=>{ addOneWayFilter(viz) }) // фильтр раздел
}

/**
 * Ставит обработчики на элементы холста, как только он прорисовался
 * (до этого объект viz._network равен null)
 */
export function setVisEventsHandlers(driver, viz, vizID, config){
    viz.registerOnEvent("completed", (e)=>{
        viz._network.stopSimulation() // остановим автоматическое размещение вершин

        // разрешим множественное выделение
        viz._network.interactionHandler.selectionHandler.options.multiselect = true

        setNodeSelectHandler(viz)
        setNodeClickHandler(viz)  
        setNodeDragHandler(driver, viz)
        setStabilizedHandler(driver, viz)  
        setCanvasDragZoomHandler(viz)  
        setButtonsHandlers(driver, viz, vizID, config)
    });
}


