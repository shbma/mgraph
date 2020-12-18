//!!! Костыль ([:subsection*0..100]) не показывает деревья с больше чем 100 этажей
function addOneWayFilter() {
    viz.updateWithCypher("MATCH p = ({id:" + document.getElementById("oneWayFilterSelector").value
        + "})-[:subsection*0..100]->()  RETURN p")
}

function showOneWayFilter() {
    viz.renderWithCypher("MATCH p = ({id:" + document.getElementById("oneWayFilterSelector").value
        + "})-[:subsection*0..100]->()  RETURN p")
}

/**
 * Выбирает вершины на глубину указанную в html-элементе с id='depth'.
 * @param refresh[boolean] сбрасывать текущую визуализацию или дописать в нее
 */
 // TODO: переписать условие с использованием deskCondition
function addDepthFilter(refresh=true) {

    let depth = parseInt(document.getElementById("depth").value)
    if (isNaN(depth)) {
        alert("Глубина должна быть указана целым числом больше нуля")
        return
    }

    if (refresh) {
        viz.clearNetwork()    
    }
    for (let i = depth; i >= 0; i--){
        let cypher = "MATCH p = ("
        cypher += '{id:' + document.getElementById("depthFilterSelector").value + '})'
        cypher += '-[:subsection*' + i + ']-()  RETURN p'        
        console.log(cypher)
        viz.updateWithCypher(cypher)            
    }
}
