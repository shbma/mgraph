/** Выдает имя текущей выбранной в интерфейсе доски  */
function getDeskName(){
    let deskValue = document.getElementById("deskSelect").value
    return deskValue ? deskValue : deskDefault    
}

/** 
 * Доп.условие к cypher запросам для сужения результатов до конкретной доски.
 * @param{string} node - обозначение узла вершины, проверяемой на принадлежность к доске
 * @param{string} desk - обозначение узла самой доски. 
 * @param{string} relation - обозначение отношения привязки к доске
 * @param{string} interest - на что ориентирован выдаваемый кусок запроса
 * @param{object} relProperties - дополнительные свойства ребра (если ориентируемся на ребро)
 */
function deskCondition(node='a', desk='', relation='', interest=deskInterest.RELDESK, relProperties={}){
    let deskName = getDeskName()
    let props = stringify(relProperties)
    props = props ? ', ' + props : '' 
        
    switch (interest){
        case deskInterest.RELDESK:
            return ' ('+node+')<-['+relation+':subsection {type:"СОДЕРЖИТ"}]-('+desk+':Доска {title:"'+deskName+'"}) '    
        case deskInterest.RELATION:
            return ' ('+node+')<-['+relation+':subsection {type:"СОДЕРЖИТ" '+props+'}]-('+desk+') '        
        case deskInterest.DESK:
            return '('+desk+':Доска {title:"'+deskName+'"})' 
    }
}

/** обработчик события смены доски */
function deskChange(){    
    updateGraph(true, true)
}
