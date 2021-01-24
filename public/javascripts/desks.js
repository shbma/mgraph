/** Выдает имя текущей выбранной в интерфейсе доски  */
function getDeskName(){
    let deskTitle = document.getElementById("deskSelect").getAttribute('actual-title')
    if (deskTitle != '') {  // этот атрибут заполняется с бэкенда
        return deskTitle
    }
    let deskText = document.getElementById("deskSelect").text
    return deskText ? deskText : deskDefault    
}

/** 
 * Доп.условие к cypher запросам для сужения результатов до конкретной доски.
 * @param{string} node - обозначение узла вершины, проверяемой на принадлежность к доске
 * @param{string} desk - обозначение узла самой доски. 
 * @param{string} relation - обозначение отношения привязки к доске
 * @param{string} interest - на что ориентирован выдаваемый кусок запроса
 * @param{object} relProperties - дополнительные свойства ребра (если ориентируемся на ребро)
 * @param{string} deskType - тип доски ('Предметная', 'Типология' и пр)
 */
function deskCondition(node='a', desk='', relation='', interest=deskInterest.RELDESK, relProperties={}, deskType=''){    
    let deskID = 0;
    switch (deskType) {        
        case 'Типология':
            deskID = getActualTypoId()
            break
        case 'Предметная': 
        default:
            deskID = getActualDeskId()
    }
    let props = stringify(relProperties)
    props = props ? ', ' + props : '' 
        
    switch (interest){
        case deskInterest.RELDESK:
            return ' ('+node+')<-['+relation+':subsection {type:"СОДЕРЖИТ"}]-('+desk+':Доска {id:'+deskID+'}) '    
        case deskInterest.RELATION:
            return ' ('+node+')<-['+relation+':subsection {type:"СОДЕРЖИТ" '+props+'}]-('+desk+') '        
        case deskInterest.DESK:
            return '('+desk+':Доска {id:'+deskID+'})' 
    }
}

/** обработчик события смены доски */
function deskChange(){          
    //updateGraph(true, true)
    window.location.href = '/desk/' + $('#deskSelect').val()
}

/** выдает id доски, который нужно показать или выставить активной в select*/
function getActualDeskId(){
    return parseInt(document.getElementById("deskSelect").getAttribute('actual-id'))
}

/** выдает id доски с типологией, которую нужно показать или выставить активной в select*/
function getActualTypoId(){
    return parseInt(document.getElementById("typoSelect").getAttribute('actual-id'))
}

/** выдает тип текущей доски, а также ее visualID и realID */
async function getDeskTypeAndId(){
    let id = getActualDeskId()
    let request = {
        'cypher': `MATCH (d:Доска {id:` + id + `}) RETURN d.type AS type, id(d) AS visualID, d.id AS realID`            
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
        if (result.length == 0){
            console.log('Ошибка: пустой ответ - у доски нет типа')
            return false
        }
        return result[0]
    
    } else {
        console.log('Ошибка HTTP: ' + response.status)
        return false
    }
}
