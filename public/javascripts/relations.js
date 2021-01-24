function addRelationship() {
    let startNodeId = document.getElementById("relationshipStart").value
    let endNodeId = document.getElementById("relationshipEnd").value
    let relationshipType = document.getElementById("relationshipType").value
    var session = driver.session()
    session
        .run(`MATCH (a) , (b) WHERE a.id = ${startNodeId} AND b.id = ${endNodeId}  CREATE (a)-[:subsection {type: "${relationshipType}"}]->(b)`)
        .then(result => {
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            session.close()
            updateGraph()
        })

}

function removeRelationship() {
    let startNodeId = document.getElementById("relationshipStart").value
    let endNodeId = document.getElementById("relationshipEnd").value
    var session = driver.session()
    session
        .run("MATCH (a {id:" + startNodeId + "})-[r:subsection]->(b {id:" + endNodeId + "}) DELETE r")
        .then(result => {
        })
        .catch(error => {
            console.log(error)
        })
        .then(() => {
            session.close()
            updateGraph(true)
        })
}

/**
 * Выбирает все ребра с данной доски и заполняет ими списки выбора, 
 */
async function fillRelations() {    
    let deskType = await getDeskTypeAndId()    
    switch (deskType['type']){
        case 'Типология':            
            let cypher = `MATCH (a)-[r]-(b) 
                           WHERE ` + deskCondition('a') + ` AND ` + deskCondition('b') + `
                           RETURN DISTINCT r.type ORDER BY r.type`
            await fillingSelect('relationshipType', cypher, 'r.type')    
            break
        case 'Предметная':
            console.log('предметная доска...')        
            // TODO: брать отношения со свзанной типологической доски
    }
    
}

function editRelationTypo(){
    
}


// не используется
/*function addRelations() {
    if(firstNodeID < 0 || secondNodeID < 0) {
        alert(firstNodeID + "," + secondNodeID)
        return
    }
    let cypher = "match(a) where a.id = " + firstNodeID + " match(b) where b.id = " + secondNodeID + " create (a)-[r:"
    let typeSelect = document.getElementById("Type")
    if(typeSelect.options[typeSelect.selectedIndex].text === "Новый тип") {
        if(document.getElementById("nameOfType") === "") {
            return
        }
        cypher += replacementSpaces(document.getElementById("nameOfType").value)
    }
    else {
        cypher += replacementSpaces(typeSelect.options[typeSelect.selectedIndex].value)
    }
    let propertys = readPropertys("Type")
    let isFirstProperty = propertys === "" ? true : false
    cypher += " {" + propertys + "}]->(b)"
    let session = driver.session()
    session
        .run(cypher)
        .then(() => {})
        .catch((error) => {
            console.log(error)
            alert("Неполучилось создать связь. Возможно вы где-то ввели недопустимый символ")
            alert(cypher)
        })
        .then(() => {
            session.close()
            updateGraph()
            updateMenu()
        })
    newPropertysTypeCount = 0
    templateChanged(isFirstLevel, "Type")
}*/