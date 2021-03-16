/** 
 * Пишет в глобальную переменную idVisualRealMap словари visualId-realId
 * и realId-visualId - соответствия id на холсте и в БД, 
 * а также заполняет глобальную переменную nodesBank вершинами
 */
function getNodesVisualRealData(){    
    // сброс прежней инфы
    idVisualRealMap.byVisual = {}
    idVisualRealMap.byReal = {}
    nodesBank = {}
    
    let session = driver.session()
    session
        .run(initialCypher().nodes_ids)
        .then(result => {                        
            result.records.forEach(record => {                 
                let visualID = record.get('visualID').low                                    
                let realID = record.get('realID').low
                // записываем два перевернутых словаря
                idVisualRealMap.byVisual[visualID] = realID         
                idVisualRealMap.byReal[realID] = visualID  
                // сохраним названия                
                nodesBank[visualID] = {
                    'id': realID, 
                    'title': record.get('title')
                }
            })             
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            session.close()
        })
}

function updateGraph(reloadNeeded=false, renderNeeded=false) {
    desk = getDeskName()    
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
            getNodesVisualRealData()            
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            if (reloadNeeded)                
                viz.reload()            
            setVisEventsHandlers()  // ставим обработчики событий на холсте
            session.close()
        })
}

function updateMenu() {
    for (let i = 0; i < selectorsID.length; i++)
        clearSelect(selectorsID[i])
    for (let i = 0; i < topicsID.length; i++)
        clearSelect(topicsID[i])    
    //fillRelations()
}

/**
 * Очищает и заполняет select единственной опцией
 * с названием captionOfResult и id=valueOfResult
 * @param{string} captionOfResult название опции
 * @param{string} valueOfResult ID опции
 */
function fillSelectSingle(select, captionOfResult, valueOfResult=''){
    // очистим список и добавим вариант согласно входым параметрам                    
    document.querySelectorAll('#'+select+' option').forEach(option => option.remove())                      
    document.getElementById(select).add(new Option(captionOfResult, valueOfResult, false, true))    
}

/*function fillSelectSingleByRealID(select, captionOfResult, valueOfResult=''){

}*/

async function fillingSelect(select, cypherCode, captionOfResult, valueOfResult='', selectedValue=null) {        
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
        let result = await response.json()                            
        if (result.length == 0) console.log('no results')     
        // очистим список и заполним заново                      
        document.querySelectorAll('#'+select+' option').forEach(option => option.remove())                                                 
        for(let template of result) {                
            let captionOfTemplate = template[captionOfResult]                          
            let valueOfTemplate = valueOfResult ? template[valueOfResult] : valueOfResult
            let isSelected = valueOfTemplate == selectedValue
            document.getElementById(select).add(new Option(captionOfTemplate, valueOfTemplate, false, isSelected))
        }                   

    } else {
        console.log('Ошибка HTTP: ' + response.status)
    }

}

function clearSelect(selectID) {        
    let selector = document.getElementById(selectID)
    if (selector != undefined) {
        for (let i = selector.options.length - 1; i >= 0; i--)
            document.getElementById(selectID).options[i] = null
    }
}

function replacementSpaces(caption) {
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
function stringify(properties){
    props=[]; 
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
function findNearestNode(point){
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
function setCanvasFocusNearPoint(point, parameters={}){
    let visualID = findNearestNode(point)  
    viz._network.focus(visualID, parameters)
}

/** 
 * Сохраняет в cookies текущее состояние холста (фокус, масштаб)
 */
function setCanvasState(cookieName='viz'){    
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
function getAndApplyCanvasState(cookieName='viz'){    
    let state = getCookie(cookieName, true)  
    let deskId = getActualDeskId()
    if (state[deskId]){ 
        setCanvasFocusNearPoint(state[deskId].focus, {scale: state[deskId].scale})
    }
}

/** подстройка высоты textarea под содержимое*/
function autosize(el){ 
  setTimeout(function(){    
    el.style.cssText = 'height:auto; padding:0';     
    el.style.cssText = 'height:' + el.scrollHeight + 'px';
  },0);
}

/** Экспорт графа в JSON файл */
function exportData(){
    let graph = {'nodes': viz._nodes, 'edges': viz._edges}    
    var graphAsString = JSON.stringify(graph, null, 2)
    var blob = new Blob([graphAsString], {type: "text/plain"});
    
    var link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    
    var saveAsFile = getDeskName() + '.json' // имя создаваемого файла
    link.setAttribute("download", saveAsFile);
    link.click();
}

/*=================== Обработка событий ================*/

$(document).ready(function() {
    //всем textarea - автоподстройка высоты под содрежимое
    document.querySelectorAll('textarea').forEach((area) => {        
        area.addEventListener('input', (event)=>{
            autosize(event.target)
        });
    });
});


/** Как только закончится стабилизация графа - включаем режим ручной расстановки вершин*/
function setStabilizedHandler(){
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

        restoreCoordinates()  // расставим вершины и холст по сохраненным позициям        
    })    
}

/* Как только закончили двигать/масштабировать холст, сохраним его новое состояние*/
function setCanvasDragZoomHandler(){
    viz._network.on('dragEnd', (e) => {        
        setCanvasState()
    })
    viz._network.on('zoom', (e) => {        
        setCanvasState()
    })
}

/**
 * Ставит обработчики на элементы холста, как только он прорисовался
 * (до этого объект viz._network равен null)
 */
function setVisEventsHandlers(){
    viz.registerOnEvent("completed", (e)=>{
        viz._network.stopSimulation() // остановим автоматическое размещение вершин

        // разрешим множественное выделение
        viz._network.interactionHandler.selectionHandler.options.multiselect = true

        setNodeSelectHandler()
        setNodeClickHandler()  
        setNodeDragHandler()
        setStabilizedHandler()  
        setCanvasDragZoomHandler()          
    });
}



