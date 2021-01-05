//!!! Костыль ([:subsection*0..100]) не показывает деревья с больше чем 100 этажей
function addOneWayFilter() {
    let id = document.getElementById("oneWayFilterSelector").value    
    viz.updateWithCypher(` 
        MATCH p = (a {id:` + id + `})-[:subsection*0..100]->() 
        WHERE ` + deskCondition('a') + `
        RETURN p`)    
}

function showOneWayFilter() {
    let id = document.getElementById("oneWayFilterSelector").value    
    viz.renderWithCypher(` 
        MATCH p = (a {id:` + id + `})-[:subsection*0..100]->() 
        WHERE ` + deskCondition('a') + `
        RETURN p`)
}

/**
 * Выбирает вершины на глубину указанную в html-элементе с id='depth'.
 * @param refresh[boolean] сбрасывать текущую визуализацию или дописать в нее
 *
 * TODO: убрать лишние вершины с поля
 */
function addDepthFilter(refresh=true) {

    let depth = parseInt(document.getElementById("depth").value)
    if (isNaN(depth)) {
        alert("Глубина должна быть указана целым числом больше нуля")
        return
    }
    let cond = deskCondition('n', '', '', deskInterest.RELDESK, {}, deskType='Типология')  
    
    let cypher = "MATCH p = "
    cypher += '(a {id:' + document.getElementById("depthFilterSelector").value + '})'
    cypher += '-[r:subsection*1..' + depth + ']-(b) '   
    cypher += ' WHERE ' + deskCondition('a') + ' AND ' + deskCondition('b')    
    cypher += ' RETURN a, r, b'        
    console.log(cypher)
    
    if (refresh == true){
        viz.renderWithCypher(cypher)            
    } else {
        viz.updateWithCypher(cypher)
    }
}
